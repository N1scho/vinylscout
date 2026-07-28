/**
 * VinylDetailsModal Component
 *
 * Displays detailed information for a vinyl in the collection
 * Extracted from App.jsx v2.10.0
 */

import React from 'react';
import { X, Heart } from 'lucide-react';
import { designSystem, withOpacity } from '../../designsystem';

const conditionGrades = ['Mint', 'NM', 'VG+', 'VG', 'Good', 'Fair', 'Poor'];

const VinylDetailsModal = ({
  selectedVinyl,
  onClose,
  onToggleFavorite,
  onOpenValueModal,
  onUpdatePrice,
  onConfirmDelete,
  onUpdateVinyl,
  themes
}) => {
  if (!selectedVinyl) return null;

  const renderTracklist = (tracklist) => {
    if (!tracklist || tracklist.length === 0) return null;

    const groupedBySide = tracklist.reduce((acc, track) => {
      const side = track.position?.match(/^[A-Za-z]+/)?.[0] || 'Other';
      if (!acc[side]) acc[side] = [];
      acc[side].push(track);
      return acc;
    }, {});

    return (
      <div style={{ marginTop: designSystem.spacing.lg }}>
        <h3 style={{
          fontSize: designSystem.typography.sizes.base,
          fontWeight: designSystem.typography.weights.semibold,
          color: themes.text,
          marginBottom: designSystem.spacing.md
        }}>
          Tracklist
        </h3>
        {Object.entries(groupedBySide).map(([side, tracks]) => (
          <div key={side} style={{ marginBottom: designSystem.spacing.md }}>
            <h4 style={{
              fontSize: designSystem.typography.sizes.sm,
              fontWeight: designSystem.typography.weights.medium,
              color: themes.textSecondary,
              marginBottom: designSystem.spacing.sm
            }}>
              Side {side} ({tracks.length} tracks)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: designSystem.spacing.xs }}>
              {tracks.map((track, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: designSystem.spacing.sm,
                    backgroundColor: idx % 2 === 0 ? withOpacity(themes.primary, 0.03) : 'transparent',
                    borderRadius: designSystem.borderRadius.sm,
                    display: 'flex',
                    gap: designSystem.spacing.sm
                  }}
                >
                  <span style={{
                    fontSize: designSystem.typography.sizes.xs,
                    color: themes.textSecondary,
                    minWidth: '24px'
                  }}>
                    {track.position}
                  </span>
                  <span style={{
                    fontSize: designSystem.typography.sizes.xs,
                    color: themes.text,
                    flex: 1
                  }}>
                    {track.title}
                  </span>
                  {track.duration && (
                    <span style={{
                      fontSize: designSystem.typography.sizes.xs,
                      color: themes.textSecondary
                    }}>
                      {track.duration}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
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
        zIndex: 1000,
        overflow: 'auto'
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
            cursor: 'pointer',
            zIndex: 1
          }}
        >
          <X size={designSystem.iconSize.md} />
        </button>

        <img
          src={selectedVinyl.cover_image || selectedVinyl.thumb}
          alt={selectedVinyl.title}
          style={{
            width: '100%',
            aspectRatio: '1',
            objectFit: 'cover',
            backgroundColor: themes.border
          }}
        />

        <div style={{ padding: designSystem.spacing.lg }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: designSystem.spacing.md
          }}>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: designSystem.typography.sizes.xl,
                fontWeight: designSystem.typography.weights.bold,
                color: themes.text,
                margin: `0 0 ${designSystem.spacing.xs} 0`
              }}>
                {selectedVinyl.title}
              </h2>
              <p style={{
                fontSize: designSystem.typography.sizes.base,
                color: themes.textSecondary,
                margin: 0
              }}>
                {selectedVinyl.artist} • {selectedVinyl.year}
              </p>
            </div>
            <button
              data-modal-button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(selectedVinyl.id);
              }}
              style={{
                padding: designSystem.spacing.sm,
                minWidth: designSystem.touchTarget.min,
                minHeight: designSystem.touchTarget.min,
                backgroundColor: 'transparent',
                border: `1px solid ${themes.border}`,
                borderRadius: designSystem.borderRadius.circle,
                color: selectedVinyl.isFavorite ? themes.warning : themes.textSecondary,
                cursor: 'pointer'
              }}
            >
              <Heart
                size={designSystem.iconSize.md}
                fill={selectedVinyl.isFavorite ? themes.warning : 'none'}
              />
            </button>
          </div>

          {selectedVinyl.lowestPrice !== null && (
            <div
              onClick={() => onOpenValueModal(selectedVinyl)}
              style={{
                padding: designSystem.spacing.md,
                backgroundColor: withOpacity(themes.primary, 0.1),
                borderRadius: designSystem.borderRadius.md,
                marginBottom: designSystem.spacing.md,
                cursor: 'pointer'
              }}
            >
              <p style={{
                fontSize: designSystem.typography.sizes.xs,
                color: themes.textSecondary,
                margin: `0 0 ${designSystem.spacing.xs} 0`
              }}>
                Current Value
              </p>
              <p style={{
                fontSize: designSystem.typography.sizes.xl,
                fontWeight: designSystem.typography.weights.bold,
                color: themes.primary,
                margin: 0
              }}>
                ${selectedVinyl.lowestPrice ? selectedVinyl.lowestPrice.toFixed(2) : '0.00'}
              </p>
            </div>
          )}

          <div style={{ marginBottom: designSystem.spacing.md }}>
            <p style={{
              fontSize: designSystem.typography.sizes.xs,
              color: themes.textSecondary,
              margin: `0 0 ${designSystem.spacing.xs} 0`
            }}>
              Label
            </p>
            <p style={{
              fontSize: designSystem.typography.sizes.base,
              color: themes.text,
              margin: 0
            }}>
              {selectedVinyl.label}
            </p>
          </div>

          <div style={{ marginBottom: designSystem.spacing.md }}>
            <p style={{
              fontSize: designSystem.typography.sizes.xs,
              color: themes.textSecondary,
              margin: `0 0 ${designSystem.spacing.xs} 0`
            }}>
              Condition
            </p>
            {onUpdateVinyl ? (
              <select
                value={selectedVinyl.condition || ''}
                onChange={(e) => onUpdateVinyl({
                  ...selectedVinyl,
                  condition: e.target.value || undefined
                })}
                style={{
                  width: '100%',
                  padding: designSystem.spacing.sm,
                  fontSize: designSystem.typography.sizes.base,
                  backgroundColor: themes.surface,
                  color: themes.text,
                  border: `1px solid ${themes.border}`,
                  borderRadius: designSystem.borderRadius.sm,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="">Not set</option>
                {conditionGrades.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            ) : (
              <p style={{
                fontSize: designSystem.typography.sizes.base,
                color: themes.text,
                margin: 0
              }}>
                {selectedVinyl.condition || 'Not set'}
              </p>
            )}
          </div>

          {selectedVinyl.genres && selectedVinyl.genres.length > 0 && (
            <div style={{ marginBottom: designSystem.spacing.md }}>
              <p style={{
                fontSize: designSystem.typography.sizes.xs,
                color: themes.textSecondary,
                margin: `0 0 ${designSystem.spacing.xs} 0`
              }}>
                Genres
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: designSystem.spacing.xs }}>
                {selectedVinyl.genres.map(genre => (
                  <span
                    key={genre}
                    style={{
                      padding: `${designSystem.spacing.xs} ${designSystem.spacing.sm}`,
                      backgroundColor: withOpacity(themes.primary, 0.1),
                      color: themes.primary,
                      borderRadius: designSystem.borderRadius.sm,
                      fontSize: designSystem.typography.sizes.xs
                    }}
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selectedVinyl.styles && selectedVinyl.styles.length > 0 && (
            <div style={{ marginBottom: designSystem.spacing.md }}>
              <p style={{
                fontSize: designSystem.typography.sizes.xs,
                color: themes.textSecondary,
                margin: `0 0 ${designSystem.spacing.xs} 0`
              }}>
                Styles
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: designSystem.spacing.xs }}>
                {selectedVinyl.styles.map(style => (
                  <span
                    key={style}
                    style={{
                      padding: `${designSystem.spacing.xs} ${designSystem.spacing.sm}`,
                      backgroundColor: withOpacity(themes.textSecondary, 0.1),
                      color: themes.textSecondary,
                      borderRadius: designSystem.borderRadius.sm,
                      fontSize: designSystem.typography.sizes.xs
                    }}
                  >
                    {style}
                  </span>
                ))}
              </div>
            </div>
          )}

          {renderTracklist(selectedVinyl.tracklist)}

          <div style={{
            display: 'flex',
            gap: designSystem.spacing.sm,
            marginTop: designSystem.spacing.lg
          }}>
            <button
              data-modal-button
              onClick={async () => {
                await onUpdatePrice(selectedVinyl.id);
              }}
              style={{
                flex: 1,
                padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
                minHeight: designSystem.touchTarget.min,
                backgroundColor: themes.primary,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: designSystem.borderRadius.md,
                cursor: 'pointer',
                fontSize: designSystem.typography.sizes.base,
                fontWeight: designSystem.typography.weights.medium
              }}
            >
              Update Price
            </button>
            <button
              data-modal-button
              onClick={() => onConfirmDelete(selectedVinyl.id)}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default VinylDetailsModal;
