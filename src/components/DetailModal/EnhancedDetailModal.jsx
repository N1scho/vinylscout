/**
 * EnhancedDetailModal Component
 *
 * Comprehensive release detail view with:
 * - Collapsible header with metadata
 * - Price display widget
 * - Expandable info sections (Notes, Tracklist, Identifiers)
 * - Streaming integration (Spotify, Tidal)
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  X,
  ChevronDown,
  ChevronUp,
  Settings,
  Music,
  List,
  Hash,
  ExternalLink
} from 'lucide-react';
import { designSystem, withOpacity } from '../../designsystem';
import { fetchVinylDetails, fetchPriceInfo } from '../../services/discogsService';
import LoadingSpinner from '../LoadingSpinner';

const EnhancedDetailModal = React.memo(({
  selectedResult,
  collection,
  onClose,
  onAddToCollection,
  onRemoveFromCollection,
  themes
}) => {
  // State management
  const [releaseDetails, setReleaseDetails] = useState(null);
  const [priceData, setPriceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [headerExpanded, setHeaderExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    notes: false,
    tracklist: true,
    identifiers: false
  });

  const inCollection = collection.some(v => v.id === selectedResult?.id);

  // Fetch detailed release data
  useEffect(() => {
    const loadReleaseData = async () => {
      if (!selectedResult) return;

      setIsLoading(true);
      try {
        // Fetch detailed release info
        const details = await fetchVinylDetails(selectedResult.id);
        setReleaseDetails(details);

        // Fetch price data
        const price = await fetchPriceInfo(selectedResult.id);
        setPriceData(price);
      } catch (error) {
        console.error('Failed to load release data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadReleaseData();
  }, [selectedResult]);

  if (!selectedResult) return null;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAddToCollection = () => {
    if (inCollection) {
      onRemoveFromCollection(selectedResult.id);
    } else {
      // Include price data when adding
      const itemWithPrice = {
        ...selectedResult,
        price: priceData ? { value: priceData.value, currency: priceData.currency } : null,
        lowestPrice: priceData?.value || null,
        priceHistory: priceData ? [{
          date: new Date().toISOString(),
          price: priceData.value,
          currency: priceData.currency
        }] : []
      };
      onAddToCollection(itemWithPrice);
    }
    onClose();
  };

  // Helper to format label info
  const formatLabelInfo = (labels) => {
    if (!labels || labels.length === 0) return null;
    return labels.map(l => l.name).join(', ');
  };

  // Helper to format formats
  const formatFormats = (formats) => {
    if (!formats || formats.length === 0) return 'Unknown';
    return formats.map(f => {
      const desc = f.descriptions ? ` (${f.descriptions.join(', ')})` : '';
      return `${f.name}${desc}`;
    }).join(', ');
  };

  // Generate Spotify search URL
  const getSpotifyUrl = () => {
    const artist = releaseDetails?.artists?.[0]?.name || selectedResult.artist || '';
    const album = releaseDetails?.title || selectedResult.title || '';
    const query = encodeURIComponent(`${artist} ${album}`);
    return `https://open.spotify.com/search/${query}`;
  };

  // Generate Tidal search URL
  const getTidalUrl = () => {
    const artist = releaseDetails?.artists?.[0]?.name || selectedResult.artist || '';
    const album = releaseDetails?.title || selectedResult.title || '';
    const query = encodeURIComponent(`${artist} ${album}`);
    return `https://listen.tidal.com/search?q=${query}`;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: withOpacity('#000000', 0.85),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: designSystem.spacing.md,
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: themes.surface,
          borderRadius: designSystem.borderRadius.lg,
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: designSystem.spacing.md,
            right: designSystem.spacing.md,
            padding: designSystem.spacing.sm,
            minWidth: designSystem.touchTarget.min,
            minHeight: designSystem.touchTarget.min,
            backgroundColor: withOpacity(themes.surface, 0.95),
            border: `1px solid ${themes.border}`,
            borderRadius: designSystem.borderRadius.circle,
            color: themes.text,
            cursor: 'pointer',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={designSystem.iconSize.md} />
        </button>

        {/* Scrollable Content */}
        <div style={{ overflowY: 'auto', overflowX: 'hidden' }}>
          {/* Cover Image */}
          <img
            src={releaseDetails?.images?.[0]?.uri || selectedResult.cover_image || selectedResult.thumb}
            alt={releaseDetails?.title || selectedResult.title}
            style={{
              width: '100%',
              aspectRatio: '1',
              objectFit: 'cover',
              backgroundColor: themes.surfaceVariant
            }}
          />

          {/* Loading State */}
          {isLoading && (
            <div style={{ padding: designSystem.spacing.xl }}>
              <LoadingSpinner size="md" message="Loading release details..." themes={themes} />
            </div>
          )}

          {/* Content */}
          {!isLoading && (
            <div style={{ padding: designSystem.spacing.lg }}>
              {/* Header Section - Collapsible */}
              <div
                style={{
                  marginBottom: designSystem.spacing.lg,
                  borderBottom: `1px solid ${themes.border}`,
                  paddingBottom: designSystem.spacing.md
                }}
              >
                {/* Title and Artist */}
                <h1
                  style={{
                    fontSize: designSystem.typography.sizes['2xl'],
                    fontWeight: designSystem.typography.weights.bold,
                    color: themes.text,
                    margin: `0 0 ${designSystem.spacing.xs} 0`,
                    lineHeight: 1.2
                  }}
                >
                  {releaseDetails?.title || selectedResult.title}
                </h1>
                <p
                  style={{
                    fontSize: designSystem.typography.sizes.lg,
                    color: themes.textSecondary,
                    margin: `0 0 ${designSystem.spacing.md} 0`
                  }}
                >
                  {releaseDetails?.artists?.[0]?.name || selectedResult.artist || 'Unknown Artist'}
                </p>

                {/* Toggle Header Metadata */}
                <button
                  onClick={() => setHeaderExpanded(!headerExpanded)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: designSystem.spacing.xs,
                    padding: `${designSystem.spacing.xs} 0`,
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: themes.primary,
                    cursor: 'pointer',
                    fontSize: designSystem.typography.sizes.sm,
                    fontWeight: designSystem.typography.weights.medium
                  }}
                >
                  {headerExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {headerExpanded ? 'Hide Details' : 'Show Details'}
                </button>

                {/* Metadata Row - Collapsible */}
                {headerExpanded && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: designSystem.spacing.md,
                      marginTop: designSystem.spacing.md,
                      padding: designSystem.spacing.md,
                      backgroundColor: themes.surfaceVariant,
                      borderRadius: designSystem.borderRadius.sm
                    }}
                  >
                    {/* Format */}
                    {releaseDetails?.formats && (
                      <div>
                        <div
                          style={{
                            fontSize: designSystem.typography.sizes.xs,
                            color: themes.textTertiary,
                            fontWeight: designSystem.typography.weights.semibold,
                            marginBottom: designSystem.spacing.xs
                          }}
                        >
                          FORMAT
                        </div>
                        <div
                          style={{
                            fontSize: designSystem.typography.sizes.sm,
                            color: themes.text
                          }}
                        >
                          {formatFormats(releaseDetails.formats)}
                        </div>
                      </div>
                    )}

                    {/* Year */}
                    {releaseDetails?.year && (
                      <div>
                        <div
                          style={{
                            fontSize: designSystem.typography.sizes.xs,
                            color: themes.textTertiary,
                            fontWeight: designSystem.typography.weights.semibold,
                            marginBottom: designSystem.spacing.xs
                          }}
                        >
                          YEAR
                        </div>
                        <div
                          style={{
                            fontSize: designSystem.typography.sizes.sm,
                            color: themes.text
                          }}
                        >
                          {releaseDetails.year}
                        </div>
                      </div>
                    )}

                    {/* Country */}
                    {releaseDetails?.country && (
                      <div>
                        <div
                          style={{
                            fontSize: designSystem.typography.sizes.xs,
                            color: themes.textTertiary,
                            fontWeight: designSystem.typography.weights.semibold,
                            marginBottom: designSystem.spacing.xs
                          }}
                        >
                          COUNTRY
                        </div>
                        <div
                          style={{
                            fontSize: designSystem.typography.sizes.sm,
                            color: themes.text
                          }}
                        >
                          {releaseDetails.country}
                        </div>
                      </div>
                    )}

                    {/* Genre & Styles */}
                    {releaseDetails?.genres && releaseDetails.genres.length > 0 && (
                      <div>
                        <div
                          style={{
                            fontSize: designSystem.typography.sizes.xs,
                            color: themes.textTertiary,
                            fontWeight: designSystem.typography.weights.semibold,
                            marginBottom: designSystem.spacing.xs
                          }}
                        >
                          GENRE
                        </div>
                        <div>
                          {/* Main Genres */}
                          <div
                            style={{
                              fontSize: designSystem.typography.sizes.sm,
                              color: themes.text,
                              fontWeight: designSystem.typography.weights.medium,
                              marginBottom: releaseDetails.styles && releaseDetails.styles.length > 0 ? designSystem.spacing.xs : 0
                            }}
                          >
                            {releaseDetails.genres.join(', ')}
                          </div>
                          {/* Subgenres/Styles */}
                          {releaseDetails.styles && releaseDetails.styles.length > 0 && (
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: designSystem.spacing.xs,
                                marginTop: designSystem.spacing.xs
                              }}
                            >
                              {releaseDetails.styles.map((style, index) => (
                                <span
                                  key={index}
                                  style={{
                                    fontSize: designSystem.typography.sizes.xs,
                                    color: themes.text,
                                    backgroundColor: themes.surfaceVariant,
                                    padding: `${designSystem.spacing.xs} ${designSystem.spacing.sm}`,
                                    borderRadius: designSystem.borderRadius.sm,
                                    border: `1px solid ${themes.border}`
                                  }}
                                >
                                  {style}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Catalog Number */}
                    {releaseDetails?.labels?.[0]?.catno && (
                      <div>
                        <div
                          style={{
                            fontSize: designSystem.typography.sizes.xs,
                            color: themes.textTertiary,
                            fontWeight: designSystem.typography.weights.semibold,
                            marginBottom: designSystem.spacing.xs
                          }}
                        >
                          CATALOG #
                        </div>
                        <div
                          style={{
                            fontSize: designSystem.typography.sizes.sm,
                            color: themes.text
                          }}
                        >
                          {releaseDetails.labels[0].catno}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Label Information */}
                {releaseDetails?.labels && releaseDetails.labels.length > 0 && (
                  <div style={{ marginTop: designSystem.spacing.md }}>
                    <div
                      style={{
                        fontSize: designSystem.typography.sizes.xs,
                        color: themes.textTertiary,
                        fontWeight: designSystem.typography.weights.semibold
                      }}
                    >
                      LABEL
                    </div>
                    <div
                      style={{
                        fontSize: designSystem.typography.sizes.sm,
                        color: themes.text,
                        marginTop: designSystem.spacing.xs
                      }}
                    >
                      {formatLabelInfo(releaseDetails.labels)}
                    </div>
                  </div>
                )}
              </div>

              {/* Price Display Widget */}
              {priceData && (
                <div
                  style={{
                    backgroundColor: withOpacity('#FFC107', 0.15),
                    border: `2px solid #FFC107`,
                    borderRadius: designSystem.borderRadius.md,
                    padding: designSystem.spacing.md,
                    marginBottom: designSystem.spacing.lg,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: designSystem.typography.sizes.xs,
                        color: themes.textSecondary,
                        fontWeight: designSystem.typography.weights.semibold,
                        marginBottom: designSystem.spacing.xs
                      }}
                    >
                      MARKETPLACE PRICE
                    </div>
                    <div
                      style={{
                        fontSize: designSystem.typography.sizes['2xl'],
                        fontWeight: designSystem.typography.weights.bold,
                        color: themes.text
                      }}
                    >
                      {priceData.currency} {
                        typeof priceData.value === 'number'
                          ? priceData.value.toFixed(2)
                          : (priceData.value && !isNaN(parseFloat(priceData.value))
                              ? parseFloat(priceData.value).toFixed(2)
                              : '0.00')
                      }
                    </div>
                    <div
                      style={{
                        fontSize: designSystem.typography.sizes.xs,
                        color: themes.textSecondary,
                        marginTop: designSystem.spacing.xs
                      }}
                    >
                      {priceData.num_for_sale} available • Lowest price
                    </div>
                  </div>
                </div>
              )}

              {/* Primary Action Button */}
              <div
                style={{
                  display: 'flex',
                  gap: designSystem.spacing.sm,
                  marginBottom: designSystem.spacing.lg
                }}
              >
                <button
                  onClick={handleAddToCollection}
                  style={{
                    flex: 1,
                    padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
                    minHeight: designSystem.touchTarget.min,
                    backgroundColor: inCollection ? themes.error : themes.primary,
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: designSystem.borderRadius.md,
                    cursor: 'pointer',
                    fontSize: designSystem.typography.sizes.lg,
                    fontWeight: designSystem.typography.weights.semibold,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: designSystem.spacing.sm
                  }}
                >
                  {inCollection ? 'Remove from Collection' : 'Add to Collection'}
                </button>
                <button
                  style={{
                    padding: designSystem.spacing.md,
                    minWidth: designSystem.touchTarget.min,
                    minHeight: designSystem.touchTarget.min,
                    backgroundColor: themes.surfaceVariant,
                    border: `1px solid ${themes.border}`,
                    borderRadius: designSystem.borderRadius.md,
                    color: themes.text,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Options"
                >
                  <Settings size={20} />
                </button>
              </div>

              {/* Streaming Integration */}
              <div
                style={{
                  display: 'flex',
                  gap: designSystem.spacing.sm,
                  marginBottom: designSystem.spacing.lg
                }}
              >
                <a
                  href={getSpotifyUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    padding: `${designSystem.spacing.sm} ${designSystem.spacing.md}`,
                    backgroundColor: '#1DB954',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    borderRadius: designSystem.borderRadius.sm,
                    fontSize: designSystem.typography.sizes.sm,
                    fontWeight: designSystem.typography.weights.medium,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: designSystem.spacing.xs,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Music size={16} />
                  Play on Spotify
                  <ExternalLink size={12} />
                </a>
                <a
                  href={getTidalUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    padding: `${designSystem.spacing.sm} ${designSystem.spacing.md}`,
                    backgroundColor: '#000000',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    borderRadius: designSystem.borderRadius.sm,
                    fontSize: designSystem.typography.sizes.sm,
                    fontWeight: designSystem.typography.weights.medium,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: designSystem.spacing.xs,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Music size={16} />
                  Play on Tidal
                  <ExternalLink size={12} />
                </a>
              </div>

              {/* Expandable Sections */}

              {/* Release Notes */}
              {releaseDetails?.notes && (
                <div
                  style={{
                    borderTop: `1px solid ${themes.border}`,
                    paddingTop: designSystem.spacing.md,
                    marginBottom: designSystem.spacing.md
                  }}
                >
                  <button
                    onClick={() => toggleSection('notes')}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: `${designSystem.spacing.sm} 0`,
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: themes.text
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: designSystem.spacing.sm
                      }}
                    >
                      <Music size={18} />
                      <span
                        style={{
                          fontSize: designSystem.typography.sizes.base,
                          fontWeight: designSystem.typography.weights.semibold
                        }}
                      >
                        Release Notes
                      </span>
                    </div>
                    {expandedSections.notes ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {expandedSections.notes && (
                    <div
                      style={{
                        marginTop: designSystem.spacing.sm,
                        padding: designSystem.spacing.md,
                        backgroundColor: themes.surfaceVariant,
                        borderRadius: designSystem.borderRadius.sm,
                        fontSize: designSystem.typography.sizes.sm,
                        color: themes.textSecondary,
                        lineHeight: 1.6
                      }}
                    >
                      {releaseDetails.notes}
                    </div>
                  )}
                </div>
              )}

              {/* Tracklist */}
              {releaseDetails?.tracklist && releaseDetails.tracklist.length > 0 && (
                <div
                  style={{
                    borderTop: `1px solid ${themes.border}`,
                    paddingTop: designSystem.spacing.md,
                    marginBottom: designSystem.spacing.md
                  }}
                >
                  <button
                    onClick={() => toggleSection('tracklist')}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: `${designSystem.spacing.sm} 0`,
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: themes.text
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: designSystem.spacing.sm
                      }}
                    >
                      <List size={18} />
                      <span
                        style={{
                          fontSize: designSystem.typography.sizes.base,
                          fontWeight: designSystem.typography.weights.semibold
                        }}
                      >
                        Tracklist ({releaseDetails.tracklist.length})
                      </span>
                    </div>
                    {expandedSections.tracklist ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {expandedSections.tracklist && (
                    <div style={{ marginTop: designSystem.spacing.sm }}>
                      {releaseDetails.tracklist.map((track, index) => (
                        <div
                          key={index}
                          style={{
                            padding: `${designSystem.spacing.sm} ${designSystem.spacing.md}`,
                            backgroundColor: index % 2 === 0 ? themes.surfaceVariant : 'transparent',
                            borderRadius: designSystem.borderRadius.sm,
                            marginBottom: designSystem.spacing.xs,
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: designSystem.typography.sizes.sm,
                                color: themes.text,
                                fontWeight: designSystem.typography.weights.medium
                              }}
                            >
                              {track.position && <span style={{ color: themes.textTertiary }}>{track.position}. </span>}
                              {track.title}
                            </div>
                            {track.artists && (
                              <div
                                style={{
                                  fontSize: designSystem.typography.sizes.xs,
                                  color: themes.textSecondary,
                                  marginTop: designSystem.spacing.xs
                                }}
                              >
                                {track.artists.map(a => a.name).join(', ')}
                              </div>
                            )}
                          </div>
                          {track.duration && (
                            <div
                              style={{
                                fontSize: designSystem.typography.sizes.sm,
                                color: themes.textTertiary,
                                marginLeft: designSystem.spacing.md
                              }}
                            >
                              {track.duration}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Identifiers */}
              {releaseDetails?.identifiers && releaseDetails.identifiers.length > 0 && (
                <div
                  style={{
                    borderTop: `1px solid ${themes.border}`,
                    paddingTop: designSystem.spacing.md,
                    marginBottom: designSystem.spacing.md
                  }}
                >
                  <button
                    onClick={() => toggleSection('identifiers')}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: `${designSystem.spacing.sm} 0`,
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: themes.text
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: designSystem.spacing.sm
                      }}
                    >
                      <Hash size={18} />
                      <span
                        style={{
                          fontSize: designSystem.typography.sizes.base,
                          fontWeight: designSystem.typography.weights.semibold
                        }}
                      >
                        Identifiers
                      </span>
                    </div>
                    {expandedSections.identifiers ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  {expandedSections.identifiers && (
                    <div
                      style={{
                        marginTop: designSystem.spacing.sm,
                        padding: designSystem.spacing.md,
                        backgroundColor: themes.surfaceVariant,
                        borderRadius: designSystem.borderRadius.sm
                      }}
                    >
                      {releaseDetails.identifiers.map((id, index) => (
                        <div
                          key={index}
                          style={{
                            marginBottom: index < releaseDetails.identifiers.length - 1 ? designSystem.spacing.sm : 0
                          }}
                        >
                          <div
                            style={{
                              fontSize: designSystem.typography.sizes.xs,
                              color: themes.textTertiary,
                              fontWeight: designSystem.typography.weights.semibold
                            }}
                          >
                            {id.type}
                          </div>
                          <div
                            style={{
                              fontSize: designSystem.typography.sizes.sm,
                              color: themes.text,
                              fontFamily: 'monospace',
                              marginTop: designSystem.spacing.xs
                            }}
                          >
                            {id.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

EnhancedDetailModal.propTypes = {
  selectedResult: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    artist: PropTypes.string,
    year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    cover_image: PropTypes.string,
    thumb: PropTypes.string
  }),
  collection: PropTypes.arrayOf(PropTypes.object).isRequired,
  onClose: PropTypes.func.isRequired,
  onAddToCollection: PropTypes.func.isRequired,
  onRemoveFromCollection: PropTypes.func.isRequired,
  themes: PropTypes.shape({
    background: PropTypes.string.isRequired,
    surface: PropTypes.string.isRequired,
    surfaceVariant: PropTypes.string.isRequired,
    primary: PropTypes.string.isRequired,
    error: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    textSecondary: PropTypes.string.isRequired,
    textTertiary: PropTypes.string.isRequired,
    border: PropTypes.string.isRequired
  }).isRequired
};

export default EnhancedDetailModal;
