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
    startCamera();
    return () => {
      if (cameraStream) {
        stopMediaStream(cameraStream);
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      console.log('Starting camera...');

      const stream = await getCameraStream({ facingMode });
      console.log('Stream acquired:', {
        active: stream.active,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });

      setCameraStream(stream);

      if (videoRef.current) {
        console.log('Setting video element srcObject...');

        // Ensure video element is ready
        const video = videoRef.current;

        // Set the stream
        video.srcObject = stream;

        // Ensure all tracks are enabled
        stream.getTracks().forEach(track => {
          console.log('Track:', track.kind, track.enabled);
          if (!track.enabled) track.enabled = true;
        });

        // Handle stream playback
        const playVideo = async () => {
          try {
            console.log('Attempting to play video...');
            console.log('Video readyState:', video.readyState);
            console.log('Video networkState:', video.networkState);
            console.log('srcObject:', video.srcObject);
            console.log('srcObject active:', (video.srcObject as MediaStream)?.active);

            const playPromise = video.play();
            if (playPromise) {
              await playPromise;
              console.log('✓ Video playing successfully');
            }
          } catch (err: any) {
            console.error('Video play error:', err.name, err.message);
          }
        };

        // Set up multiple ways to trigger playback
        video.onloadedmetadata = () => {
          console.log('✓ Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
          playVideo();
        };

        video.oncanplay = () => {
          console.log('✓ Video can play');
        };

        video.onplay = () => {
          console.log('✓ Video started playing');
        };

        // Try to play immediately
        await new Promise(resolve => setTimeout(resolve, 100));
        await playVideo();

        // Also try again after stream is ready
        await new Promise(resolve => setTimeout(resolve, 400));
        if (video.paused) {
          console.log('Video still paused, trying again...');
          await playVideo();
        }
      }
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access camera';
      console.error('Camera error:', message);
      setError(message);
      setLoading(false);
    }
  };

  const handleCapture = () => {
    if (videoRef.current && cameraStream) {
      try {
        const video = videoRef.current;
        console.log('Capturing photo...');
        console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
        console.log('Video paused:', video.paused);
        console.log('Video currentTime:', video.currentTime);

        const photoBase64 = capturePhotoFromVideo(videoRef.current);
        console.log('✓ Photo captured, size:', photoBase64.length);
        setPreview(photoBase64);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to capture photo';
        console.error('Capture error:', message);
        setError(message);
      }
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
