import { useState, useRef } from 'react';
import api from '../../lib/api';
import { darkTheme, modalOverlayStyle, modalContentStyle, inputStyle, buttonPrimaryStyle, buttonSecondaryStyle } from '../../theme';

interface NoteUploadModalProps {
  subjects: any[];
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NoteUploadModal({
  subjects,
  onClose,
  onSuccess
}: NoteUploadModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id || '');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const cameraRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (cameraRef.current) {
        cameraRef.current.srcObject = stream;
        cameraRef.current.style.display = 'block';
      }
    } catch (error) {
      setError('Failed to access camera');
    }
  };

  const capturePhoto = () => {
    if (cameraRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(cameraRef.current, 0, 0);
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            setFile(blob as File);
            setPreview(canvasRef.current!.toDataURL());
            // Stop camera stream
            const stream = cameraRef.current!.srcObject as MediaStream;
            stream?.getTracks().forEach((track) => track.stop());
            if (cameraRef.current) cameraRef.current.style.display = 'none';
          }
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !selectedSubject) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // In a real app, you'd upload the file and process it
      // For now, we'll just create the note with the text
      await api.notes.create({
        title,
        content,
        subject_id: selectedSubject,
        image_url: preview || undefined
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={{
        ...modalContentStyle,
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto'
      } as React.CSSProperties}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: 0 }}>
            Upload Note
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: darkTheme.colors.textSecondary,
              cursor: 'pointer',
              fontSize: '24px',
              transition: darkTheme.transitions.default,
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#fff'}
            onMouseOut={(e) => e.currentTarget.style.color = darkTheme.colors.textSecondary}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '8px'
            }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle as React.CSSProperties}
              placeholder="Enter note title"
            />
          </div>

          {/* Subject */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '8px'
            }}>
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{
                ...inputStyle,
                width: '100%'
              } as React.CSSProperties}
            >
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '8px'
            }}>
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                ...inputStyle,
                width: '100%',
                minHeight: '100px',
                fontFamily: 'inherit',
                resize: 'vertical'
              } as React.CSSProperties}
              placeholder="Enter note content"
            />
          </div>

          {/* File Upload / Camera */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#fff',
              marginBottom: '8px'
            }}>
              Attachment (Optional)
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <label style={{
                flex: 1,
                padding: '12px 16px',
                background: darkTheme.colors.bgSecondary,
                border: `1px dashed ${darkTheme.colors.borderColor}`,
                borderRadius: darkTheme.borderRadius.md,
                cursor: 'pointer',
                textAlign: 'center',
                transition: darkTheme.transitions.default,
                color: darkTheme.colors.textSecondary,
                fontSize: '13px'
              }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = darkTheme.colors.accent;
                  e.currentTarget.style.background = darkTheme.colors.bgTertiary;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = darkTheme.colors.borderColor;
                  e.currentTarget.style.background = darkTheme.colors.bgSecondary;
                }}
              >
                <i className="fas fa-upload" style={{ marginRight: '6px' }}></i>
                Upload File
                <input
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  accept="image/*,application/pdf"
                />
              </label>
              <button
                onClick={handleCameraCapture}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  background: darkTheme.colors.bgSecondary,
                  border: `1px solid ${darkTheme.colors.borderColor}`,
                  borderRadius: darkTheme.borderRadius.md,
                  cursor: 'pointer',
                  color: darkTheme.colors.textSecondary,
                  fontSize: '13px',
                  transition: darkTheme.transitions.default
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = darkTheme.colors.accent;
                  e.currentTarget.style.background = darkTheme.colors.bgTertiary;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = darkTheme.colors.borderColor;
                  e.currentTarget.style.background = darkTheme.colors.bgSecondary;
                }}
              >
                <i className="fas fa-camera" style={{ marginRight: '6px' }}></i>
                Camera
              </button>
            </div>
          </div>

          {/* Camera Stream */}
          <video
            ref={cameraRef}
            style={{
              display: 'none',
              width: '100%',
              borderRadius: darkTheme.borderRadius.md,
              marginBottom: '12px'
            }}
            autoPlay
          />
          {cameraRef.current?.srcObject && (
            <button
              onClick={capturePhoto}
              style={{
                ...buttonPrimaryStyle,
                width: '100%'
              } as React.CSSProperties}
            >
              <i className="fas fa-camera" style={{ marginRight: '8px' }}></i>
              Capture Photo
            </button>
          )}

          {/* Preview */}
          {preview && (
            <div style={{
              padding: '12px',
              background: darkTheme.colors.bgSecondary,
              borderRadius: darkTheme.borderRadius.md,
              textAlign: 'center'
            }}>
              <img
                src={preview}
                style={{
                  maxWidth: '100%',
                  maxHeight: '200px',
                  borderRadius: darkTheme.borderRadius.md
                }}
                alt="Preview"
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#fca5a5',
              padding: '12px 16px',
              borderRadius: darkTheme.borderRadius.md,
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '8px'
          }}>
            <button
              onClick={onClose}
              style={{
                ...buttonSecondaryStyle,
                flex: 1
              } as React.CSSProperties}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                ...buttonPrimaryStyle,
                flex: 1,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              } as React.CSSProperties}
            >
              {loading ? 'Uploading...' : 'Upload Note'}
            </button>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} width={640} height={480} />
    </div>
  );
}
