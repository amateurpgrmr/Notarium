import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { sign, verify } from 'hono/jwt'
import type { JWTPayload } from 'hono/jwt'

// Types
type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}

type Variables = {
  user: JWTPayload
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

// ==================== HELPER FUNCTIONS ====================

// Simple password hashing (for serverless environment without bcrypt)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

// ==================== AUTHENTICATION ====================

// Register with Email/Password
app.post('/api/auth/register', async (c) => {
  try {
    const { email, password, name, role } = await c.req.json()

    // Validation
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400)
    }

    if (password.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400)
    }

    // Check if user exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first()

    if (existingUser) {
      return c.json({ error: 'User already exists' }, 400)
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const userRole = role === 'admin' ? 'admin' : 'student'
    const result = await c.env.DB.prepare(
      'INSERT INTO users (email, display_name, password_hash, role) VALUES (?, ?, ?, ?)'
    ).bind(email, name, passwordHash, userRole).run()

    const userId = result.meta.last_row_id

    // Generate JWT
    const jwtPayload = {
      userId,
      email,
      name,
      role: userRole,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
    }

    const token = await sign(jwtPayload, c.env.JWT_SECRET)

    return c.json({
      success: true,
      token,
      user: {
        id: userId,
        email,
        name,
        role: userRole,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    return c.json({ error: 'Registration failed' }, 500)
  }
})

// Login with Email/Password
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400)
    }

    // Find user
    const user = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first()

    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    // Check if account is suspended
    if (user.suspended === 1) {
      return c.json({ error: 'Account has been suspended' }, 403)
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash as string)
    if (!isValid) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    // Generate JWT
    const jwtPayload = {
      userId: user.id,
      email: user.email,
      name: user.display_name,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
    }

    const token = await sign(jwtPayload, c.env.JWT_SECRET)

    return c.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.display_name,
        role: user.role,
        picture: user.photo_url,
        points: user.points,
        notes_count: user.notes_count,
        class: user.class,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Login failed' }, 500)
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

// Update profile
app.put('/api/auth/profile', authMiddleware, async (c) => {
  const user = c.get('user')
  const { name, class: userClass, photo_url } = await c.req.json()

  await c.env.DB.prepare(`
    UPDATE users 
    SET display_name = ?, class = ?, photo_url = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(name, userClass, photo_url, user.userId).run()

  return c.json({ success: true })
})

// Change password
app.post('/api/auth/change-password', authMiddleware, async (c) => {
  const user = c.get('user')
  const { currentPassword, newPassword } = await c.req.json()

  if (!currentPassword || !newPassword) {
    return c.json({ error: 'Current and new password required' }, 400)
  }

  if (newPassword.length < 6) {
    return c.json({ error: 'Password must be at least 6 characters' }, 400)
  }

  // Get current password hash
  const dbUser = await c.env.DB.prepare(
    'SELECT password_hash FROM users WHERE id = ?'
  ).bind(user.userId).first()

  if (!dbUser) {
    return c.json({ error: 'User not found' }, 404)
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, dbUser.password_hash as string)
  if (!isValid) {
    return c.json({ error: 'Current password is incorrect' }, 401)
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword)

  // Update password
  await c.env.DB.prepare(
    'UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?'
  ).bind(newPasswordHash, user.userId).run()

  return c.json({ success: true, message: 'Password updated successfully' })
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

// ==================== ADMIN ROUTES ====================

// Admin middleware
const adminMiddleware = async (c: any, next: any) => {
  const user = c.get('user')
  
  if (user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403)
  }
  
  await next()
}

// Get all users (admin only)
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (c) => {
  const users = await c.env.DB.prepare(
    'SELECT id, email, display_name, role, points, notes_count, class, suspended, created_at FROM users ORDER BY created_at DESC'
  ).all()

  return c.json({ users: users.results })
})

// Suspend user (admin only)
app.post('/api/admin/users/:id/suspend', authMiddleware, adminMiddleware, async (c) => {
  const userId = c.req.param('id')

  await c.env.DB.prepare(
    'UPDATE users SET suspended = 1, updated_at = datetime("now") WHERE id = ?'
  ).bind(userId).run()

  return c.json({ success: true })
})

// Unsuspend user (admin only)
app.post('/api/admin/users/:id/unsuspend', authMiddleware, adminMiddleware, async (c) => {
  const userId = c.req.param('id')

  await c.env.DB.prepare(
    'UPDATE users SET suspended = 0, updated_at = datetime("now") WHERE id = ?'
  ).bind(userId).run()

  return c.json({ success: true })
})

// ==================== HEALTH CHECK ====================

app.get('/', (c) => c.json({
  status: 'ok',
  message: 'Notarium API v2.0 - Email/Password Auth',
  timestamp: new Date().toISOString(),
}))

app.get('/api/health', (c) => c.json({ status: 'healthy' }))

export default app