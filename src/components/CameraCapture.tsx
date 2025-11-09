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
      console.log('[CAMERA] Video element found');

      // Get camera stream
      const stream = await getCameraStream({ facingMode });
      console.log('[CAMERA] ✓ Stream acquired');

      // Enable all tracks
      stream.getTracks().forEach(track => {
        if (!track.enabled) track.enabled = true;
      });

      // IMPORTANT: Set srcObject BEFORE defining event handlers
      video.srcObject = stream;
      console.log('[CAMERA] ✓ srcObject assigned');

      // Wait for stream to start rendering
      let canPlayFired = false;
      video.oncanplay = () => {
        if (!canPlayFired) {
          canPlayFired = true;
          console.log('[CAMERA] ✓ canplay fired - stream rendering started');
          console.log('[CAMERA] Video dimensions:', video.videoWidth, 'x', video.videoHeight);
        }
      };

      video.onloadedmetadata = () => {
        console.log('[CAMERA] ✓ Metadata loaded:', video.videoWidth, 'x', video.videoHeight);
      };

      video.onplay = () => {
        console.log('[CAMERA] ✓ Video is playing');
      };

      video.onplaying = () => {
        console.log('[CAMERA] ✓ Video is actively playing');
      };

      // Try to play immediately
      console.log('[CAMERA] Attempting to start playback...');
      try {
        await video.play();
        console.log('[CAMERA] ✓ play() succeeded immediately');
      } catch (e) {
        console.log('[CAMERA] play() not ready yet, waiting for autoPlay...');
      }

      setCameraStream(stream);
      setLoading(false);
      console.log('[CAMERA] ✓ Camera initialized - waiting for canplay event');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access camera';
      console.error('[CAMERA] ✗ Error:', message);
      setError(message);
      setLoading(false);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !cameraStream) {
      setError('Camera not ready - please wait for stream to load');
      return;
    }

    try {
      const video = videoRef.current;

      // Check if video is actually playing before capture
      if (video.paused) {
        console.warn('[CAPTURE] ⚠️ Video is paused, waiting for it to play before capture...');
        setError('Waiting for camera stream to play...');
        return;
      }

      // Check if video has valid dimensions (stream is rendering)
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn('[CAPTURE] ⚠️ Video dimensions not ready:', video.videoWidth, 'x', video.videoHeight);
        setError('Camera stream not ready - no video dimensions');
        return;
      }

      console.log('[CAPTURE] ✓ Taking photo from:', video.videoWidth, 'x', video.videoHeight);

      const photoBase64 = capturePhotoFromVideo(video);
      console.log('[CAPTURE] ✓ Photo captured, size:', photoBase64.length, 'bytes');
      setPreview(photoBase64);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to capture photo';
      console.error('[CAPTURE] ✗ Error:', message);
      setError(message);
    }
  };

  const handleConfirm = async () => {
    if (preview) {
      await onCapture(preview);
      handleClose();
    }
  };

  const handleConfirmAndContinue = async () => {
    if (preview) {
      await onCapture(preview);
      setPreview(null); // Reset to camera view for another photo
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

  // Detect mobile for responsive sizing
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate appropriate image height based on screen size using A4 page aspect ratio (210mm x 297mm = ~0.707)
  const calculatePageDimensions = () => {
    const maxWidth = isMobile ? window.innerWidth * 0.9 : 600;
    const maxHeight = isMobile ? window.innerHeight * 0.6 : window.innerHeight * 0.7;

    // A4 aspect ratio: width/height = 210/297 = 0.707
    const pageRatio = 210 / 297;

    // Calculate dimensions while maintaining page aspect ratio
    let width = maxWidth;
    let height = width / pageRatio;

    // If height exceeds max, recalculate based on height
    if (height > maxHeight) {
      height = maxHeight;
      width = height * pageRatio;
    }

    return { width, height };
  };

  const { width: imageWidth, height: imageHeight } = calculatePageDimensions();

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
        zIndex: 10000,
        padding: isMobile ? '12px' : '16px'
      }}
    >
      <div
        style={{
          background: darkTheme.colors.bgSecondary,
          borderRadius: darkTheme.borderRadius.lg,
          padding: isMobile ? '16px' : '24px',
          maxWidth: `${imageWidth + (isMobile ? 32 : 48)}px`,
          width: '100%',
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '12px' : '16px',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h2 style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: '600', margin: 0, color: darkTheme.colors.textPrimary }}>
            {preview ? 'Confirm Photo' : title}
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

        {/* Video element - only show when NOT in preview mode */}
        {!preview && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                display: 'block',
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
                background: 'black',
                borderRadius: darkTheme.borderRadius.md,
                objectFit: 'contain',
                margin: '0 auto'
              }}
            />

            {/* Loading overlay */}
            {loading && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0, 0, 0, 0.7)',
                  borderRadius: darkTheme.borderRadius.md,
                  zIndex: 10
                }}
              >
                <LoadingSpinner message="Initializing camera..." size="lg" />
              </div>
            )}

            {/* Error overlay */}
            {error && !loading && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0, 0, 0, 0.9)',
                  borderRadius: darkTheme.borderRadius.md,
                  zIndex: 10,
                  flexDirection: 'column',
                  padding: '20px'
                }}
              >
                <div style={{ color: '#fca5a5', fontSize: '14px', textAlign: 'center', marginBottom: '16px' }}>
                  {error}
                </div>
                <button
                  onClick={startCamera}
                  style={{
                    padding: '8px 16px',
                    background: darkTheme.colors.accent,
                    border: 'none',
                    color: 'white',
                    borderRadius: darkTheme.borderRadius.md,
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Retry Camera
                </button>
              </div>
            )}
          </div>
        )}

        {/* Capture button - shown only when not in error/loading and not in preview */}
        {!loading && !error && !preview && (
          <button
            onClick={handleCapture}
            style={{
              padding: isMobile ? '10px 20px' : '12px 24px',
              background: darkTheme.colors.accent,
              border: 'none',
              color: 'white',
              borderRadius: darkTheme.borderRadius.md,
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: isMobile ? '14px' : '16px',
              transition: darkTheme.transitions.default,
              width: '100%',
              flexShrink: 0
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
          >
            📸 Capture Photo
          </button>
        )}

        {/* Preview mode - replaces video */}
        {preview && (
          <>
            <img
              src={preview}
              alt="Captured"
              style={{
                width: `${imageWidth}px`,
                height: `${imageHeight}px`,
                borderRadius: darkTheme.borderRadius.md,
                objectFit: 'contain',
                background: 'black',
                flexShrink: 0,
                margin: '0 auto'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexDirection: isMobile ? 'column' : 'row' }}>
              <button
                onClick={handleRetake}
                style={{
                  flex: isMobile ? undefined : 1,
                  padding: isMobile ? '10px 16px' : '12px 24px',
                  background: darkTheme.colors.bgTertiary,
                  border: `1px solid ${darkTheme.colors.borderColor}`,
                  color: darkTheme.colors.textPrimary,
                  borderRadius: darkTheme.borderRadius.md,
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: isMobile ? '13px' : '15px',
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
                onClick={handleConfirmAndContinue}
                style={{
                  flex: isMobile ? undefined : 1,
                  padding: isMobile ? '10px 16px' : '12px 24px',
                  background: 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#86efac',
                  borderRadius: darkTheme.borderRadius.md,
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: isMobile ? '13px' : '15px',
                  transition: darkTheme.transitions.default
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)';
                  e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
                }}
              >
                ➕ Add & Take Another
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  flex: isMobile ? undefined : 1,
                  padding: isMobile ? '10px 16px' : '12px 24px',
                  background: darkTheme.colors.accent,
                  border: 'none',
                  color: 'white',
                  borderRadius: darkTheme.borderRadius.md,
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: isMobile ? '13px' : '15px',
                  transition: darkTheme.transitions.default
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                ✓ Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
