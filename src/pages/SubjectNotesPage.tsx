import { useEffect, useState } from 'react';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { Subject } from './SubjectsPage';
import { darkTheme, cardStyle, buttonSecondaryStyle } from '../theme';

export interface Note {
  id: number;
  title: string;
  content: string;
  author_name: string;
  created_at: string;
  views: number;
  rating_avg: number;
}

interface SubjectNotesPageProps {
  subject: Subject | null;
  onBack: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function SubjectNotesPage({
  subject,
  onBack,
  isLoading,
  setIsLoading
}: SubjectNotesPageProps) {
  const [subjectNotes, setSubjectNotes] = useState<Note[]>([]);

  useEffect(() => {
    const loadNotes = async () => {
      if (!subject) return;

      try {
        setIsLoading(true);
        const notesData = await api.getSubjectNotes?.(subject.id);
        setSubjectNotes(notesData?.notes || []);
      } catch (error) {
        console.error('Failed to load subject notes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, [subject, setIsLoading]);

  if (!subject) return null;

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          ...buttonSecondaryStyle,
          marginBottom: '24px'
        } as React.CSSProperties}
        onMouseOver={(e) => e.currentTarget.style.background = darkTheme.colors.bgSecondary}
        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <i style={{ marginRight: '8px' }} className="fas fa-arrow-left"></i>Back to Subjects
      </button>

      <h2 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '24px',
        color: darkTheme.colors.textPrimary
      }}>
        {subject.name}
      </h2>

      {isLoading ? (
        <LoadingSpinner message="Loading notes..." />
      ) : subjectNotes.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 40px',
          color: darkTheme.colors.textSecondary
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
          <p style={{ fontSize: '16px' }}>No notes yet in this subject</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {subjectNotes.map((note) => (
            <div
              key={note.id}
              style={{
                ...cardStyle,
                cursor: 'pointer'
              } as React.CSSProperties}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = darkTheme.colors.accent;
                e.currentTarget.style.boxShadow = darkTheme.shadows.default;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = darkTheme.colors.borderColor;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: `linear-gradient(135deg, ${darkTheme.colors.accent}, #8b5cf6)`,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  {note.author_name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>{note.author_name}</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: darkTheme.colors.textSecondary }}>
                    {new Date(note.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                {note.title}
              </h3>
              <p style={{
                fontSize: '14px',
                color: darkTheme.colors.textSecondary,
                marginBottom: '12px',
                lineHeight: '1.5'
              }}>
                {note.content.substring(0, 100)}...
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: darkTheme.colors.textSecondary
              }}>
                <span>👁️ {note.views || 0} views</span>
                <span>⭐ {(note.rating_avg || 0).toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
