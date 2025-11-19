import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { designSystem } from '../../designsystem';

/**
 * Modal Component
 *
 * Reusable modal dialog with backdrop, close button, and animations
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  footer,
  themes
}) {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'auto';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: '400px',
    md: '600px',
    lg: '800px',
    xl: '1000px',
    full: '95vw'
  };

  const maxWidth = sizes[size] || sizes.md;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: designSystem.spacing.md
      }}
    >
      {/* Backdrop */}
      <div
        onClick={() => closeOnBackdrop && onClose()}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 200ms ease'
        }}
      />

      {/* Modal Content */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          backgroundColor: themes?.surface || '#ffffff',
          borderRadius: designSystem.borderRadius.lg,
          boxShadow: designSystem.shadows.xl,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 200ms ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: designSystem.spacing.xl,
              borderBottom: `1px solid ${themes?.border || '#e2e8f0'}`
            }}
          >
            {title && (
              <h2
                style={{
                  fontSize: designSystem.typography.sizes.xl,
                  fontWeight: designSystem.typography.weights.semibold,
                  color: themes?.text || '#0f172a',
                  margin: 0
                }}
              >
                {title}
              </h2>
            )}

            {showCloseButton && (
              <button
                onClick={onClose}
                style={{
                  marginLeft: 'auto',
                  padding: designSystem.spacing.sm,
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: designSystem.borderRadius.sm,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: designSystem.transitions.fast,
                  color: themes?.textSecondary || '#64748b'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    themes?.hoverOverlay || 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: designSystem.spacing.xl,
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: designSystem.spacing.xl,
              borderTop: `1px solid ${themes?.border || '#e2e8f0'}`,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: designSystem.spacing.md
            }}
          >
            {footer}
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
