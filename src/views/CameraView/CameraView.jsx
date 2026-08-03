import React from 'react';
import { designSystem, withOpacity } from '../../designsystem';

/**
 * CameraView Component
 *
 * Camera interface for scanning vinyl album covers using AI vision
 *
 * Features:
 * - Live camera feed with video element
 * - Capture button to take photo and analyze
 * - Error display for camera/analysis issues
 * - Integration with Anthropic Claude API for album identification
 *
 * @component
 */
export default function CameraView({
  // Refs
  videoRef,
  canvasRef,

  // State
  isAnalyzing,
  cameraError,
  capturedImageData,

  // Actions
  onCapture,
  onClearCapture,

  // Theme
  themes
}) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 56px - 80px)',
        backgroundColor: '#000',
        display: 'flex',
        flexDirection: 'column',
        marginTop: '56px',
        overflow: 'hidden'
      }}
    >
      {/* Video Feed or Captured Image */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: '100%',
          flex: 1,
          objectFit: 'cover',
          backgroundColor: '#000',
          display: capturedImageData ? 'none' : 'block'
        }}
      />

      {/* Display Captured Image */}
      {capturedImageData && (
        <img
          src={capturedImageData}
          alt="Captured vinyl cover"
          style={{
            width: '100%',
            flex: 1,
            objectFit: 'cover',
            backgroundColor: '#000'
          }}
        />
      )}

      {/* Hidden Canvas for Capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Capture/Retry Button */}
      <div
        style={{
          position: 'absolute',
          bottom: designSystem.spacing.xl,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: designSystem.spacing.md,
          padding: designSystem.spacing.md,
          zIndex: 101
        }}
      >
        {capturedImageData && !isAnalyzing && (
          <button
            onClick={onClearCapture}
            style={{
              padding: `${designSystem.spacing.sm} ${designSystem.spacing.md}`,
              borderRadius: designSystem.borderRadius.md,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              border: '2px solid #FFFFFF',
              cursor: 'pointer',
              fontSize: designSystem.typography.sizes.sm,
              fontWeight: designSystem.typography.weights.medium,
              transition: 'transform 0.1s ease'
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            aria-label="Retry photo"
          >
            Retry
          </button>
        )}

        <button
          onClick={onCapture}
          disabled={isAnalyzing || capturedImageData}
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: '4px solid #FFFFFF',
            cursor: isAnalyzing || capturedImageData ? 'not-allowed' : 'pointer',
            opacity: isAnalyzing || capturedImageData ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.1s ease',
            position: 'relative'
          }}
          onMouseDown={(e) => {
            if (!isAnalyzing && !capturedImageData) {
              e.currentTarget.style.transform = 'scale(0.95)';
            }
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label={isAnalyzing ? 'Analyzing album cover...' : 'Capture and analyze album cover'}
        >
          {/* Inner Circle - Changes color based on state */}
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: isAnalyzing ? '#FFA500' : '#EF4444',
              border: '3px solid #FFFFFF',
              transition: 'background-color 0.3s ease'
            }}
          />
        </button>
      </div>

      {/* Error Message Overlay */}
      {cameraError && (
        <div
          style={{
            position: 'absolute',
            top: designSystem.spacing.md,
            left: designSystem.spacing.md,
            right: designSystem.spacing.md,
            padding: designSystem.spacing.md,
            backgroundColor: withOpacity(themes.error, 0.9),
            color: '#FFFFFF',
            borderRadius: designSystem.borderRadius.md,
            fontSize: designSystem.typography.sizes.sm,
            fontWeight: designSystem.typography.weights.medium,
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 100
          }}
        >
          {cameraError}
        </div>
      )}

      {/* Analyzing Indicator */}
      {isAnalyzing && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: withOpacity('#000000', 0.8),
            color: '#FFFFFF',
            padding: `${designSystem.spacing.lg} ${designSystem.spacing.xl}`,
            borderRadius: designSystem.borderRadius.lg,
            fontSize: designSystem.typography.sizes.lg,
            fontWeight: designSystem.typography.weights.medium,
            textAlign: 'center',
            zIndex: 100,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div style={{ marginBottom: designSystem.spacing.sm }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                borderTopColor: '#FFFFFF',
                borderRadius: '50%',
                margin: '0 auto',
                animation: 'spin 1s linear infinite'
              }}
            />
          </div>
          Analyzing album cover...
        </div>
      )}
    </div>
  );
}
