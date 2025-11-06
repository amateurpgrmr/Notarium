import { useState, useEffect } from 'react';
import { darkTheme } from '../theme';

interface Note {
  id: number;
  title: string;
  description: string;
  tags?: string | string[];
  author_name: string;
  subject_id: number;
  subject_name?: string;
  image_path?: string;
  likes: number;
  admin_upvotes: number;
  created_at: string;
}

interface AdminNoteEditModalProps {
  note: Note | null;
  onClose: () => void;
  onSave: (noteId: number, updates: { title?: string; description?: string; tags?: string[] }) => Promise<void>;
}

export default function AdminNoteEditModal({ note, onClose, onSave }: AdminNoteEditModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setDescription(note.description || '');

      // Handle tags - could be string or array
      if (note.tags) {
        if (typeof note.tags === 'string') {
          try {
            const parsedTags = JSON.parse(note.tags);
            setTags(Array.isArray(parsedTags) ? parsedTags.join(', ') : '');
          } catch {
            setTags('');
          }
        } else if (Array.isArray(note.tags)) {
          setTags(note.tags.join(', '));
        }
      } else {
        setTags('');
      }
    }
  }, [note]);

  if (!note) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);
      await onSave(note.id, {
        title,
        description,
        tags: tagArray
      });
      onClose();
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
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
          maxWidth: '700px',
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
            borderBottom: `1px solid ${darkTheme.colors.borderColor}`,
            position: 'sticky',
            top: 0,
            background: darkTheme.colors.bgPrimary,
            zIndex: 10
          }}
        >
          <h2 style={{ fontSize: '20px', margin: 0, fontWeight: '600' }}>
            Edit Note
          </h2>
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
          {/* Note Info */}
          <div style={{ marginBottom: '20px', padding: '12px', background: darkTheme.colors.bgSecondary, borderRadius: darkTheme.borderRadius.md }}>
            <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, marginBottom: '4px' }}>
              Author: <span style={{ color: darkTheme.colors.textPrimary, fontWeight: '500' }}>{note.author_name}</span>
            </div>
            <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary }}>
              Subject: <span style={{ color: darkTheme.colors.textPrimary, fontWeight: '500' }}>{note.subject_name || 'Unknown'}</span>
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: darkTheme.colors.bgSecondary,
                border: `1px solid ${darkTheme.colors.borderColor}`,
                borderRadius: darkTheme.borderRadius.md,
                outline: 'none',
                color: darkTheme.colors.textPrimary,
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: darkTheme.colors.bgSecondary,
                border: `1px solid ${darkTheme.colors.borderColor}`,
                borderRadius: darkTheme.borderRadius.md,
                outline: 'none',
                color: darkTheme.colors.textPrimary,
                fontSize: '14px',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Tags */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Tags <span style={{ fontSize: '12px', color: darkTheme.colors.textSecondary }}>(comma-separated)</span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. algebra, equations, mathematics"
              style={{
                width: '100%',
                padding: '12px 16px',
                background: darkTheme.colors.bgSecondary,
                border: `1px solid ${darkTheme.colors.borderColor}`,
                borderRadius: darkTheme.borderRadius.md,
                outline: 'none',
                color: darkTheme.colors.textPrimary,
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            {tags && (
              <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {tags.split(',').map((tag, idx) => {
                  const trimmedTag = tag.trim();
                  if (!trimmedTag) return null;
                  return (
                    <span
                      key={idx}
                      style={{
                        background: `${darkTheme.colors.accent}20`,
                        border: `1px solid ${darkTheme.colors.accent}`,
                        color: darkTheme.colors.accent,
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      {trimmedTag}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: darkTheme.colors.bgSecondary,
                border: `1px solid ${darkTheme.colors.borderColor}`,
                color: darkTheme.colors.textPrimary,
                borderRadius: darkTheme.borderRadius.md,
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: darkTheme.colors.accent,
                border: 'none',
                color: 'white',
                borderRadius: darkTheme.borderRadius.md,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                opacity: isSaving ? 0.6 : 1
              }}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
