import React, { useRef, useMemo } from 'react';
import { RefreshCw, Grid, List, X, Music } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { designSystem } from '../../designsystem';
import VinylCard from '../../components/VinylCard';
import FilterChip from '../../components/FilterChip';
import EmptyState from '../../components/EmptyState';
import { useDiscoverStore } from '../../stores/discoverStore';

/**
 * CollectionView Component
 *
 * Main collection management interface for displaying and organizing vinyl records
 *
 * Features:
 * - Collection header with count and total value
 * - Update all prices functionality
 * - Search within collection
 * - Active filter badges (genre, decade, format)
 * - View toggle (grid/list)
 * - Sort options (artist, album, price, date)
 * - Filter options (all/favorites)
 * - Empty states for different scenarios
 * - Grid and list view display
 *
 * @component
 */
export default function CollectionView({
  // Collection Data
  collection,
  filteredAndSorted,
  collectionValue,

  // Search & Filter State
  collectionSearch,
  onCollectionSearchChange,
  collectionFilter,
  onCollectionFilterChange,
  activeGenreFilter,
  onActiveGenreFilterChange,
  activeDecadeFilter,
  onActiveDecadeFilterChange,
  activeFormatFilter,
  onActiveFormatFilterChange,

  // View & Sort State
  collectionView,
  onCollectionViewChange,
  sortBy,
  onSortByChange,

  // Price State
  isUpdatingAllPrices,
  refreshingPrices,
  priceChanges,

  // Actions
  onUpdateAllPrices,
  onToggleFavorite,
  onRefreshPrice,
  onRemove,
  onViewDetails,
  onNavigateToSearch,
  getPriceChange,

  // Theme
  themes
}) {
  const parentRef = useRef(null);
  const wishlistCount = useDiscoverStore((state) => state.wishlist.length);

  const handleClearAllFilters = () => {
    onActiveGenreFilterChange(null);
    onActiveDecadeFilterChange(null);
    onActiveFormatFilterChange(null);
  };

  const hasActiveFilters = activeGenreFilter || activeDecadeFilter || activeFormatFilter;

  // Virtual scrolling configuration
  // For grid view, we calculate columns based on minimum card width (160px + gap)
  // For list view, each item is full width
  const columnCount = collectionView === 'grid'
    ? Math.floor((parentRef.current?.offsetWidth || 800) / (160 + 16)) || 1
    : 1;

  const rowVirtualizer = useVirtualizer({
    count: collectionView === 'grid'
      ? Math.ceil(filteredAndSorted.length / columnCount)
      : filteredAndSorted.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => collectionView === 'grid' ? 350 : 120,
    overscan: 5
  });

  return (
    <div
      ref={parentRef}
      style={{
        width: '100%',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        padding: designSystem.spacing.md,
        paddingTop: '72px',
        paddingBottom: `calc(${designSystem.spacing.nav} + ${designSystem.spacing.md})`
      }}
    >
      {/* Header with Count and Update Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: designSystem.spacing.lg
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: designSystem.spacing.sm }}>
            <h2
              style={{
                fontSize: designSystem.typography.sizes.xl,
                fontWeight: designSystem.typography.weights.bold,
                color: themes.text,
                margin: 0
              }}
            >
              Collection
            </h2>
            <span
              style={{
                backgroundColor: themes.primary,
                color: '#FFFFFF',
                padding: `${designSystem.spacing.xs} ${designSystem.spacing.sm}`,
                borderRadius: designSystem.borderRadius.sm,
                fontSize: designSystem.typography.sizes.sm,
                fontWeight: designSystem.typography.weights.medium
              }}
            >
              {filteredAndSorted.length}
              {filteredAndSorted.length !== collection.length
                ? `/${collection.length}`
                : ''}
            </span>
          </div>
          {collectionValue.count > 0 && (
            <p
              style={{
                fontSize: designSystem.typography.sizes.sm,
                color: themes.primary,
                margin: `${designSystem.spacing.xs} 0 0 0`,
                fontWeight: designSystem.typography.weights.medium
              }}
            >
              Total Value: {collectionValue.currency} {collectionValue.total.toFixed(2)}
            </p>
          )}
        </div>
        <button
          onClick={onUpdateAllPrices}
          disabled={isUpdatingAllPrices}
          style={{
            padding: `${designSystem.spacing.sm} ${designSystem.spacing.md}`,
            minHeight: designSystem.touchTarget.min,
            backgroundColor: themes.primary,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: designSystem.borderRadius.sm,
            cursor: isUpdatingAllPrices ? 'not-allowed' : 'pointer',
            opacity: isUpdatingAllPrices ? 0.6 : 1,
            fontSize: designSystem.typography.sizes.sm,
            fontWeight: designSystem.typography.weights.medium,
            display: 'flex',
            alignItems: 'center',
            gap: designSystem.spacing.xs
          }}
        >
          {isUpdatingAllPrices ? (
            <>
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Updating...</span>
            </>
          ) : (
            'Update Prices'
          )}
        </button>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: designSystem.spacing.md }}>
        <input
          type="text"
          value={collectionSearch}
          onChange={(e) => onCollectionSearchChange(e.target.value)}
          placeholder="Search by artist or album..."
          style={{
            width: '100%',
            padding: designSystem.spacing.md,
            fontSize: designSystem.typography.sizes.base,
            backgroundColor: themes.surface,
            color: themes.text,
            border: `1px solid ${themes.border}`,
            borderRadius: designSystem.borderRadius.md,
            outline: 'none',
            transition: designSystem.transitions.fast
          }}
          onFocus={(e) => (e.target.style.borderColor = themes.primary)}
          onBlur={(e) => (e.target.style.borderColor = themes.border)}
        />
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: designSystem.spacing.xs,
            marginBottom: designSystem.spacing.md,
            padding: designSystem.spacing.md,
            backgroundColor: themes.primary10,
            border: `1px solid ${themes.primary20}`,
            borderRadius: designSystem.borderRadius.md
          }}
        >
          <span
            style={{
              fontSize: designSystem.typography.sizes.sm,
              color: themes.textSecondary,
              display: 'flex',
              alignItems: 'center',
              paddingRight: designSystem.spacing.sm
            }}
          >
            Filters:
          </span>

          {activeGenreFilter && (
            <FilterChip
              label="Genre"
              value={activeGenreFilter}
              onRemove={() => onActiveGenreFilterChange(null)}
              variant="primary"
              themes={themes}
            />
          )}

          {activeDecadeFilter && (
            <FilterChip
              label="Decade"
              value={activeDecadeFilter}
              onRemove={() => onActiveDecadeFilterChange(null)}
              variant="primary"
              themes={themes}
            />
          )}

          {activeFormatFilter && (
            <FilterChip
              label="Format"
              value={activeFormatFilter}
              onRemove={() => onActiveFormatFilterChange(null)}
              variant="primary"
              themes={themes}
            />
          )}

          <button
            onClick={handleClearAllFilters}
            style={{
              marginLeft: 'auto',
              padding: `${designSystem.spacing.xs} ${designSystem.spacing.sm}`,
              backgroundColor: 'transparent',
              color: themes.textSecondary,
              border: `1px solid ${themes.border}`,
              borderRadius: designSystem.borderRadius.sm,
              cursor: 'pointer',
              fontSize: designSystem.typography.sizes.sm,
              fontWeight: designSystem.typography.weights.medium,
              transition: designSystem.transitions.fast
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = themes.hoverOverlay;
              e.currentTarget.style.borderColor = themes.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = themes.border;
            }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* View and Sort Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: designSystem.spacing.md,
          marginBottom: designSystem.spacing.lg,
          padding: designSystem.spacing.md,
          backgroundColor: themes.surface,
          border: `1px solid ${themes.border}`,
          borderRadius: designSystem.borderRadius.md
        }}
      >
        {/* View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: designSystem.spacing.xs }}>
          <button
            onClick={() => onCollectionViewChange('grid')}
            style={{
              padding: designSystem.spacing.sm,
              minWidth: designSystem.touchTarget.min,
              minHeight: designSystem.touchTarget.min,
              backgroundColor:
                collectionView === 'grid' ? themes.primary : 'transparent',
              color: collectionView === 'grid' ? '#FFFFFF' : themes.textSecondary,
              border: `1px solid ${
                collectionView === 'grid' ? themes.primary : themes.border
              }`,
              borderRadius: designSystem.borderRadius.sm,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Grid view"
          >
            <Grid size={20} />
          </button>
          <button
            onClick={() => onCollectionViewChange('list')}
            style={{
              padding: designSystem.spacing.sm,
              minWidth: designSystem.touchTarget.min,
              minHeight: designSystem.touchTarget.min,
              backgroundColor:
                collectionView === 'list' ? themes.primary : 'transparent',
              color: collectionView === 'list' ? '#FFFFFF' : themes.textSecondary,
              border: `1px solid ${
                collectionView === 'list' ? themes.primary : themes.border
              }`,
              borderRadius: designSystem.borderRadius.sm,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="List view"
          >
            <List size={20} />
          </button>
        </div>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value)}
          style={{
            flex: 1,
            minWidth: '150px',
            padding: designSystem.spacing.sm,
            fontSize: designSystem.typography.sizes.sm,
            backgroundColor: themes.background,
            color: themes.text,
            border: `1px solid ${themes.border}`,
            borderRadius: designSystem.borderRadius.sm,
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="artist-asc">Artist (A-Z)</option>
          <option value="artist-desc">Artist (Z-A)</option>
          <option value="album-asc">Album (A-Z)</option>
          <option value="album-desc">Album (Z-A)</option>
          <option value="price-asc">Price (Low to High)</option>
          <option value="price-desc">Price (High to Low)</option>
          <option value="date-new">Recently Added</option>
          <option value="date-old">Oldest First</option>
        </select>

        {/* Filter Dropdown */}
        <select
          value={collectionFilter}
          onChange={(e) => onCollectionFilterChange(e.target.value)}
          style={{
            minWidth: '120px',
            padding: designSystem.spacing.sm,
            fontSize: designSystem.typography.sizes.sm,
            backgroundColor: themes.background,
            color: themes.text,
            border: `1px solid ${themes.border}`,
            borderRadius: designSystem.borderRadius.sm,
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Items</option>
          <option value="favorites">Favorites Only</option>
        </select>

        {/* Wishlist Filter Button */}
        <button
          onClick={() => {
            onCollectionFilterChange(
              collectionFilter === 'wishlist' ? 'all' : 'wishlist'
            );
          }}
          style={{
            padding: `${designSystem.spacing.sm} ${designSystem.spacing.md}`,
            minHeight: designSystem.touchTarget.min,
            backgroundColor: collectionFilter === 'wishlist' ? themes.primary : themes.background,
            color: collectionFilter === 'wishlist' ? '#FFFFFF' : themes.text,
            border: `1px solid ${
              collectionFilter === 'wishlist' ? themes.primary : themes.border
            }`,
            borderRadius: designSystem.borderRadius.sm,
            fontSize: designSystem.typography.sizes.sm,
            fontWeight: designSystem.typography.weights.medium,
            cursor: 'pointer',
            transition: designSystem.transitions.fast
          }}
          onMouseEnter={(e) => {
            if (collectionFilter !== 'wishlist') {
              e.currentTarget.style.borderColor = themes.primary;
            }
          }}
          onMouseLeave={(e) => {
            if (collectionFilter !== 'wishlist') {
              e.currentTarget.style.borderColor = themes.border;
            }
          }}
        >
          Wishlist ({wishlistCount})
        </button>
      </div>

      {/* Empty State or Collection Grid */}
      {filteredAndSorted.length === 0 ? (
        <EmptyState
          type={
            collectionSearch
              ? 'search'
              : collectionFilter === 'favorites'
              ? 'favorites'
              : collectionFilter === 'wishlist'
              ? 'favorites'
              : 'collection'
          }
          action={
            collectionFilter === 'all' && !collectionSearch
              ? onNavigateToSearch
              : collectionSearch
              ? () => onCollectionSearchChange('')
              : undefined
          }
          actionLabel={
            collectionFilter === 'all' && !collectionSearch
              ? 'Start Searching'
              : collectionSearch
              ? 'Clear Search'
              : undefined
          }
          themes={themes}
        />
      ) : (
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const startIndex = virtualRow.index * columnCount;
            const items = filteredAndSorted.slice(startIndex, startIndex + columnCount);

            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  display: collectionView === 'grid' ? 'grid' : 'flex',
                  gridTemplateColumns:
                    collectionView === 'grid' ? 'repeat(auto-fill, minmax(160px, 1fr))' : 'unset',
                  flexDirection: collectionView === 'list' ? 'column' : 'unset',
                  gap:
                    collectionView === 'list' ? designSystem.spacing.sm : designSystem.spacing.md
                }}
              >
                {items.map((item) => {
                  // Get price change from history (for long-term tracking)
                  const historicalPriceChange = getPriceChange(item);
                  // Get temporary price change from recent refresh (shows for 5 seconds)
                  const tempPriceChange = priceChanges[item.id];

                  // Normalize the price change format
                  // tempPriceChange has {amount, currency}
                  // historicalPriceChange has {absolute, value, current, previous, ...}
                  let priceChange = null;
                  if (tempPriceChange) {
                    priceChange = tempPriceChange;
                  } else if (historicalPriceChange) {
                    priceChange = {
                      amount: historicalPriceChange.absolute,
                      currency: item.price?.currency || 'USD'
                    };
                  }

                  // Support both price structures for backward compatibility
                  const priceData = item.price || (item.lowestPrice ? { value: item.lowestPrice, currency: 'USD' } : null);

                  return (
                    <VinylCard
                      key={item.id}
                      vinyl={item}
                      price={priceData}
                      isRefreshing={refreshingPrices[item.id]}
                      priceChange={priceChange}
                      inCollection={true}
                      isFavorite={item.isFavorite}
                      onToggleFavorite={() => onToggleFavorite(item.id)}
                      onRefreshPrice={() => onRefreshPrice(item.id, true)}
                      onRemove={() => onRemove(item.id)}
                      onViewDetails={() => onViewDetails(item)}
                      themes={themes}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
