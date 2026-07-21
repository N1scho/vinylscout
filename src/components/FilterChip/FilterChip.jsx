import React from 'react';
import { X } from 'lucide-react';
import { designSystem } from '../../designsystem';

/**
 * FilterChip Component
 *
 * Displays an active filter with a remove button
 */
export default function FilterChip({
  label,
  value,
  onRemove,
  variant = 'default', // 'default' | 'primary' | 'success'
  themes
}) {
  const variants = {
    default: {
      bg: themes?.surface || '#f1f5f9',
      color: themes?.text || '#0f172a',
      border: themes?.border || '#e2e8f0'
    },
    primary: {
      bg: themes?.primary || '#d4af37',
      color: '#0f0f0f',
      border: themes?.primary || '#d4af37'
    },
    success: {
      bg: themes?.success || '#22c55e',
      color: '#ffffff',
      border: themes?.success || '#22c55e'
    }
  };

  const style = variants[variant] || variants.default;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: designSystem.spacing.xs,
        padding: `${designSystem.spacing.xs} ${designSystem.spacing.md}`,
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        borderRadius: '16px',
        fontSize: designSystem.typography.sizes.sm,
        fontWeight: 500,
        maxWidth: '200px'
      }}
    >
      {/* Label */}
      <span
        style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {label}: {value}
      </span>

      {/* Remove Button */}
      {onRemove && (
        <button
          onClick={onRemove}
          style={{
            padding: 0,
            backgroundColor: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.7,
            transition: designSystem.transitions.fast
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.7';
          }}
          aria-label={`Remove ${label} filter`}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
