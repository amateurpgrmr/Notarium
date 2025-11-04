/**
 * Camera utilities for capturing images from device camera
 */

export interface CameraStreamOptions {
  facingMode?: 'user' | 'environment';
}

export interface CapturePhotoOptions {
  quality?: number;
  format?: 'image/jpeg' | 'image/png';
}

/**
 * Request access to the device camera
 */
export async function getCameraStream(options: CameraStreamOptions = {}): Promise<MediaStream> {
  const { facingMode = 'environment' } = options;

  try {
    // Try multiple constraint variations to maximize compatibility
    const constraints = [
      // Most restrictive: exact facingMode with ideal resolution
      {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      },
      // Less restrictive: facingMode only
      {
        video: { facingMode },
        audio: false
      },
      // Fallback: any camera with minimum quality
      {
        video: {
          width: { min: 320 },
          height: { min: 240 }
        },
        audio: false
      },
      // Last resort: any video device
      {
        video: true,
        audio: false
      }
    ];

    let lastError: Error | null = null;
    for (const constraint of constraints) {
      try {
        console.log('Attempting camera with constraint:', constraint);
        const stream = await navigator.mediaDevices.getUserMedia(constraint);
        console.log('Camera stream acquired successfully');
        return stream;
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        console.log('Constraint failed, trying next...', lastError.message);
      }
    }

    throw lastError || new Error('Failed to access camera with all constraint variations');
  } catch (error) {
    throw new Error(`Failed to access camera: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Capture a photo from a video element and return as base64
 */
export function capturePhotoFromVideo(
  videoElement: HTMLVideoElement,
  options: CapturePhotoOptions = {}
): string {
  const { quality = 0.8, format = 'image/jpeg' } = options;

  // Ensure video has actual dimensions
  if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
    throw new Error('Video stream not ready - no video dimensions');
  }

  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(videoElement, 0, 0);
  return canvas.toDataURL(format, quality);
}

/**
 * Stop all tracks in a media stream
 */
export function stopMediaStream(stream: MediaStream): void {
  stream.getTracks().forEach(track => track.stop());
}

/**
 * Convert base64 string to Blob
 */
export function base64ToBlob(base64: string, mimeType: string = 'image/jpeg'): Blob {
  const byteCharacters = atob(base64.split(',')[1] || base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Convert Blob to base64 string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
