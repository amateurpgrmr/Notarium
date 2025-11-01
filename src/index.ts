import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt, sign, verify } from 'hono/jwt'
import type { JWTPayload } from 'hono/jwt'

// Types
type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  FRONTEND_URL: string
}

type Variables = {
  user: JWTPayload
}

type GoogleTokenResponse = {
  access_token: string
  id_token: string
  expires_in: number
}

type GoogleUserInfo = {
  id: string
  email: string
  name: string
  picture: string
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// CORS middleware
app.use('/*', cors({
  origin: [
    'http://localhost:5173',
    'https://notarium-seven.vercel.app',
    'https://notarium-site.vercel.app',
  ],
  credentials: true,
}))
// ==================== AUTHENTICATION ====================

// Google OAuth - Start
app.get('/api/auth/google', (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID
  const redirectUri = `${c.env.FRONTEND_URL}/auth/callback`
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid email profile')
  authUrl.searchParams.set('access_type', 'online')
  
  return c.redirect(authUrl.toString())
})

// Google OAuth - Callback
app.post('/api/auth/callback', async (c) => {
  try {
    const { code } = await c.req.json()
    
    if (!code) {
      return c.json({ error: 'Authorization code missing' }, 400)
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: c.env.GOOGLE_CLIENT_ID,
        client_secret: c.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${c.env.FRONTEND_URL}/auth/callback`,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error('Token exchange failed:', error)
      return c.json({ error: 'Failed to exchange authorization code' }, 400)
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json()

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userResponse.ok) {
      return c.json({ error: 'Failed to fetch user info' }, 400)
    }

    const googleUser: GoogleUserInfo = await userResponse.json()

    // Create or update user in database
    const existingUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(googleUser.email).first()

    let userId: number

    if (existingUser) {
      userId = existingUser.id as number
      // Update user info
      await c.env.DB.prepare(
        'UPDATE users SET display_name = ?, photo_url = ?, updated_at = datetime("now") WHERE id = ?'
      ).bind(googleUser.name, googleUser.picture, userId).run()
    } else {
      // Create new user
      const result = await c.env.DB.prepare(
        'INSERT INTO users (email, display_name, photo_url, role) VALUES (?, ?, ?, "student")'
      ).bind(googleUser.email, googleUser.name, googleUser.picture).run()
      
      userId = result.meta.last_row_id
    }

    // Generate JWT token
    const jwtPayload = {
      userId,
      email: googleUser.email,
      name: googleUser.name,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
    }

    const token = await sign(jwtPayload, c.env.JWT_SECRET)

    return c.json({
      success: true,
      token,
      user: {
        id: userId,
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
      },
    })
  } catch (error) {
    console.error('Auth callback error:', error)
    return c.json({ error: 'Authentication failed' }, 500)
  }
})

// JWT Middleware
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.substring(7)
  
  try {
    const payload = await verify(token, c.env.JWT_SECRET)
    c.set('user', payload)
    await next()
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401)
  }
}

// Get current user
app.get('/api/auth/me', authMiddleware, async (c) => {
  const user = c.get('user')
  
  const dbUser = await c.env.DB.prepare(
    'SELECT id, email, display_name, photo_url, role, points, notes_count, class FROM users WHERE id = ?'
  ).bind(user.userId).first()

  if (!dbUser) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({ user: dbUser })
})

// ==================== SUBJECTS ====================

app.get('/api/subjects', async (c) => {
  const subjects = await c.env.DB.prepare(
    'SELECT * FROM subjects ORDER BY name'
  ).all()

  return c.json({ subjects: subjects.results })
})

// ==================== NOTES ====================

// Get all public notes
app.get('/api/notes', async (c) => {
  const subject = c.req.query('subject')
  
  let query = `
    SELECT n.*, u.display_name as author_name, u.photo_url as author_photo
    FROM notes n
    JOIN users u ON n.author_id = u.id
    WHERE n.is_public = 1
  `
  
  if (subject) {
    query += ` AND n.subject = ?`
  }
  
  query += ` ORDER BY n.created_at DESC LIMIT 50`
  
  const stmt = c.env.DB.prepare(query)
  const notes = subject ? await stmt.bind(subject).all() : await stmt.all()

  return c.json({ notes: notes.results })
})

// Get single note
app.get('/api/notes/:id', async (c) => {
  const noteId = c.req.param('id')
  
  const note = await c.env.DB.prepare(`
    SELECT n.*, u.display_name as author_name, u.photo_url as author_photo
    FROM notes n
    JOIN users u ON n.author_id = u.id
    WHERE n.id = ?
  `).bind(noteId).first()

  if (!note) {
    return c.json({ error: 'Note not found' }, 404)
  }

  // Increment view count
  await c.env.DB.prepare(
    'UPDATE notes SET views = views + 1 WHERE id = ?'
  ).bind(noteId).run()

  return c.json({ note })
})

// Create note (protected)
app.post('/api/notes', authMiddleware, async (c) => {
  const user = c.get('user')
  const { title, content, subject, tags, is_public } = await c.req.json()

  if (!title || !content) {
    return c.json({ error: 'Title and content are required' }, 400)
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO notes (author_id, title, content, subject, tags, is_public)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    user.userId,
    title,
    content,
    subject || null,
    tags || null,
    is_public ? 1 : 0
  ).run()

  // Update user's note count
  await c.env.DB.prepare(
    'UPDATE users SET notes_count = notes_count + 1 WHERE id = ?'
  ).bind(user.userId).run()

  return c.json({
    success: true,
    noteId: result.meta.last_row_id,
  })
})

// Update note (protected)
app.put('/api/notes/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const noteId = c.req.param('id')
  const { title, content, subject, tags, is_public } = await c.req.json()

  // Check ownership
  const note = await c.env.DB.prepare(
    'SELECT author_id FROM notes WHERE id = ?'
  ).bind(noteId).first()

  if (!note) {
    return c.json({ error: 'Note not found' }, 404)
  }

  if (note.author_id !== user.userId) {
    return c.json({ error: 'Unauthorized' }, 403)
  }

  await c.env.DB.prepare(`
    UPDATE notes
    SET title = ?, content = ?, subject = ?, tags = ?, is_public = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(title, content, subject, tags, is_public ? 1 : 0, noteId).run()

  return c.json({ success: true })
})

// Delete note (protected)
app.delete('/api/notes/:id', authMiddleware, async (c) => {
  const user = c.get('user')
  const noteId = c.req.param('id')

  const note = await c.env.DB.prepare(
    'SELECT author_id FROM notes WHERE id = ?'
  ).bind(noteId).first()

  if (!note) {
    return c.json({ error: 'Note not found' }, 404)
  }

  if (note.author_id !== user.userId) {
    return c.json({ error: 'Unauthorized' }, 403)
  }

  await c.env.DB.prepare('DELETE FROM notes WHERE id = ?').bind(noteId).run()

  // Update user's note count
  await c.env.DB.prepare(
    'UPDATE users SET notes_count = notes_count - 1 WHERE id = ?'
  ).bind(user.userId).run()

  return c.json({ success: true })
})

// ==================== AI CHAT ====================

app.post('/api/chat/session', authMiddleware, async (c) => {
  const user = c.get('user')
  const { subject, topic } = await c.req.json()

  const result = await c.env.DB.prepare(`
    INSERT INTO chat_sessions (user_id, subject, topic)
    VALUES (?, ?, ?)
  `).bind(user.userId, subject, topic).run()

  return c.json({
    success: true,
    sessionId: result.meta.last_row_id,
  })
})

app.post('/api/chat/message', authMiddleware, async (c) => {
  const { sessionId, role, content } = await c.req.json()

  await c.env.DB.prepare(`
    INSERT INTO chat_messages (session_id, role, content)
    VALUES (?, ?, ?)
  `).bind(sessionId, role, content).run()

  return c.json({ success: true })
})

// ==================== HEALTH CHECK ====================

app.get('/', (c) => c.json({
  status: 'ok',
  message: 'Notarium API v2.0',
  timestamp: new Date().toISOString(),
}))

app.get('/api/health', (c) => c.json({ status: 'healthy' }))

export default app