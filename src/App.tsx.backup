import { useState } from 'react'
import api, { LoginCredentials } from './lib/api'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const credentials: LoginCredentials = { email, password }
      const result = await api.auth.login(credentials)
      if (result.success) {
        setIsLoggedIn(true)
        setMessage(`Welcome ${result.user.name}!`)
      }
    } catch (error) {
      setMessage('Login failed. Please try again.')
    }
  }

  if (isLoggedIn) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial' }}>
        <h1>Notarium - Student Notes Platform</h1>
        <p>{message}</p>
        <button onClick={() => setIsLoggedIn(false)}>Logout</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '400px', margin: '50px auto' }}>
      <h1>Notarium - Student Notes Platform</h1>
      <p>Login to access your notes</p>
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button type="submit" style={{ padding: '10px', background: '#007acc', color: 'white', border: 'none', borderRadius: '4px' }}>
          Login
        </button>
      </form>
      
      {message && <p style={{ color: 'red', marginTop: '10px' }}>{message}</p>}
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p>Try: test@student.com / any password</p>
      </div>
    </div>
  )
}

export default App
