import { useState, useEffect } from 'react';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { darkTheme, cardStyle, buttonPrimaryStyle } from '../theme';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  class: string;
  role: string;
  suspended?: number;
  notes_count: number;
}

interface AdminNote {
  id: number;
  title: string;
  author_name: string;
  subject: string;
  views: number;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'notes'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'users') {
        const data = await api.admin.getUsers();
        setUsers(data.users || []);
      } else {
        const data = await api.admin.getNotes();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

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

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: `1px solid ${darkTheme.colors.borderColor}`,
        paddingBottom: '16px'
      }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'users' ? darkTheme.colors.accent : 'transparent',
            border: 'none',
            color: '#fff',
            borderRadius: darkTheme.borderRadius.md,
            cursor: 'pointer',
            fontWeight: '500',
            transition: darkTheme.transitions.default
          }}
          onMouseOver={(e) => activeTab !== 'users' && (e.currentTarget.style.background = darkTheme.colors.bgSecondary)}
          onMouseOut={(e) => activeTab !== 'users' && (e.currentTarget.style.background = 'transparent')}
        >
          <i className="fas fa-users" style={{ marginRight: '8px' }}></i>Users
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'notes' ? darkTheme.colors.accent : 'transparent',
            border: 'none',
            color: '#fff',
            borderRadius: darkTheme.borderRadius.md,
            cursor: 'pointer',
            fontWeight: '500',
            transition: darkTheme.transitions.default
          }}
          onMouseOver={(e) => activeTab !== 'notes' && (e.currentTarget.style.background = darkTheme.colors.bgSecondary)}
          onMouseOut={(e) => activeTab !== 'notes' && (e.currentTarget.style.background = 'transparent')}
        >
          <i className="fas fa-file" style={{ marginRight: '8px' }}></i>Notes
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner message={`Loading ${activeTab}...`} />
      ) : activeTab === 'users' ? (
        /* Users Table */
        <div style={{
          ...cardStyle,
          padding: 0,
          overflow: 'auto',
          maxHeight: 'calc(100vh - 300px)'
        } as React.CSSProperties}>
          {users.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: darkTheme.colors.textSecondary
            }}>
              <p>No users found</p>
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead style={{
                background: darkTheme.colors.bgSecondary,
                position: 'sticky',
                top: 0
              }}>
                <tr>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    borderBottom: `1px solid ${darkTheme.colors.borderColor}`,
                    fontWeight: '600',
                    fontSize: '13px'
                  }}>Name</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    borderBottom: `1px solid ${darkTheme.colors.borderColor}`,
                    fontWeight: '600',
                    fontSize: '13px'
                  }}>Email</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    borderBottom: `1px solid ${darkTheme.colors.borderColor}`,
                    fontWeight: '600',
                    fontSize: '13px'
                  }}>Class</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    borderBottom: `1px solid ${darkTheme.colors.borderColor}`,
                    fontWeight: '600',
                    fontSize: '13px'
                  }}>Notes</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    borderBottom: `1px solid ${darkTheme.colors.borderColor}`,
                    fontWeight: '600',
                    fontSize: '13px'
                  }}>Status</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    borderBottom: `1px solid ${darkTheme.colors.borderColor}`,
                    fontWeight: '600',
                    fontSize: '13px'
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: `1px solid ${darkTheme.colors.borderColor}`,
                      transition: darkTheme.transitions.default
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = darkTheme.colors.bgSecondary}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{user.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: darkTheme.colors.textSecondary }}>
                      {user.email}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{user.class}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{user.notes_count}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: darkTheme.borderRadius.sm,
                        background: user.suspended
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(34, 197, 94, 0.2)',
                        color: user.suspended ? '#fca5a5' : '#86efac',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {user.suspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      display: 'flex',
                      gap: '8px',
                      justifyContent: 'flex-end'
                    }}>
                      {!user.suspended && (
                        <button
                          onClick={() => handleSuspendUser(user.id)}
                          disabled={actionLoading === user.id}
                          style={{
                            padding: '4px 8px',
                            background: 'rgba(245, 158, 11, 0.2)',
                            color: '#fbbf24',
                            border: 'none',
                            borderRadius: darkTheme.borderRadius.sm,
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500',
                            opacity: actionLoading === user.id ? 0.5 : 1
                          }}
                        >
                          Suspend
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={actionLoading === user.id}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#fca5a5',
                          border: 'none',
                          borderRadius: darkTheme.borderRadius.sm,
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          opacity: actionLoading === user.id ? 0.5 : 1
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* Notes Table */
        <div style={{
          ...cardStyle,
          padding: 0,
          overflow: 'auto',
          maxHeight: 'calc(100vh - 300px)'
        } as React.CSSProperties}>
          {notes.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: darkTheme.colors.textSecondary
            }}>
              <p>No notes found</p>
            </div>
          ) : (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead style={{
                background: darkTheme.colors.bgSecondary,
                position: 'sticky',
                top: 0
              }}>
                <tr>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    borderBottom: `1px solid ${darkTheme.colors.borderColor}`,
                    fontWeight: '600',
                    fontSize: '13px'
                  }}>Title</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    borderBottom: `1px solid ${darkTheme.colors.borderColor}`,
                    fontWeight: '600',
                    fontSize: '13px'
                  }}>Author</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    borderBottom: `1px solid ${darkTheme.colors.borderColor}`,
                    fontWeight: '600',
                    fontSize: '13px'
                  }}>Subject</th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    borderBottom: `1px solid ${darkTheme.colors.borderColor}`,
                    fontWeight: '600',
                    fontSize: '13px'
                  }}>Views</th>
                </tr>
              </thead>
              <tbody>
                {notes.map((note) => (
                  <tr
                    key={note.id}
                    style={{
                      borderBottom: `1px solid ${darkTheme.colors.borderColor}`,
                      transition: darkTheme.transitions.default
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = darkTheme.colors.bgSecondary}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{note.title}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: darkTheme.colors.textSecondary }}>
                      {note.author_name}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{note.subject}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                      <i className="fas fa-eye" style={{ marginRight: '6px' }}></i>
                      {note.views}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
