import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import '../styles/login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Auto-redirect if already authenticated or auto-login if token exists
  useEffect(() => {
    if (api.isAuthenticated()) {
      navigate('/', { replace: true });
      return;
    }

    // Try to auto-login if token exists in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      // Token exists, redirect to home - the app will validate the token
      navigate('/', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load saved credentials from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('loginEmail');
    const savedPassword = localStorage.getItem('loginPassword');
    if (savedEmail) setEmail(savedEmail);
    if (savedPassword) setPassword(savedPassword);
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Save credentials for auto-fill on next visit
      localStorage.setItem('loginEmail', email);
      localStorage.setItem('loginPassword', password);

      const response = await api.auth.login({ email, password });
      if (response.token) {
        localStorage.setItem('token', response.token);
        navigate('/', { replace: true });
      }

    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="login-wrapper">
        <h1 className="login-title" style={{ animation: 'fadeIn 0.6s ease-out' }}>
          NOTARIUM
        </h1>

        <div className="login-card" style={{ animation: 'scaleIn 0.6s ease-out 0.2s both' }}>
          <h2 className="login-heading">Welcome Back</h2>
          <p className="login-subtitle">Sign in to access your study materials</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleEmailLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label htmlFor="password">Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '4px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#888'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="login-button primary"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="login-footer">
            Don't have an account? <a href="/signup">Sign up</a>
          </p>

          <div style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center'
          }}>
            <a
              href="/admin-login"
              style={{
                color: '#888',
                fontSize: '13px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
              onMouseOut={(e) => e.currentTarget.style.color = '#888'}
            >
              <span>🔐</span>
              <span>Admin Sign In</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
