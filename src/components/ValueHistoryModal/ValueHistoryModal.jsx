/**
 * ValueHistoryModal Component
 *
 * Displays price history chart and data for a vinyl record
 * Extracted from App.jsx v2.10.0
 */

import React from 'react';
import { X } from 'lucide-react';
import { designSystem, withOpacity } from '../../designsystem';

const ValueHistoryModal = ({
  showValueModal,
  selectedResult,
  valueHistory,
  onClose,
  themes
}) => {
  if (!showValueModal || !selectedResult) return null;

  const maxPrice = Math.max(...valueHistory.map(h => h.price), 1);
  const minPrice = Math.min(...valueHistory.map(h => h.price), 0);
  const priceRange = maxPrice - minPrice;
  const paddedMax = maxPrice + (priceRange * 0.1);
  const paddedMin = Math.max(0, minPrice - (priceRange * 0.1));
  const paddedRange = paddedMax - paddedMin;

  // Calculate Y-axis labels (5 steps)
  const yAxisSteps = 5;
  const yAxisLabels = Array.from({ length: yAxisSteps }, (_, i) => {
    const value = paddedMin + (paddedRange * (i / (yAxisSteps - 1)));
    return value;
  }).reverse();

  // Format date for X-axis
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

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
        zIndex: 1001
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: themes.surface,
          borderRadius: designSystem.borderRadius.md,
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: designSystem.spacing.lg,
          position: 'relative'
        }}
      >
        <button
          data-modal-button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: designSystem.spacing.sm,
            right: designSystem.spacing.sm,
            padding: designSystem.spacing.sm,
            minWidth: designSystem.touchTarget.min,
            minHeight: designSystem.touchTarget.min,
            backgroundColor: withOpacity(themes.background, 0.9),
            border: 'none',
            borderRadius: designSystem.borderRadius.circle,
            color: themes.text,
            cursor: 'pointer'
          }}
        >
          <X size={designSystem.iconSize.md} />
        </button>

        <h2 style={{
          fontSize: designSystem.typography.sizes.lg,
          fontWeight: designSystem.typography.weights.bold,
          color: themes.text,
          margin: `0 0 ${designSystem.spacing.md} 0`
        }}>
          Price History
        </h2>

        {valueHistory.length === 0 ? (
          <p style={{
            fontSize: designSystem.typography.sizes.base,
            color: themes.textSecondary
          }}>
            No price history available
          </p>
        ) : (
          <>
            {/* Chart Container */}
            <div style={{
              display: 'flex',
              marginBottom: designSystem.spacing.xl
            }}>
              {/* Y-axis labels */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                paddingRight: designSystem.spacing.sm,
                height: '280px',
                paddingTop: '10px',
                paddingBottom: '30px'
              }}>
                {yAxisLabels.map((label, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: designSystem.typography.sizes.xs,
                      color: themes.textSecondary,
                      textAlign: 'right',
                      minWidth: '40px'
                    }}
                  >
                    {label.toFixed(0)}
                  </span>
                ))}
              </div>

              {/* Chart area */}
              <div style={{ flex: 1 }}>
                {/* Main chart */}
                <div style={{
                  height: '250px',
                  position: 'relative',
                  backgroundColor: withOpacity(themes.border, 0.1),
                  borderRadius: designSystem.borderRadius.sm,
                  padding: '10px 10px 20px 10px'
                }}>
                  {/* Horizontal grid lines */}
                  <svg
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      right: '10px',
                      bottom: '20px',
                      width: 'calc(100% - 20px)',
                      height: 'calc(100% - 30px)',
                      pointerEvents: 'none'
                    }}
                  >
                    {/* Grid lines */}
                    {yAxisLabels.map((_, i) => (
                      <line
                        key={i}
                        x1="0%"
                        y1={`${(i / (yAxisSteps - 1)) * 100}%`}
                        x2="100%"
                        y2={`${(i / (yAxisSteps - 1)) * 100}%`}
                        stroke={withOpacity(themes.border, 0.3)}
                        strokeWidth="1"
                      />
                    ))}

                    {/* Price line */}
                    <polyline
                      points={valueHistory
                        .map((point, index) => {
                          const x = (index / (valueHistory.length - 1 || 1)) * 100;
                          const normalizedPrice = (point.price - paddedMin) / paddedRange;
                          const y = 100 - (normalizedPrice * 100);
                          return `${x}%,${y}%`;
                        })
                        .join(' ')}
                      fill="none"
                      stroke={themes.primary}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Area fill under line */}
                    <polygon
                      points={[
                        '0%,100%',
                        ...valueHistory.map((point, index) => {
                          const x = (index / (valueHistory.length - 1 || 1)) * 100;
                          const normalizedPrice = (point.price - paddedMin) / paddedRange;
                          const y = 100 - (normalizedPrice * 100);
                          return `${x}%,${y}%`;
                        }),
                        '100%,100%'
                      ].join(' ')}
                      fill={withOpacity(themes.primary, 0.1)}
                    />
                  </svg>

                  {/* Data points with hover */}
                  {valueHistory.map((point, index) => {
                    const normalizedPrice = (point.price - paddedMin) / paddedRange;
                    return (
                      <div
                        key={index}
                        title={`${formatDate(point.date)}: ${point.currency} ${point.price.toFixed(2)}`}
                        style={{
                          position: 'absolute',
                          left: `calc(10px + ${(index / (valueHistory.length - 1 || 1)) * 100}% * (100% - 20px) / 100)`,
                          bottom: `calc(20px + ${normalizedPrice * 100}% * (100% - 30px) / 100)`,
                          width: '10px',
                          height: '10px',
                          backgroundColor: themes.primary,
                          border: `2px solid ${themes.surface}`,
                          borderRadius: '50%',
                          transform: 'translate(-50%, 50%)',
                          cursor: 'pointer',
                          zIndex: 10,
                          transition: 'all 150ms ease',
                          boxShadow: designSystem.shadows.sm
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translate(-50%, 50%) scale(1.3)';
                          e.target.style.boxShadow = designSystem.shadows.md;
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translate(-50%, 50%) scale(1)';
                          e.target.style.boxShadow = designSystem.shadows.sm;
                        }}
                      />
                    );
                  })}
                </div>

                {/* X-axis labels */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: designSystem.spacing.xs,
                  paddingLeft: '10px',
                  paddingRight: '10px'
                }}>
                  {valueHistory.length > 1 && (
                    <>
                      <span style={{
                        fontSize: designSystem.typography.sizes.xs,
                        color: themes.textSecondary
                      }}>
                        {formatDate(valueHistory[0].date)}
                      </span>
                      <span style={{
                        fontSize: designSystem.typography.sizes.xs,
                        color: themes.textSecondary
                      }}>
                        {formatDate(valueHistory[valueHistory.length - 1].date)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Price statistics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: designSystem.spacing.md,
              marginBottom: designSystem.spacing.lg,
              padding: designSystem.spacing.md,
              backgroundColor: withOpacity(themes.primary, 0.05),
              borderRadius: designSystem.borderRadius.md
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: designSystem.typography.sizes.xs,
                  color: themes.textSecondary,
                  marginBottom: designSystem.spacing.xs
                }}>Current</div>
                <div style={{
                  fontSize: designSystem.typography.sizes.lg,
                  fontWeight: designSystem.typography.weights.bold,
                  color: themes.primary
                }}>
                  {valueHistory[valueHistory.length - 1].currency} {valueHistory[valueHistory.length - 1].price.toFixed(2)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: designSystem.typography.sizes.xs,
                  color: themes.textSecondary,
                  marginBottom: designSystem.spacing.xs
                }}>Highest</div>
                <div style={{
                  fontSize: designSystem.typography.sizes.lg,
                  fontWeight: designSystem.typography.weights.bold,
                  color: themes.text
                }}>
                  {valueHistory[0].currency} {maxPrice.toFixed(2)}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: designSystem.typography.sizes.xs,
                  color: themes.textSecondary,
                  marginBottom: designSystem.spacing.xs
                }}>Lowest</div>
                <div style={{
                  fontSize: designSystem.typography.sizes.lg,
                  fontWeight: designSystem.typography.weights.bold,
                  color: themes.text
                }}>
                  {valueHistory[0].currency} {minPrice.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Price history list */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: designSystem.spacing.sm
            }}>
              <h3 style={{
                fontSize: designSystem.typography.sizes.base,
                fontWeight: designSystem.typography.weights.semibold,
                color: themes.text,
                margin: `0 0 ${designSystem.spacing.sm} 0`
              }}>
                Price Records
              </h3>
              {valueHistory.slice().reverse().map((point, index) => {
                const isLatest = index === 0;
                const priceChange = index < valueHistory.length - 1
                  ? point.price - valueHistory[valueHistory.length - 1 - index - 1].price
                  : 0;

                return (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: designSystem.spacing.sm,
                      backgroundColor: isLatest
                        ? withOpacity(themes.primary, 0.1)
                        : withOpacity(themes.primary, 0.05),
                      borderRadius: designSystem.borderRadius.sm,
                      borderLeft: isLatest ? `3px solid ${themes.primary}` : 'none'
                    }}
                  >
                    <span style={{
                      fontSize: designSystem.typography.sizes.sm,
                      color: themes.textSecondary
                    }}>
                      {new Date(point.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: designSystem.spacing.sm }}>
                      {index < valueHistory.length - 1 && priceChange !== 0 && (
                        <span style={{
                          fontSize: designSystem.typography.sizes.xs,
                          color: priceChange > 0 ? '#10b981' : '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}>
                          {priceChange > 0 ? '↑' : '↓'} {Math.abs(priceChange).toFixed(2)}
                        </span>
                      )}
                      <span style={{
                        fontSize: designSystem.typography.sizes.sm,
                        fontWeight: isLatest ? designSystem.typography.weights.bold : designSystem.typography.weights.medium,
                        color: isLatest ? themes.primary : themes.text
                      }}>
                        {point.currency} {point.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ValueHistoryModal;
