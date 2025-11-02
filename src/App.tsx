import { useEffect, useState, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import api, { User } from './lib/api'
import Login from './pages/Login'
import Signup from './pages/Signup'
import SubjectsPage from './pages/SubjectsPage'
import SubjectNotesPage from './pages/SubjectNotesPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ChatPage from './pages/ChatPage'
import AdminPage from './pages/AdminPage'
import ProfileEditor from './components/ProfileEditor'
import UploadNoteModal from './components/UploadNoteModal'
import LoadingSpinner from './components/LoadingSpinner'
import { darkTheme, darkThemeStyles } from './theme'
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

export function useAuth() {
  return useContext(AuthContext)
}


// ==================== PROTECTED ROUTE ====================

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, refreshUser } = useAuth()
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    // If no user but token exists, try to load user
    if (!user && !loading && api.isAuthenticated() && !isRefreshing) {
      setIsRefreshing(true)
      refreshUser().finally(() => setIsRefreshing(false))
    }
  }, [user, loading, refreshUser, isRefreshing])

  if (loading || isRefreshing) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: darkTheme.colors.bgPrimary,
        color: darkTheme.colors.textPrimary
      }}>
        <LoadingSpinner message="Loading your workspace..." size="lg" />
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
  const [currentPage, setCurrentPage] = useState<'subjects' | 'subject-notes' | 'leaderboard' | 'chat' | 'admin'>('subjects')
  const [currentSubject, setCurrentSubject] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [showProfileEditor, setShowProfileEditor] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [subjects, setSubjects] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const handleSelectSubject = (subject: any) => {
    setCurrentSubject(subject)
    setCurrentPage('subject-notes')
  }

  const handleBackToSubjects = () => {
    setCurrentPage('subjects')
    setCurrentSubject(null)
  }

  const loadSubjects = async () => {
    try {
      const data = await api.getSubjects()
      setSubjects(data.subjects || [])
    } catch (error) {
      console.error('Failed to load subjects:', error)
    }
  }

  useEffect(() => {
    loadSubjects()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: darkTheme.colors.bgPrimary, color: darkTheme.colors.textPrimary }}>
      <style>{darkThemeStyles}</style>

      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${darkTheme.colors.borderColor}`,
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '24px', fontFamily: 'Playfair Display, serif', fontWeight: 'bold', margin: 0 }}>
            Notarium<span style={{ color: darkTheme.colors.accent }}>.Site</span>
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Search bar */}
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '10px 16px 10px 40px',
              background: darkTheme.colors.bgSecondary,
              border: `1px solid ${darkTheme.colors.borderColor}`,
              borderRadius: darkTheme.borderRadius.sm,
              width: '250px',
              fontSize: '14px',
              color: darkTheme.colors.textPrimary,
              outline: 'none',
              transition: darkTheme.transitions.default,
              position: 'relative',
              boxSizing: 'border-box'
            } as React.CSSProperties}
            onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'}
            onBlur={(e) => e.currentTarget.style.borderColor = darkTheme.colors.borderColor}
          />

          {/* Upload Note Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            style={{
              padding: '8px 16px',
              background: darkTheme.colors.accent,
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: darkTheme.transitions.default,
              borderRadius: darkTheme.borderRadius.md,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            <i className="fas fa-plus"></i>Upload Note
          </button>

          {/* Nav buttons */}
          <button
            onClick={() => { setCurrentPage('subjects'); setCurrentSubject(null); }}
            style={{
              padding: '8px 16px',
              background: currentPage === 'subjects' ? darkTheme.colors.accent : 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: darkTheme.transitions.default,
              borderRadius: darkTheme.borderRadius.md
            }}
            onMouseOver={(e) => !currentPage.includes('subjects') && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
            onMouseOut={(e) => !currentPage.includes('subjects') && (e.currentTarget.style.background = 'transparent')}
          >
            <i style={{ marginRight: '6px' }} className="fas fa-book"></i>Subjects
          </button>

          <button
            onClick={() => setCurrentPage('chat')}
            style={{
              padding: '8px 16px',
              background: currentPage === 'chat' ? darkTheme.colors.accent : 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: darkTheme.transitions.default,
              borderRadius: darkTheme.borderRadius.md
            }}
            onMouseOver={(e) => currentPage !== 'chat' && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
            onMouseOut={(e) => currentPage !== 'chat' && (e.currentTarget.style.background = 'transparent')}
          >
            <i style={{ marginRight: '6px' }} className="fas fa-comments"></i>Chat
          </button>

          <button
            onClick={() => setCurrentPage('leaderboard')}
            style={{
              padding: '8px 16px',
              background: currentPage === 'leaderboard' ? darkTheme.colors.accent : 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: darkTheme.transitions.default,
              borderRadius: darkTheme.borderRadius.md
            }}
            onMouseOver={(e) => currentPage !== 'leaderboard' && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
            onMouseOut={(e) => currentPage !== 'leaderboard' && (e.currentTarget.style.background = 'transparent')}
          >
            <i style={{ marginRight: '6px' }} className="fas fa-trophy"></i>Leaderboard
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => setCurrentPage('admin')}
              style={{
                padding: '8px 16px',
                background: currentPage === 'admin' ? darkTheme.colors.accent : 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: darkTheme.transitions.default,
                borderRadius: darkTheme.borderRadius.md
              }}
              onMouseOver={(e) => currentPage !== 'admin' && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
              onMouseOut={(e) => currentPage !== 'admin' && (e.currentTarget.style.background = 'transparent')}
            >
              <i style={{ marginRight: '6px' }} className="fas fa-cog"></i>Admin
            </button>
          )}

          {/* User menu */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginLeft: '16px',
            paddingLeft: '16px',
            borderLeft: `1px solid ${darkTheme.colors.borderColor}`
          }}>
            <button
              onClick={() => setShowProfileEditor(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                border: 'none',
                color: darkTheme.colors.textPrimary,
                cursor: 'pointer',
                transition: darkTheme.transitions.default,
                padding: '4px 8px',
                borderRadius: darkTheme.borderRadius.md
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: '32px',
                height: '32px',
                background: `linear-gradient(135deg, ${darkTheme.colors.accent}, #8b5cf6)`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '14px' }}>{user?.name}</span>
            </button>

            <button
              onClick={logout}
              style={{
                padding: '8px 16px',
                background: darkTheme.colors.danger,
                border: 'none',
                color: 'white',
                borderRadius: darkTheme.borderRadius.md,
                cursor: 'pointer',
                transition: darkTheme.transitions.default,
                fontSize: '14px',
                fontWeight: '500'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = darkTheme.colors.dangerHover}
              onMouseOut={(e) => e.currentTarget.style.background = darkTheme.colors.danger}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ marginTop: '70px', padding: '40px' }}>
        {currentPage === 'subjects' && (
          <SubjectsPage
            onSelectSubject={handleSelectSubject}
            isLoading={loading}
            setIsLoading={setLoading}
          />
        )}

        {currentPage === 'subject-notes' && (
          <SubjectNotesPage
            subject={currentSubject}
            onBack={handleBackToSubjects}
            isLoading={loading}
            setIsLoading={setLoading}
          />
        )}

        {currentPage === 'leaderboard' && (
          <LeaderboardPage
            isLoading={loading}
            setIsLoading={setLoading}
          />
        )}

        {currentPage === 'chat' && (
          <ChatPage />
        )}

        {currentPage === 'admin' && user?.role === 'admin' && (
          <AdminPage />
        )}
      </main>

      {/* Profile Editor Modal */}
      {showProfileEditor && (
        <ProfileEditor onClose={() => setShowProfileEditor(false)} />
      )}

      {/* Upload Note Modal */}
      {showUploadModal && (
        <UploadNoteModal
          onClose={() => setShowUploadModal(false)}
          subjects={subjects}
          onSuccess={() => {
            setShowUploadModal(false)
            // Optionally refresh notes or navigate to subjects
            loadSubjects()
          }}
        />
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
