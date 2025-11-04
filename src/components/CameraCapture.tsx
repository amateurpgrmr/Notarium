import { useState, useRef, useEffect } from 'react';
import { getCameraStream, capturePhotoFromVideo, stopMediaStream } from '../utils/camera';
import { darkTheme } from '../theme';
import LoadingSpinner from './LoadingSpinner';

interface CameraCaptureProps {
  onCapture: (photoBase64: string) => void;
  onClose: () => void;
  title?: string;
  facingMode?: 'user' | 'environment';
}

export default function CameraCapture({
  onCapture,
  onClose,
  title = 'Capture Photo',
  facingMode = 'environment'
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    // Ensure video element is mounted before starting camera
    const timer = setTimeout(() => {
      startCamera();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (cameraStream) {
        stopMediaStream(cameraStream);
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      console.log('[CAMERA] Starting camera initialization...');

      if (!videoRef.current) {
        throw new Error('Video element ref not available');
      }

      const video = videoRef.current;
      console.log('[CAMERA] Video element found, display:', window.getComputedStyle(video).display);

      // Get camera stream
      const stream = await getCameraStream({ facingMode });
      console.log('[CAMERA] ✓ Stream acquired - tracks:', {
        video: stream.getVideoTracks().length,
        audio: stream.getAudioTracks().length,
        active: stream.active
      });

      // Enable all tracks
      stream.getTracks().forEach(track => {
        if (!track.enabled) track.enabled = true;
      });

      // Assign stream to video element
      video.srcObject = stream;
      console.log('[CAMERA] ✓ srcObject assigned to video element');

      setCameraStream(stream);

      // Simple event handlers
      video.onloadedmetadata = () => {
        console.log('[CAMERA] ✓ Metadata loaded:', video.videoWidth, 'x', video.videoHeight);
      };

      video.onplay = () => {
        console.log('[CAMERA] ✓ Video is playing');
      };

      video.onerror = (e) => {
        console.error('[CAMERA] ✗ Video error:', e);
      };

      // Wait a bit for the video element to be ready, then force play
      await new Promise(resolve => setTimeout(resolve, 300));

      try {
        console.log('[CAMERA] Calling video.play()...');
        await video.play();
        console.log('[CAMERA] ✓ play() succeeded');
      } catch (playErr: any) {
        console.error('[CAMERA] play() error:', playErr.name, '-', playErr.message);
        // This might fail in some scenarios but the autoPlay attribute should handle it
      }

      setLoading(false);
      console.log('[CAMERA] ✓ Camera initialized successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access camera';
      console.error('[CAMERA] ✗ Error:', message);
      setError(message);
      setLoading(false);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !cameraStream) {
      setError('Camera not ready');
      return;
    }

    try {
      const video = videoRef.current;
      console.log('[CAPTURE] Taking photo from video dimensions:', video.videoWidth, 'x', video.videoHeight);

      const photoBase64 = capturePhotoFromVideo(video);
      console.log('[CAPTURE] ✓ Photo captured, size:', photoBase64.length, 'bytes');
      setPreview(photoBase64);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to capture photo';
      console.error('[CAPTURE] ✗ Error:', message);
      setError(message);
    }
  };

  const handleConfirm = () => {
    if (preview) {
      onCapture(preview);
      handleClose();
    }
  };

  const handleRetake = () => {
    setPreview(null);
  };

  const handleClose = () => {
    if (cameraStream) {
      stopMediaStream(cameraStream);
      setCameraStream(null);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}
    >
      <div
        style={{
          background: darkTheme.colors.bgSecondary,
          borderRadius: darkTheme.borderRadius.lg,
          padding: '24px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: darkTheme.colors.textPrimary }}>
            {title}
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: darkTheme.colors.textSecondary,
              cursor: 'pointer',
              fontSize: '24px',
              lineHeight: '1'
            }}
          >
            ✕
          </button>
        </div>

        {loading && (
          <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LoadingSpinner message="Initializing camera..." size="lg" />
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              background: darkTheme.colors.danger,
              color: 'white',
              padding: '12px 16px',
              borderRadius: darkTheme.borderRadius.md,
              fontSize: '14px'
            }}
          >
            {error}
            <button
              onClick={startCamera}
              style={{
                display: 'block',
                width: '100%',
                marginTop: '12px',
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                borderRadius: darkTheme.borderRadius.md,
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {!preview ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '400px',
                    background: 'black',
                    borderRadius: darkTheme.borderRadius.md,
                    objectFit: 'cover'
                  }}
                />
                <button
                  onClick={handleCapture}
                  style={{
                    padding: '12px 24px',
                    background: darkTheme.colors.accent,
                    border: 'none',
                    color: 'white',
                    borderRadius: darkTheme.borderRadius.md,
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '16px',
                    transition: darkTheme.transitions.default
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  📸 Capture Photo
                </button>
              </>
            ) : (
              <>
                <img
                  src={preview}
                  alt="Captured"
                  style={{
                    width: '100%',
                    height: '400px',
                    borderRadius: darkTheme.borderRadius.md,
                    objectFit: 'cover'
                  }}
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleRetake}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      background: darkTheme.colors.bgTertiary,
                      border: `1px solid ${darkTheme.colors.borderColor}`,
                      color: darkTheme.colors.textPrimary,
                      borderRadius: darkTheme.borderRadius.md,
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '16px',
                      transition: darkTheme.transitions.default
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = darkTheme.colors.bgSecondary;
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = darkTheme.colors.bgTertiary;
                      e.currentTarget.style.borderColor = darkTheme.colors.borderColor;
                    }}
                  >
                    🔄 Retake
                  </button>
                  <button
                    onClick={handleConfirm}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      background: darkTheme.colors.accent,
                      border: 'none',
                      color: 'white',
                      borderRadius: darkTheme.borderRadius.md,
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '16px',
                      transition: darkTheme.transitions.default
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                    onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    ✓ Use Photo
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
