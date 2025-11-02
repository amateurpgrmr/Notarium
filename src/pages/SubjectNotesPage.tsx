import { useEffect, useState } from 'react';
import api from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import UploadNoteModal from '../components/UploadNoteModal';
import { Subject } from './SubjectsPage';
import { darkTheme } from '../theme';

export interface Note {
  id: number;
  title: string;
  description: string;
  content?: string;
  author_name: string;
  author_class: string;
  subject_id: number;
  image?: string;
  tags?: string[];
  likes: number;
  admin_upvotes: number;
  created_at: string;
  liked_by_me?: boolean;
  upvoted_by_me?: boolean;
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
  const [notes, setNotes] = useState<Note[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'mostUpvoted'>('newest');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [currentUser] = useState({ userClass: '10-A' }); // Mock current user

  useEffect(() => {
    loadNotes();
  }, [subject]);

  const loadNotes = async () => {
    if (!subject) return;

    try {
      setIsLoading(true);
      // Mock notes data per subject
      const mockNotes: Note[] = [
        {
          id: 1,
          title: `Introduction to ${subject.name}`,
          description: `Learn the fundamentals of ${subject.name}. This comprehensive note covers all basics.`,
          author_name: 'Alice Johnson',
          author_class: '10-A',
          subject_id: subject.id,
          image: '📄',
          tags: ['basics', 'fundamental'],
          likes: 24,
          admin_upvotes: 3,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 2,
          title: `Advanced Topics in ${subject.name}`,
          description: `Deep dive into advanced concepts. Perfect for exam preparation.`,
          author_name: 'Bob Smith',
          author_class: '10-B',
          subject_id: subject.id,
          image: '📚',
          tags: ['advanced', 'exam-prep'],
          likes: 18,
          admin_upvotes: 5,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 3,
          title: `Quick Summary of ${subject.name}`,
          description: `Quick revision notes for last-minute preparation.`,
          author_name: 'Carol White',
          author_class: '10-C',
          subject_id: subject.id,
          image: '📋',
          tags: ['summary', 'revision'],
          likes: 42,
          admin_upvotes: 2,
          created_at: new Date().toISOString(),
        }
      ];

      setNotes(mockNotes);

      // Extract all unique tags
      const tags = new Set<string>();
      mockNotes.forEach(note => {
        note.tags?.forEach(tag => tags.add(tag));
      });
      setAllTags(Array.from(tags));
    } catch (error) {
      console.error('Failed to load subject notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    loadNotes();
  };

  const filteredAndSortedNotes = notes
    .filter(note => filterTag === 'all' || note.tags?.includes(filterTag))
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'popular') {
        return b.likes - a.likes;
      } else {
        return b.admin_upvotes - a.admin_upvotes;
      }
    });

  const toggleLike = (noteId: number) => {
    setNotes(notes.map(note => {
      if (note.id === noteId) {
        return {
          ...note,
          liked_by_me: !note.liked_by_me,
          likes: note.liked_by_me ? note.likes - 1 : note.likes + 1
        };
      }
      return note;
    }));
  };

  const toggleAdminUpvote = (noteId: number) => {
    setNotes(notes.map(note => {
      if (note.id === noteId) {
        return {
          ...note,
          upvoted_by_me: !note.upvoted_by_me,
          admin_upvotes: note.upvoted_by_me ? note.admin_upvotes - 1 : note.admin_upvotes + 1
        };
      }
      return note;
    }));
  };

  if (!subject) return null;

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          padding: '8px 16px',
          background: 'transparent',
          border: 'none',
          color: darkTheme.colors.accent,
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: '24px',
          transition: darkTheme.transitions.default,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onMouseOver={(e) => (e.currentTarget.style.opacity = '0.8')}
        onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
      >
        <i className="fas fa-arrow-left"></i>Back to Subjects
      </button>

      {/* Header with Upload Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            margin: '0 0 8px 0',
            color: darkTheme.colors.textPrimary
          }}>
            {subject.name}
          </h2>
          <p style={{ margin: 0, color: darkTheme.colors.textSecondary, fontSize: '14px' }}>
            {notes.length} note{notes.length !== 1 ? 's' : ''} in this subject
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          style={{
            padding: '12px 24px',
            background: `linear-gradient(135deg, ${darkTheme.colors.accent} 0%, #27ae60 100%)`,
            border: 'none',
            color: 'white',
            borderRadius: darkTheme.borderRadius.md,
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s',
            boxShadow: darkTheme.shadows.default
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <i className="fas fa-plus"></i>Add Note
        </button>
      </div>

      {/* Sorting and Filtering */}
      {notes.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '32px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Sort Dropdown */}
          <div>
            <label style={{ fontSize: '14px', fontWeight: '500', marginRight: '8px', color: darkTheme.colors.textSecondary }}>
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: '8px 12px',
                background: darkTheme.colors.bgSecondary,
                border: `1px solid ${darkTheme.colors.borderColor}`,
                borderRadius: darkTheme.borderRadius.sm,
                color: darkTheme.colors.textPrimary,
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <option value="newest">Newest</option>
              <option value="popular">Most Liked</option>
              <option value="mostUpvoted">Most Upvoted</option>
            </select>
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: darkTheme.colors.textSecondary }}>
                Tags:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setFilterTag('all')}
                  style={{
                    padding: '6px 14px',
                    background: filterTag === 'all' ? darkTheme.colors.accent : darkTheme.colors.bgSecondary,
                    border: `1px solid ${filterTag === 'all' ? darkTheme.colors.accent : darkTheme.colors.borderColor}`,
                    color: filterTag === 'all' ? 'white' : darkTheme.colors.textPrimary,
                    borderRadius: darkTheme.borderRadius.sm,
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                >
                  All
                </button>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(tag)}
                    style={{
                      padding: '6px 14px',
                      background: filterTag === tag ? darkTheme.colors.accent : darkTheme.colors.bgSecondary,
                      border: `1px solid ${filterTag === tag ? darkTheme.colors.accent : darkTheme.colors.borderColor}`,
                      color: filterTag === tag ? 'white' : darkTheme.colors.textPrimary,
                      borderRadius: darkTheme.borderRadius.sm,
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notes Grid */}
      {isLoading ? (
        <LoadingSpinner message="Loading notes..." />
      ) : filteredAndSortedNotes.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 40px',
          color: darkTheme.colors.textSecondary
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📚</div>
          <p style={{ fontSize: '18px', marginBottom: '8px' }}>No notes yet</p>
          <p style={{ fontSize: '14px' }}>Be the first to add a note in this subject!</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {filteredAndSortedNotes.map((note) => (
            <div
              key={note.id}
              style={{
                background: darkTheme.colors.bgSecondary,
                borderRadius: darkTheme.borderRadius.md,
                overflow: 'hidden',
                transition: darkTheme.transitions.default,
                border: `1px solid ${darkTheme.colors.borderColor}`,
                boxShadow: darkTheme.shadows.default,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = darkTheme.shadows.lg;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = darkTheme.shadows.default;
              }}
            >
              {/* Image Section */}
              <div
                style={{
                  height: '200px',
                  background: `linear-gradient(135deg, ${darkTheme.colors.accent}20, ${darkTheme.colors.accent}05)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '64px',
                  color: darkTheme.colors.accent,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {note.image}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(to right, ${darkTheme.colors.accent}, #27ae60)`
                  }}
                ></div>
              </div>

              {/* Content Section */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                {/* Title */}
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: '0 0 8px 0',
                  color: darkTheme.colors.textPrimary,
                  lineHeight: '1.3'
                }}>
                  {note.title}
                </h3>

                {/* Author and Class */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: `linear-gradient(135deg, ${darkTheme.colors.accent}, #8b5cf6)`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {note.author_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: darkTheme.colors.textPrimary }}>
                      {note.author_name}
                    </p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: darkTheme.colors.textSecondary }}>
                      Class {note.author_class}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p style={{
                  fontSize: '14px',
                  color: darkTheme.colors.textSecondary,
                  margin: '0 0 12px 0',
                  lineHeight: '1.5',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {note.description}
                </p>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          padding: '4px 10px',
                          background: `${darkTheme.colors.accent}15`,
                          color: darkTheme.colors.accent,
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '500'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Divider */}
                <div style={{
                  height: '1px',
                  background: darkTheme.colors.borderColor,
                  margin: '12px 0'
                }}></div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'auto'
                }}>
                  {/* Like Button */}
                  <button
                    onClick={() => toggleLike(note.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: note.liked_by_me ? darkTheme.colors.accent : darkTheme.colors.textSecondary,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: darkTheme.transitions.default,
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = note.liked_by_me ? `${darkTheme.colors.accent}10` : `rgba(255,255,255,0.1)`;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    <i className={`fas fa-heart${note.liked_by_me ? '' : '-o'}`}></i>
                    {note.likes}
                  </button>

                  {/* Admin Upvote Button */}
                  <button
                    onClick={() => toggleAdminUpvote(note.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: note.upvoted_by_me ? '#ff6b00' : darkTheme.colors.textSecondary,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: darkTheme.transitions.default,
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = note.upvoted_by_me ? 'rgba(255, 107, 0, 0.1)' : `rgba(255,255,255,0.1)`;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    <i className={`fas fa-crown${note.upvoted_by_me ? '' : ''}`}></i>
                    {note.admin_upvotes}
                  </button>

                  {/* Date */}
                  <span style={{
                    fontSize: '12px',
                    color: darkTheme.colors.textSecondary
                  }}>
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Note Modal */}
      {showUploadModal && (
        <UploadNoteModal
          onClose={() => setShowUploadModal(false)}
          subjects={[subject]}
          onSuccess={handleUploadSuccess}
          preselectedSubject={subject.id}
        />
      )}
    </div>
  );
}
