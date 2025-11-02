import { useState } from 'react';
import { Note } from '../pages/SubjectNotesPage';
import { darkTheme } from '../theme';

interface NoteDetailModalProps {
  note: Note | null;
  onClose: () => void;
  onLike?: (noteId: number) => void;
  onUpvote?: (noteId: number) => void;
}

export default function NoteDetailModal({
  note,
  onClose,
  onLike,
  onUpvote
}: NoteDetailModalProps) {
  if (!note) return null;

  const [isLiked, setIsLiked] = useState(note.liked_by_me || false);
  const [isUpvoted, setIsUpvoted] = useState(note.upvoted_by_me || false);
  const [likeCount, setLikeCount] = useState(note.likes);
  const [upvoteCount, setUpvoteCount] = useState(note.admin_upvotes);

  const handleLike = () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    onLike?.(note.id);
  };

  const handleUpvote = () => {
    const newUpvotedState = !isUpvoted;
    setIsUpvoted(newUpvotedState);
    setUpvoteCount(prev => newUpvotedState ? prev + 1 : prev - 1);
    onUpvote?.(note.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
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
          borderRadius: '16px',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflowY: 'auto',
          color: darkTheme.colors.textPrimary,
          boxShadow: darkTheme.shadows.lg
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
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
          <h2 style={{ fontSize: '20px', fontFamily: 'Playfair Display, serif', margin: 0 }}>
            Note Details
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

        {/* Note Image Header */}
        {note.image && (
          <div
            style={{
              height: '240px',
              background: `linear-gradient(135deg, ${darkTheme.colors.accent} 0%, #8b5cf6 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '96px',
              borderBottom: `1px solid ${darkTheme.colors.borderColor}`
            }}
          >
            {note.image}
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '32px' }}>
          {/* Title */}
          <h1
            style={{
              fontSize: '28px',
              fontFamily: 'Playfair Display, serif',
              margin: '0 0 16px 0',
              color: darkTheme.colors.textPrimary
            }}
          >
            {note.title}
          </h1>

          {/* Author Info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: `1px solid ${darkTheme.colors.borderColor}`
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                background: `linear-gradient(135deg, ${darkTheme.colors.accent}, #8b5cf6)`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '18px'
              }}
            >
              {note.author_name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>{note.author_name}</div>
              <div
                style={{
                  fontSize: '13px',
                  color: darkTheme.colors.textSecondary,
                  background: `${darkTheme.colors.accent}20`,
                  padding: '4px 10px',
                  borderRadius: '12px',
                  display: 'inline-block',
                  marginTop: '4px'
                }}
              >
                Class {note.author_class}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: '13px', color: darkTheme.colors.textSecondary }}>
              {formatDate(note.created_at)}
            </div>
          </div>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: darkTheme.colors.textSecondary }}>
                TOPICS
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      background: `${darkTheme.colors.accent}20`,
                      border: `1px solid ${darkTheme.colors.accent}`,
                      color: darkTheme.colors.accent,
                      padding: '6px 14px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '8px',
                color: darkTheme.colors.textSecondary
              }}
            >
              SUMMARY
            </h3>
            <p
              style={{
                fontSize: '15px',
                lineHeight: '1.6',
                color: darkTheme.colors.textPrimary,
                margin: 0
              }}
            >
              {note.description}
            </p>
          </div>

          {/* Full Content (if available) */}
          {note.content && (
            <div style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: darkTheme.colors.textSecondary
                }}
              >
                FULL CONTENT
              </h3>
              <div
                style={{
                  background: darkTheme.colors.bgSecondary,
                  border: `1px solid ${darkTheme.colors.borderColor}`,
                  borderRadius: '12px',
                  padding: '16px',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}
              >
                {note.content}
              </div>
            </div>
          )}

          {/* Stats */}
          <div
            style={{
              background: darkTheme.colors.bgSecondary,
              border: `1px solid ${darkTheme.colors.borderColor}`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, marginBottom: '4px' }}>
                  LIKES
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: darkTheme.colors.accent }}>
                  {likeCount}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, marginBottom: '4px' }}>
                  ADMIN UPVOTES
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b00' }}>
                  {upvoteCount}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <button
              onClick={handleLike}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: isLiked ? darkTheme.colors.accent : darkTheme.colors.bgSecondary,
                color: isLiked ? 'white' : darkTheme.colors.textPrimary,
                border: `1px solid ${isLiked ? darkTheme.colors.accent : darkTheme.colors.borderColor}`,
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                if (!isLiked) {
                  e.currentTarget.style.background = `${darkTheme.colors.accent}15`;
                  e.currentTarget.style.borderColor = darkTheme.colors.accent;
                }
              }}
              onMouseOut={(e) => {
                if (!isLiked) {
                  e.currentTarget.style.background = darkTheme.colors.bgSecondary;
                  e.currentTarget.style.borderColor = darkTheme.colors.borderColor;
                }
              }}
            >
              <i
                className={`${isLiked ? 'fas' : 'far'} fa-heart`}
                style={{ fontSize: '16px' }}
              ></i>
              {isLiked ? 'Liked' : 'Like'}
            </button>

            <button
              onClick={handleUpvote}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: isUpvoted ? '#ff6b00' : darkTheme.colors.bgSecondary,
                color: isUpvoted ? 'white' : darkTheme.colors.textPrimary,
                border: `1px solid ${isUpvoted ? '#ff6b00' : darkTheme.colors.borderColor}`,
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                if (!isUpvoted) {
                  e.currentTarget.style.background = '#ff6b0015';
                  e.currentTarget.style.borderColor = '#ff6b00';
                }
              }}
              onMouseOut={(e) => {
                if (!isUpvoted) {
                  e.currentTarget.style.background = darkTheme.colors.bgSecondary;
                  e.currentTarget.style.borderColor = darkTheme.colors.borderColor;
                }
              }}
            >
              <i
                className="fas fa-crown"
                style={{ fontSize: '16px' }}
              ></i>
              {isUpvoted ? 'Upvoted' : 'Admin Upvote'}
            </button>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: darkTheme.colors.bgSecondary,
              color: darkTheme.colors.textPrimary,
              border: `1px solid ${darkTheme.colors.borderColor}`,
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = `${darkTheme.colors.accent}20`;
              e.currentTarget.style.borderColor = darkTheme.colors.accent;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = darkTheme.colors.bgSecondary;
              e.currentTarget.style.borderColor = darkTheme.colors.borderColor;
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
