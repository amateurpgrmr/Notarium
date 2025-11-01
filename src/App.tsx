import { useEffect, useState, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import api, { User } from './lib/api'
import './index.css'

// ==================== AUTH CONTEXT ====================

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
})

function useAuth() {
  return useContext(AuthContext)
}

// ==================== AUTH CALLBACK PAGE ====================

function AuthCallback() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search)
      const code = params.get('code')
      const errorParam = params.get('error')

      if (errorParam) {
        setError('Authentication failed. Please try again.')
        setTimeout(() => navigate('/login'), 3000)
        return
      }

      if (!code) {
        setError('No authorization code received.')
        setTimeout(() => navigate('/login'), 3000)
        return
      }

      try {
        await api.loginWithGoogle(code)
        navigate('/')
      } catch (error) {
        console.error('Login failed:', error)
        setError('Login failed. Please try again.')
        setTimeout(() => navigate('/login'), 3000)
      }
    }

    handleCallback()
  }, [location, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <div className="text-center">
        {error ? (
          <div className="text-red-500">
            <div className="text-5xl mb-4">❌</div>
            <p className="text-xl">{error}</p>
          </div>
        ) : (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-xl">Signing you in...</p>
          </>
        )}
      </div>
    </div>
  )
}

// ==================== LOGIN PAGE ====================

function LoginPage() {
  const handleGoogleLogin = () => {
    window.location.href = api.getGoogleAuthUrl()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-md w-full mx-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gradient mb-2">
              Notarium
            </h1>
            <p className="text-gray-400">Student Notes Platform</p>
          </div>

          {/* Login Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>

          <p className="text-center text-gray-500 text-sm mt-6">
            By signing in, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  )
}

// ==================== PROTECTED ROUTE ====================

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// ==================== HOME PAGE ====================

function HomePage() {
  const { user, logout } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [subjectsData, notesData] = await Promise.all([
          api.getSubjects(),
          api.getNotes(),
        ])
        setSubjects(subjectsData.subjects)
        setNotes(notesData.notes)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="glass-effect border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gradient">Notarium</h1>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={user?.picture || 'https://via.placeholder.com/40'}
                  alt={user?.name}
                  className="w-10 h-10 rounded-full border-2 border-blue-500"
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-effect p-6 rounded-xl border border-gray-800">
            <h3 className="text-gray-400 text-sm mb-2">Your Notes</h3>
            <p className="text-3xl font-bold">{user?.notes_count || 0}</p>
          </div>
          <div className="glass-effect p-6 rounded-xl border border-gray-800">
            <h3 className="text-gray-400 text-sm mb-2">Points</h3>
            <p className="text-3xl font-bold text-blue-500">{user?.points || 0}</p>
          </div>
          <div className="glass-effect p-6 rounded-xl border border-gray-800">
            <h3 className="text-gray-400 text-sm mb-2">Class</h3>
            <p className="text-3xl font-bold">{user?.class || 'N/A'}</p>
          </div>
        </div>

        {/* Subjects */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Subjects</h2>
          {loading ? (
            <div className="text-gray-400">Loading subjects...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {subjects.map((subject: any) => (
                <div
                  key={subject.id}
                  className="glass-effect p-6 rounded-xl border border-gray-800 hover:border-blue-500 transition-all cursor-pointer text-center"
                >
                  <i className={`fas ${subject.icon} text-3xl text-blue-500 mb-3`}></i>
                  <h3 className="font-semibold mb-1">{subject.name}</h3>
                  <p className="text-sm text-gray-400">{subject.note_count} notes</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Notes */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Recent Notes</h2>
          {loading ? (
            <div className="text-gray-400">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="glass-effect p-12 rounded-xl border border-gray-800 text-center">
              <p className="text-gray-400">No notes yet. Create your first note!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.slice(0, 6).map((note: any) => (
                <div
                  key={note.id}
                  className="glass-effect p-6 rounded-xl border border-gray-800 hover:border-blue-500 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={note.author_photo || 'https://via.placeholder.com/40'}
                      alt={note.author_name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{note.author_name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(note.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{note.title}</h3>
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {note.content}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>👁️ {note.views} views</span>
                    <span>⭐ {note.rating_avg.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

// ==================== AUTH PROVIDER ====================

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      if (!api.isAuthenticated()) {
        setLoading(false)
        return
      }

      try {
        const { user: userData } = await api.getCurrentUser()
        setUser(userData)
      } catch (error) {
        console.error('Failed to load user:', error)
        api.clearToken()
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  const logout = () => {
    api.logout()
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ==================== MAIN APP ====================

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App