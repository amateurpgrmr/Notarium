import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../App';
import { darkTheme, modalOverlayStyle, inputStyle, buttonPrimaryStyle } from '../theme';

interface ProfileStatsProps {
  onClose: () => void;
  onEditProfile: () => void;
}

export default function ProfileStats({ onClose, onEditProfile }: ProfileStatsProps) {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await api.getLeaderboard();
      const lb = data.leaderboard || [];
      const rank = lb.findIndex((u: any) => u.id === user?.id) + 1;
      setLeaderboard(lb);
      setUserRank(rank > 0 ? rank : null);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGradientColor = (index: number) => {
    const colors = [
      'linear-gradient(135deg, #ff6b6b, #ee5a6f)',
      'linear-gradient(135deg, #4ecdc4, #44a08d)',
      'linear-gradient(135deg, #f39c12, #e67e22)',
      'linear-gradient(135deg, #9b59b6, #8e44ad)',
      'linear-gradient(135deg, #3498db, #2980b9)',
    ];
    return colors[index % colors.length];
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={{
        ...modalOverlayStyle,
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }} onClick={onClose}>
        <div style={{
          background: darkTheme.colors.bgPrimary,
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '100%',
          border: `1px solid ${darkTheme.colors.borderColor}`,
          maxHeight: '80vh',
          overflowY: 'auto',
          position: 'relative',
          zIndex: 1000
        }} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: 0 }}>
              My Profile
            </h2>
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

          {/* User Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '32px',
            paddingBottom: '24px',
            borderBottom: `1px solid ${darkTheme.colors.borderColor}`
          }}>
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
              fontSize: '32px',
              flexShrink: 0,
              border: `2px solid ${darkTheme.colors.borderColor}`
            }}>
              {!user?.photo_url && user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px 0' }}>
                {user?.name}
              </h3>
              <p style={{ fontSize: '14px', color: darkTheme.colors.textSecondary, margin: 0 }}>
                {user?.class}
              </p>
              <p style={{ fontSize: '12px', color: darkTheme.colors.accent, margin: '4px 0 0 0' }}>
                {user?.role === 'admin' ? '👑 Admin' : '📚 Student'}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginBottom: '32px'
          }}>
            {/* Notes Created */}
            <div style={{
              background: getGradientColor(0),
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              color: 'white'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
                {user?.notes_count || 0}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Notes Created</div>
            </div>

            {/* Likes Received */}
            <div style={{
              background: getGradientColor(1),
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              color: 'white'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
                {user?.total_likes || 0}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Likes Received</div>
            </div>

            {/* Leaderboard Rank */}
            <div style={{
              background: getGradientColor(2),
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              color: 'white'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {userRank ? `#${userRank}` : 'N/A'}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Rank</div>
            </div>

            {/* Points */}
            <div style={{
              background: getGradientColor(3),
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              color: 'white'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
                {user?.points || 0}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>Points</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => {
                onEditProfile();
                onClose();
              }}
              style={{
                ...buttonPrimaryStyle,
                flex: 1,
                padding: '12px 20px'
              } as React.CSSProperties}
            >
              <i className="fas fa-edit" style={{ marginRight: '8px' }}></i>
              Edit Profile
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '12px 20px',
                background: darkTheme.colors.bgSecondary,
                border: `1px solid ${darkTheme.colors.borderColor}`,
                borderRadius: darkTheme.borderRadius.md,
                color: darkTheme.colors.textPrimary,
                cursor: 'pointer',
                fontWeight: '500',
                transition: darkTheme.transitions.default,
                flex: 1
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = darkTheme.colors.bgSecondary}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
