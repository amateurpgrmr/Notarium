import { useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../App';
import { darkTheme, modalOverlayStyle, modalContentStyle, inputStyle, buttonPrimaryStyle, buttonSecondaryStyle } from '../theme';

interface ProfileEditorProps {
  onClose: () => void;
}

export default function ProfileEditor({ onClose }: ProfileEditorProps) {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [selectedClass, setSelectedClass] = useState(user?.class || '10.1');

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await api.updateProfile({ name, class: selectedClass });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: 0 }}>Edit Profile</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: darkTheme.colors.textSecondary,
              cursor: 'pointer',
              fontSize: '24px',
              transition: darkTheme.transitions.default,
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
            onMouseOut={(e) => e.currentTarget.style.color = darkTheme.colors.textSecondary}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Username */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '8px'
            }}>
              Username
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle as React.CSSProperties}
              placeholder="Your display name"
              onFocus={(e) => e.currentTarget.style.borderColor = darkTheme.colors.accent}
              onBlur={(e) => e.currentTarget.style.borderColor = darkTheme.colors.borderColor}
            />
          </div>

          {/* Class Selection (Students only) */}
          {user?.role === 'student' && (
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '8px'
              }}>
                Class
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px'
              }}>
                {['10.1', '10.2', '10.3'].map((classOption) => (
                  <button
                    key={classOption}
                    type="button"
                    onClick={() => setSelectedClass(classOption)}
                    style={{
                      padding: '12px',
                      borderRadius: darkTheme.borderRadius.md,
                      fontWeight: '600',
                      cursor: 'pointer',
                      border: 'none',
                      transition: darkTheme.transitions.default,
                      background: selectedClass === classOption
                        ? `linear-gradient(135deg, ${darkTheme.colors.accent}, #8b5cf6)`
                        : darkTheme.colors.bgSecondary,
                      color: selectedClass === classOption ? '#fff' : darkTheme.colors.textSecondary,
                      boxShadow: selectedClass === classOption ? darkTheme.shadows.default : 'none'
                    }}
                    onMouseOver={(e) => {
                      if (selectedClass !== classOption) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedClass !== classOption) {
                        e.currentTarget.style.background = darkTheme.colors.bgSecondary;
                      }
                    }}
                  >
                    {classOption}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#fca5a5',
              padding: '12px 16px',
              borderRadius: darkTheme.borderRadius.md,
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.5)',
              color: '#86efac',
              padding: '12px 16px',
              borderRadius: darkTheme.borderRadius.md,
              fontSize: '14px'
            }}>
              Profile updated successfully!
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '8px'
          }}>
            <button
              onClick={onClose}
              style={{
                ...buttonSecondaryStyle,
                flex: 1
              } as React.CSSProperties}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              style={{
                ...buttonPrimaryStyle,
                flex: 1,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              } as React.CSSProperties}
              onMouseOver={(e) => !loading && (e.currentTarget.style.boxShadow = darkTheme.shadows.lg)}
              onMouseOut={(e) => e.currentTarget.style.boxShadow = darkTheme.shadows.default}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
