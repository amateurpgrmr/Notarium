import { useEffect, useState, createContext, useContext, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import api, { User } from './lib/api'
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import Signup from './pages/Signup'
import Suspended from './pages/Suspended'
import PasswordResetPage from './pages/PasswordResetPage'
import SubjectsPage from './pages/SubjectsPage'
import SubjectNotesPage from './pages/SubjectNotesPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ChatPage from './pages/ChatPage'
import AdminPage from './pages/AdminPage'
import MyNotesPage from './pages/MyNotesPage'
import ProfileEditor from './components/ProfileEditor'
import ProfileStats from './components/ProfileStats'
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

  useEffect(() => {
    // If no user but token exists, try to load user
    if (!user && !loading && api.isAuthenticated()) {
      refreshUser()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading])

  if (loading) {
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

  // Check if user is suspended
  if (user.suspended && user.suspension_end_date) {
    return <Navigate to="/suspended" replace />
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
  const [showProfileStats, setShowProfileStats] = useState(false)
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
        padding: isMobile ? '12px 16px' : '16px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
        gap: '12px',
        minHeight: isMobile ? '64px' : '76px'
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
              fontSize: '24px',
              display: 'flex',
              alignItems: 'center',
              padding: '8px',
              transition: darkTheme.transitions.default
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            <i className="fas fa-bars"></i>
          </button>
        )}

        {/* Logo - Image only on both desktop and mobile */}
        <button
          onClick={() => { navigateTo('subjects'); setCurrentSubject(null); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: darkTheme.transitions.default,
            padding: 0
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          <img
            src="/notarium-logo.jpg"
            alt="Notarium"
            style={{ height: isMobile ? '44px' : '48px', width: 'auto' }}
          />
        </button>

        {/* Search bar - Always visible */}
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '10px 14px 10px 36px',
            background: darkTheme.colors.bgSecondary,
            border: `1px solid ${darkTheme.colors.borderColor}`,
            borderRadius: darkTheme.borderRadius.md,
            width: isMobile ? '1fr' : '280px',
            fontSize: '14px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => navigateTo('subjects')}
              style={{
                padding: '10px 18px',
                background: currentPage === 'subjects' ? darkTheme.colors.accent : 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
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
              onClick={() => navigateTo('chat')}
              style={{
                padding: '10px 18px',
                background: currentPage === 'chat' ? darkTheme.colors.accent : 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
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
              onClick={() => navigateTo('leaderboard')}
              style={{
                padding: '10px 18px',
                background: currentPage === 'leaderboard' ? darkTheme.colors.accent : 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
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
                onClick={() => navigateTo('admin')}
                style={{
                  padding: '10px 18px',
                  background: currentPage === 'admin' ? darkTheme.colors.accent : 'transparent',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
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

            {/* My Notes Button */}
            <button
              onClick={() => window.location.href = '/my-notes'}
              style={{
                padding: '10px 18px',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: darkTheme.transitions.default,
                borderRadius: darkTheme.borderRadius.md
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <i style={{ marginRight: '6px' }} className="fas fa-book"></i>My Notes
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              style={{
                padding: '10px 18px',
                background: 'transparent',
                border: `1px solid ${darkTheme.colors.borderColor}`,
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                transition: darkTheme.transitions.default,
                borderRadius: darkTheme.borderRadius.md
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = darkTheme.colors.borderColor;
              }}
            >
              <i style={{ marginRight: '6px' }} className="fas fa-sign-out-alt"></i>Logout
            </button>
          </div>
        )}

        {/* Account Avatar - Desktop only */}
        {!isMobile && (
          <button
            onClick={() => setShowProfileEditor(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'transparent',
              border: 'none',
              color: darkTheme.colors.textPrimary,
              cursor: 'pointer',
              transition: darkTheme.transitions.default,
              padding: '8px 10px',
              borderRadius: darkTheme.borderRadius.md
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: '40px',
              height: '40px',
              background: user?.photo_url
                ? `url('${user.photo_url}') center/cover`
                : `linear-gradient(135deg, ${darkTheme.colors.accent}, #8b5cf6)`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px',
              flexShrink: 0
            }}>
              {!user?.photo_url && user?.name?.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '13px', fontWeight: '500' }}>{user?.name}</span>
          </button>
        )}
      </nav>

      {/* Warning Banner (Yellow) */}
      {user?.warning && user?.warning_message && !user?.suspended && (
        <div style={{
          position: 'fixed',
          top: isMobile ? '64px' : '76px',
          left: 0,
          right: 0,
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.95))',
          backdropFilter: 'blur(10px)',
          borderBottom: '2px solid rgba(245, 158, 11, 0.5)',
          padding: '14px 20px',
          zIndex: 999,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ fontSize: '22px', flexShrink: 0 }}>⚠️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px', color: 'white' }}>
                  Account Warning
                </div>
                <div style={{
                  fontSize: '13px',
                  padding: '10px',
                  background: 'rgba(0, 0, 0, 0.15)',
                  borderRadius: '6px',
                  color: 'rgba(255, 255, 255, 0.95)',
                  borderLeft: '3px solid rgba(255, 255, 255, 0.6)'
                }}>
                  {user.warning_message}
                </div>
                <div style={{ fontSize: '11px', marginTop: '8px', color: 'rgba(255, 255, 255, 0.85)', fontStyle: 'italic' }}>
                  This is a warning. Repeated violations may result in account suspension.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspension Banner (Red) - Blocks Actions */}
      {user?.suspended && (user?.suspension_end_date || user?.suspension_reason) && (
        <div style={{
          position: 'fixed',
          top: isMobile ? '64px' : '76px',
          left: 0,
          right: 0,
          background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.95), rgba(153, 27, 27, 0.95))',
          backdropFilter: 'blur(10px)',
          borderBottom: '2px solid rgba(239, 68, 68, 0.5)',
          padding: '16px 20px',
          zIndex: 999,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ fontSize: '24px', flexShrink: 0 }}>⚠️</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px', color: 'white' }}>
                  Account Suspended
                </div>
                {user.suspension_end_date && (
                  <div style={{ fontSize: '14px', marginBottom: '6px', color: 'rgba(255, 255, 255, 0.95)' }}>
                    Your account is suspended until {new Date(user.suspension_end_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
                {user.suspension_reason && (
                  <div style={{
                    fontSize: '13px',
                    padding: '10px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '6px',
                    marginTop: '8px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    borderLeft: '3px solid rgba(255, 255, 255, 0.5)'
                  }}>
                    <strong>Reason:</strong> {user.suspension_reason}
                  </div>
                )}
                <div style={{ fontSize: '12px', marginTop: '10px', color: 'rgba(255, 255, 255, 0.8)' }}>
                  You can still view content but cannot upload notes or interact during this time.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
          top: '64px',
          width: '280px',
          height: 'calc(100vh - 64px)',
          background: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRight: `1px solid ${darkTheme.colors.borderColor}`,
          zIndex: 1001,
          transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Profile Section - Top (Full Width) */}
          <div style={{
            padding: '24px 16px',
            borderBottom: `2px solid ${darkTheme.colors.borderColor}`,
            background: `linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))`,
            textAlign: 'center',
            cursor: 'pointer',
            transition: darkTheme.transitions.default
          }}
          onClick={() => {
            setShowProfileStats(true);
            closeMobileMenu();
          }}
          onMouseOver={(e) => e.currentTarget.style.background = `linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))`}
          onMouseOut={(e) => e.currentTarget.style.background = `linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))`}
          >
            {/* Profile Picture */}
            <div style={{
              width: '80px',
              height: '80px',
              background: user?.photo_url
                ? `url('${user.photo_url}') center/cover`
                : `linear-gradient(135deg, ${darkTheme.colors.accent}, #8b5cf6)`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '36px',
              margin: '0 auto 12px',
              flexShrink: 0,
              border: `2px solid ${darkTheme.colors.borderColor}`
            }}>
              {!user?.photo_url && user?.name?.charAt(0).toUpperCase()}
            </div>

            {/* User Name and Class */}
            <h3 style={{ margin: '0 0 2px 0', fontSize: '18px', fontWeight: '800', color: '#fff', letterSpacing: '0.5px' }}>
              {user?.name || 'User'}
            </h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: darkTheme.colors.textSecondary, fontWeight: '500' }}>
              {user?.class ? `📚 ${user.class}` : ''}
            </p>

            {/* Description */}
            {user?.description && (
              <p style={{
                margin: '8px 0',
                fontSize: '12px',
                color: darkTheme.colors.textSecondary,
                fontStyle: 'italic',
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                "{user.description}"
              </p>
            )}

            {/* Points Display - Only show when user has uploaded notes */}
            {(user?.points || 0) > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                margin: '8px 0',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                <span style={{ fontSize: '16px' }}>🪙</span>
                <span>{Math.max(0, user?.points || 0)} Points</span>
              </div>
            )}

            {/* Badges - Dynamic based on points */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '12px',
              flexWrap: 'wrap'
            }}>
              {/* Bronze Badge (100+ notes) */}
              {(user?.points || 0) >= 100 && (
                <div
                  title="Bronze Badge - 100+ Points"
                  style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #CD7F32, #8B4513)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '16px',
                    animation: 'badgeBounce 0.6s ease-out',
                    boxShadow: '0 4px 12px rgba(205, 127, 50, 0.4)'
                  }}
                >
                  🥉
                </div>
              )}

              {/* Silver Badge (250+ notes) */}
              {(user?.points || 0) >= 250 && (
                <div
                  title="Silver Badge - 250+ Points"
                  style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #C0C0C0, #808080)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '16px',
                    animation: 'badgeBounce 0.6s ease-out 0.1s both',
                    boxShadow: '0 4px 12px rgba(192, 192, 192, 0.4)'
                  }}
                >
                  🥈
                </div>
              )}

              {/* Gold Badge (500+ notes) */}
              {(user?.points || 0) >= 500 && (
                <div
                  title="Gold Badge - 500+ Points"
                  style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '16px',
                    animation: 'badgeBounce 0.6s ease-out 0.2s both',
                    boxShadow: '0 4px 12px rgba(255, 215, 0, 0.6)'
                  }}
                >
                  🥇
                </div>
              )}

              {/* Platinum Badge (1000+ notes) */}
              {(user?.points || 0) >= 1000 && (
                <div
                  title="Platinum Badge - 1000+ Points"
                  style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #E5E4E2, #36454F)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '16px',
                    animation: 'badgeBounce 0.6s ease-out 0.3s both',
                    boxShadow: '0 4px 12px rgba(229, 228, 226, 0.6)'
                  }}
                >
                  👑
                </div>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
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

            {/* My Notes Button */}
            <button
              onClick={() => {
                closeMobileMenu()
                window.location.href = '/my-notes'
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'transparent',
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
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <i className="fas fa-book" style={{ width: '20px' }}></i>My Notes
            </button>

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

          {/* Notarium.Site Footer - Bottom */}
          <div style={{
            padding: '16px',
            borderTop: `2px solid ${darkTheme.colors.borderColor}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            transition: darkTheme.transitions.default,
            marginTop: 'auto'
          }}
          onClick={() => { navigateTo('subjects'); setCurrentSubject(null); closeMobileMenu(); }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
          >
            <img
              src="/notarium-logo.jpg"
              alt="Notarium"
              style={{ height: '40px', width: 'auto' }}
            />
            <div>
              <h4 style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>
                Notarium<span style={{ color: darkTheme.colors.accent }}>.Site</span>
              </h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: darkTheme.colors.textSecondary }}>Share Your Notes</p>
            </div>
          </div>

          {/* Badge Unlock Animation Keyframes */}
          <style>{`
            @keyframes badgeBounce {
              0% {
                transform: scale(0) rotate(-180deg);
                opacity: 0;
              }
              50% {
                transform: scale(1.2) rotate(0deg);
              }
              100% {
                transform: scale(1) rotate(0deg);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}

      {/* Main Content */}
      <main style={{ marginTop: isMobile ? '78px' : '92px', padding: isMobile ? '16px' : '32px' }}>
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

      {/* Profile Stats Modal - Mobile only */}
      {showProfileStats && (
        <ProfileStats
          onClose={() => setShowProfileStats(false)}
          onEditProfile={() => setShowProfileEditor(true)}
        />
      )}

      {/* Profile Editor Modal - Desktop only */}
      {showProfileEditor && !showProfileStats && (
        <ProfileEditor onClose={() => setShowProfileEditor(false)} />
      )}

      {/* Copyright Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '32px 20px',
        borderTop: `1px solid ${darkTheme.colors.borderColor}`,
        color: darkTheme.colors.textSecondary,
        fontSize: '13px',
        marginTop: '48px',
        background: darkTheme.colors.bgSecondary
      }}>
        <p style={{ margin: 0 }}>© 2025 Notarium. All rights reserved.</p>
      </footer>
    </div>
  )
}

// ==================== AUTH PROVIDER ====================

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const logout = useCallback(() => {
    api.logout()
    setUser(null)
    window.location.href = '/login'
  }, [])

  const refreshUser = useCallback(async () => {
    setLoading(true)
    await loadUser()
  }, [loadUser])

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
          <Route path="/suspended" element={<Suspended />} />
          <Route path="/pwd-reset" element={<PasswordResetPage />} />
          <Route
            path="/my-notes"
            element={
              <ProtectedRoute>
                <MyNotesPage />
              </ProtectedRoute>
            }
          />
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
