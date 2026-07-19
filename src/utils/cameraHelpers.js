/**
 * Camera Helpers Utility Module
 *
 * Provides camera operation utilities for vinyl cover scanning
 * Extracted from App.jsx v2.8.2
 */

/**
 * Start camera stream
 *
 * @param {Function} onSuccess - Callback with stream object
 * @param {Function} onError - Callback with error message
 * @returns {Promise<MediaStream>} Camera stream
 */
export const startCameraStream = async (onSuccess, onError) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    });

    if (onSuccess) onSuccess(stream);
    return stream;
  } catch (err) {
    console.error('Camera error:', err);
    const errorMessage = err.message || 'Failed to access camera';
    if (onError) onError(errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * Stop camera stream
 *
 * @param {MediaStream} stream - Camera stream to stop
 * @param {HTMLVideoElement} videoElement - Video element to clear (optional)
 */
export const stopCameraStream = (stream, videoElement = null) => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    if (videoElement) {
      videoElement.srcObject = null;
    }
  }
};

/**
 * Capture image from video and convert to base64
 *
 * @param {HTMLVideoElement} videoElement - Video element
 * @param {HTMLCanvasElement} canvasElement - Canvas element for capture
 * @param {number} quality - JPEG quality (0-1)
 * @returns {string} Base64 encoded image
 */
export const captureImageFromVideo = (videoElement, canvasElement, quality = 0.8) => {
  if (!videoElement || !canvasElement) {
    throw new Error('Video and canvas elements required');
  }

  const canvas = canvasElement;
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0);

  const imageData = canvas.toDataURL('image/jpeg', quality);
  const base64Image = imageData.split(',')[1];

  return base64Image;
};

/**
 * Analyze vinyl cover image via server-side API (key stays on server)
 *
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<{artist: string, album: string}>}
 */
export const analyzeVinylCover = async (base64Image) => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
  }

  const data = await response.json();

  if ((!data.artist || data.artist === 'Unknown') && (!data.album || data.album === 'Unknown')) {
    throw new Error('Album nicht erkannt. Bitte mit besserem Licht erneut versuchen.');
  }

  return { artist: data.artist, album: data.album };
};

export const captureAndAnalyzeVinyl = async (videoElement, canvasElement) => {
  const base64Image = captureImageFromVideo(videoElement, canvasElement, 0.8);
  return analyzeVinylCover(base64Image);
};
