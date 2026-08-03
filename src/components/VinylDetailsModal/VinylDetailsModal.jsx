/**
 * VinylDetailsModal Component
 *
 * Displays detailed information for a vinyl in the collection
 * Extracted from App.jsx v2.10.0
 */

import React, { useState, useEffect } from 'react';
import { X, Heart, Settings, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [detailsExpanded, setDetailsExpanded] = useState(true);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [imageIndex, setImageIndex] = useState(0);
  const [loadingImages, setLoadingImages] = useState(false);
  const [releaseTracklist, setReleaseTracklist] = useState(null);

  useEffect(() => {
    if (!selectedVinyl?.id) return;

    const fetchReleaseData = async () => {
      setLoadingImages(true);
      try {
        const res = await fetch('/api/discogs-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: `/releases/${selectedVinyl.id}`,
            params: {}
          })
        });
        if (res.ok) {
          const data = await res.json();
          const images = data.images || [];
          const tracklist = data.tracklist || [];
          setAdditionalImages(images);
          if (tracklist.length > 0) {
            setReleaseTracklist(tracklist);
          }
        }
      } catch (err) {
        console.error('Failed to fetch release data:', err);
      } finally {
        setLoadingImages(false);
      }
    };

    fetchReleaseData();
  }, [selectedVinyl?.id]);

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

  const getPrimaryGenre = () => {
    if (!selectedVinyl.genres || selectedVinyl.genres.length === 0) return null;
    return selectedVinyl.genres[0];
  };

  const formatValue = () => {
    if (!selectedVinyl.format) return null;
    if (Array.isArray(selectedVinyl.format)) return selectedVinyl.format[0];
    return selectedVinyl.format;
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

        {additionalImages.length > 0 && (
          <div style={{
            position: 'relative',
            backgroundColor: themes.background,
            padding: designSystem.spacing.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: designSystem.spacing.sm
          }}>
            <button
              data-modal-button
              onClick={() => setImageIndex((i) => (i - 1 + additionalImages.length) % additionalImages.length)}
              style={{
                padding: designSystem.spacing.sm,
                backgroundColor: 'transparent',
                border: 'none',
                color: themes.text,
                cursor: 'pointer',
                zIndex: 2
              }}
            >
              <ChevronLeft size={designSystem.iconSize.md} />
            </button>
            <img
              src={additionalImages[imageIndex]?.uri}
              alt={`Album image ${imageIndex + 1}`}
              style={{
                height: '200px',
                maxWidth: '200px',
                objectFit: 'contain'
              }}
            />
            <button
              data-modal-button
              onClick={() => setImageIndex((i) => (i + 1) % additionalImages.length)}
              style={{
                padding: designSystem.spacing.sm,
                backgroundColor: 'transparent',
                border: 'none',
                color: themes.text,
                cursor: 'pointer',
                zIndex: 2
              }}
            >
              <ChevronRight size={designSystem.iconSize.md} />
            </button>
            <div style={{
              position: 'absolute',
              bottom: designSystem.spacing.sm,
              right: designSystem.spacing.sm,
              fontSize: designSystem.typography.sizes.xs,
              color: themes.textSecondary
            }}>
              {imageIndex + 1} / {additionalImages.length}
            </div>
          </div>
        )}

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
                {selectedVinyl.artist}
              </p>
            </div>
          </div>

          <button
            data-modal-button
            onClick={() => setDetailsExpanded(!detailsExpanded)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: designSystem.spacing.xs,
              color: themes.primary,
              cursor: 'pointer',
              padding: 0,
              marginBottom: designSystem.spacing.md,
              fontSize: designSystem.typography.sizes.base
            }}
          >
            <ChevronUp
              size={designSystem.iconSize.sm}
              style={{
                transform: detailsExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 0.2s'
              }}
            />
            {detailsExpanded ? 'Hide Details' : 'Show Details'}
          </button>

          {detailsExpanded && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: designSystem.spacing.md,
                padding: designSystem.spacing.md,
                backgroundColor: withOpacity(themes.primary, 0.05),
                borderRadius: designSystem.borderRadius.md,
                marginBottom: designSystem.spacing.md
              }}
            >
              {selectedVinyl.artist && (
                <div>
                  <p style={{
                    fontSize: designSystem.typography.sizes.xs,
                    color: themes.textSecondary,
                    margin: `0 0 ${designSystem.spacing.xs} 0`,
                    fontWeight: designSystem.typography.weights.semibold
                  }}>
                    ARTIST
                  </p>
                  <p style={{
                    fontSize: designSystem.typography.sizes.base,
                    color: themes.text,
                    margin: 0
                  }}>
                    {selectedVinyl.artist}
                  </p>
                </div>
              )}

              {selectedVinyl.title && (
                <div>
                  <p style={{
                    fontSize: designSystem.typography.sizes.xs,
                    color: themes.textSecondary,
                    margin: `0 0 ${designSystem.spacing.xs} 0`,
                    fontWeight: designSystem.typography.weights.semibold
                  }}>
                    ALBUM
                  </p>
                  <p style={{
                    fontSize: designSystem.typography.sizes.base,
                    color: themes.text,
                    margin: 0
                  }}>
                    {selectedVinyl.title}
                  </p>
                </div>
              )}

              {formatValue() && (
                <div>
                  <p style={{
                    fontSize: designSystem.typography.sizes.xs,
                    color: themes.textSecondary,
                    margin: `0 0 ${designSystem.spacing.xs} 0`,
                    fontWeight: designSystem.typography.weights.semibold
                  }}>
                    FORMAT
                  </p>
                  <p style={{
                    fontSize: designSystem.typography.sizes.base,
                    color: themes.text,
                    margin: 0
                  }}>
                    {formatValue()}
                  </p>
                </div>
              )}

              {selectedVinyl.year && (
                <div>
                  <p style={{
                    fontSize: designSystem.typography.sizes.xs,
                    color: themes.textSecondary,
                    margin: `0 0 ${designSystem.spacing.xs} 0`,
                    fontWeight: designSystem.typography.weights.semibold
                  }}>
                    YEAR
                  </p>
                  <p style={{
                    fontSize: designSystem.typography.sizes.base,
                    color: themes.text,
                    margin: 0
                  }}>
                    {selectedVinyl.year}
                  </p>
                </div>
              )}

              {selectedVinyl.country && (
                <div>
                  <p style={{
                    fontSize: designSystem.typography.sizes.xs,
                    color: themes.textSecondary,
                    margin: `0 0 ${designSystem.spacing.xs} 0`,
                    fontWeight: designSystem.typography.weights.semibold
                  }}>
                    COUNTRY
                  </p>
                  <p style={{
                    fontSize: designSystem.typography.sizes.base,
                    color: themes.text,
                    margin: 0
                  }}>
                    {selectedVinyl.country}
                  </p>
                </div>
              )}

              {getPrimaryGenre() && (
                <div>
                  <p style={{
                    fontSize: designSystem.typography.sizes.xs,
                    color: themes.textSecondary,
                    margin: `0 0 ${designSystem.spacing.xs} 0`,
                    fontWeight: designSystem.typography.weights.semibold
                  }}>
                    GENRE
                  </p>
                  <p style={{
                    fontSize: designSystem.typography.sizes.base,
                    color: themes.text,
                    margin: 0
                  }}>
                    {getPrimaryGenre()}
                  </p>
                </div>
              )}

              {selectedVinyl.catalog_number && (
                <div>
                  <p style={{
                    fontSize: designSystem.typography.sizes.xs,
                    color: themes.textSecondary,
                    margin: `0 0 ${designSystem.spacing.xs} 0`,
                    fontWeight: designSystem.typography.weights.semibold
                  }}>
                    CATALOG #
                  </p>
                  <p style={{
                    fontSize: designSystem.typography.sizes.base,
                    color: themes.text,
                    margin: 0
                  }}>
                    {selectedVinyl.catalog_number}
                  </p>
                </div>
              )}

              {selectedVinyl.label && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <p style={{
                    fontSize: designSystem.typography.sizes.xs,
                    color: themes.textSecondary,
                    margin: `0 0 ${designSystem.spacing.xs} 0`,
                    fontWeight: designSystem.typography.weights.semibold
                  }}>
                    LABEL
                  </p>
                  <p style={{
                    fontSize: designSystem.typography.sizes.base,
                    color: themes.text,
                    margin: 0
                  }}>
                    {Array.isArray(selectedVinyl.label) ? selectedVinyl.label[0] : selectedVinyl.label}
                  </p>
                </div>
              )}
            </div>
          )}

          {selectedVinyl.lowestPrice !== null && (
            <div
              onClick={() => onOpenValueModal(selectedVinyl)}
              style={{
                padding: designSystem.spacing.md,
                backgroundColor: withOpacity('#FFA500', 0.1),
                border: `2px solid #FFA500`,
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
                Marketplace Price
              </p>
              <p style={{
                fontSize: designSystem.typography.sizes.xl,
                fontWeight: designSystem.typography.weights.bold,
                color: themes.text,
                margin: 0
              }}>
                EUR {selectedVinyl.lowestPrice ? selectedVinyl.lowestPrice.toFixed(2) : '0.00'}
              </p>
              <p style={{
                fontSize: designSystem.typography.sizes.xs,
                color: themes.textSecondary,
                margin: `${designSystem.spacing.xs} 0 0 0`
              }}>
                4 available • Lowest price
              </p>
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: designSystem.spacing.sm,
            marginBottom: designSystem.spacing.md
          }}>
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
              Remove from Collection
            </button>
            <button
              data-modal-button
              onClick={() => {}}
              style={{
                padding: `${designSystem.spacing.md}`,
                minWidth: designSystem.touchTarget.min,
                minHeight: designSystem.touchTarget.min,
                backgroundColor: withOpacity(themes.textSecondary, 0.1),
                color: themes.textSecondary,
                border: `1px solid ${themes.border}`,
                borderRadius: designSystem.borderRadius.circle,
                cursor: 'pointer'
              }}
            >
              <Settings size={designSystem.iconSize.md} />
            </button>
          </div>

          <div style={{
            display: 'flex',
            gap: designSystem.spacing.sm,
            marginBottom: designSystem.spacing.md
          }}>
            <button
              data-modal-button
              onClick={() => {}}
              style={{
                flex: 1,
                padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
                minHeight: designSystem.touchTarget.min,
                backgroundColor: '#1DB954',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: designSystem.borderRadius.md,
                cursor: 'pointer',
                fontSize: designSystem.typography.sizes.base,
                fontWeight: designSystem.typography.weights.medium,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: designSystem.spacing.xs
              }}
            >
              ♪ Play on Spotify
            </button>
            <button
              data-modal-button
              onClick={() => {}}
              style={{
                flex: 1,
                padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
                minHeight: designSystem.touchTarget.min,
                backgroundColor: '#000000',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: designSystem.borderRadius.md,
                cursor: 'pointer',
                fontSize: designSystem.typography.sizes.base,
                fontWeight: designSystem.typography.weights.medium,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: designSystem.spacing.xs
              }}
            >
              ♪ Play on Tidal
            </button>
          </div>

          <div style={{ marginBottom: designSystem.spacing.md }}>
            <p style={{
              fontSize: designSystem.typography.sizes.xs,
              color: themes.textSecondary,
              margin: `0 0 ${designSystem.spacing.xs} 0`,
              fontWeight: designSystem.typography.weights.semibold
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

          {renderTracklist(releaseTracklist || selectedVinyl.tracklist)}
        </div>
      </div>
    </div>
  );
};

export default VinylDetailsModal;
