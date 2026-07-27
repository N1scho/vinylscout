/**
 * PriceHistoryModal Component
 *
 * Displays price history with statistics, chart, and detailed price records
 * for tracking vinyl album price trends over time
 */

import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { designSystem, withOpacity } from '../../designsystem';
import { getPriceHistory, clearPriceHistory } from '../../services/priceHistoryService';
import Modal from '../Modal/Modal';

/**
 * Format date string to readable format
 * @param {string} dateString - ISO8601 timestamp
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format date for chart display
 * @param {string} dateString - ISO8601 timestamp
 * @returns {string} Short formatted date
 */
const formatChartDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Calculate price statistics
 * @param {Array} history - Array of price records
 * @returns {Object} Object with min, max, avg prices
 */
const calculateStats = (history) => {
  if (history.length === 0) {
    return { min: 0, max: 0, avg: 0 };
  }

  const prices = history.map(h => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;

  return { min, max, avg };
};

/**
 * PriceHistoryModal Component
 *
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Callback when modal closes
 * @param {string} albumId - ID of the album
 * @param {string} albumTitle - Title of the album
 * @param {Object} themes - Theme colors
 */
export default function PriceHistoryModal({
  isOpen,
  onClose,
  albumId,
  albumTitle,
  themes
}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Load price history when modal opens
  useEffect(() => {
    if (isOpen && albumId) {
      setLoading(true);
      try {
        const data = getPriceHistory(albumId);
        setHistory(data);
      } catch (error) {
        console.error('Failed to load price history:', error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    }
  }, [isOpen, albumId]);

  /**
   * Handle clearing history with confirmation
   */
  const handleConfirmClear = () => {
    try {
      clearPriceHistory(albumId);
      setHistory([]);
      setShowConfirmClear(false);
    } catch (error) {
      console.error('Failed to clear price history:', error);
    }
  };

  if (!isOpen) return null;

  const stats = calculateStats(history);
  const currency = history.length > 0 ? history[0].currency : 'USD';

  // Calculate padding for chart
  const maxPrice = Math.max(...history.map(h => h.price), 1);
  const minPrice = Math.min(...history.map(h => h.price), 0);
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

  const footerContent = (
    <div style={{ display: 'flex', gap: designSystem.spacing.md }}>
      <button
        onClick={() => setShowConfirmClear(true)}
        style={{
          padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
          minHeight: designSystem.touchTarget.min,
          backgroundColor: themes?.error || '#ef4444',
          color: '#ffffff',
          border: 'none',
          borderRadius: designSystem.borderRadius.md,
          cursor: 'pointer',
          fontSize: designSystem.typography.sizes.base,
          fontWeight: designSystem.typography.weights.medium,
          display: 'flex',
          alignItems: 'center',
          gap: designSystem.spacing.sm,
          transition: designSystem.transitions.fast
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        aria-label="Clear price history"
      >
        <Trash2 size={18} />
        Clear History
      </button>
      <button
        onClick={onClose}
        style={{
          padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
          minHeight: designSystem.touchTarget.min,
          backgroundColor: themes?.primary || '#2563eb',
          color: '#ffffff',
          border: 'none',
          borderRadius: designSystem.borderRadius.md,
          cursor: 'pointer',
          fontSize: designSystem.typography.sizes.base,
          fontWeight: designSystem.typography.weights.medium,
          flex: 1,
          transition: designSystem.transitions.fast
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        Done
      </button>
    </div>
  );

  const modalContent = (
    <div>
      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '200px',
            color: themes?.textSecondary || '#64748b'
          }}
        >
          Loading price history...
        </div>
      ) : history.length === 0 ? (
        <div
          style={{
            padding: designSystem.spacing.xl,
            textAlign: 'center',
            color: themes?.textSecondary || '#64748b'
          }}
        >
          <p style={{
            fontSize: designSystem.typography.sizes.base,
            margin: 0
          }}>
            No price history available yet. Prices will be tracked over time.
          </p>
        </div>
      ) : (
        <>
          {/* Stats Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: designSystem.spacing.md,
              marginBottom: designSystem.spacing.xl,
              padding: designSystem.spacing.md,
              backgroundColor: withOpacity(themes?.primary || '#2563eb', 0.05),
              borderRadius: designSystem.borderRadius.md
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: designSystem.typography.sizes.xs,
                  color: themes?.textSecondary || '#64748b',
                  marginBottom: designSystem.spacing.xs
                }}
              >
                Min Price
              </div>
              <div
                style={{
                  fontSize: designSystem.typography.sizes.lg,
                  fontWeight: designSystem.typography.weights.bold,
                  color: themes?.text || '#0f172a'
                }}
              >
                {currency} {stats.min.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: designSystem.typography.sizes.xs,
                  color: themes?.textSecondary || '#64748b',
                  marginBottom: designSystem.spacing.xs
                }}
              >
                Avg Price
              </div>
              <div
                style={{
                  fontSize: designSystem.typography.sizes.lg,
                  fontWeight: designSystem.typography.weights.bold,
                  color: themes?.primary || '#2563eb'
                }}
              >
                {currency} {stats.avg.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: designSystem.typography.sizes.xs,
                  color: themes?.textSecondary || '#64748b',
                  marginBottom: designSystem.spacing.xs
                }}
              >
                Max Price
              </div>
              <div
                style={{
                  fontSize: designSystem.typography.sizes.lg,
                  fontWeight: designSystem.typography.weights.bold,
                  color: themes?.text || '#0f172a'
                }}
              >
                {currency} {stats.max.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Price Chart */}
          <div
            style={{
              display: 'flex',
              marginBottom: designSystem.spacing.xl,
              gap: designSystem.spacing.md
            }}
          >
            {/* Y-axis labels */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                paddingRight: designSystem.spacing.sm,
                height: '280px',
                paddingTop: '10px',
                paddingBottom: '30px'
              }}
            >
              {yAxisLabels.map((label, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: designSystem.typography.sizes.xs,
                    color: themes?.textSecondary || '#64748b',
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
              <div
                style={{
                  height: '250px',
                  position: 'relative',
                  backgroundColor: withOpacity(themes?.border || '#e2e8f0', 0.1),
                  borderRadius: designSystem.borderRadius.sm,
                  padding: '10px 10px 20px 10px'
                }}
              >
                {/* SVG Chart */}
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
                      key={`grid-${i}`}
                      x1="0%"
                      y1={`${(i / (yAxisSteps - 1)) * 100}%`}
                      x2="100%"
                      y2={`${(i / (yAxisSteps - 1)) * 100}%`}
                      stroke={withOpacity(themes?.border || '#e2e8f0', 0.3)}
                      strokeWidth="1"
                    />
                  ))}

                  {/* Price line */}
                  <polyline
                    points={history
                      .map((point, index) => {
                        const x = (index / (history.length - 1 || 1)) * 100;
                        const normalizedPrice = (point.price - paddedMin) / paddedRange;
                        const y = 100 - (normalizedPrice * 100);
                        return `${x}%,${y}%`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke={themes?.primary || '#2563eb'}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Area fill under line */}
                  <polygon
                    points={[
                      '0%,100%',
                      ...history.map((point, index) => {
                        const x = (index / (history.length - 1 || 1)) * 100;
                        const normalizedPrice = (point.price - paddedMin) / paddedRange;
                        const y = 100 - (normalizedPrice * 100);
                        return `${x}%,${y}%`;
                      }),
                      '100%,100%'
                    ].join(' ')}
                    fill={withOpacity(themes?.primary || '#2563eb', 0.1)}
                  />
                </svg>

                {/* Data points with hover */}
                {history.map((point, index) => {
                  const normalizedPrice = (point.price - paddedMin) / paddedRange;
                  return (
                    <div
                      key={`point-${index}`}
                      title={`${formatChartDate(point.timestamp)}: ${point.currency} ${point.price.toFixed(2)}`}
                      style={{
                        position: 'absolute',
                        left: `calc(10px + ${(index / (history.length - 1 || 1)) * 100}% * (100% - 20px) / 100)`,
                        bottom: `calc(20px + ${normalizedPrice * 100}% * (100% - 30px) / 100)`,
                        width: '10px',
                        height: '10px',
                        backgroundColor: themes?.primary || '#2563eb',
                        border: `2px solid ${themes?.surface || '#ffffff'}`,
                        borderRadius: '50%',
                        transform: 'translate(-50%, 50%)',
                        cursor: 'pointer',
                        zIndex: 10,
                        transition: designSystem.transitions.fast,
                        boxShadow: designSystem.shadows.sm
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translate(-50%, 50%) scale(1.3)';
                        e.currentTarget.style.boxShadow = designSystem.shadows.md;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translate(-50%, 50%) scale(1)';
                        e.currentTarget.style.boxShadow = designSystem.shadows.sm;
                      }}
                    />
                  );
                })}
              </div>

              {/* X-axis labels */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: designSystem.spacing.xs,
                  paddingLeft: '10px',
                  paddingRight: '10px'
                }}
              >
                {history.length > 1 && (
                  <>
                    <span
                      style={{
                        fontSize: designSystem.typography.sizes.xs,
                        color: themes?.textSecondary || '#64748b'
                      }}
                    >
                      {formatChartDate(history[0].timestamp)}
                    </span>
                    <span
                      style={{
                        fontSize: designSystem.typography.sizes.xs,
                        color: themes?.textSecondary || '#64748b'
                      }}
                    >
                      {formatChartDate(history[history.length - 1].timestamp)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Price Records Table */}
          <div
            style={{
              marginBottom: designSystem.spacing.lg
            }}
          >
            <h3
              style={{
                fontSize: designSystem.typography.sizes.base,
                fontWeight: designSystem.typography.weights.semibold,
                color: themes?.text || '#0f172a',
                margin: `0 0 ${designSystem.spacing.md} 0`
              }}
            >
              Price History Records
            </h3>

            {/* Table */}
            <div
              style={{
                overflowX: 'auto'
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: designSystem.typography.sizes.sm
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: `1px solid ${themes?.border || '#e2e8f0'}`
                    }}
                  >
                    <th
                      style={{
                        textAlign: 'left',
                        padding: designSystem.spacing.md,
                        color: themes?.textSecondary || '#64748b',
                        fontWeight: designSystem.typography.weights.semibold
                      }}
                    >
                      Date/Time
                    </th>
                    <th
                      style={{
                        textAlign: 'right',
                        padding: designSystem.spacing.md,
                        color: themes?.textSecondary || '#64748b',
                        fontWeight: designSystem.typography.weights.semibold
                      }}
                    >
                      Price
                    </th>
                    <th
                      style={{
                        textAlign: 'center',
                        padding: designSystem.spacing.md,
                        color: themes?.textSecondary || '#64748b',
                        fontWeight: designSystem.typography.weights.semibold
                      }}
                    >
                      Currency
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history
                    .slice()
                    .reverse()
                    .map((record, index) => {
                      const isLatest = index === 0;
                      return (
                        <tr
                          key={`record-${index}`}
                          style={{
                            borderBottom: `1px solid ${themes?.borderLight || '#f3f4f6'}`,
                            backgroundColor: isLatest
                              ? withOpacity(themes?.primary || '#2563eb', 0.05)
                              : 'transparent'
                          }}
                        >
                          <td
                            style={{
                              padding: designSystem.spacing.md,
                              color: themes?.text || '#0f172a'
                            }}
                          >
                            {formatDate(record.timestamp)}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              padding: designSystem.spacing.md,
                              color: themes?.text || '#0f172a',
                              fontWeight: isLatest
                                ? designSystem.typography.weights.semibold
                                : designSystem.typography.weights.normal
                            }}
                          >
                            {record.price.toFixed(2)}
                          </td>
                          <td
                            style={{
                              textAlign: 'center',
                              padding: designSystem.spacing.md,
                              color: themes?.textSecondary || '#64748b',
                              fontWeight: designSystem.typography.weights.medium
                            }}
                          >
                            {record.currency}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Price History - ${albumTitle}`}
      size="lg"
      footer={footerContent}
      themes={themes}
    >
      {modalContent}
    </Modal>
  );
}
