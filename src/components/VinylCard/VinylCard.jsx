import React from 'react';
import PropTypes from 'prop-types';
import { Heart, RefreshCw, Trash2, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { designSystem } from '../../designsystem';

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
  themes
}) {
  const hasPrice = price && typeof price.value === 'number';
  const hasPriceChange = priceChange && typeof priceChange.amount === 'number';

  return (
    <div
      style={{
        backgroundColor: themes.surface,
        borderRadius: designSystem.borderRadius.md,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: designSystem.transitions.base,
        boxShadow: designSystem.shadows.sm,
        cursor: 'pointer',
        border: `1px solid ${themes.border}`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = designSystem.shadows.lg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = designSystem.shadows.sm;
      }}
    >
      {/* Cover Image */}
      <div
        onClick={() => onViewDetails && onViewDetails(vinyl)}
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '100%',
          backgroundColor: themes.surfaceVariant,
          overflow: 'hidden'
        }}
      >
        <img
          src={vinyl.thumb || vinyl.cover_image || '/placeholder.jpg'}
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
        />

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
              : '0.00'} {priceChange.currency || 'USD'}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          padding: designSystem.spacing.md,
          display: 'flex',
          flexDirection: 'column',
          gap: designSystem.spacing.sm,
          flex: 1
        }}
      >
        {/* Title */}
        <h3
          onClick={() => onViewDetails && onViewDetails(vinyl)}
          style={{
            fontSize: designSystem.typography.sizes.base,
            fontWeight: designSystem.typography.weights.semibold,
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

        {/* Year */}
        {vinyl.year && (
          <div
            style={{
              fontSize: designSystem.typography.sizes.sm,
              color: themes.textSecondary
            }}
          >
            {vinyl.year}
          </div>
        )}

        {/* Price */}
        <div style={{ marginTop: 'auto' }}>
          {hasPrice ? (
            <div
              style={{
                fontSize: designSystem.typography.sizes.lg,
                fontWeight: designSystem.typography.weights.bold,
                color: themes.primary
              }}
            >
              {price.currency} {typeof price.value === 'number' ? price.value.toFixed(2) : price.value}
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
            gap: designSystem.spacing.sm,
            marginTop: designSystem.spacing.sm,
            paddingTop: designSystem.spacing.sm,
            borderTop: `1px solid ${themes.borderLight}`
          }}
        >
          {inCollection ? (
            <>
              {/* Collection Actions */}
              {onToggleFavorite && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(vinyl.id);
                  }}
                  style={{
                    flex: 1,
                    padding: designSystem.spacing.sm,
                    backgroundColor: vinyl.isFavorite
                      ? themes.error
                      : 'transparent',
                    color: vinyl.isFavorite ? 'white' : themes.textSecondary,
                    border: vinyl.isFavorite
                      ? 'none'
                      : `1px solid ${themes.border}`,
                    borderRadius: designSystem.borderRadius.sm,
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefreshPrice(vinyl.id);
                  }}
                  disabled={isRefreshing}
                  style={{
                    flex: 1,
                    padding: designSystem.spacing.sm,
                    backgroundColor: 'transparent',
                    color: themes.textSecondary,
                    border: `1px solid ${themes.border}`,
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

              {onViewDetails && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(vinyl);
                  }}
                  style={{
                    flex: 1,
                    padding: designSystem.spacing.sm,
                    backgroundColor: 'transparent',
                    color: themes.textSecondary,
                    border: `1px solid ${themes.border}`,
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

              {onRemove && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(vinyl.id);
                  }}
                  style={{
                    flex: 1,
                    padding: designSystem.spacing.sm,
                    backgroundColor: 'transparent',
                    color: themes.error,
                    border: `1px solid ${themes.border}`,
                    borderRadius: designSystem.borderRadius.sm,
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
                  onClick={(e) => {
                    e.stopPropagation();
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
                  }}
                  style={{
                    flex: 1,
                    padding: `${designSystem.spacing.sm} ${designSystem.spacing.md}`,
                    backgroundColor: themes.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: designSystem.borderRadius.sm,
                    cursor: 'pointer',
                    fontSize: designSystem.typography.sizes.sm,
                    fontWeight: designSystem.typography.weights.medium,
                    transition: designSystem.transitions.fast
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = themes.primaryHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = themes.primary;
                  }}
                >
                  Add to Collection
                </button>
              )}

              {onViewDetails && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(vinyl);
                  }}
                  style={{
                    padding: designSystem.spacing.sm,
                    backgroundColor: 'transparent',
                    color: themes.textSecondary,
                    border: `1px solid ${themes.border}`,
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
  onAddToCollection: null
};

export default VinylCard;
