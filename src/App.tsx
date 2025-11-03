import { useEffect, useState, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import api, { User } from './lib/api'
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import Signup from './pages/Signup'
import SubjectsPage from './pages/SubjectsPage'
import SubjectNotesPage from './pages/SubjectNotesPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ChatPage from './pages/ChatPage'
import AdminPage from './pages/AdminPage'
import ProfileEditor from './components/ProfileEditor'
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
  const [subjects, setSubjects] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640)

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

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640)
      if (window.innerWidth >= 640) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const navigateTo = (page: typeof currentPage, subject?: any) => {
    if (subject) {
      setCurrentSubject(subject)
    }
    setCurrentPage(page)
    closeMobileMenu()
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
        padding: isMobile ? '20px 24px' : '32px 60px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
        gap: '20px',
        minHeight: isMobile ? '90px' : '130px'
      }}>
        {/* Mobile: Hamburger Button */}
        {isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: darkTheme.colors.textPrimary,
              cursor: 'pointer',
              fontSize: '32px',
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              transition: darkTheme.transitions.default
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            <i className="fas fa-bars"></i>
          </button>
        )}

        {/* Logo - Desktop with text, Mobile with image only */}
        <button
          onClick={() => { navigateTo('subjects'); setCurrentSubject(null); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: darkTheme.transitions.default,
            padding: 0
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          {isMobile ? (
            <img
              src="/notarium-logo.jpg"
              alt="Notarium"
              style={{ height: '56px', width: 'auto' }}
            />
          ) : (
            <>
              <img
                src="/notarium-logo.jpg"
                alt="Notarium"
                style={{ height: '70px', width: 'auto' }}
              />
              <h1 style={{ fontSize: '28px', fontFamily: 'Playfair Display, serif', fontWeight: 'bold', margin: 0 }}>
                Notarium<span style={{ color: darkTheme.colors.accent }}>.Site</span>
              </h1>
            </>
          )}
        </button>

        {/* Search bar - Always visible */}
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '14px 18px 14px 48px',
            background: darkTheme.colors.bgSecondary,
            border: `1px solid ${darkTheme.colors.borderColor}`,
            borderRadius: darkTheme.borderRadius.md,
            width: isMobile ? '1fr' : '360px',
            fontSize: '16px',
            fontWeight: '500',
            color: darkTheme.colors.textPrimary,
            outline: 'none',
            transition: darkTheme.transitions.default,
            boxSizing: 'border-box',
            flex: isMobile ? 1 : undefined
          } as React.CSSProperties}
          onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'}
          onBlur={(e) => e.currentTarget.style.borderColor = darkTheme.colors.borderColor}
        />

        {/* Desktop Navigation Buttons - Hidden on mobile */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => navigateTo('subjects')}
              style={{
                padding: '16px 28px',
                background: currentPage === 'subjects' ? darkTheme.colors.accent : 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: darkTheme.transitions.default,
                borderRadius: darkTheme.borderRadius.md
              }}
              onMouseOver={(e) => !currentPage.includes('subjects') && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
              onMouseOut={(e) => !currentPage.includes('subjects') && (e.currentTarget.style.background = 'transparent')}
            >
              <i style={{ marginRight: '10px' }} className="fas fa-book"></i>Subjects
            </button>

            <button
              onClick={() => navigateTo('chat')}
              style={{
                padding: '16px 28px',
                background: currentPage === 'chat' ? darkTheme.colors.accent : 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: darkTheme.transitions.default,
                borderRadius: darkTheme.borderRadius.md
              }}
              onMouseOver={(e) => currentPage !== 'chat' && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
              onMouseOut={(e) => currentPage !== 'chat' && (e.currentTarget.style.background = 'transparent')}
            >
              <i style={{ marginRight: '10px' }} className="fas fa-comments"></i>Chat
            </button>

            <button
              onClick={() => navigateTo('leaderboard')}
              style={{
                padding: '16px 28px',
                background: currentPage === 'leaderboard' ? darkTheme.colors.accent : 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: darkTheme.transitions.default,
                borderRadius: darkTheme.borderRadius.md
              }}
              onMouseOver={(e) => currentPage !== 'leaderboard' && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
              onMouseOut={(e) => currentPage !== 'leaderboard' && (e.currentTarget.style.background = 'transparent')}
            >
              <i style={{ marginRight: '10px' }} className="fas fa-trophy"></i>Leaderboard
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => navigateTo('admin')}
                style={{
                  padding: '16px 28px',
                  background: currentPage === 'admin' ? darkTheme.colors.accent : 'transparent',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: darkTheme.transitions.default,
                  borderRadius: darkTheme.borderRadius.md
                }}
                onMouseOver={(e) => currentPage !== 'admin' && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
                onMouseOut={(e) => currentPage !== 'admin' && (e.currentTarget.style.background = 'transparent')}
              >
                <i style={{ marginRight: '10px' }} className="fas fa-cog"></i>Admin
              </button>
            )}
          </div>
        )}

        {/* Account Avatar - Always visible */}
        <button
          onClick={() => setShowProfileEditor(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? 0 : '16px',
            background: 'transparent',
            border: 'none',
            color: darkTheme.colors.textPrimary,
            cursor: 'pointer',
            transition: darkTheme.transitions.default,
            padding: '12px 16px',
            borderRadius: darkTheme.borderRadius.md
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{
            width: '56px',
            height: '56px',
            background: `linear-gradient(135deg, ${darkTheme.colors.accent}, #8b5cf6)`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '20px',
            flexShrink: 0
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          {!isMobile && <span style={{ fontSize: '16px', fontWeight: '600' }}>{user?.name}</span>}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 999,
          top: '60px'
        }} onClick={closeMobileMenu} />
      )}

      {/* Mobile Menu */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          left: 0,
          top: '60px',
          width: '280px',
          height: 'calc(100vh - 60px)',
          background: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRight: `1px solid ${darkTheme.colors.borderColor}`,
          zIndex: 1001,
          transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: 'auto'
        }}>
          {/* Menu Items */}
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => navigateTo('subjects')}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: currentPage === 'subjects' ? darkTheme.colors.accent : 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '500',
                transition: darkTheme.transitions.default,
                borderRadius: darkTheme.borderRadius.md,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseOver={(e) => !currentPage.includes('subjects') && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
              onMouseOut={(e) => !currentPage.includes('subjects') && (e.currentTarget.style.background = 'transparent')}
            >
              <i className="fas fa-book" style={{ width: '20px' }}></i>Subjects
            </button>

            <button
              onClick={() => navigateTo('chat')}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: currentPage === 'chat' ? darkTheme.colors.accent : 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '500',
                transition: darkTheme.transitions.default,
                borderRadius: darkTheme.borderRadius.md,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseOver={(e) => currentPage !== 'chat' && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
              onMouseOut={(e) => currentPage !== 'chat' && (e.currentTarget.style.background = 'transparent')}
            >
              <i className="fas fa-comments" style={{ width: '20px' }}></i>Chat
            </button>

            <button
              onClick={() => navigateTo('leaderboard')}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: currentPage === 'leaderboard' ? darkTheme.colors.accent : 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '500',
                transition: darkTheme.transitions.default,
                borderRadius: darkTheme.borderRadius.md,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseOver={(e) => currentPage !== 'leaderboard' && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
              onMouseOut={(e) => currentPage !== 'leaderboard' && (e.currentTarget.style.background = 'transparent')}
            >
              <i className="fas fa-trophy" style={{ width: '20px' }}></i>Leaderboard
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => navigateTo('admin')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: currentPage === 'admin' ? darkTheme.colors.accent : 'transparent',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '500',
                  transition: darkTheme.transitions.default,
                  borderRadius: darkTheme.borderRadius.md,
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseOver={(e) => currentPage !== 'admin' && (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
                onMouseOut={(e) => currentPage !== 'admin' && (e.currentTarget.style.background = 'transparent')}
              >
                <i className="fas fa-cog" style={{ width: '20px' }}></i>Admin
              </button>
            )}

            {/* Divider */}
            <div style={{
              height: '1px',
              background: darkTheme.colors.borderColor,
              margin: '8px 0'
            }}></div>

            {/* Logout Button */}
            <button
              onClick={() => {
                closeMobileMenu()
                logout()
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: darkTheme.colors.danger,
                border: 'none',
                color: 'white',
                borderRadius: darkTheme.borderRadius.md,
                cursor: 'pointer',
                transition: darkTheme.transitions.default,
                fontSize: '15px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = darkTheme.colors.dangerHover}
              onMouseOut={(e) => e.currentTarget.style.background = darkTheme.colors.danger}
            >
              <i className="fas fa-sign-out-alt" style={{ width: '20px' }}></i>Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{ marginTop: isMobile ? '110px' : '162px', padding: isMobile ? '24px' : '60px' }}>
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
          <Route path="/admin-login" element={<AdminLogin />} />
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
