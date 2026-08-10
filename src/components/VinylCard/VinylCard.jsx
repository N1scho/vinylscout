import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Heart, RefreshCw, Trash2, TrendingUp, TrendingDown, Eye, TrendingUpIcon, Image, Plus } from 'lucide-react';
import { designSystem } from '../../designsystem';
import { useSettingsStore } from '../../stores/settingsStore';
import { getPriceHistory } from '../../services/priceHistoryService';

/**
 * VinylCard Component
 *
 * Displays a single vinyl record with:
 * - Cover image
 * - Title and artist
 * - Current price
 * - Action buttons (favorite, refresh, remove)
 * - Price change indicator
 */
const VinylCard = React.memo(function VinylCard({
  vinyl,
  price,
  isRefreshing = false,
  priceChange = null,
  inCollection = false,
  onToggleFavorite,
  onRefreshPrice,
  onRemove,
  onViewDetails,
  onAddToCollection,
  onPriceHistory,
  onReloadCover,
  themes
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [isReloadingCover, setIsReloadingCover] = useState(false);

  const designTheme = useSettingsStore(s => s.designTheme);
  const isDarkBg = themes.background && parseInt(themes.background.slice(1, 3), 16) < 128;
  const glass = designSystem.glassMorphism[designTheme];

  const getButtonGlassStyle = () => {
    if (designTheme === 'hybrid') {
      return {
        backgroundColor: `rgba(${isDarkBg ? '60, 60, 60' : '240, 240, 240'}, 0.9)`,
        color: themes.text,
        border: `1px solid ${themes.border}`,
        backdropFilter: 'none'
      };
    }

    return {
      backgroundColor: `rgba(${isDarkBg ? '20, 20, 20' : '255, 255, 255'}, ${glass.bgOpacity})`,
      color: themes.textSecondary,
      border: `1px solid ${glass.borderColor}`,
      backdropFilter: `blur(${glass.blur})`,
      boxShadow: `0 4px 12px rgba(${isDarkBg ? '0, 183, 255' : '0, 0, 0'}, ${glass.glowAlpha * 0.6})`
    };
  };

  const hasPrice = price && (typeof price.value === 'number' || typeof price.value === 'string') && price.value !== null && price.value !== undefined;
  const hasPriceChange = priceChange && (typeof priceChange.amount === 'number' || typeof priceChange.amount === 'string') && priceChange.amount !== null && priceChange.amount !== undefined;

  // Build images array from various sources
  const images = [];
  if (vinyl.images && Array.isArray(vinyl.images)) {
    images.push(...vinyl.images.map(img => img.url || img));
  }
  if (vinyl.cover_image && !images.includes(vinyl.cover_image)) {
    images.push(vinyl.cover_image);
  }
  if (vinyl.thumb && !images.includes(vinyl.thumb)) {
    images.push(vinyl.thumb);
  }

  const currentImage = images[currentImageIndex] || vinyl.thumb || vinyl.cover_image || '/placeholder.jpg';

  // Memoize event handlers to prevent unnecessary re-renders
  const handleMouseEnter = useCallback((e) => {
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = designSystem.shadows.lg;
    e.currentTarget.style.borderColor = themes.primary;
  }, [themes.primary]);

  const handleMouseLeave = useCallback((e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = designSystem.shadows.md;
    e.currentTarget.style.borderColor = themes.border;
  }, [themes.border]);

  const handleViewDetails = useCallback(() => {
    if (onViewDetails) {
      onViewDetails(vinyl);
    }
  }, [onViewDetails, vinyl]);

  const handleToggleFavorite = useCallback((e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(vinyl.id);
    }
  }, [onToggleFavorite, vinyl.id]);

  const handleRefreshPrice = useCallback((e) => {
    e.stopPropagation();
    if (onRefreshPrice) {
      onRefreshPrice(vinyl.id);
    }
  }, [onRefreshPrice, vinyl.id]);

  const handleRemove = useCallback((e) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(vinyl.id);
    }
  }, [onRemove, vinyl.id]);

  const handleAddToCollection = useCallback((e) => {
    e.stopPropagation();
    if (onAddToCollection) {
      // Include price data when adding to collection
      const itemWithPrice = {
        ...vinyl,
        price: price || null,
        lowestPrice: price?.value || null,
        priceHistory: price ? [{
          date: new Date().toISOString(),
          price: price.value,
          currency: price.currency
        }] : []
      };
      onAddToCollection(itemWithPrice);
    }
  }, [onAddToCollection, vinyl, price]);

  const handleReloadCover = useCallback(async (e) => {
    e.stopPropagation();
    if (onReloadCover) {
      setIsReloadingCover(true);
      await onReloadCover(vinyl.id);
      setIsReloadingCover(false);
    }
  }, [onReloadCover, vinyl.id]);

  const handleViewDetailsButton = useCallback((e) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(vinyl);
    }
  }, [onViewDetails, vinyl]);

  const handlePriceHistory = useCallback((e) => {
    e.stopPropagation();
    if (onPriceHistory) {
      onPriceHistory(vinyl.id);
    }
  }, [onPriceHistory, vinyl.id]);

  // Check if price history exists
  const hasPriceHistory = () => {
    try {
      const history = getPriceHistory(vinyl.id);
      return history && history.length > 0;
    } catch (error) {
      return false;
    }
  };

  return (
    <div
      style={{
        backgroundColor: themes.surface,
        borderRadius: '12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: `all ${designSystem.transitions.base}`,
        boxShadow: designSystem.shadows.md,
        cursor: 'pointer',
        border: `1px solid ${themes.border}`
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Cover Image */}
      <div
        onClick={handleViewDetails}
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '100%',
          backgroundColor: themes.surfaceVariant,
          overflow: 'hidden'
        }}
      >
        <img
          src={currentImage}
          alt={vinyl.title}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          loading="lazy"
          onError={() => setImageLoadError(true)}
          onLoad={() => setImageLoadError(false)}
        />

        {/* Image Navigation */}
        {images.length > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: designSystem.spacing.xs,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '6px',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.7)',
              padding: `${designSystem.spacing.xs} ${designSystem.spacing.sm}`,
              borderRadius: designSystem.borderRadius.circle
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
              disabled={currentImageIndex === 0}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: currentImageIndex === 0 ? 'not-allowed' : 'pointer',
                opacity: currentImageIndex === 0 ? 0.4 : 1,
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                lineHeight: '1em',
                margin: 0
              }}
            >
              ❮
            </button>
            <span style={{ minWidth: '26px', textAlign: 'center', fontSize: '12px', color: 'white', fontWeight: 600 }}>
              {currentImageIndex + 1}/{images.length}
            </span>
            <button
              onClick={() => setCurrentImageIndex(Math.min(images.length - 1, currentImageIndex + 1))}
              disabled={currentImageIndex === images.length - 1}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: currentImageIndex === images.length - 1 ? 'not-allowed' : 'pointer',
                opacity: currentImageIndex === images.length - 1 ? 0.4 : 1,
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                lineHeight: '1em',
                margin: 0
              }}
            >
              ❯
            </button>
          </div>
        )}

        {/* Favorite Badge */}
        {vinyl.isFavorite && (
          <div
            style={{
              position: 'absolute',
              top: designSystem.spacing.sm,
              right: designSystem.spacing.sm,
              backgroundColor: themes.error,
              borderRadius: designSystem.borderRadius.circle,
              padding: designSystem.spacing.xs,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Heart size={12} fill="white" color="white" />
          </div>
        )}

        {/* Update Price Button */}
        {inCollection && (
          <button
            onClick={handleRefreshPrice}
            disabled={isRefreshing}
            style={{
              position: 'absolute',
              top: designSystem.spacing.sm,
              right: vinyl.isFavorite ? '40px' : designSystem.spacing.sm,
              backgroundColor: themes.primary,
              border: 'none',
              borderRadius: designSystem.borderRadius.circle,
              padding: designSystem.spacing.xs,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              opacity: isRefreshing ? 0.6 : 1,
              transition: designSystem.transitions.fast
            }}
            onMouseEnter={(e) => {
              if (!isRefreshing) {
                e.currentTarget.style.backgroundColor = themes.primaryHover;
                e.currentTarget.style.transform = 'scale(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = themes.primary;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <RefreshCw
              size={14}
              color="white"
              style={{
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
              }}
            />
          </button>
        )}

        {/* Price Change Indicator */}
        {hasPriceChange && (
          <div
            style={{
              position: 'absolute',
              top: designSystem.spacing.sm,
              left: designSystem.spacing.sm,
              backgroundColor:
                priceChange.amount > 0
                  ? themes.success
                  : priceChange.amount < 0
                  ? themes.error
                  : themes.textSecondary,
              color: 'white',
              padding: `${designSystem.spacing.xs} ${designSystem.spacing.sm}`,
              borderRadius: designSystem.borderRadius.sm,
              fontSize: designSystem.typography.sizes.xs,
              fontWeight: designSystem.typography.weights.semibold,
              display: 'flex',
              alignItems: 'center',
              gap: designSystem.spacing.xs
            }}
          >
            {priceChange.amount > 0 ? (
              <TrendingUp size={10} />
            ) : (
              <TrendingDown size={10} />
            )}
            {typeof priceChange.amount === 'number' && !isNaN(priceChange.amount)
              ? Math.abs(priceChange.amount).toFixed(2)
              : '0.00'} EUR
          </div>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          padding: designSystem.spacing.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: designSystem.spacing.md,
          flex: 1
        }}
      >
        {/* Title */}
        <h3
          onClick={() => onViewDetails && onViewDetails(vinyl)}
          style={{
            fontSize: designSystem.typography.sizes.base,
            fontWeight: 600,
            color: themes.text,
            margin: 0,
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {vinyl.title}
        </h3>

        {/* Year & Country */}
        <div
          style={{
            display: 'flex',
            gap: designSystem.spacing.md,
            fontSize: designSystem.typography.sizes.sm,
            color: themes.textSecondary
          }}
        >
          {vinyl.year && <span>{vinyl.year}</span>}
          {vinyl.country && <span>•</span>}
          {vinyl.country && <span>{vinyl.country}</span>}
        </div>

        {/* Price */}
        <div style={{ marginTop: 'auto', paddingTop: designSystem.spacing.md }}>
          {hasPrice ? (
            <div
              style={{
                fontSize: designSystem.typography.sizes.xl,
                fontWeight: 700,
                color: themes.primary,
                letterSpacing: '-0.5px'
              }}
            >
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {price.currency} {
                  typeof price.value === 'number'
                    ? price.value.toFixed(2)
                    : (price.value && !isNaN(parseFloat(price.value))
                        ? parseFloat(price.value).toFixed(2)
                        : '0.00')
                }
              </span>
            </div>
          ) : (
            <div
              style={{
                fontSize: designSystem.typography.sizes.sm,
                color: themes.textTertiary
              }}
            >
              No price data
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginTop: designSystem.spacing.md,
            paddingTop: designSystem.spacing.md,
            borderTop: `1px solid ${themes.border}`
          }}
        >
          {inCollection ? (
            <>
              {/* Collection Actions */}
              {onToggleFavorite && (
                <button
                  onClick={handleToggleFavorite}
                  style={{
                    flex: 1,
                    padding: designSystem.spacing.sm,
                    backgroundColor: vinyl.isFavorite ? themes.error : getButtonGlassStyle().backgroundColor,
                    color: vinyl.isFavorite ? 'white' : getButtonGlassStyle().color,
                    border: vinyl.isFavorite ? 'none' : getButtonGlassStyle().border,
                    borderRadius: designSystem.borderRadius.sm,
                    backdropFilter: vinyl.isFavorite ? 'none' : getButtonGlassStyle().backdropFilter,
                    boxShadow: vinyl.isFavorite ? 'none' : getButtonGlassStyle().boxShadow,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: designSystem.transitions.fast
                  }}
                  title="Toggle Favorite"
                >
                  <Heart
                    size={16}
                    fill={vinyl.isFavorite ? 'currentColor' : 'none'}
                  />
                </button>
              )}

              {onRefreshPrice && (
                <button
                  onClick={handleRefreshPrice}
                  disabled={isRefreshing}
                  style={{
                    flex: 1,
                    padding: designSystem.spacing.sm,
                    ...getButtonGlassStyle(),
                    borderRadius: designSystem.borderRadius.sm,
                    cursor: isRefreshing ? 'not-allowed' : 'pointer',
                    opacity: isRefreshing ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: designSystem.transitions.fast
                  }}
                  title="Refresh Price"
                >
                  <RefreshCw
                    size={16}
                    style={{
                      animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                    }}
                  />
                </button>
              )}

              {onPriceHistory && hasPriceHistory() && (
                <button
                  onClick={handlePriceHistory}
                  style={{
                    flex: 1,
                    padding: designSystem.spacing.sm,
                    ...getButtonGlassStyle(),
                    borderRadius: designSystem.borderRadius.sm,
                    color: themes.primary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: designSystem.transitions.fast
                  }}
                  title="Price History"
                >
                  <TrendingUpIcon size={16} />
                </button>
              )}

              {onViewDetails && (
                <button
                  onClick={handleViewDetailsButton}
                  style={{
                    flex: 1,
                    padding: designSystem.spacing.sm,
                    ...getButtonGlassStyle(),
                    borderRadius: designSystem.borderRadius.sm,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: designSystem.transitions.fast
                  }}
                  title="View Details"
                >
                  <Eye size={16} />
                </button>
              )}

              {onReloadCover && (
                <button
                  onClick={handleReloadCover}
                  disabled={isReloadingCover}
                  style={{
                    flex: 1,
                    padding: designSystem.spacing.sm,
                    ...getButtonGlassStyle(),
                    borderRadius: designSystem.borderRadius.sm,
                    cursor: isReloadingCover ? 'not-allowed' : 'pointer',
                    opacity: isReloadingCover ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: designSystem.transitions.fast
                  }}
                  title="Reload Cover"
                >
                  <Image
                    size={16}
                    style={{
                      animation: isReloadingCover ? 'spin 1s linear infinite' : 'none'
                    }}
                  />
                </button>
              )}

              {onRemove && (
                <button
                  onClick={handleRemove}
                  style={{
                    flex: 1,
                    padding: designSystem.spacing.sm,
                    ...getButtonGlassStyle(),
                    borderRadius: designSystem.borderRadius.sm,
                    color: themes.error,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: designSystem.transitions.fast
                  }}
                  title="Remove from Collection"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </>
          ) : (
            <>
              {/* Search Result Actions */}
              {onAddToCollection && (
                <button
                  onClick={handleAddToCollection}
                  style={{
                    flex: 1,
                    padding: `${designSystem.spacing.sm} ${designSystem.spacing.md}`,
                    backgroundColor: themes.primary,
                    color: themes.buttonText,
                    border: 'none',
                    borderRadius: designSystem.borderRadius.sm,
                    backdropFilter: designTheme !== 'hybrid' ? `blur(${glass.blur})` : 'none',
                    boxShadow: designTheme !== 'hybrid' ? `0 4px 12px rgba(${isDarkBg ? '0, 183, 255' : '0, 0, 0'}, ${glass.glowAlpha * 0.4})` : 'none',
                    cursor: 'pointer',
                    fontSize: designSystem.typography.sizes.sm,
                    fontWeight: 600,
                    transition: designSystem.transitions.fast,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = themes.primaryHover;
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = themes.primary;
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Plus size={16} />
                  Add to Collection
                </button>
              )}

              {onViewDetails && (
                <button
                  onClick={handleViewDetailsButton}
                  style={{
                    padding: designSystem.spacing.sm,
                    ...getButtonGlassStyle(),
                    borderRadius: designSystem.borderRadius.sm,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: designSystem.transitions.fast
                  }}
                  title="View Details"
                >
                  <Eye size={16} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

VinylCard.propTypes = {
  vinyl: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    artist: PropTypes.string,
    year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string,
    format: PropTypes.string,
    genre: PropTypes.arrayOf(PropTypes.string),
    cover_image: PropTypes.string,
    thumb: PropTypes.string,
    isFavorite: PropTypes.bool
  }).isRequired,
  price: PropTypes.shape({
    value: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired
  }),
  isRefreshing: PropTypes.bool,
  priceChange: PropTypes.shape({
    amount: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired
  }),
  inCollection: PropTypes.bool,
  onToggleFavorite: PropTypes.func,
  onRefreshPrice: PropTypes.func,
  onRemove: PropTypes.func,
  onViewDetails: PropTypes.func,
  onAddToCollection: PropTypes.func,
  onPriceHistory: PropTypes.func,
  themes: PropTypes.shape({
    primary: PropTypes.string.isRequired,
    surface: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    textSecondary: PropTypes.string.isRequired,
    border: PropTypes.string.isRequired
  }).isRequired
};

VinylCard.defaultProps = {
  price: null,
  isRefreshing: false,
  priceChange: null,
  inCollection: false,
  onToggleFavorite: null,
  onRefreshPrice: null,
  onRemove: null,
  onViewDetails: null,
  onAddToCollection: null,
  onPriceHistory: null
};

export default VinylCard;
