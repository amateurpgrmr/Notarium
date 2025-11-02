import { useEffect, useState, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import api, { User } from './lib/api'
import Login from './pages/Login'
import Signup from './pages/Signup'
import './index.css'

// ==================== AUTH CONTEXT ====================

interface AuthContextType {
  user: User | null
  loading: boolean
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
  refreshUser: async () => {},
})

function useAuth() {
  return useContext(AuthContext)
}

// ==================== PROTECTED ROUTE ====================

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-lg font-medium text-gray-700">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// ==================== PROFILE EDITOR ====================

function ProfileEditor({ onClose }: { onClose: () => void }) {
  const { user, refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState(user?.name || '')
  const [selectedClass, setSelectedClass] = useState(user?.class || '10.1')

  const handleSave = async () => {
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      await api.updateProfile({ name, class: selectedClass })
      await refreshUser()
      setSuccess(true)
      setTimeout(() => onClose(), 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Your display name"
            />
          </div>

          {/* Class Selection (Students only) */}
          {user?.role === 'student' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Class
              </label>
              <div className="grid grid-cols-3 gap-3">
                {['10.1', '10.2', '10.3'].map((classOption) => (
                  <button
                    key={classOption}
                    type="button"
                    onClick={() => setSelectedClass(classOption)}
                    className={`py-3 px-4 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                      selectedClass === classOption
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {classOption}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
              Profile updated successfully!
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== HOME PAGE ====================

function HomePage() {
  const { user, logout } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showProfileEditor, setShowProfileEditor] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const subjectsData = await api.getSubjects()
        const notesData = await api.getNotes()
        setSubjects(subjectsData.subjects || [])
        setNotes(notesData.notes || [])
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">📚</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Notarium
              </h1>
              {user?.role === 'admin' && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-lg">
                  ADMIN
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowProfileEditor(true)}
                className="flex items-center gap-3 hover:bg-gray-100 rounded-xl px-3 py-2 transition-colors"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.class || 'No class'}</p>
                </div>
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0]}! 👋</h2>
          <p className="text-purple-100">Ready to share some knowledge today?</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Your Notes</h3>
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{user?.notes_count || 0}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Points</h3>
              <span className="text-2xl">⭐</span>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{user?.points || 0}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Class</h3>
              <span className="text-2xl">🎓</span>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{user?.class || 'N/A'}</p>
          </div>
        </div>

        {/* Subjects */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Subjects</h2>
          {loading ? (
            <div className="text-gray-600">Loading subjects...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {subjects.map((subject: any) => (
                <div
                  key={subject.id}
                  className="bg-white/80 backdrop-blur-xl p-6 rounded-xl border border-white/20 hover:border-purple-300 hover:shadow-xl transition-all cursor-pointer text-center group"
                >
                  <i className={`fas ${subject.icon} text-4xl bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-3 group-hover:scale-110 transition-transform`}></i>
                  <h3 className="font-semibold text-gray-900 mb-1">{subject.name}</h3>
                  <p className="text-sm text-gray-500">{subject.note_count} notes</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Notes */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Notes</h2>
          {loading ? (
            <div className="text-gray-600">Loading notes...</div>
          ) : notes.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl p-12 rounded-xl border-2 border-dashed border-gray-300 text-center">
              <span className="text-6xl mb-4 block">📚</span>
              <p className="text-gray-500 text-lg">No notes yet. Be the first to share!</p>
              <button className="mt-4 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow">
                Create Your First Note
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {notes.slice(0, 6).map((note: any) => (
                <div
                  key={note.id}
                  className="bg-white/80 backdrop-blur-xl p-6 rounded-xl border border-white/20 hover:border-purple-300 hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                      {note.author_name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{note.author_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(note.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{note.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {note.content}
                  </p>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>👁️ {note.views || 0} views</span>
                    <span>⭐ {(note.rating_avg || 0).toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Profile Editor Modal */}
      {showProfileEditor && (
        <ProfileEditor onClose={() => setShowProfileEditor(false)} />
      )}
    </div>
  )
}

// ==================== AUTH PROVIDER ====================

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = async () => {
    if (!api.isAuthenticated()) {
      setLoading(false)
      return
    }

    try {
      const response = await api.getCurrentUser()
      setUser(response.user)
    } catch (error) {
      console.error('Failed to load user:', error)
      api.clearToken()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
  }, [])

  const logout = () => {
    api.logout()
    setUser(null)
    window.location.href = '/login'
  }

  const refreshUser = async () => {
    await loadUser()
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
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
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
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
