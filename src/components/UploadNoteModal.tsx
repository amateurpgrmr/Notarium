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
  const [uploadImage, setUploadImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [manualTags, setManualTags] = useState('');
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);
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
        setUploadImage(reader.result);
        // Auto-process OCR if in scan mode
        if (uploadMode === 'scan') {
          processOCR(reader.result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoCapture = async (photoBase64: string) => {
    setShowCamera(false);
    setUploadImage(photoBase64);

    // Auto-process OCR if in scan mode
    if (uploadMode === 'scan') {
      await processOCR(photoBase64);
    }
  };

  const processOCR = async (base64Image: string) => {
    setIsProcessingOCR(true);
    try {
      const result = await api.ai.performOCR(base64Image, 'image/jpeg');
      if (result.success) {
        setExtractedText(result.text);

        // Auto-generate summary and tags in parallel after OCR completes
        if (result.text && noteTitle) {
          const [summary, tags] = await Promise.all([
            generateQuickSummary(result.text, noteTitle),
            generateAutoTags(result.text, noteTitle)
          ]);
          setGeneratedSummary(summary);
          setSuggestedTags(tags);
        }
      } else {
        alert('Failed to process image');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to process image'}`);
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const generateQuickSummary = async (content: string, title: string): Promise<string> => {
    try {
      const response = await api.request('/api/gemini/quick-summary', {
        method: 'POST',
        body: {
          title: title,
          content: content
        }
      });
      return response.summary || '';
    } catch (error) {
      console.error('Summary generation error:', error);
      return '';
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
    if (!noteTitle || !uploadImage) {
      alert('Please fill in all required fields (Title and Image)');
      return;
    }

    if (!user?.class) {
      alert('User class not found. Please update your profile.');
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
        image_path: uploadImage,
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
        try {
          const [summary, tags] = await Promise.all([
            generateQuickSummary(extractedText, noteTitle),
            generateAutoTags(extractedText, noteTitle)
          ]);
          setGeneratedSummary(summary);
          setSuggestedTags(tags);
        } catch (error) {
          console.error('Error generating AI suggestions:', error);
        }
      }
    };

    generateAISuggestions();
  }, [noteTitle, extractedText]);

  const canSubmit = noteTitle && uploadImage && user?.class && !isProcessingOCR && !isSubmitting;

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
              if (!isProcessingOCR) {
                setUploadMode('scan');
                setExtractedText('');
              }
            }}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '12px',
              border: `2px dashed ${uploadMode === 'scan' ? darkTheme.colors.accent : darkTheme.colors.borderColor}`,
              background: uploadMode === 'scan' ? `${darkTheme.colors.accent}15` : 'transparent',
              cursor: isProcessingOCR ? 'not-allowed' : 'pointer',
              textAlign: 'center',
              transition: 'all 0.3s',
              opacity: isProcessingOCR && uploadMode !== 'scan' ? 0.5 : 1
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>
              <i className="fas fa-text-height"></i>
            </div>
            <div style={{ color: darkTheme.colors.textSecondary }}>Scan with AI OCR</div>
          </div>
          <div
            onClick={() => {
              if (!isProcessingOCR) {
                setUploadMode('photo');
              }
            }}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '12px',
              border: `2px dashed ${uploadMode === 'photo' ? darkTheme.colors.accent : darkTheme.colors.borderColor}`,
              background: uploadMode === 'photo' ? `${darkTheme.colors.accent}15` : 'transparent',
              cursor: isProcessingOCR ? 'not-allowed' : 'pointer',
              textAlign: 'center',
              transition: 'all 0.3s',
              opacity: isProcessingOCR ? 0.5 : 1
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>
              <i className="fas fa-camera"></i>
            </div>
            <div style={{ color: darkTheme.colors.textSecondary }}>Photo Only</div>
          </div>
        </div>

        {/* Upload Buttons - Only show if no image selected */}
        {!uploadImage && (
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
        )}

        {/* Image Thumbnail - Tiny indicator when image is selected */}
        {uploadImage && (
          <div
            style={{
              display: 'flex',
              gap: isMobile ? '8px' : '12px',
              marginBottom: isMobile ? '8px' : '12px',
              padding: isMobile ? '4px 6px' : '6px 8px',
              background: `${darkTheme.colors.accent}10`,
              border: `1px solid ${darkTheme.colors.accent}30`,
              borderRadius: '6px',
              alignItems: 'center',
              height: isMobile ? '40px' : '50px'
            }}
          >
            <img
              src={uploadImage}
              alt="Selected"
              style={{
                width: isMobile ? '36px' : '45px',
                height: isMobile ? '36px' : '45px',
                borderRadius: '4px',
                objectFit: 'cover',
                flexShrink: 0
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '2px 0', color: darkTheme.colors.accent, fontWeight: '500', fontSize: isMobile ? '11px' : '12px' }}>
                <i className="fas fa-check-circle"></i> Photo ready
              </p>
              {isProcessingOCR && (
                <p style={{ margin: '2px 0 0 0', color: darkTheme.colors.textSecondary, fontSize: isMobile ? '10px' : '11px' }}>
                  <i className="fas fa-spinner fa-spin"></i> Scanning...
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setUploadImage(null);
                setExtractedText('');
              }}
              style={{
                padding: isMobile ? '4px 8px' : '4px 10px',
                background: 'transparent',
                color: darkTheme.colors.textSecondary,
                border: `1px solid ${darkTheme.colors.borderColor}`,
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: isMobile ? '10px' : '11px',
                flexShrink: 0,
                whiteSpace: 'nowrap'
              }}
            >
              Change
            </button>
          </div>
        )}

        {/* Scanning Indicator - Show while OCR is processing */}
        {uploadMode === 'scan' && uploadImage && isProcessingOCR && !extractedText && (
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
              Scanning with AI OCR...
            </p>
          </div>
        )}

        {/* Extracted Text */}
        {uploadMode === 'scan' && extractedText && (
          <div style={{ marginBottom: '16px', flex: isMobile ? 1 : 'auto', display: 'flex', flexDirection: 'column' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: isMobile ? '12px' : '14px', fontWeight: '500' }}>
              <i className="fas fa-check-circle" style={{ color: darkTheme.colors.accent, marginRight: '8px' }}></i>
              Extracted Text (OCR Result)
            </label>
            <div
              style={{
                background: `${darkTheme.colors.accent}10`,
                border: `1px solid ${darkTheme.colors.accent}30`,
                borderRadius: '12px',
                padding: isMobile ? '12px' : '16px',
                maxHeight: isMobile ? '400px' : '250px',
                overflowY: 'auto',
                flex: isMobile ? 1 : 'auto'
              }}
            >
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  fontSize: isMobile ? '12px' : '14px',
                  fontFamily: 'monospace',
                  margin: 0,
                  color: darkTheme.colors.textSecondary
                }}
              >
                {extractedText}
              </pre>
            </div>
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

        {/* AI-Generated Summary Preview */}
        {generatedSummary && (
          <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: isMobile ? '12px' : '14px', fontWeight: '500' }}>
              <i className="fas fa-magic" style={{ color: darkTheme.colors.accent, marginRight: '8px' }}></i>
              AI-Generated Summary
            </label>
            <div
              style={{
                width: '100%',
                padding: isMobile ? '8px 12px' : '12px 16px',
                background: `${darkTheme.colors.accent}10`,
                border: `1px solid ${darkTheme.colors.accent}30`,
                borderRadius: '12px',
                color: darkTheme.colors.textSecondary,
                boxSizing: 'border-box',
                fontSize: isMobile ? '13px' : '14px',
                fontStyle: 'italic'
              }}
            >
              {generatedSummary}
            </div>
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
    </div>
  );
}
