import { useState, useRef } from 'react';
import CameraCapture from './CameraCapture';
import api from '../lib/api';
import { darkTheme } from '../theme';
import LoadingSpinner from './LoadingSpinner';

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

const AUTHOR_CLASSES = ['10-A', '10-B', '10-C', '11-A', '11-B', '11-C', '12-A', '12-B', '12-C'];

export default function UploadNoteModal({ onClose, subjects, onSuccess, preselectedSubject }: UploadNoteModalProps) {
  const [uploadMode, setUploadMode] = useState<'scan' | 'photo'>('scan');
  const [uploadImage, setUploadImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteDescription, setNoteDescription] = useState('');
  const [noteSubject, setNoteSubject] = useState<number | null>(preselectedSubject || null);
  const [noteTags, setNoteTags] = useState('');
  const [noteClass, setNoteClass] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!noteTitle || !uploadImage || !noteSubject || !noteClass) {
      alert('Please fill in all required fields (Title, Image, Subject, and Class)');
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate 1-sentence summary
      const contentForSummary = extractedText || noteDescription;
      let quickSummary = '';
      let autoTags: string[] = [];

      if (contentForSummary) {
        // Generate summary and tags in parallel for speed
        const [summary, tags] = await Promise.all([
          generateQuickSummary(contentForSummary, noteTitle),
          generateAutoTags(contentForSummary, noteTitle)
        ]);
        quickSummary = summary;
        autoTags = tags;
      }

      const noteData = {
        title: noteTitle,
        description: noteDescription || quickSummary, // Use auto-summary if no description
        subject_id: noteSubject,
        extracted_text: extractedText || 'No extracted text',
        image_path: uploadImage, // Store base64 image
        quick_summary: quickSummary, // Store the 1-sentence summary separately
        tags: autoTags.length > 0 ? autoTags : noteTags.split(',').map(t => t.trim()).filter(t => t) // Use auto-tags or manual tags
      };

      const response = await api.request('/api/notes', {
        method: 'POST',
        body: noteData
      });

      if (response.note) {
        alert('Note uploaded successfully with auto-generated tags!');
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

  const canSubmit = noteTitle && uploadImage && noteSubject && noteClass && !isProcessingOCR && !isSubmitting;

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
          padding: '32px',
          boxShadow: darkTheme.shadows.lg,
          maxHeight: '90vh',
          overflowY: 'auto',
          color: darkTheme.colors.textPrimary
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            paddingBottom: '16px',
            borderBottom: `1px solid ${darkTheme.colors.borderColor}`
          }}
        >
          <h3 style={{ fontSize: '24px', fontFamily: 'Playfair Display, serif', margin: 0 }}>
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
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div
            onClick={() => {
              setUploadMode('scan');
              setExtractedText('');
            }}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '12px',
              border: `2px dashed ${uploadMode === 'scan' ? darkTheme.colors.accent : darkTheme.colors.borderColor}`,
              background: uploadMode === 'scan' ? `${darkTheme.colors.accent}15` : 'transparent',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.3s'
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>
              <i className="fas fa-text-height"></i>
            </div>
            <div style={{ color: darkTheme.colors.textSecondary }}>Scan with AI OCR</div>
          </div>
          <div
            onClick={() => setUploadMode('photo')}
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '12px',
              border: `2px dashed ${uploadMode === 'photo' ? darkTheme.colors.accent : darkTheme.colors.borderColor}`,
              background: uploadMode === 'photo' ? `${darkTheme.colors.accent}15` : 'transparent',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.3s'
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>
              <i className="fas fa-camera"></i>
            </div>
            <div style={{ color: darkTheme.colors.textSecondary }}>Photo Only</div>
          </div>
        </div>

        {/* Image Preview or Upload Buttons */}
        {uploadImage ? (
          <div
            style={{
              border: `2px dashed ${darkTheme.colors.accent}`,
              borderRadius: '12px',
              padding: '32px',
              marginBottom: '24px',
              textAlign: 'center',
              background: `${darkTheme.colors.accent}10`
            }}
          >
            <img
              src={uploadImage}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '200px',
                margin: '0 auto',
                borderRadius: '12px',
                marginBottom: '16px'
              }}
            />
            <p style={{ color: darkTheme.colors.accent, marginBottom: '12px' }}>
              <i className="fas fa-check-circle"></i> Image ready for upload
            </p>
            <button
              onClick={() => {
                setUploadImage(null);
                setExtractedText('');
              }}
              style={{
                padding: '8px 16px',
                background: darkTheme.colors.bgSecondary,
                color: darkTheme.colors.textPrimary,
                border: `1px solid ${darkTheme.colors.borderColor}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Change Image
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowCamera(true)}
                style={{
                  flex: 1,
                  padding: '20px',
                  background: `linear-gradient(135deg, ${darkTheme.colors.accent} 0%, ${darkTheme.colors.accentHover} 100%)`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.3s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fas fa-camera" style={{ fontSize: '32px' }}></i>
                <span>Take Photo</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  flex: 1,
                  padding: '20px',
                  background: `linear-gradient(135deg, ${darkTheme.colors.accent} 0%, ${darkTheme.colors.accentHover} 100%)`,
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.3s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fas fa-upload" style={{ fontSize: '32px' }}></i>
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

        {/* Processing OCR */}
        {isProcessingOCR && (
          <div
            style={{
              marginBottom: '16px',
              padding: '16px',
              background: `${darkTheme.colors.accent}10`,
              border: `1px solid ${darkTheme.colors.accent}30`,
              borderRadius: '12px',
              textAlign: 'center'
            }}
          >
            <i
              className="fas fa-spinner fa-spin"
              style={{ fontSize: '24px', color: darkTheme.colors.accent, marginBottom: '8px', display: 'block' }}
            ></i>
            <p style={{ color: darkTheme.colors.accent, fontWeight: '500', margin: 0 }}>
              Processing image with AI OCR...
            </p>
          </div>
        )}

        {/* Extracted Text */}
        {uploadMode === 'scan' && extractedText && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              <i className="fas fa-check-circle" style={{ color: darkTheme.colors.accent, marginRight: '8px' }}></i>
              Extracted Text (OCR Result)
            </label>
            <div
              style={{
                background: `${darkTheme.colors.accent}10`,
                border: `1px solid ${darkTheme.colors.accent}30`,
                borderRadius: '12px',
                padding: '16px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}
            >
              <pre
                style={{
                  whiteSpace: 'pre-wrap',
                  fontSize: '14px',
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
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Note Title
          </label>
          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Enter a title for your note"
            style={{
              width: '100%',
              padding: '12px 16px',
              background: darkTheme.colors.bgSecondary,
              border: `1px solid ${darkTheme.colors.borderColor}`,
              borderRadius: '12px',
              outline: 'none',
              color: darkTheme.colors.textPrimary,
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Description
          </label>
          <textarea
            value={noteDescription}
            onChange={(e) => setNoteDescription(e.target.value)}
            placeholder="Enter a description (optional)"
            rows={3}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: darkTheme.colors.bgSecondary,
              border: `1px solid ${darkTheme.colors.borderColor}`,
              borderRadius: '12px',
              outline: 'none',
              color: darkTheme.colors.textPrimary,
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Subject {preselectedSubject && '(Auto-selected)'}
          </label>
          <select
            value={noteSubject || ''}
            onChange={(e) => setNoteSubject(Number(e.target.value))}
            disabled={!!preselectedSubject}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: darkTheme.colors.bgSecondary,
              border: `1px solid ${darkTheme.colors.borderColor}`,
              borderRadius: '12px',
              outline: 'none',
              color: darkTheme.colors.textPrimary,
              boxSizing: 'border-box',
              opacity: preselectedSubject ? 0.6 : 1,
              cursor: preselectedSubject ? 'not-allowed' : 'pointer'
            }}
          >
            <option value="">Select a subject...</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Your Class <span style={{ color: darkTheme.colors.danger }}>*</span>
          </label>
          <select
            value={noteClass}
            onChange={(e) => setNoteClass(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: darkTheme.colors.bgSecondary,
              border: `1px solid ${darkTheme.colors.borderColor}`,
              borderRadius: '12px',
              outline: 'none',
              color: darkTheme.colors.textPrimary,
              boxSizing: 'border-box'
            }}
          >
            <option value="">Select your class...</option>
            {AUTHOR_CLASSES.map((cls) => (
              <option key={cls} value={cls}>
                Class {cls}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
            Topic Tags <span style={{ fontSize: '12px', color: darkTheme.colors.textSecondary }}>(comma-separated, e.g. "basics, exam-prep, summary")</span>
          </label>
          <input
            type="text"
            value={noteTags}
            onChange={(e) => setNoteTags(e.target.value)}
            placeholder="Enter tags separated by commas (optional)"
            style={{
              width: '100%',
              padding: '12px 16px',
              background: darkTheme.colors.bgSecondary,
              border: `1px solid ${darkTheme.colors.borderColor}`,
              borderRadius: '12px',
              outline: 'none',
              color: darkTheme.colors.textPrimary,
              boxSizing: 'border-box'
            }}
          />
          {noteTags && (
            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {noteTags.split(',').map((tag, idx) => {
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

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%',
            padding: '12px 24px',
            background: canSubmit ? darkTheme.colors.accent : `${darkTheme.colors.accent}80`,
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            fontSize: '16px',
            fontWeight: '500',
            transition: 'all 0.3s',
            opacity: canSubmit ? 1 : 0.5
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
