import { useState, useRef, useEffect } from 'react';
import CameraCapture from './CameraCapture';
import api from '../lib/api';
import { darkTheme } from '../theme';
import LoadingSpinner from './LoadingSpinner';
import { useAuth } from '../App';

interface Subject {
  id: number;
  name: string;
  icon: string;
  note_count: number;
}

interface UploadNoteModalProps {
  onClose: () => void;
  subjects: Subject[];
  onSuccess?: () => void;
  preselectedSubject?: number;
}

export default function UploadNoteModal({ onClose, subjects, onSuccess, preselectedSubject }: UploadNoteModalProps) {
  const { user } = useAuth();
  const [uploadMode, setUploadMode] = useState<'scan' | 'photo'>('scan');
  const [uploadImages, setUploadImages] = useState<string[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [manualTags, setManualTags] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
  const [fullscreenImage, setFullscreenImage] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [ocrCompleted, setOcrCompleted] = useState(false);
  const [viewMode, setViewMode] = useState<'image' | 'text'>('image'); // Toggle between image and text view
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Track window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const newImage = reader.result;
        setUploadImages(prev => {
          const newImages = [...prev, newImage];
          // Auto-process OCR if in scan mode
          if (uploadMode === 'scan') {
            setTimeout(() => processImagesOCR(newImages), 100);
          }
          return newImages;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoCapture = async (photoBase64: string) => {
    setShowCamera(false);
    setUploadImages(prev => {
      const newImages = [...prev, photoBase64];
      // Auto-process OCR if in scan mode
      if (uploadMode === 'scan') {
        setTimeout(() => processImagesOCR(newImages), 100);
      }
      return newImages;
    });
  };

  const processImagesOCR = async (images: string[]) => {
    if (images.length === 0 || isProcessingOCR) {
      console.log('Skipping OCR:', { imagesLength: images.length, isProcessingOCR });
      return;
    }

    console.log('Starting OCR for', images.length, 'images');
    setIsProcessingOCR(true);
    setExtractedText(''); // Clear any existing text
    setOcrCompleted(false);

    try {
      let combinedText = '';

      // Process each image sequentially
      for (let i = 0; i < images.length; i++) {
        try {
          console.log(`Processing image ${i + 1}/${images.length}...`);
          const result = await api.ai.performOCR(images[i], 'image/jpeg');
          console.log(`OCR result for image ${i + 1}:`, result);

          if (result.success && result.text) {
            const pageMarker = i > 0 ? `\n\n--- Page ${i + 1} ---\n\n` : '';
            combinedText += pageMarker + result.text;

            // Update text as we process each page (Gemini-formatted)
            setExtractedText(combinedText);
            console.log(`Extracted text updated (${combinedText.length} chars)`);
          } else {
            console.error(`OCR failed for page ${i + 1}:`, result);
          }
        } catch (pageError) {
          console.error(`Error processing page ${i + 1}:`, pageError);
          alert(`OCR Error on page ${i + 1}: ${pageError instanceof Error ? pageError.message : 'Unknown error'}`);
        }
      }

      if (combinedText.length === 0) {
        alert('OCR completed but no text was extracted. The image may be blank or the API key may be invalid.');
      }

      setOcrCompleted(true);
      console.log('OCR complete! Total text length:', combinedText.length);

    } catch (error) {
      console.error('OCR Error:', error);
      alert(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const generateQuickSummary = async (content: string, title: string): Promise<string> => {
    try {
      if (!content || content.trim().length === 0) {
        throw new Error('No content available to summarize. Please upload an image first.');
      }

      const response = await api.request('/api/gemini/quick-summary', {
        method: 'POST',
        body: {
          title: title || 'Untitled',
          content: content
        }
      });

      if (!response.success || !response.summary) {
        throw new Error(response.error || 'Failed to generate summary');
      }

      return response.summary;
    } catch (error: any) {
      console.error('Summary generation error:', error);
      alert(`Summary Error: ${error.message || 'Failed to generate summary. Please try again.'}`);
      throw error;
    }
  };

  const generateAutoTags = async (content: string, title: string): Promise<string[]> => {
    try {
      const response = await api.request('/api/gemini/auto-tags', {
        method: 'POST',
        body: {
          title: title,
          content: content
        }
      });
      return response.tags || [];
    } catch (error) {
      console.error('Tag generation error:', error);
      return [];
    }
  };

  const handleSubmit = async () => {
    if (!noteTitle || uploadImages.length === 0) {
      alert('Please fill in all required fields (Title and Image)');
      return;
    }

    if (!preselectedSubject) {
      alert('Subject not found. Please select a subject before uploading.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Use extracted text for summary if not already generated
      const contentForSummary = extractedText;
      let quickSummary = generatedSummary;
      let autoTags = suggestedTags;

      // Generate if not already generated
      if (contentForSummary && !quickSummary) {
        const [summary, tags] = await Promise.all([
          generateQuickSummary(contentForSummary, noteTitle),
          generateAutoTags(contentForSummary, noteTitle)
        ]);
        quickSummary = summary;
        autoTags = tags;
        setGeneratedSummary(summary);
        setSuggestedTags(tags);
      }

      // Combine manual tags with AI suggestions
      const manualTagList = manualTags.split(',').map(t => t.trim()).filter(t => t);
      const finalTags = manualTagList.length > 0 ? manualTagList : autoTags;

      const noteData = {
        title: noteTitle,
        description: quickSummary || 'No description available',
        subject_id: preselectedSubject, // REQUIRED - must be provided
        extracted_text: extractedText || 'No extracted text',
        image_path: uploadImages[0], // Use first image as primary
        quick_summary: quickSummary,
        tags: finalTags
      };

      const response = await api.request('/api/notes', {
        method: 'POST',
        body: noteData
      });

      if (response.note) {
        alert('Note uploaded successfully!');
        onSuccess?.();
        onClose();
      }
    } catch (error: any) {
      console.error('Submit Error:', error);
      alert(`Failed to upload note: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add effect to auto-generate summary and tags when title and extracted text are both available
  useEffect(() => {
    const generateAISuggestions = async () => {
      if (noteTitle && extractedText && !generatedSummary && !isProcessingOCR) {
        console.log('Auto-generating summary and tags...', {
          titleLength: noteTitle.length,
          textLength: extractedText.length
        });
        try {
          const [summary, tags] = await Promise.all([
            generateQuickSummary(extractedText, noteTitle),
            generateAutoTags(extractedText, noteTitle)
          ]);
          setGeneratedSummary(summary);
          setSuggestedTags(tags);
          console.log('Auto-generation complete');
        } catch (error) {
          console.error('Error generating AI suggestions:', error);
          // Don't show alert for auto-generation - user can manually trigger
        }
      }
    };

    generateAISuggestions();
  }, [noteTitle, extractedText]);

  const canSubmit = noteTitle && uploadImages.length > 0 && !isProcessingOCR && !isSubmitting;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
    >
      <div
        style={{
          background: darkTheme.colors.bgPrimary,
          borderRadius: '16px',
          width: '100%',
          maxWidth: '600px',
          padding: isMobile ? '12px' : '32px',
          boxShadow: darkTheme.shadows.lg,
          maxHeight: '98vh',
          overflowY: 'auto',
          color: darkTheme.colors.textPrimary,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: isMobile ? '12px' : '24px',
            paddingBottom: isMobile ? '8px' : '16px',
            borderBottom: `1px solid ${darkTheme.colors.borderColor}`
          }}
        >
          <h3 style={{ fontSize: isMobile ? '18px' : '24px', fontFamily: 'Playfair Display, serif', margin: 0 }}>
            Upload Note
          </h3>
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

        {/* Mode Selection */}
        <div style={{ display: 'flex', gap: isMobile ? '8px' : '16px', marginBottom: isMobile ? '12px' : '24px' }}>
          <div
            onClick={() => {
              if (!isProcessingOCR && uploadImages.length === 0) {
                setUploadMode('scan');
                setExtractedText('');
                setOcrCompleted(false);
              }
            }}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '12px',
              border: `2px dashed ${uploadMode === 'scan' ? darkTheme.colors.accent : darkTheme.colors.borderColor}`,
              background: uploadMode === 'scan' ? `${darkTheme.colors.accent}15` : 'transparent',
              cursor: (isProcessingOCR || uploadImages.length > 0) ? 'not-allowed' : 'pointer',
              textAlign: 'center',
              transition: 'all 0.3s',
              opacity: (isProcessingOCR || uploadImages.length > 0) && uploadMode !== 'scan' ? 0.5 : 1
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>
              <i className="fas fa-text-height"></i>
            </div>
            <div style={{ color: darkTheme.colors.textSecondary }}>Scan with AI OCR</div>
          </div>
          <div
            onClick={() => {
              if (!isProcessingOCR && uploadImages.length === 0) {
                setUploadMode('photo');
                setOcrCompleted(false);
              }
            }}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '12px',
              border: `2px dashed ${uploadMode === 'photo' ? darkTheme.colors.accent : darkTheme.colors.borderColor}`,
              background: uploadMode === 'photo' ? `${darkTheme.colors.accent}15` : 'transparent',
              cursor: (isProcessingOCR || uploadImages.length > 0) ? 'not-allowed' : 'pointer',
              textAlign: 'center',
              transition: 'all 0.3s',
              opacity: (isProcessingOCR || uploadImages.length > 0) && uploadMode !== 'photo' ? 0.5 : 1
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>
              <i className="fas fa-camera"></i>
            </div>
            <div style={{ color: darkTheme.colors.textSecondary }}>Photo Only</div>
          </div>
        </div>

        {/* Upload Buttons */}
        {uploadImages.length === 0 ? (
          <div style={{ marginBottom: isMobile ? '12px' : '24px' }}>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowCamera(true)}
                style={{
                  flex: 1,
                  padding: isMobile ? '16px' : '20px',
                  background: `linear-gradient(135deg, ${darkTheme.colors.accent} 0%, ${darkTheme.colors.accentHover} 100%)`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: '600',
                  transition: 'all 0.3s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fas fa-camera" style={{ fontSize: isMobile ? '24px' : '32px' }}></i>
                <span>Take Photo</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flex: 1,
                  padding: isMobile ? '16px' : '20px',
                  background: `linear-gradient(135deg, ${darkTheme.colors.accent} 0%, ${darkTheme.colors.accentHover} 100%)`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: '600',
                  transition: 'all 0.3s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fas fa-upload" style={{ fontSize: isMobile ? '24px' : '32px' }}></i>
                <span>Upload File</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <div style={{ marginBottom: isMobile ? '12px' : '16px' }}>
            {/* Add Another Page Button - Always available */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingOCR}
              style={{
                width: '100%',
                padding: isMobile ? '12px' : '14px',
                background: darkTheme.colors.accent,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: isProcessingOCR ? 'not-allowed' : 'pointer',
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: '600',
                transition: 'all 0.2s',
                opacity: isProcessingOCR ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                if (!isProcessingOCR) e.currentTarget.style.background = darkTheme.colors.accentHover;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = darkTheme.colors.accent;
              }}
            >
              <i className="fas fa-plus"></i>
              Add Another Page
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* Multi-Page Preview with Navigation */}
        {uploadImages.length > 0 && (
          <div style={{ marginBottom: isMobile ? '12px' : '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: '500', margin: 0 }}>
                <i className="fas fa-images" style={{ color: darkTheme.colors.accent, marginRight: '8px' }}></i>
                Note Pages ({uploadImages.length})
              </label>

              {/* View Mode Toggle - Only show if OCR text exists */}
              {uploadMode === 'scan' && extractedText && (
                <div style={{
                  display: 'flex',
                  gap: '4px',
                  background: darkTheme.colors.bgSecondary,
                  padding: '4px',
                  borderRadius: '8px',
                  border: `1px solid ${darkTheme.colors.borderColor}`
                }}>
                  <button
                    onClick={() => setViewMode('image')}
                    style={{
                      padding: '6px 12px',
                      background: viewMode === 'image' ? darkTheme.colors.accent : 'transparent',
                      color: viewMode === 'image' ? 'white' : darkTheme.colors.textSecondary,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: isMobile ? '11px' : '12px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    <i className="fas fa-image" style={{ marginRight: '4px' }}></i>
                    Image
                  </button>
                  <button
                    onClick={() => setViewMode('text')}
                    style={{
                      padding: '6px 12px',
                      background: viewMode === 'text' ? darkTheme.colors.accent : 'transparent',
                      color: viewMode === 'text' ? 'white' : darkTheme.colors.textSecondary,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: isMobile ? '11px' : '12px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                  >
                    <i className="fas fa-align-left" style={{ marginRight: '4px' }}></i>
                    Text
                  </button>
                </div>
              )}
            </div>
            <div style={{
              position: 'relative',
              background: `${darkTheme.colors.accent}10`,
              border: `1px solid ${darkTheme.colors.accent}30`,
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {/* Show Image View or Text View based on viewMode */}
              {viewMode === 'image' ? (
                <>
                  {/* Previous Page Arrow */}
                  {uploadImages.length > 1 && currentPage > 0 && (
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                      style={{
                        background: darkTheme.colors.accent,
                        border: 'none',
                        borderRadius: '8px',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        fontSize: '14px',
                        flexShrink: 0
                      }}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                  )}

                  {/* Current Page Image - Clickable for fullscreen */}
                  <div
                    onClick={() => setFullscreenImage(currentPage)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      gap: '8px'
                    }}
                  >
                    <img
                      src={uploadImages[currentPage]}
                      alt={`Page ${currentPage + 1}`}
                      style={{
                        width: '100%',
                        maxHeight: '150px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        border: `2px solid ${darkTheme.colors.accent}`
                      }}
                    />
                    <div style={{ fontSize: '12px', color: darkTheme.colors.textSecondary }}>
                      Page {currentPage + 1} of {uploadImages.length} - Click to view fullscreen
                    </div>
                    {isProcessingOCR && (
                      <div style={{ fontSize: '11px', color: darkTheme.colors.accent }}>
                        <i className="fas fa-spinner fa-spin"></i> Scanning...
                      </div>
                    )}
                  </div>

                  {/* Next Page Arrow */}
                  {uploadImages.length > 1 && currentPage < uploadImages.length - 1 && (
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(uploadImages.length - 1, prev + 1))}
                      style={{
                        background: darkTheme.colors.accent,
                        border: 'none',
                        borderRadius: '8px',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white',
                        fontSize: '14px',
                        flexShrink: 0
                      }}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  )}
                </>
              ) : (
                /* Text View - Show extracted text */
                <div style={{
                  flex: 1,
                  padding: '12px',
                  background: darkTheme.colors.bgPrimary,
                  borderRadius: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  fontSize: isMobile ? '12px' : '13px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  color: darkTheme.colors.textPrimary
                }}>
                  {extractedText || 'No text extracted yet. Click "Start OCR Scan" to extract text.'}
                </div>
              )}
            </div>

            {/* Action Buttons Row */}
            <div style={{
              marginTop: '8px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center'
            }}>
              {/* Delete Current Page Button */}
              <button
                onClick={() => {
                  const newImages = uploadImages.filter((_, idx) => idx !== currentPage);
                  setUploadImages(newImages);
                  if (newImages.length === 0) {
                    setExtractedText('');
                    setCurrentPage(0);
                    setOcrCompleted(false);
                  } else if (currentPage >= newImages.length) {
                    setCurrentPage(newImages.length - 1);
                  }
                }}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  background: 'transparent',
                  color: 'rgba(239, 68, 68, 0.8)',
                  border: `1px solid rgba(239, 68, 68, 0.5)`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <i className="fas fa-trash" style={{ marginRight: '6px' }}></i>
                Delete
              </button>

              {/* Add Page Button - Opens camera for scan/photo mode */}
              <button
                onClick={() => setShowCamera(true)}
                disabled={isProcessingOCR}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  background: darkTheme.colors.accent,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isProcessingOCR ? 'not-allowed' : 'pointer',
                  fontSize: '11px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  opacity: isProcessingOCR ? 0.5 : 1
                }}
                onMouseOver={(e) => {
                  if (!isProcessingOCR) e.currentTarget.style.background = darkTheme.colors.accentHover;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = darkTheme.colors.accent;
                }}
              >
                <i className="fas fa-camera" style={{ marginRight: '6px' }}></i>
                Add Page
              </button>
            </div>
          </div>
        )}

        {/* Scanning Indicator - Show while OCR is processing */}
        {uploadMode === 'scan' && uploadImages.length > 0 && isProcessingOCR && (
          <div
            style={{
              marginBottom: isMobile ? '8px' : '12px',
              padding: isMobile ? '8px 12px' : '12px 16px',
              background: `${darkTheme.colors.accent}10`,
              border: `1px solid ${darkTheme.colors.accent}30`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <i
              className="fas fa-spinner fa-spin"
              style={{ fontSize: isMobile ? '16px' : '18px', color: darkTheme.colors.accent, flexShrink: 0 }}
            ></i>
            <p style={{ margin: 0, color: darkTheme.colors.accent, fontWeight: '500', fontSize: isMobile ? '12px' : '13px' }}>
              Scanning with AI OCR and cleaning text...
            </p>
          </div>
        )}

        {/* Success message after OCR completes */}
        {uploadMode === 'scan' && extractedText && !isProcessingOCR && (
          <div
            style={{
              marginBottom: isMobile ? '8px' : '12px',
              padding: isMobile ? '8px 12px' : '10px 14px',
              background: `${darkTheme.colors.accent}10`,
              border: `1px solid ${darkTheme.colors.accent}30`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <i
              className="fas fa-check-circle"
              style={{ fontSize: isMobile ? '14px' : '16px', color: darkTheme.colors.accent, flexShrink: 0 }}
            ></i>
            <p style={{ margin: 0, color: darkTheme.colors.textSecondary, fontSize: isMobile ? '11px' : '12px' }}>
              Text extracted and cleaned with AI. Use the Image/Text toggle above to view it.
            </p>
          </div>
        )}

        {/* Form Fields */}
        <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: isMobile ? '12px' : '14px', fontWeight: '500' }}>
            Note Title
          </label>
          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Enter a title for your note"
            style={{
              width: '100%',
              padding: isMobile ? '8px 12px' : '12px 16px',
              background: darkTheme.colors.bgSecondary,
              border: `1px solid ${darkTheme.colors.borderColor}`,
              borderRadius: '12px',
              outline: 'none',
              color: darkTheme.colors.textPrimary,
              boxSizing: 'border-box',
              fontSize: isMobile ? '13px' : '14px'
            }}
          />
        </div>

        {/* AI-Generated Summary Preview with Regenerate Button */}
        {uploadMode === 'scan' && extractedText && (
          <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: '500', margin: 0 }}>
                <i className="fas fa-magic" style={{ color: darkTheme.colors.accent, marginRight: '8px' }}></i>
                AI-Generated Summary (2 sentences)
              </label>
              <button
                onClick={async () => {
                  console.log('Generate Summary clicked', {
                    hasTitle: !!noteTitle,
                    hasText: !!extractedText,
                    textLength: extractedText?.length
                  });

                  if (!noteTitle || noteTitle.trim().length === 0) {
                    alert('Please add a title first');
                    return;
                  }

                  if (!extractedText || extractedText.trim().length === 0) {
                    alert('No extracted text available. Please wait for OCR to complete or upload an image.');
                    return;
                  }

                  try {
                    console.log('Starting summary generation...');
                    const summary = await generateQuickSummary(extractedText, noteTitle);
                    console.log('Summary generated:', summary);
                    setGeneratedSummary(summary);

                    const tags = await generateAutoTags(extractedText, noteTitle);
                    console.log('Tags generated:', tags);
                    setSuggestedTags(tags);
                  } catch (error: any) {
                    console.error('Summary generation failed:', error);
                    // Error already shown by generateQuickSummary
                  }
                }}
                disabled={!noteTitle}
                style={{
                  padding: '4px 12px',
                  background: darkTheme.colors.accent,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: noteTitle ? 'pointer' : 'not-allowed',
                  fontSize: isMobile ? '11px' : '12px',
                  fontWeight: '500',
                  opacity: noteTitle ? 1 : 0.5,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (noteTitle && extractedText) {
                    e.currentTarget.style.background = darkTheme.colors.accentHover;
                  }
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = darkTheme.colors.accent;
                }}
              >
                <i className="fas fa-sync" style={{ marginRight: '4px' }}></i>
                {generatedSummary ? 'Regenerate' : 'Generate'}
              </button>
            </div>
            {generatedSummary ? (
              <div
                style={{
                  width: '100%',
                  padding: isMobile ? '8px 12px' : '12px 16px',
                  background: `${darkTheme.colors.accent}10`,
                  border: `1px solid ${darkTheme.colors.accent}30`,
                  borderRadius: '12px',
                  color: darkTheme.colors.textPrimary,
                  boxSizing: 'border-box',
                  fontSize: isMobile ? '13px' : '14px',
                  lineHeight: '1.6'
                }}
              >
                {generatedSummary}
              </div>
            ) : (
              <div
                style={{
                  width: '100%',
                  padding: isMobile ? '8px 12px' : '12px 16px',
                  background: `${darkTheme.colors.borderColor}20`,
                  border: `1px dashed ${darkTheme.colors.borderColor}`,
                  borderRadius: '12px',
                  color: darkTheme.colors.textSecondary,
                  boxSizing: 'border-box',
                  fontSize: isMobile ? '12px' : '13px',
                  fontStyle: 'italic',
                  textAlign: 'center'
                }}
              >
                Click "Generate" to create an AI summary from your note
              </div>
            )}
          </div>
        )}

        {/* Manual Tags Input */}
        <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: isMobile ? '12px' : '14px', fontWeight: '500' }}>
            Topic Tags <span style={{ fontSize: isMobile ? '10px' : '12px', color: darkTheme.colors.textSecondary }}>(comma-separated, optional)</span>
          </label>
          <input
            type="text"
            value={manualTags}
            onChange={(e) => setManualTags(e.target.value)}
            placeholder="e.g. algebra, equations, mathematics"
            style={{
              width: '100%',
              padding: isMobile ? '8px 12px' : '12px 16px',
              background: darkTheme.colors.bgSecondary,
              border: `1px solid ${darkTheme.colors.borderColor}`,
              borderRadius: '12px',
              outline: 'none',
              color: darkTheme.colors.textPrimary,
              boxSizing: 'border-box',
              fontSize: isMobile ? '13px' : '14px'
            }}
          />
          {/* Preview of manual tags */}
          {manualTags && (
            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {manualTags.split(',').map((tag, idx) => {
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

        {/* AI-Suggested Tags - shown only if no manual tags */}
        {suggestedTags.length > 0 && !manualTags && (
          <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: isMobile ? '11px' : '14px', fontWeight: '500', color: darkTheme.colors.textSecondary }}>
              <i className="fas fa-lightbulb" style={{ color: darkTheme.colors.accent, marginRight: '8px' }}></i>
              AI Suggestions (leave tags empty to use these):
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {suggestedTags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    background: `${darkTheme.colors.accent}15`,
                    border: `1px dashed ${darkTheme.colors.accent}60`,
                    color: darkTheme.colors.accent,
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '11px',
                    fontWeight: '500',
                    opacity: 0.8
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%',
            padding: isMobile ? '10px 16px' : '12px 24px',
            background: canSubmit ? darkTheme.colors.accent : `${darkTheme.colors.accent}80`,
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: '500',
            transition: 'all 0.3s',
            opacity: canSubmit ? 1 : 0.5,
            marginTop: isMobile ? '8px' : '0'
          }}
        >
          {isProcessingOCR ? 'Processing OCR...' : isSubmitting ? 'Uploading...' : 'Upload Note'}
        </button>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handlePhotoCapture}
          onClose={() => setShowCamera(false)}
          title="Take Photo of Note"
          facingMode="environment"
        />
      )}

      {/* Fullscreen Image Modal */}
      {fullscreenImage !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            flexDirection: 'column',
            gap: '20px'
          }}
          onClick={() => setFullscreenImage(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setFullscreenImage(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              fontSize: '24px',
              zIndex: 2001
            }}
          >
            ×
          </button>

          {/* Navigation Arrows */}
          {uploadImages.length > 1 && fullscreenImage > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenImage(prev => prev !== null ? Math.max(0, prev - 1) : 0);
              }}
              style={{
                position: 'absolute',
                left: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                fontSize: '24px',
                zIndex: 2001
              }}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
          )}

          {uploadImages.length > 1 && fullscreenImage < uploadImages.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFullscreenImage(prev => prev !== null ? Math.min(uploadImages.length - 1, prev + 1) : uploadImages.length - 1);
              }}
              style={{
                position: 'absolute',
                right: '20px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '56px',
                height: '56px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                fontSize: '24px',
                zIndex: 2001
              }}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          )}

          {/* Image */}
          <img
            src={uploadImages[fullscreenImage]}
            alt={`Page ${fullscreenImage + 1} Fullscreen`}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: '12px'
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Page Indicator */}
          {uploadImages.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '24px',
                padding: '12px 24px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '500',
                zIndex: 2001
              }}
            >
              Page {fullscreenImage + 1} of {uploadImages.length}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
