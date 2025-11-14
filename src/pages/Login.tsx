import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';
import '../styles/login.css';

const SECRET_CODE = '%62rdn2%';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password Modal States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState<'code' | 'reset'>('code');
  const [resetCode, setResetCode] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  // Handle autofill from password reset
  useEffect(() => {
    const state = location.state as any;
    if (state?.email) {
      setEmail(state.email);
    }
    if (state?.password) {
      setPassword(state.password);
    }
    if (state?.message) {
      setSuccessMessage(state.message);
    }
  }, [location.state]);

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

  const handleOpenForgotPassword = () => {
    setShowForgotPassword(true);
    setResetStep('code');
    setResetCode('');
    setResetEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
    setResetStep('code');
    setResetCode('');
    setResetEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (resetCode === SECRET_CODE) {
      setResetStep('reset');
    } else {
      setResetError('Invalid code. Please contact an admin for the correct code.');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!resetEmail) {
      setResetError('Please enter your email');
      return;
    }

    if (!newPassword) {
      setResetError('Please enter a new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }

    try {
      setResetLoading(true);
      await api.request('/api/auth/admin-reset-password', {
        method: 'POST',
        body: {
          email: resetEmail,
          newPassword
        }
      });

      // Success - close modal and show success message
      handleCloseForgotPassword();
      setEmail(resetEmail);
      setPassword(newPassword);
      setSuccessMessage('Password reset successful! You can now sign in with your new password.');
    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password. Please check your email and try again.');
    } finally {
      setResetLoading(false);
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
          {successMessage && <div className="login-success">{successMessage}</div>}

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

          {/* Forgot Password Link */}
          <div style={{ textAlign: 'center', marginTop: '12px', marginBottom: '8px' }}>
            <button
              type="button"
              onClick={handleOpenForgotPassword}
              style={{
                background: 'none',
                border: 'none',
                color: '#888',
                fontSize: '13px',
                cursor: 'pointer',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
              onMouseOut={(e) => e.currentTarget.style.color = '#888'}
            >
              Forgot Password?
            </button>
          </div>

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

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={handleCloseForgotPassword}
        >
          <div
            className="login-card"
            style={{
              maxWidth: '450px',
              width: '100%',
              animation: 'scaleIn 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="login-heading" style={{ margin: 0 }}>Reset Password</h2>
              <button
                onClick={handleCloseForgotPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '0',
                  lineHeight: '1',
                  transition: 'color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
                onMouseOut={(e) => e.currentTarget.style.color = '#888'}
              >
                ×
              </button>
            </div>

            <p className="login-subtitle" style={{ marginBottom: '20px' }}>
              {resetStep === 'code'
                ? 'Enter the code provided by your admin'
                : 'Enter your email and new password'
              }
            </p>

            {resetError && <div className="login-error">{resetError}</div>}

            {/* Step 1: Code Entry */}
            {resetStep === 'code' && (
              <form onSubmit={handleCodeSubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="resetCode">Admin Code</label>
                  <input
                    id="resetCode"
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="Enter the code from admin"
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="login-button primary"
                >
                  Continue
                </button>
              </form>
            )}

            {/* Step 2: Password Reset */}
            {resetStep === 'reset' && (
              <form onSubmit={handlePasswordReset} className="login-form">
                <div className="form-group">
                  <label htmlFor="resetEmail">Email</label>
                  <input
                    id="resetEmail"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ position: 'relative' }}>
                  <label htmlFor="newPassword">New Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
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
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ position: 'relative' }}>
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setResetStep('code')}
                    className="login-button"
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="login-button primary"
                    style={{ flex: 2 }}
                  >
                    {resetLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
