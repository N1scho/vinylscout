/**
 * ConfirmDialog Component
 *
 * Confirmation dialog for destructive actions
 * Extracted from App.jsx v2.10.0
 */

import React from 'react';
import { designSystem, withOpacity } from '../../designsystem';

const ConfirmDialog = ({
  confirmDelete,
  onConfirm,
  onCancel,
  themes
}) => {
  if (!confirmDelete) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: withOpacity('#000000', 0.8),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: designSystem.spacing.md,
        zIndex: 2000
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: themes.surface,
          padding: designSystem.spacing.xl,
          borderRadius: designSystem.borderRadius.lg,
          maxWidth: '400px',
          width: '100%'
        }}
      >
        <h3 style={{
          fontSize: designSystem.typography.sizes.xl,
          fontWeight: designSystem.typography.weights.bold,
          color: themes.text,
          margin: `0 0 ${designSystem.spacing.sm} 0`
        }}>
          Remove from Collection?
        </h3>
        <p style={{
          fontSize: designSystem.typography.sizes.base,
          color: themes.textSecondary,
          margin: `0 0 ${designSystem.spacing.lg} 0`
        }}>
          This vinyl will be permanently removed from your collection. This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: designSystem.spacing.sm }}>
          <button
            onClick={() => onConfirm(confirmDelete)}
            style={{
              flex: 1,
              padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
              minHeight: designSystem.touchTarget.min,
              backgroundColor: themes.error,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: designSystem.borderRadius.md,
              cursor: 'pointer',
              fontSize: designSystem.typography.sizes.base,
              fontWeight: designSystem.typography.weights.medium
            }}
          >
            Remove
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
              minHeight: designSystem.touchTarget.min,
              backgroundColor: 'transparent',
              color: themes.text,
              border: `1px solid ${themes.border}`,
              borderRadius: designSystem.borderRadius.md,
              cursor: 'pointer',
              fontSize: designSystem.typography.sizes.base,
              fontWeight: designSystem.typography.weights.medium
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
