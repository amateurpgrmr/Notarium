import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import type { D1Database } from '@cloudflare/workers-types'

type Env = {
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  JWT_SECRET: string
  DB: D1Database
}

const app = new Hono<{ Bindings: Env }>()

// ROOT ROUTE — FIXES 404
app.get('/', (c) => c.json({ status: 'ok', message: 'Notarium backend is running' }))

app.get('/api/health', (c) => c.text('OK'))

app.get('/api/auth/google', (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID
  const redirectUri = 'https://notarium-seven.vercel.app/auth/callback'
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'openid email profile')
  return c.redirect(authUrl.toString())
})

app.get('/api/auth/callback', async (c) => {
  const code = c.req.query('code')
  if (!code) return c.text('Missing code', 400)

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: 'https://notarium-seven.vercel.app/auth/callback',
      grant_type: 'authorization_code',
    }),
  })

  const tokenData = await tokenResponse.json()
  const idToken = tokenData.id_token
  if (!idToken) return c.text('No id_token', 400)

  const payload = { sub: tokenData.sub, email: tokenData.email }
  const token = await sign(payload, c.env.JWT_SECRET)

  return c.json({ token })
})

export default app
