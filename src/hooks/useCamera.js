/**
 * useCamera Hook
 *
 * Manages camera state and lifecycle
 * Extracted from App.jsx v2.9.0
 */

import { useState, useEffect, useRef } from 'react';
import { startCameraStream, stopCameraStream } from '../utils/cameraHelpers';

export const useCamera = (isActive) => {
  const [cameraStream, setCameraStream] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Start camera when activated
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await startCameraStream(
        (stream) => {
          setCameraStream(stream);
          setIsCameraActive(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        },
        (error) => {
          setCameraError(error);
          setIsCameraActive(false);
        }
      );
    } catch (err) {
      // Error already handled by callback
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (cameraStream) {
      stopCameraStream(cameraStream, videoRef.current);
      setCameraStream(null);
      setIsCameraActive(false);
    }
  };

  // Auto start/stop based on active state
  useEffect(() => {
    if (isActive && !isCameraActive) {
      startCamera();
    } else if (!isActive && isCameraActive) {
      stopCamera();
    }

    // Cleanup on unmount
    return () => {
      if (isCameraActive) stopCamera();
    };
  }, [isActive]);

  return {
    // State
    cameraStream,
    isCameraActive,
    cameraError,
    isAnalyzing,
    videoRef,
    canvasRef,

    // Setters
    setCameraError,
    setIsAnalyzing,

    // Operations
    startCamera,
    stopCamera
  };
};
