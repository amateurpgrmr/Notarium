import { useEffect, useState } from 'react';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { darkTheme, cardStyle } from '../theme';

interface LeaderboardEntry {
  name?: string;
  display_name?: string;
  class?: string;
  points?: number;
  score?: number;
  total_likes?: number;
  photo_url?: string;
}

interface LeaderboardPageProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function LeaderboardPage({
  isLoading,
  setIsLoading
}: LeaderboardPageProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setIsLoading(true);

        const leaderboardData = await api.getLeaderboard();

        const normalizedLeaderboard = Array.isArray(leaderboardData)
          ? leaderboardData
          : (leaderboardData?.leaderboard || []);

        setLeaderboard(normalizedLeaderboard);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
        setLeaderboard([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();
  }, [setIsLoading]);

  return (
    <div>
      <h2 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '24px',
        color: darkTheme.colors.textPrimary
      }}>
        Leaderboard
      </h2>

      {isLoading ? (
        <LoadingSpinner message="Loading leaderboard..." />
      ) : leaderboard.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 40px',
          color: darkTheme.colors.textSecondary
        }}>
          <p style={{ fontSize: '16px' }}>No leaderboard data available</p>
        </div>
      ) : (
        <div style={{
          ...cardStyle,
          padding: 0,
          overflow: 'hidden'
        } as React.CSSProperties}>
          {leaderboard.slice(0, 20).map((entry, index) => (
            <div
              key={index}
              style={{
                padding: '16px 20px',
                borderBottom: index < leaderboard.length - 1 ? `1px solid ${darkTheme.colors.borderColor}` : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                transition: darkTheme.transitions.default
              }}
              onMouseOver={(e) => e.currentTarget.style.background = darkTheme.colors.bgTertiary}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: darkTheme.colors.accent,
                minWidth: '30px'
              }}>
                {index + 1}
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                background: entry.photo_url
                  ? `url('${entry.photo_url}') center/cover`
                  : `linear-gradient(135deg, ${darkTheme.colors.accent}, #8b5cf6)`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                flexShrink: 0,
                color: '#fff',
                fontSize: '14px'
              }}>
                {!entry.photo_url && (entry.display_name?.charAt(0).toUpperCase() || entry.name?.charAt(0).toUpperCase() || 'U')}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: '500' }}>{entry.display_name || entry.name || 'Unknown'}</p>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '12px',
                  color: darkTheme.colors.textSecondary
                }}>
                  Class {entry.class || 'N/A'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  justifyContent: 'flex-end'
                }}>
                  <span style={{ fontSize: '18px' }}>🪙</span>
                  <p style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: darkTheme.colors.accent
                  }}>
                    {Math.max(0, entry.points || entry.score || entry.total_likes || 0)}
                  </p>
                </div>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '12px',
                  color: darkTheme.colors.textSecondary
                }}>
                  points
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
