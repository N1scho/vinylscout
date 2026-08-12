import React, { useState } from 'react';
import { useErrorStore } from '../../stores/errorStore';
import { designSystem } from '../../designsystem';

export default function ErrorConsole({ themes }) {
  const { errors, clearErrors, removeError } = useErrorStore();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isExpanded && errors.length === 0) {
    return null;
  }

  return (
    <div style={{ borderTop: `1px solid ${themes.border}`, paddingTop: designSystem.spacing.lg }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: designSystem.spacing.md,
          backgroundColor: errors.length > 0 ? '#dc2626' : themes.surface,
          color: errors.length > 0 ? '#ffffff' : themes.text,
          border: `1px solid ${errors.length > 0 ? '#991b1b' : themes.border}`,
          borderRadius: designSystem.borderRadius.md,
          cursor: 'pointer',
          fontSize: designSystem.typography.sizes.base,
          fontWeight: designSystem.typography.weights.medium,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'all 200ms ease'
        }}
      >
        <span>
          Error Console {errors.length > 0 && `(${errors.length})`}
        </span>
        <span style={{ fontSize: '12px' }}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {isExpanded && (
        <div
          style={{
            marginTop: designSystem.spacing.md,
            display: 'flex',
            flexDirection: 'column',
            gap: designSystem.spacing.sm
          }}
        >
          {errors.length === 0 ? (
            <div
              style={{
                padding: designSystem.spacing.md,
                backgroundColor: themes.surface,
                border: `1px solid ${themes.border}`,
                borderRadius: designSystem.borderRadius.sm,
                color: themes.textSecondary,
                fontSize: designSystem.typography.sizes.sm,
                textAlign: 'center'
              }}
            >
              No errors logged
            </div>
          ) : (
            <>
              <button
                onClick={clearErrors}
                style={{
                  padding: designSystem.spacing.sm,
                  backgroundColor: 'transparent',
                  color: themes.primary,
                  border: `1px solid ${themes.primary}`,
                  borderRadius: designSystem.borderRadius.sm,
                  cursor: 'pointer',
                  fontSize: designSystem.typography.sizes.sm,
                  fontWeight: designSystem.typography.weights.medium
                }}
              >
                Clear All
              </button>
              <div
                style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: designSystem.spacing.sm
                }}
              >
                {errors.map((error) => (
                  <div
                    key={error.id}
                    style={{
                      padding: designSystem.spacing.md,
                      backgroundColor: themes.surface,
                      border: `1px solid #dc2626`,
                      borderRadius: designSystem.borderRadius.sm,
                      fontSize: designSystem.typography.sizes.xs,
                      fontFamily: 'monospace',
                      color: themes.text
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: designSystem.spacing.xs,
                        gap: designSystem.spacing.sm
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', color: '#dc2626' }}>
                          {error.message}
                        </div>
                        <div style={{ color: themes.textSecondary, marginTop: '4px' }}>
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <button
                        onClick={() => removeError(error.id)}
                        style={{
                          padding: '2px 8px',
                          backgroundColor: 'transparent',
                          color: themes.textSecondary,
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          flexShrink: 0
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {error.endpoint && (
                      <div style={{ marginTop: '4px', wordBreak: 'break-all' }}>
                        <span style={{ color: themes.textSecondary }}>Endpoint: </span>
                        {error.endpoint}
                      </div>
                    )}

                    {error.status && (
                      <div style={{ marginTop: '4px' }}>
                        <span style={{ color: themes.textSecondary }}>Status: </span>
                        {error.status}
                      </div>
                    )}

                    {error.details && (
                      <div
                        style={{
                          marginTop: '4px',
                          padding: '4px',
                          backgroundColor: themes.background,
                          borderRadius: '2px',
                          maxHeight: '100px',
                          overflowY: 'auto',
                          wordBreak: 'break-all'
                        }}
                      >
                        <span style={{ color: themes.textSecondary }}>Details: </span>
                        {typeof error.details === 'string'
                          ? error.details
                          : JSON.stringify(error.details, null, 2)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
