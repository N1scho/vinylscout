import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { designSystem } from '../../designsystem';

/**
 * Toast Component
 *
 * Notification toast with auto-dismiss and different variants
 */
export default function Toast({
  message,
  type = 'info', // 'success' | 'error' | 'warning' | 'info'
  duration = 5000,
  onClose,
  position = 'top-right', // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'
  themes
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 200);
  };

  if (!isVisible) return null;

  const config = {
    success: {
      icon: CheckCircle,
      color: themes?.success || '#22c55e',
      bgColor: 'rgba(34, 197, 94, 0.1)'
    },
    error: {
      icon: XCircle,
      color: themes?.error || '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)'
    },
    warning: {
      icon: AlertCircle,
      color: themes?.warning || '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)'
    },
    info: {
      icon: Info,
      color: themes?.info || '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)'
    }
  };

  const { icon: Icon, color, bgColor } = config[type] || config.info;

  const positions = {
    'top-left': { top: designSystem.spacing.xl, left: designSystem.spacing.xl },
    'top-right': { top: designSystem.spacing.xl, right: designSystem.spacing.xl },
    'bottom-left': { bottom: designSystem.spacing.xl, left: designSystem.spacing.xl },
    'bottom-right': {
      bottom: `calc(${designSystem.spacing.nav} + ${designSystem.spacing.xl})`,
      right: designSystem.spacing.xl
    },
    'top-center': {
      top: designSystem.spacing.xl,
      left: '50%',
      transform: 'translateX(-50%)'
    },
    'bottom-center': {
      bottom: `calc(${designSystem.spacing.nav} + ${designSystem.spacing.xl})`,
      left: '50%',
      transform: 'translateX(-50%)'
    }
  };

  const positionStyle = positions[position] || positions['top-right'];

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyle,
        zIndex: 10000,
        animation: isExiting ? 'slideOut 200ms ease' : 'slideIn 200ms ease',
        minWidth: '300px',
        maxWidth: '500px'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: designSystem.spacing.md,
          padding: designSystem.spacing.lg,
          backgroundColor: themes?.surface || '#ffffff',
          borderRadius: designSystem.borderRadius.md,
          boxShadow: designSystem.shadows.xl,
          border: `1px solid ${themes?.border || '#e2e8f0'}`,
          borderLeft: `4px solid ${color}`
        }}
      >
        {/* Icon */}
        <div
          style={{
            flex: 'none',
            width: '32px',
            height: '32px',
            borderRadius: designSystem.borderRadius.circle,
            backgroundColor: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon size={20} color={color} />
        </div>

        {/* Message */}
        <div
          style={{
            flex: 1,
            fontSize: designSystem.typography.sizes.sm,
            color: themes?.text || '#0f172a',
            lineHeight: 1.5,
            paddingTop: '4px'
          }}
        >
          {message}
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            flex: 'none',
            padding: designSystem.spacing.xs,
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: designSystem.borderRadius.sm,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: themes?.textSecondary || '#64748b',
            transition: designSystem.transitions.fast
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              themes?.hoverOverlay || 'rgba(0, 0, 0, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>

      {/* Progress Bar (optional) */}
      {duration > 0 && (
        <div
          style={{
            marginTop: '-1px',
            height: '3px',
            backgroundColor: themes?.borderLight || 'rgba(0, 0, 0, 0.05)',
            borderRadius: '0 0 12px 12px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              height: '100%',
              backgroundColor: color,
              animation: `progress ${duration}ms linear`
            }}
          />
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) translateX(${
              position.includes('center') ? '-50%' : '0'
            });
          }
          to {
            opacity: 1;
            transform: translateY(0) translateX(${
              position.includes('center') ? '-50%' : '0'
            });
          }
        }
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateY(0) translateX(${
              position.includes('center') ? '-50%' : '0'
            });
          }
          to {
            opacity: 0;
            transform: translateY(-20px) translateX(${
              position.includes('center') ? '-50%' : '0'
            });
          }
        }
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
