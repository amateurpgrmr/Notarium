import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { darkTheme } from '../theme';
import api from '../lib/api';

const SECRET_CODE = 'bru31$';

export default function PasswordResetPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'code' | 'reset'>('code');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (code === SECRET_CODE) {
      setStep('reset');
    } else {
      setError('Invalid code. Please contact an admin for the correct code.');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await api.request('/api/auth/admin-reset-password', {
        method: 'POST',
        body: {
          email,
          newPassword
        }
      });

      // Success - redirect to login with autofilled password
      navigate('/login', {
        state: {
          email,
          password: newPassword,
          message: 'Password reset successful! You can now login.'
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: darkTheme.colors.bgPrimary,
      padding: isMobile ? '20px' : '40px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '450px',
        background: darkTheme.colors.bgSecondary,
        borderRadius: darkTheme.borderRadius.lg,
        padding: isMobile ? '24px' : '40px',
        boxShadow: darkTheme.shadows.lg,
        border: `1px solid ${darkTheme.colors.borderColor}`
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '32px' }}>
          <img
            src="/notarium-logo.jpg"
            alt="Notarium"
            style={{ height: isMobile ? '60px' : '80px', width: 'auto', marginBottom: '16px' }}
          />
          <h1 style={{
            fontSize: isMobile ? '22px' : '28px',
            fontWeight: 'bold',
            color: darkTheme.colors.textPrimary,
            marginBottom: '8px'
          }}>
            Password Reset
          </h1>
          <p style={{
            fontSize: isMobile ? '13px' : '14px',
            color: darkTheme.colors.textSecondary
          }}>
            {step === 'code'
              ? 'Enter the code provided by your admin'
              : 'Enter your email and new password'
            }
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: isMobile ? '10px 14px' : '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: darkTheme.borderRadius.md,
            color: '#fca5a5',
            fontSize: isMobile ? '13px' : '14px',
            marginBottom: isMobile ? '16px' : '20px'
          }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
            {error}
          </div>
        )}

        {/* Step 1: Code Entry */}
        {step === 'code' && (
          <form onSubmit={handleCodeSubmit}>
            <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: '500',
                color: darkTheme.colors.textPrimary
              }}>
                Admin Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter the code from admin"
                style={{
                  width: '100%',
                  padding: isMobile ? '10px 14px' : '12px 16px',
                  background: darkTheme.colors.bgTertiary,
                  border: `1px solid ${darkTheme.colors.borderColor}`,
                  borderRadius: darkTheme.borderRadius.md,
                  color: darkTheme.colors.textPrimary,
                  fontSize: isMobile ? '14px' : '15px',
                  outline: 'none',
                  transition: darkTheme.transitions.default
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = darkTheme.colors.accent}
                onBlur={(e) => e.currentTarget.style.borderColor = darkTheme.colors.borderColor}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: isMobile ? '12px' : '14px',
                background: darkTheme.colors.accent,
                color: 'white',
                border: 'none',
                borderRadius: darkTheme.borderRadius.md,
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: darkTheme.transitions.default
              }}
              onMouseOver={(e) => e.currentTarget.style.background = darkTheme.colors.accentHover}
              onMouseOut={(e) => e.currentTarget.style.background = darkTheme.colors.accent}
            >
              Continue
            </button>
          </form>
        )}

        {/* Step 2: Password Reset */}
        {step === 'reset' && (
          <form onSubmit={handlePasswordReset}>
            <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: '500',
                color: darkTheme.colors.textPrimary
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                style={{
                  width: '100%',
                  padding: isMobile ? '10px 14px' : '12px 16px',
                  background: darkTheme.colors.bgTertiary,
                  border: `1px solid ${darkTheme.colors.borderColor}`,
                  borderRadius: darkTheme.borderRadius.md,
                  color: darkTheme.colors.textPrimary,
                  fontSize: isMobile ? '14px' : '15px',
                  outline: 'none',
                  transition: darkTheme.transitions.default
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = darkTheme.colors.accent}
                onBlur={(e) => e.currentTarget.style.borderColor = darkTheme.colors.borderColor}
              />
            </div>

            <div style={{ marginBottom: isMobile ? '16px' : '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: '500',
                color: darkTheme.colors.textPrimary
              }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                style={{
                  width: '100%',
                  padding: isMobile ? '10px 14px' : '12px 16px',
                  background: darkTheme.colors.bgTertiary,
                  border: `1px solid ${darkTheme.colors.borderColor}`,
                  borderRadius: darkTheme.borderRadius.md,
                  color: darkTheme.colors.textPrimary,
                  fontSize: isMobile ? '14px' : '15px',
                  outline: 'none',
                  transition: darkTheme.transitions.default
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = darkTheme.colors.accent}
                onBlur={(e) => e.currentTarget.style.borderColor = darkTheme.colors.borderColor}
              />
            </div>

            <div style={{ marginBottom: isMobile ? '20px' : '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: '500',
                color: darkTheme.colors.textPrimary
              }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                style={{
                  width: '100%',
                  padding: isMobile ? '10px 14px' : '12px 16px',
                  background: darkTheme.colors.bgTertiary,
                  border: `1px solid ${darkTheme.colors.borderColor}`,
                  borderRadius: darkTheme.borderRadius.md,
                  color: darkTheme.colors.textPrimary,
                  fontSize: isMobile ? '14px' : '15px',
                  outline: 'none',
                  transition: darkTheme.transitions.default
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = darkTheme.colors.accent}
                onBlur={(e) => e.currentTarget.style.borderColor = darkTheme.colors.borderColor}
              />
            </div>

            <div style={{ display: 'flex', gap: isMobile ? '10px' : '12px' }}>
              <button
                type="button"
                onClick={() => setStep('code')}
                style={{
                  flex: 1,
                  padding: isMobile ? '12px' : '14px',
                  background: darkTheme.colors.bgTertiary,
                  color: darkTheme.colors.textPrimary,
                  border: `1px solid ${darkTheme.colors.borderColor}`,
                  borderRadius: darkTheme.borderRadius.md,
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: darkTheme.transitions.default
                }}
                onMouseOver={(e) => e.currentTarget.style.background = darkTheme.colors.bgSecondary}
                onMouseOut={(e) => e.currentTarget.style.background = darkTheme.colors.bgTertiary}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 2,
                  padding: isMobile ? '12px' : '14px',
                  background: loading ? darkTheme.colors.accent + '80' : darkTheme.colors.accent,
                  color: 'white',
                  border: 'none',
                  borderRadius: darkTheme.borderRadius.md,
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: darkTheme.transitions.default
                }}
                onMouseOver={(e) => {
                  if (!loading) e.currentTarget.style.background = darkTheme.colors.accentHover;
                }}
                onMouseOut={(e) => {
                  if (!loading) e.currentTarget.style.background = darkTheme.colors.accent;
                }}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div style={{
          marginTop: isMobile ? '20px' : '24px',
          paddingTop: isMobile ? '16px' : '20px',
          borderTop: `1px solid ${darkTheme.colors.borderColor}`,
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: isMobile ? '12px' : '13px',
            color: darkTheme.colors.textSecondary
          }}>
            Need help? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  );
}
