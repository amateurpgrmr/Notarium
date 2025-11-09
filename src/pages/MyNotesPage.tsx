import { useState, useEffect } from 'react';
import { darkTheme } from '../theme';
import { useAuth } from '../App';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface Note {
  id: number;
  title: string;
  subject: string;
  subject_name: string;
  extracted_text?: string;
  summary?: string;
  tags?: string;
  likes: number;
  admin_upvotes: number;
  created_at: string;
  image_path?: string;
}

interface NotesBySubject {
  [subject: string]: Note[];
}

export default function MyNotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMyNotes();
  }, []);

  const loadMyNotes = async () => {
    try {
      setLoading(true);
      const response = await api.request('/api/notes/my-notes');
      setNotes(response.notes || []);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.extracted_text || '');
    setEditTags(note.tags || '');
  };

  const handleSave = async () => {
    if (!editingNote) return;

    try {
      setSaving(true);
      await api.request(`/api/notes/${editingNote.id}`, {
        method: 'PUT',
        body: {
          title: editTitle,
          extracted_text: editContent,
          tags: editTags
        }
      });

      // Update local state
      setNotes(notes.map(note =>
        note.id === editingNote.id
          ? { ...note, title: editTitle, extracted_text: editContent, tags: editTags }
          : note
      ));

      setEditingNote(null);
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note? Your points will decrease by 1.')) {
      return;
    }

    try {
      await api.request(`/api/notes/${noteId}`, {
        method: 'DELETE'
      });

      // Remove from local state
      setNotes(notes.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('Failed to delete note');
    }
  };

  // Group notes by subject
  const notesBySubject: NotesBySubject = notes.reduce((acc, note) => {
    const subject = note.subject_name || note.subject || 'Other';
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(note);
    return acc;
  }, {} as NotesBySubject);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: darkTheme.colors.bgPrimary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <LoadingSpinner message="Loading your notes..." size="lg" />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: darkTheme.colors.bgPrimary,
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '8px',
          color: darkTheme.colors.textPrimary
        }}>
          <i className="fas fa-book" style={{ marginRight: '12px', color: darkTheme.colors.accent }}></i>
          My Notes
        </h1>
        <p style={{
          color: darkTheme.colors.textSecondary,
          marginBottom: '32px'
        }}>
          {notes.length} notes uploaded
        </p>

        {notes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: darkTheme.colors.textSecondary
          }}>
            <i className="fas fa-folder-open" style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}></i>
            <p>You haven't uploaded any notes yet.</p>
          </div>
        ) : (
          Object.entries(notesBySubject).map(([subject, subjectNotes]) => (
            <div key={subject} style={{
              marginBottom: '32px',
              background: darkTheme.colors.bgSecondary,
              borderRadius: darkTheme.borderRadius.lg,
              padding: '24px',
              border: `1px solid ${darkTheme.colors.borderColor}`
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                marginBottom: '16px',
                color: darkTheme.colors.textPrimary,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>{subject}</span>
                <span style={{
                  fontSize: '14px',
                  color: darkTheme.colors.textSecondary,
                  fontWeight: 'normal'
                }}>
                  ({subjectNotes.length})
                </span>
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '16px'
              }}>
                {subjectNotes.map(note => (
                  <div key={note.id} style={{
                    background: darkTheme.colors.bgTertiary,
                    borderRadius: darkTheme.borderRadius.md,
                    padding: '16px',
                    border: `1px solid ${darkTheme.colors.borderColor}`,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = darkTheme.colors.accent;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = darkTheme.colors.borderColor;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  >
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      marginBottom: '8px',
                      color: darkTheme.colors.textPrimary,
                      wordBreak: 'break-word'
                    }}>
                      {note.title}
                    </h3>

                    {note.summary && (
                      <p style={{
                        fontSize: '13px',
                        color: darkTheme.colors.textSecondary,
                        marginBottom: '12px',
                        lineHeight: '1.5'
                      }}>
                        {note.summary}
                      </p>
                    )}

                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      marginBottom: '12px',
                      fontSize: '12px',
                      color: darkTheme.colors.textSecondary
                    }}>
                      <span>👤 {note.likes}</span>
                      <span>⭐ {note.admin_upvotes}</span>
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <button
                        onClick={() => handleEdit(note)}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: darkTheme.colors.accent,
                          color: 'white',
                          border: 'none',
                          borderRadius: darkTheme.borderRadius.sm,
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        <i className="fas fa-edit" style={{ marginRight: '4px' }}></i>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        style={{
                          padding: '8px 12px',
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#fca5a5',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: darkTheme.borderRadius.sm,
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingNote && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: darkTheme.colors.bgSecondary,
            borderRadius: darkTheme.borderRadius.lg,
            padding: '24px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: darkTheme.colors.textPrimary
              }}>
                Edit Note
              </h2>
              <button
                onClick={() => setEditingNote(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: darkTheme.colors.textSecondary,
                  cursor: 'pointer',
                  fontSize: '24px'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: darkTheme.colors.textPrimary,
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Title
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: darkTheme.colors.bgTertiary,
                  border: `1px solid ${darkTheme.colors.borderColor}`,
                  borderRadius: darkTheme.borderRadius.md,
                  color: darkTheme.colors.textPrimary,
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: darkTheme.colors.textPrimary,
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Content
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={10}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: darkTheme.colors.bgTertiary,
                  border: `1px solid ${darkTheme.colors.borderColor}`,
                  borderRadius: darkTheme.borderRadius.md,
                  color: darkTheme.colors.textPrimary,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: darkTheme.colors.textPrimary,
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: darkTheme.colors.bgTertiary,
                  border: `1px solid ${darkTheme.colors.borderColor}`,
                  borderRadius: darkTheme.borderRadius.md,
                  color: darkTheme.colors.textPrimary,
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => setEditingNote(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: darkTheme.colors.bgTertiary,
                  border: `1px solid ${darkTheme.colors.borderColor}`,
                  borderRadius: darkTheme.borderRadius.md,
                  color: darkTheme.colors.textPrimary,
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: darkTheme.colors.accent,
                  border: 'none',
                  borderRadius: darkTheme.borderRadius.md,
                  color: 'white',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
