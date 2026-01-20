import { useState, useEffect } from 'react';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminNoteEditModal from '../components/AdminNoteEditModal';
import AdminUsageReport from './AdminUsageReport';
import { darkTheme, cardStyle } from '../theme';

interface AdminUser {
  id: number;
  name: string;
  display_name?: string;
  email: string;
  class: string;
  role: string;
  suspended?: number;
  suspension_end_date?: string;
  suspension_reason?: string;
  warning?: number;
  warning_message?: string;
  notes_count?: number;
  notes_uploaded?: number;
  points?: number;
  total_likes?: number;
  total_admin_upvotes?: number;
  photo_url?: string;
}

interface AdminNote {
  id: number;
  title: string;
  description: string;
  author_name: string;
  author_id: number;
  subject: string;
  subject_id: number;
  subject_name?: string;
  image_path?: string;
  tags?: string | string[];
  likes: number;
  admin_upvotes: number;
  created_at: string;
  admin_liked?: boolean;
}

interface SuspendUserModalProps {
  user: AdminUser | null;
  onClose: () => void;
  onSuspend: (userId: number, days: number, reason: string) => Promise<void>;
}

function SuspendUserModal({ user, onClose, onSuspend }: SuspendUserModalProps) {
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSuspend(user.id, days, reason);
      onClose();
    } catch (error) {
      alert('Failed to suspend user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1002,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: darkTheme.colors.bgPrimary,
          borderRadius: darkTheme.borderRadius.lg,
          width: '100%',
          maxWidth: '500px',
          color: darkTheme.colors.textPrimary,
          boxShadow: darkTheme.shadows.lg
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            borderBottom: `1px solid ${darkTheme.colors.borderColor}`
          }}
        >
          <h2 style={{ fontSize: '20px', margin: 0, fontWeight: '600' }}>Suspend User</h2>
          <button
            onClick={onClose}
            style={{
              fontSize: '24px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: darkTheme.colors.textSecondary
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', color: darkTheme.colors.textPrimary, marginBottom: '8px' }}>
              User: <strong>{user.display_name || user.name}</strong>
            </div>
            <div style={{ fontSize: '13px', color: darkTheme.colors.textSecondary }}>
              {user.email}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Suspension Duration (days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                background: darkTheme.colors.bgSecondary,
                border: `1px solid ${darkTheme.colors.borderColor}`,
                borderRadius: darkTheme.borderRadius.md,
                color: darkTheme.colors.textPrimary,
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Reason / Warning Message
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for suspension (visible to user)..."
              required
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: darkTheme.colors.bgSecondary,
                border: `1px solid ${darkTheme.colors.borderColor}`,
                borderRadius: darkTheme.borderRadius.md,
                color: darkTheme.colors.textPrimary,
                fontSize: '14px',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: darkTheme.colors.bgSecondary,
                border: `1px solid ${darkTheme.colors.borderColor}`,
                color: darkTheme.colors.textPrimary,
                borderRadius: darkTheme.borderRadius.md,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                background: 'rgba(245, 158, 11, 0.9)',
                border: 'none',
                color: 'white',
                borderRadius: darkTheme.borderRadius.md,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? 'Suspending...' : `Suspend for ${days} day${days !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface WarnUserModalProps {
  user: AdminUser | null;
  onClose: () => void;
  onWarn: (userId: number, message: string) => Promise<void>;
}

function WarnUserModal({ user, onClose, onWarn }: WarnUserModalProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onWarn(user.id, message);
      onClose();
    } catch (error) {
      alert('Failed to warn user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1002,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: darkTheme.colors.bgPrimary,
          borderRadius: darkTheme.borderRadius.lg,
          width: '100%',
          maxWidth: '500px',
          color: darkTheme.colors.textPrimary,
          boxShadow: darkTheme.shadows.lg
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            borderBottom: `1px solid ${darkTheme.colors.borderColor}`
          }}
        >
          <h2 style={{ fontSize: '20px', margin: 0, fontWeight: '600' }}>Warn User</h2>
          <button
            onClick={onClose}
            style={{
              fontSize: '24px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: darkTheme.colors.textSecondary
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', color: darkTheme.colors.textPrimary, marginBottom: '8px' }}>
              User: <strong>{user.display_name || user.name}</strong>
            </div>
            <div style={{ fontSize: '13px', color: darkTheme.colors.textSecondary }}>
              {user.email}
            </div>
          </div>

          <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: darkTheme.borderRadius.md }}>
            <div style={{ fontSize: '13px', color: '#fbbf24' }}>
              Warnings show a yellow banner but don't block any actions. Use this for first-time offenses or reminders.
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Warning Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter the warning message (visible to user)..."
              required
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: darkTheme.colors.bgSecondary,
                border: `1px solid ${darkTheme.colors.borderColor}`,
                borderRadius: darkTheme.borderRadius.md,
                color: darkTheme.colors.textPrimary,
                fontSize: '14px',
                boxSizing: 'border-box',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: darkTheme.colors.bgSecondary,
                border: `1px solid ${darkTheme.colors.borderColor}`,
                color: darkTheme.colors.textPrimary,
                borderRadius: darkTheme.borderRadius.md,
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                background: 'rgba(245, 158, 11, 0.9)',
                border: 'none',
                color: 'white',
                borderRadius: darkTheme.borderRadius.md,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                opacity: isSubmitting ? 0.7 : 1
              }}
            >
              {isSubmitting ? 'Sending...' : 'Send Warning'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface UserDetailModalProps {
  user: AdminUser | null;
  onClose: () => void;
}

function UserDetailModal({ user, onClose }: UserDetailModalProps) {
  if (!user) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1001,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: darkTheme.colors.bgPrimary,
          borderRadius: darkTheme.borderRadius.lg,
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          color: darkTheme.colors.textPrimary,
          boxShadow: darkTheme.shadows.lg
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px',
            borderBottom: `1px solid ${darkTheme.colors.borderColor}`
          }}
        >
          <h2 style={{ fontSize: '20px', margin: 0, fontWeight: '600' }}>User Details</h2>
          <button
            onClick={onClose}
            style={{
              fontSize: '24px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: darkTheme.colors.textSecondary
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                background: user.photo_url
                  ? `url('${user.photo_url}') center/cover`
                  : `linear-gradient(135deg, ${darkTheme.colors.accent}, #8b5cf6)`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '24px'
              }}
            >
              {!user.photo_url && (user.display_name || user.name)?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                {user.display_name || user.name}
              </h3>
              <p style={{ margin: '4px 0 0 0', color: darkTheme.colors.textSecondary, fontSize: '14px' }}>
                {user.email}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
            <div style={{ padding: '16px', background: darkTheme.colors.bgSecondary, borderRadius: darkTheme.borderRadius.md }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#fbbf24' }}>
                {(user as any).points || 0}
              </div>
              <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, marginTop: '4px' }}>
                Total Points
              </div>
            </div>
            <div style={{ padding: '16px', background: darkTheme.colors.bgSecondary, borderRadius: darkTheme.borderRadius.md }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: darkTheme.colors.accent }}>
                {user.points || 0}
              </div>
              <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, marginTop: '4px' }}>
                Points
              </div>
            </div>
            <div style={{ padding: '16px', background: darkTheme.colors.bgSecondary, borderRadius: darkTheme.borderRadius.md }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: darkTheme.colors.textPrimary }}>
                {user.notes_uploaded || user.notes_count || 0}
              </div>
              <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, marginTop: '4px' }}>
                Notes Uploaded
              </div>
            </div>
            <div style={{ padding: '16px', background: darkTheme.colors.bgSecondary, borderRadius: darkTheme.borderRadius.md }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: darkTheme.colors.textPrimary }}>
                {user.total_likes || 0}
              </div>
              <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, marginTop: '4px' }}>
                Total Likes
              </div>
            </div>
            <div style={{ padding: '16px', background: darkTheme.colors.bgSecondary, borderRadius: darkTheme.borderRadius.md }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: darkTheme.colors.textPrimary }}>
                {user.total_admin_upvotes || 0}
              </div>
              <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, marginTop: '4px' }}>
                Admin Likes
              </div>
            </div>
          </div>

          {/* Info */}
          <div style={{ padding: '16px', background: darkTheme.colors.bgSecondary, borderRadius: darkTheme.borderRadius.md, marginBottom: '20px' }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, marginBottom: '4px' }}>Class</div>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>{user.class}</div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, marginBottom: '4px' }}>Role</div>
              <div style={{ fontSize: '14px', fontWeight: '500', textTransform: 'capitalize' }}>{user.role}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, marginBottom: '4px' }}>Status</div>
              <span style={{
                padding: '4px 12px',
                borderRadius: darkTheme.borderRadius.sm,
                background: user.suspended ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                color: user.suspended ? '#fca5a5' : '#86efac',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {user.suspended ? 'Suspended' : 'Active'}
              </span>
            </div>
          </div>

          {/* Suspension Details */}
          {user.suspended && (user.suspension_end_date || user.suspension_reason) && (
            <div style={{
              padding: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: darkTheme.borderRadius.md,
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#fca5a5', marginBottom: '12px' }}>
                Suspension Details
              </div>
              {user.suspension_end_date && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, marginBottom: '4px' }}>
                    Suspended Until
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '500' }}>
                    {new Date(user.suspension_end_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}
              {user.suspension_reason && (
                <div>
                  <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, marginBottom: '4px' }}>
                    Reason
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    {user.suspension_reason}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'usage'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [suspendingUser, setSuspendingUser] = useState<AdminUser | null>(null);
  const [warningUser, setWarningUser] = useState<AdminUser | null>(null);
  const [showActivityLog, setShowActivityLog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, logsData] = await Promise.all([
        api.admin.getUsers(),
        loadActivityLogs()
      ]);
      setUsers(usersData.users || []);
      setActivityLogs(logsData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivityLogs = async () => {
    try {
      const response = await api.request('/api/admin/activity-log?limit=50', {
        method: 'GET'
      });
      return response.logs || [];
    } catch (error) {
      console.error('Failed to load activity logs:', error);
      return [];
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      setActionLoading(userId);
      await api.admin.deleteUser(userId);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspendUser = async (userId: number, days: number, reason: string) => {
    try {
      setActionLoading(userId);
      const response = await api.admin.suspendUser(userId, days, reason);
      // Reload data to get updated suspension info
      await loadData();
    } catch (error) {
      console.error('Failed to suspend user:', error);
      throw error;
    } finally {
      setActionLoading(null);
    }
  };

  const handleWarnUser = async (userId: number, message: string) => {
    try {
      setActionLoading(userId);
      const response = await api.admin.warnUser(userId, message);
      // Reload data to get updated warning info
      await loadData();
    } catch (error) {
      console.error('Failed to warn user:', error);
      throw error;
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnsuspendUser = async (userId: number) => {
    if (!confirm('Are you sure you want to remove the suspension from this user?')) {
      return;
    }
    try {
      setActionLoading(userId);
      const response = await api.admin.unsuspendUser(userId);
      // Reload data to get updated suspension info
      await loadData();
    } catch (error) {
      console.error('Failed to unsuspend user:', error);
      alert('Failed to unsuspend user');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <h2 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '24px',
        color: darkTheme.colors.textPrimary
      }}>
        Admin Dashboard
      </h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: `2px solid ${darkTheme.colors.borderColor}` }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            color: activeTab === 'users' ? darkTheme.colors.accent : darkTheme.colors.textSecondary,
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            borderBottom: activeTab === 'users' ? `3px solid ${darkTheme.colors.accent}` : '3px solid transparent',
            marginBottom: '-2px',
            transition: darkTheme.transitions.default
          }}
        >
          Users & Activity
        </button>
        <button
          onClick={() => setActiveTab('usage')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            color: activeTab === 'usage' ? darkTheme.colors.accent : darkTheme.colors.textSecondary,
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            borderBottom: activeTab === 'usage' ? `3px solid ${darkTheme.colors.accent}` : '3px solid transparent',
            marginBottom: '-2px',
            transition: darkTheme.transitions.default
          }}
        >
          Usage Report
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'usage' ? (
        <AdminUsageReport />
      ) : loading ? (
        <LoadingSpinner message="Loading admin data..." />
      ) : (
        <div>
          {/* Users Section */}
          <div style={{ marginBottom: '48px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: darkTheme.colors.textPrimary }}>
              <i className="fas fa-users" style={{ marginRight: '8px', color: darkTheme.colors.accent }}></i>
              Users ({users.length})
            </h3>
            <div style={{
              ...cardStyle,
              padding: 0,
              overflow: 'auto',
              maxHeight: '400px'
            } as React.CSSProperties}>
              {users.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: darkTheme.colors.textSecondary }}>
                  No users found
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', padding: '16px' }}>
                  {users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      style={{
                        padding: '16px',
                        background: darkTheme.colors.bgSecondary,
                        borderRadius: darkTheme.borderRadius.md,
                        border: `1px solid ${darkTheme.colors.borderColor}`,
                        cursor: 'pointer',
                        transition: darkTheme.transitions.default
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = darkTheme.shadows.lg;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            background: user.photo_url
                              ? `url('${user.photo_url}') center/cover`
                              : `linear-gradient(135deg, ${darkTheme.colors.accent}, #8b5cf6)`,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '18px',
                            flexShrink: 0
                          }}
                        >
                          {!user.photo_url && (user.display_name || user.name)?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.display_name || user.name}
                          </div>
                          <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                        <span style={{ color: darkTheme.colors.textSecondary }}>Points:</span>
                        <span style={{ fontWeight: '600', color: '#fbbf24' }}>{(user as any).points || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                        <span style={{ color: darkTheme.colors.textSecondary }}>Total Points:</span>
                        <span style={{ fontWeight: '600', color: darkTheme.colors.accent }}>{user.points || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                        <span style={{ color: darkTheme.colors.textSecondary }}>Notes:</span>
                        <span style={{ fontWeight: '600' }}>{user.notes_uploaded || user.notes_count || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: darkTheme.borderRadius.sm,
                          background: user.suspended ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                          color: user.suspended ? '#fca5a5' : '#86efac',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}>
                          {user.suspended ? 'Suspended' : 'Active'}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {!user.suspended && !user.warning && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setWarningUser(user);
                              }}
                              disabled={actionLoading === user.id}
                              style={{
                                padding: '4px 8px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: '#fbbf24',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                borderRadius: darkTheme.borderRadius.sm,
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '500'
                              }}
                            >
                              Warn
                            </button>
                          )}
                          {!user.suspended ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSuspendingUser(user);
                              }}
                              disabled={actionLoading === user.id}
                              style={{
                                padding: '4px 8px',
                                background: 'rgba(239, 68, 68, 0.2)',
                                color: '#fca5a5',
                                border: 'none',
                                borderRadius: darkTheme.borderRadius.sm,
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '500'
                              }}
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnsuspendUser(user.id);
                              }}
                              disabled={actionLoading === user.id}
                              style={{
                                padding: '4px 8px',
                                background: 'rgba(34, 197, 94, 0.2)',
                                color: '#86efac',
                                border: '1px solid rgba(34, 197, 94, 0.3)',
                                borderRadius: darkTheme.borderRadius.sm,
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '500'
                              }}
                            >
                              Unsuspend
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUser(user.id);
                            }}
                            disabled={actionLoading === user.id}
                            style={{
                              padding: '4px 8px',
                              background: 'rgba(239, 68, 68, 0.2)',
                              color: '#fca5a5',
                              border: 'none',
                              borderRadius: darkTheme.borderRadius.sm,
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '500'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activity Log Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: darkTheme.colors.textPrimary }}>
                <i className="fas fa-history" style={{ marginRight: '8px', color: darkTheme.colors.accent }}></i>
                Activity Log ({activityLogs.length})
              </h3>
              <button
                onClick={() => setShowActivityLog(!showActivityLog)}
                style={{
                  padding: '8px 16px',
                  background: showActivityLog ? darkTheme.colors.accent : darkTheme.colors.bgSecondary,
                  border: 'none',
                  color: '#fff',
                  borderRadius: darkTheme.borderRadius.md,
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                {showActivityLog ? 'Hide Log' : 'Show Log'}
              </button>
            </div>

            {showActivityLog && (
              <div style={{
                ...cardStyle,
                padding: 0,
                overflow: 'auto',
                maxHeight: '500px'
              } as React.CSSProperties}>
                {activityLogs.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: darkTheme.colors.textSecondary }}>
                    No activity logs yet
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{
                      background: darkTheme.colors.bgSecondary,
                      position: 'sticky',
                      top: 0
                    }}>
                      <tr>
                        <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: `1px solid ${darkTheme.colors.borderColor}`, fontWeight: '600', fontSize: '13px' }}>Time</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: `1px solid ${darkTheme.colors.borderColor}`, fontWeight: '600', fontSize: '13px' }}>Admin</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: `1px solid ${darkTheme.colors.borderColor}`, fontWeight: '600', fontSize: '13px' }}>Action</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: `1px solid ${darkTheme.colors.borderColor}`, fontWeight: '600', fontSize: '13px' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityLogs.map((log) => (
                        <tr
                          key={log.id}
                          style={{
                            borderBottom: `1px solid ${darkTheme.colors.borderColor}`,
                            transition: darkTheme.transitions.default
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = darkTheme.colors.bgSecondary}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: darkTheme.colors.textSecondary }}>
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                            {log.admin_email}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: darkTheme.borderRadius.sm,
                              background: log.action_type === 'like' ? 'rgba(34, 197, 94, 0.2)' :
                                         log.action_type === 'edit' ? 'rgba(59, 130, 246, 0.2)' :
                                         log.action_type === 'delete' ? 'rgba(239, 68, 68, 0.2)' :
                                         'rgba(156, 163, 175, 0.2)',
                              color: log.action_type === 'like' ? '#86efac' :
                                    log.action_type === 'edit' ? '#60a5fa' :
                                    log.action_type === 'delete' ? '#fca5a5' :
                                    '#d1d5db',
                              fontSize: '11px',
                              fontWeight: '500',
                              textTransform: 'uppercase'
                            }}>
                              {log.action_type}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: '13px', color: darkTheme.colors.textSecondary }}>
                            {log.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
      {warningUser && (
        <WarnUserModal
          user={warningUser}
          onClose={() => setWarningUser(null)}
          onWarn={handleWarnUser}
        />
      )}
      {suspendingUser && (
        <SuspendUserModal
          user={suspendingUser}
          onClose={() => setSuspendingUser(null)}
          onSuspend={handleSuspendUser}
        />
      )}
    </div>
  );
}
