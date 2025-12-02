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
      await startCameraStream(
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
    } catch {
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

  // Use ref to track camera stream for cleanup
  const cameraStreamRef = useRef(null);
  const videoElementRef = useRef(null);

  useEffect(() => {
    cameraStreamRef.current = cameraStream;
    videoElementRef.current = videoRef.current;
  }, [cameraStream]);

  // Auto start/stop based on active state
  useEffect(() => {
    if (isActive && !isCameraActive) {
      startCamera();
    } else if (!isActive && isCameraActive) {
      stopCamera();
    }

    // Cleanup on unmount - use refs to avoid stale closure
    return () => {
      if (cameraStreamRef.current) {
        stopCameraStream(cameraStreamRef.current, videoElementRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isCameraActive]);

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
