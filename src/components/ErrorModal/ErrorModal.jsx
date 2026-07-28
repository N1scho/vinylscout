import React from 'react';
import { designSystem } from '../../designsystem';

export default function ErrorModal({ show, title, message, onClose, themes }) {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: designSystem.spacing.md
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: themes.surface,
          border: `2px solid #dc2626`,
          borderRadius: designSystem.borderRadius.lg,
          padding: designSystem.spacing.lg,
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: designSystem.spacing.lg }}>
          <h3
            style={{
              margin: 0,
              fontSize: designSystem.typography.sizes.lg,
              fontWeight: designSystem.typography.weights.bold,
              color: '#dc2626'
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: designSystem.typography.sizes.xl,
              color: themes.text,
              cursor: 'pointer',
              padding: 0,
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            backgroundColor: themes.background,
            padding: designSystem.spacing.md,
            borderRadius: designSystem.borderRadius.md,
            marginBottom: designSystem.spacing.lg,
            fontFamily: 'monospace',
            fontSize: designSystem.typography.sizes.sm,
            color: themes.text,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: '1.6'
          }}
        >
          {message}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
            backgroundColor: themes.primary,
            color: '#ffffff',
            border: 'none',
            borderRadius: designSystem.borderRadius.md,
            fontSize: designSystem.typography.sizes.base,
            fontWeight: designSystem.typography.weights.medium,
            cursor: 'pointer',
            minHeight: designSystem.touchTarget.min
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
