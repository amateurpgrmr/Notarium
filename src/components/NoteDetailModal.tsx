import { useState, useEffect } from 'react';
import { Note } from '../pages/SubjectNotesPage';
import { User } from '../lib/api';
import api from '../lib/api';
import { darkTheme } from '../theme';

interface NoteDetailModalProps {
  note: Note | null;
  onClose: () => void;
  onLike?: (noteId: number) => void;
  currentUser?: User | null;
}

export default function NoteDetailModal({
  note,
  onClose,
  onLike,
  currentUser
}: NoteDetailModalProps) {
  if (!note) return null;

  // Parse images - support both single image string and array of images
  const images = (() => {
    if (!note.image) return [];
    if (typeof note.image === 'string') {
      // Check if it's a JSON array
      if (note.image.startsWith('[')) {
        try {
          return JSON.parse(note.image);
        } catch {
          return [note.image];
        }
      }
      return [note.image];
    }
    if (Array.isArray(note.image)) {
      return note.image;
    }
    return [];
  })();

  const [isLiked, setIsLiked] = useState(note.liked_by_me || false);
  const [likeCount, setLikeCount] = useState(note.likes);
  const [summary, setSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const currentImage = images[currentImageIndex] || null;
  const hasMultipleImages = images.length > 1;

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset zoom when changing images
  useEffect(() => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  }, [currentImageIndex]);

  // Navigation handlers
  const goToPreviousImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
    if (zoomLevel <= 1.5) {
      setImagePosition({ x: 0, y: 0 });
    }
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  };

  // Drag handlers for zoomed images
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    if (hasMultipleImages && zoomLevel === 1) {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (hasMultipleImages && zoomLevel === 1) {
      setTouchEnd(e.targetTouches[0].clientX);
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || zoomLevel > 1) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNextImage();
    }
    if (isRightSwipe) {
      goToPreviousImage();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isFullScreen) {
        if (e.key === 'ArrowLeft') goToPreviousImage();
        if (e.key === 'ArrowRight') goToNextImage();
        if (e.key === 'Escape') setIsFullScreen(false);
        if (e.key === '+' || e.key === '=') handleZoomIn();
        if (e.key === '-') handleZoomOut();
        if (e.key === '0') handleResetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullScreen, hasMultipleImages]);

  const handleLike = () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    onLike?.(note.id);
  };

  const generateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const response = await api.request('/api/gemini/summarize', {
        method: 'POST',
        body: {
          title: note.title,
          description: note.description,
          content: note.content
        }
      });

      if (response.success) {
        setSummary(response.summary);
      } else {
        setSummary('Failed to generate summary. Please try again.');
      }
    } catch (error) {
      console.error('Summary error:', error);
      setSummary('Error generating summary');
    } finally {
      setIsGeneratingSummary(false);
    }
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ fontSize: '20px', fontFamily: 'Playfair Display, serif', margin: 0 }}>
              Note Details
            </h2>
          </div>
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
        {currentImage && (
          <div
            style={{
              height: currentImage.startsWith('data:') ? '400px' : '240px',
              background: currentImage.startsWith('data:')
                ? `url(${currentImage}) center/contain no-repeat ${darkTheme.colors.bgSecondary}`
                : `linear-gradient(135deg, ${darkTheme.colors.accent} 0%, #8b5cf6 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: currentImage.startsWith('data:') ? '0' : '96px',
              borderBottom: `1px solid ${darkTheme.colors.borderColor}`,
              cursor: currentImage.startsWith('data:') ? 'zoom-in' : 'default',
              position: 'relative'
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Show emoji only if no actual image */}
            {!currentImage.startsWith('data:') && currentImage}

            {/* Clickable overlay for zoom - only on the actual image area */}
            {currentImage.startsWith('data:') && (
              <div
                onClick={() => setIsFullScreen(true)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  cursor: 'zoom-in',
                  transition: 'background 0.3s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              />
            )}

            {/* Navigation Arrows for Multiple Images */}
            {hasMultipleImages && currentImage.startsWith('data:') && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goToPreviousImage(); }}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    border: 'none',
                    color: 'white',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    transition: 'all 0.3s',
                    zIndex: 10
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.8)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    border: 'none',
                    color: 'white',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    transition: 'all 0.3s',
                    zIndex: 10
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.8)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>

                {/* Page Indicator and White Dot Indicators */}
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  pointerEvents: 'none'
                }}>
                  {/* Text indicator */}
                  <div style={{
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: '16px',
                    padding: '6px 16px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {currentImageIndex + 1} / {images.length}
                  </div>

                  {/* White dot indicators */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    {images.map((_, index) => (
                      <div
                        key={index}
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: index === currentImageIndex ? 'white' : 'rgba(255, 255, 255, 0.4)',
                          transition: 'all 0.3s',
                          boxShadow: index === currentImageIndex ? '0 0 8px rgba(255, 255, 255, 0.6)' : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Fullscreen hint icon */}
            {currentImage.startsWith('data:') && (
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: 'white',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                pointerEvents: 'none'
              }}>
                <i className="fas fa-expand"></i>
                <span style={{ fontSize: '12px' }}>Click to expand</span>
              </div>
            )}
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
                background: note.author_photo
                  ? `url('${note.author_photo}') center/cover`
                  : `linear-gradient(135deg, ${darkTheme.colors.accent}, #8b5cf6)`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '18px'
              }}
            >
              {!note.author_photo && note.author_name?.charAt(0).toUpperCase()}
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
                fontSize: isMobile ? '13px' : '15px',
                lineHeight: '1.6',
                color: darkTheme.colors.textPrimary,
                margin: 0
              }}
            >
              {note.description}
            </p>
          </div>

          {/* Full Content (if available) */}
          <div style={{ marginBottom: '24px' }}>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '12px',
                color: darkTheme.colors.textSecondary
              }}
            >
              EXTRACTED TEXT
            </h3>
            <div
              style={{
                background: darkTheme.colors.bgSecondary,
                border: `1px solid ${darkTheme.colors.borderColor}`,
                borderRadius: '12px',
                padding: '16px',
                fontSize: isMobile ? '13px' : '14px',
                lineHeight: '1.8',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '500px',
                overflowY: 'auto',
                minHeight: '100px',
                color: darkTheme.colors.textPrimary
              }}
            >
              {note.content ? note.content : (
                <div style={{
                  color: darkTheme.colors.textSecondary,
                  fontStyle: 'italic',
                  textAlign: 'center',
                  padding: '20px'
                }}>
                  <i className="fas fa-info-circle" style={{ fontSize: '24px', marginBottom: '12px', display: 'block' }}></i>
                  No extracted text available for this note
                </div>
              )}
            </div>
          </div>

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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary, marginBottom: '4px' }}>
                  LIKES
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: darkTheme.colors.accent }}>
                  {likeCount}
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
          </div>

          {/* Summarize Button */}
          <button
            onClick={generateSummary}
            disabled={isGeneratingSummary}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: darkTheme.colors.accent,
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: isGeneratingSummary ? 'not-allowed' : 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.3s',
              marginBottom: '12px',
              opacity: isGeneratingSummary ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              if (!isGeneratingSummary) {
                e.currentTarget.style.opacity = '0.9';
              }
            }}
            onMouseOut={(e) => {
              if (!isGeneratingSummary) {
                e.currentTarget.style.opacity = '1';
              }
            }}
          >
            <i
              className={`fas fa-${isGeneratingSummary ? 'spinner fa-spin' : 'lightbulb'}`}
              style={{ fontSize: '16px' }}
            ></i>
            {isGeneratingSummary ? 'Generating Summary...' : 'Generate AI Summary'}
          </button>

          {/* Summary Display */}
          {summary && (
            <div
              style={{
                background: darkTheme.colors.bgSecondary,
                border: `1px solid ${darkTheme.colors.accent}`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
                color: darkTheme.colors.textPrimary,
                fontSize: isMobile ? '12px' : '14px',
                lineHeight: '1.6'
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: darkTheme.colors.accent,
                  textTransform: 'uppercase'
                }}
              >
                AI Summary
              </div>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{summary}</p>
            </div>
          )}

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

      {/* Fullscreen Image Overlay */}
      {isFullScreen && currentImage && currentImage.startsWith('data:') && (
        <div
          onClick={(e) => {
            if (zoomLevel === 1 && e.target === e.currentTarget) {
              setIsFullScreen(false);
            }
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.95)',
            backdropFilter: 'blur(8px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            cursor: isDragging ? 'grabbing' : (zoomLevel > 1 ? 'grab' : 'default'),
            overflow: 'hidden'
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setIsFullScreen(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(4px)',
              border: 'none',
              color: 'white',
              fontSize: '32px',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s',
              zIndex: 2002
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ×
          </button>

          {/* Zoom Controls */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 2002
          }}>
            <button
              onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
              disabled={zoomLevel >= 4}
              style={{
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(4px)',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                cursor: zoomLevel >= 4 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s',
                opacity: zoomLevel >= 4 ? 0.5 : 1
              }}
              onMouseOver={(e) => {
                if (zoomLevel < 4) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <i className="fas fa-plus"></i>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
              disabled={zoomLevel <= 1}
              style={{
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(4px)',
                border: 'none',
                color: 'white',
                fontSize: '20px',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                cursor: zoomLevel <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s',
                opacity: zoomLevel <= 1 ? 0.5 : 1
              }}
              onMouseOver={(e) => {
                if (zoomLevel > 1) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <i className="fas fa-minus"></i>
            </button>
            {zoomLevel > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); handleResetZoom(); }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(4px)',
                  border: 'none',
                  color: 'white',
                  fontSize: '16px',
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                1:1
              </button>
            )}
          </div>

          {/* Navigation Arrows for Multiple Images */}
          {hasMultipleImages && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goToPreviousImage(); }}
                style={{
                  position: 'absolute',
                  left: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(4px)',
                  border: 'none',
                  color: 'white',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  transition: 'all 0.3s',
                  zIndex: 2001
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(4px)',
                  border: 'none',
                  color: 'white',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  transition: 'all 0.3s',
                  zIndex: 2001
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                }}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </>
          )}

          {/* Full size image with zoom and pan */}
          <img
            src={currentImage}
            alt={note.title}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            style={{
              maxWidth: zoomLevel === 1 ? '100%' : 'none',
              maxHeight: zoomLevel === 1 ? '100%' : 'none',
              width: zoomLevel > 1 ? `${zoomLevel * 100}%` : 'auto',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              transform: `translate(${imagePosition.x}px, ${imagePosition.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s',
              cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              userSelect: 'none',
              pointerEvents: zoomLevel > 1 ? 'auto' : 'none'
            }}
            draggable={false}
          />

          {/* Info Panel */}
          <div style={{
            position: 'absolute',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            pointerEvents: 'none'
          }}>
            {/* Info bar */}
            <div style={{
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '24px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              {hasMultipleImages && (
                <span style={{ fontWeight: '600' }}>
                  {currentImageIndex + 1} / {images.length}
                </span>
              )}
              {zoomLevel > 1 && (
                <span style={{ fontWeight: '600' }}>
                  {Math.round(zoomLevel * 100)}%
                </span>
              )}
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fas fa-info-circle"></i>
                {zoomLevel > 1 ? 'Drag to pan' : 'Use +/- to zoom'}
              </span>
            </div>

            {/* White dot indicators for fullscreen */}
            {hasMultipleImages && (
              <div style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
              }}>
                {images.map((_, index) => (
                  <div
                    key={index}
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: index === currentImageIndex ? 'white' : 'rgba(255, 255, 255, 0.3)',
                      transition: 'all 0.3s',
                      boxShadow: index === currentImageIndex ? '0 0 10px rgba(255, 255, 255, 0.8)' : 'none'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
