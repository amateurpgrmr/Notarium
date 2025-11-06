import { useState, useEffect } from 'react';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminNoteEditModal from '../components/AdminNoteEditModal';
import { darkTheme, cardStyle } from '../theme';

interface AdminUser {
  id: number;
  name: string;
  display_name?: string;
  email: string;
  class: string;
  role: string;
  suspended?: number;
  notes_count?: number;
  notes_uploaded?: number;
  diamonds?: number;
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
              <div style={{ fontSize: '24px', fontWeight: '700', color: darkTheme.colors.accent }}>
                {user.diamonds || 0}
              </div>
              <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, marginTop: '4px' }}>
                💎 Total Diamonds
              </div>
            </div>
            <div style={{ padding: '16px', background: darkTheme.colors.bgSecondary, borderRadius: darkTheme.borderRadius.md }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: darkTheme.colors.textPrimary }}>
                {user.notes_uploaded || user.notes_count || 0}
              </div>
              <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, marginTop: '4px' }}>
                📝 Notes Uploaded
              </div>
            </div>
            <div style={{ padding: '16px', background: darkTheme.colors.bgSecondary, borderRadius: darkTheme.borderRadius.md }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: darkTheme.colors.textPrimary }}>
                {user.total_likes || 0}
              </div>
              <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, marginTop: '4px' }}>
                ❤️ Total Likes
              </div>
            </div>
            <div style={{ padding: '16px', background: darkTheme.colors.bgSecondary, borderRadius: darkTheme.borderRadius.md }}>
              <div style={{ fontSize: '24px', fontWeight: '700', color: darkTheme.colors.textPrimary }}>
                {user.total_admin_upvotes || 0}
              </div>
              <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, marginTop: '4px' }}>
                ⭐ Admin Likes
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
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editingNote, setEditingNote] = useState<AdminNote | null>(null);
  const [groupBySubject, setGroupBySubject] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, notesData] = await Promise.all([
        api.admin.getUsers(),
        api.admin.getNotes()
      ]);
      setUsers(usersData.users || []);
      setNotes(notesData.notes || []);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLike = async (noteId: number) => {
    try {
      setActionLoading(noteId);
      await api.request(`/api/admin/notes/${noteId}/like`, {
        method: 'POST'
      });
      // Reload to get updated data
      await loadData();
    } catch (error) {
      console.error('Failed to admin like:', error);
      alert('Failed to like note');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveNote = async (noteId: number, updates: { title?: string; description?: string; tags?: string[] }) => {
    try {
      await api.request(`/api/admin/notes/${noteId}`, {
        method: 'PUT',
        body: updates
      });
      // Reload to get updated data
      await loadData();
    } catch (error) {
      console.error('Failed to update note:', error);
      throw error;
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

  const handleSuspendUser = async (userId: number) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;

    try {
      setActionLoading(userId);
      await api.admin.suspendUser(userId);
      setUsers(users.map((u) =>
        u.id === userId ? { ...u, suspended: 1 } : u
      ));
    } catch (error) {
      console.error('Failed to suspend user:', error);
      alert('Failed to suspend user');
    } finally {
      setActionLoading(null);
    }
  };

  // Group notes by subject
  const notesBySubject = notes.reduce((acc, note) => {
    const subject = note.subject_name || note.subject || 'Unknown';
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(note);
    return acc;
  }, {} as Record<string, AdminNote[]>);

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

      {loading ? (
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
                        <span style={{ color: darkTheme.colors.textSecondary }}>💎 Diamonds:</span>
                        <span style={{ fontWeight: '600', color: darkTheme.colors.accent }}>{user.diamonds || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                        <span style={{ color: darkTheme.colors.textSecondary }}>📝 Notes:</span>
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
                          {!user.suspended && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSuspendUser(user.id);
                              }}
                              disabled={actionLoading === user.id}
                              style={{
                                padding: '4px 8px',
                                background: 'rgba(245, 158, 11, 0.2)',
                                color: '#fbbf24',
                                border: 'none',
                                borderRadius: darkTheme.borderRadius.sm,
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '500'
                              }}
                            >
                              Suspend
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

          {/* Notes Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: darkTheme.colors.textPrimary }}>
                <i className="fas fa-file" style={{ marginRight: '8px', color: darkTheme.colors.accent }}></i>
                Notes ({notes.length})
              </h3>
              <button
                onClick={() => setGroupBySubject(!groupBySubject)}
                style={{
                  padding: '8px 16px',
                  background: groupBySubject ? darkTheme.colors.accent : darkTheme.colors.bgSecondary,
                  border: 'none',
                  color: '#fff',
                  borderRadius: darkTheme.borderRadius.md,
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                {groupBySubject ? '📚 Grouped by Subject' : '📄 List View'}
              </button>
            </div>

            {notes.length === 0 ? (
              <div style={{
                ...cardStyle,
                padding: '40px',
                textAlign: 'center',
                color: darkTheme.colors.textSecondary
              }}>
                No notes found
              </div>
            ) : groupBySubject ? (
              /* Grouped by Subject */
              <div>
                {Object.entries(notesBySubject).map(([subject, subjectNotes]) => (
                  <div key={subject} style={{ marginBottom: '32px' }}>
                    <h4 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      marginBottom: '12px',
                      color: darkTheme.colors.accent,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>{subject}</span>
                      <span style={{ fontSize: '12px', fontWeight: '400', color: darkTheme.colors.textSecondary }}>
                        ({subjectNotes.length} notes)
                      </span>
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                      {subjectNotes.map((note) => (
                        <div
                          key={note.id}
                          onClick={() => setEditingNote(note)}
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
                          <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px', color: darkTheme.colors.textPrimary }}>
                            {note.title}
                          </div>
                          <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, marginBottom: '8px' }}>
                            by {note.author_name}
                          </div>
                          {note.description && (
                            <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, marginBottom: '12px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {note.description}
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                            <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                              <span style={{ color: darkTheme.colors.textSecondary }}>
                                <i className="fas fa-heart" style={{ marginRight: '4px' }}></i>
                                {note.likes}
                              </span>
                              <span style={{ color: darkTheme.colors.accent }}>
                                <i className="fas fa-star" style={{ marginRight: '4px' }}></i>
                                {note.admin_upvotes}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAdminLike(note.id);
                              }}
                              disabled={actionLoading === note.id}
                              style={{
                                padding: '6px 12px',
                                background: note.admin_liked ? `${darkTheme.colors.accent}40` : `${darkTheme.colors.accent}20`,
                                border: `1px solid ${darkTheme.colors.accent}`,
                                color: darkTheme.colors.accent,
                                borderRadius: darkTheme.borderRadius.sm,
                                cursor: actionLoading === note.id ? 'not-allowed' : 'pointer',
                                fontSize: '11px',
                                fontWeight: '600',
                                opacity: actionLoading === note.id ? 0.6 : 1
                              }}
                              title="Admin Like (+5 diamonds)"
                            >
                              {actionLoading === note.id ? '...' : note.admin_liked ? '⭐ Liked' : '⭐ Admin Like'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div style={{
                ...cardStyle,
                padding: 0,
                overflow: 'auto',
                maxHeight: '600px'
              } as React.CSSProperties}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{
                    background: darkTheme.colors.bgSecondary,
                    position: 'sticky',
                    top: 0
                  }}>
                    <tr>
                      <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: `1px solid ${darkTheme.colors.borderColor}`, fontWeight: '600', fontSize: '13px' }}>Title</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: `1px solid ${darkTheme.colors.borderColor}`, fontWeight: '600', fontSize: '13px' }}>Author</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: `1px solid ${darkTheme.colors.borderColor}`, fontWeight: '600', fontSize: '13px' }}>Subject</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: `1px solid ${darkTheme.colors.borderColor}`, fontWeight: '600', fontSize: '13px' }}>Likes</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', borderBottom: `1px solid ${darkTheme.colors.borderColor}`, fontWeight: '600', fontSize: '13px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notes.map((note) => (
                      <tr
                        key={note.id}
                        onClick={() => setEditingNote(note)}
                        style={{
                          borderBottom: `1px solid ${darkTheme.colors.borderColor}`,
                          cursor: 'pointer',
                          transition: darkTheme.transitions.default
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = darkTheme.colors.bgSecondary}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 16px', fontSize: '14px' }}>{note.title}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: darkTheme.colors.textSecondary }}>
                          {note.author_name}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '14px' }}>{note.subject_name || note.subject}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                          <span style={{ marginRight: '12px' }}>
                            <i className="fas fa-heart" style={{ marginRight: '4px', color: darkTheme.colors.textSecondary }}></i>
                            {note.likes}
                          </span>
                          <span style={{ color: darkTheme.colors.accent }}>
                            <i className="fas fa-star" style={{ marginRight: '4px' }}></i>
                            {note.admin_upvotes}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdminLike(note.id);
                            }}
                            disabled={actionLoading === note.id}
                            style={{
                              padding: '6px 12px',
                              background: `${darkTheme.colors.accent}20`,
                              border: `1px solid ${darkTheme.colors.accent}`,
                              color: darkTheme.colors.accent,
                              borderRadius: darkTheme.borderRadius.sm,
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}
                            title="Admin Like (+5 diamonds)"
                          >
                            ⭐ Admin Like
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
      {editingNote && (
        <AdminNoteEditModal
          note={editingNote}
          onClose={() => setEditingNote(null)}
          onSave={handleSaveNote}
        />
      )}
    </div>
  );
}
