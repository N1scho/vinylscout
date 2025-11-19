import React from 'react';
import { RefreshCw, Loader } from 'lucide-react';
import { designSystem } from '../../designsystem';

/**
 * LoadingSpinner Component
 *
 * Reusable loading indicator with optional message
 */
export default function LoadingSpinner({
  size = 'md',
  message = null,
  fullScreen = false,
  variant = 'spinner', // 'spinner' | 'refresh'
  themes
}) {
  const sizes = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48
  };

  const iconSize = sizes[size] || sizes.md;

  const Icon = variant === 'refresh' ? RefreshCw : Loader;

  const spinner = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: designSystem.spacing.md
      }}
    >
      <Icon
        size={iconSize}
        color={themes?.primary || '#2563eb'}
        style={{
          animation: 'spin 1s linear infinite'
        }}
      />
      {message && (
        <div
          style={{
            fontSize: designSystem.typography.sizes.sm,
            color: themes?.textSecondary || '#64748b',
            textAlign: 'center',
            maxWidth: '300px'
          }}
        >
          {message}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: themes?.background || 'rgba(255, 255, 255, 0.9)',
          zIndex: 9999
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
}
