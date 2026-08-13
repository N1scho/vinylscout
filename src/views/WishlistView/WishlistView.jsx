import React, { useMemo } from 'react';
import { designSystem } from '../../designsystem';
import { useDiscoverStore } from '../../stores/discoverStore';
import VinylCard from '../../components/VinylCard';
import EmptyState from '../../components/EmptyState';

export default function WishlistView({ themes, allAlbums, wishlistIds, onNavigateToDiscover, onAddToCollection, onViewDetails, onRefreshPrice }) {
  const { toggleWishlist } = useDiscoverStore();

  const wishlistItems = useMemo(() => {
    if (!allAlbums || !wishlistIds) return [];
    const albumMap = new Map(allAlbums.map(a => [String(a.id), a]));
    return wishlistIds
      .map(id => {
        const item = albumMap.get(String(id));
        if (!item) return null;
        return {
          ...item,
          cover_image: item.coverUrl || item.cover_image,
          title: item.album || item.title
        };
      })
      .filter(Boolean);
  }, [allAlbums, wishlistIds]);


  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div
        style={{
          width: '100%',
          height: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: themes.background,
          padding: designSystem.spacing.md,
          paddingTop: '72px',
          paddingBottom: `calc(${designSystem.spacing.nav} + ${designSystem.spacing.md})`
        }}
      >
        <EmptyState
          type="collection"
          action={onNavigateToDiscover}
          actionLabel="Browse Discover"
          themes={themes}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: themes.background,
        padding: designSystem.spacing.md,
        paddingTop: '72px',
        paddingBottom: `calc(${designSystem.spacing.nav} + ${designSystem.spacing.md})`
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: designSystem.spacing.lg,
          paddingBottom: designSystem.spacing.md,
          borderBottom: `1px solid ${themes.border}`
        }}
      >
        <h1
          style={{
            fontSize: designSystem.typography.sizes['2xl'],
            fontWeight: 700,
            color: themes.text,
            margin: '0 0 8px 0'
          }}
        >
          Wishlist
        </h1>
        <p
          style={{
            fontSize: designSystem.typography.sizes.sm,
            color: themes.textSecondary,
            margin: 0
          }}
        >
          {wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: designSystem.spacing.md
        }}
      >
        {wishlistItems.map((item) => (
          <VinylCard
            key={item.id}
            vinyl={item}
            price={null}
            inCollection={false}
            onRemove={() => toggleWishlist(item.id)}
            onViewDetails={() => onViewDetails(item)}
            onAddToCollection={() => onAddToCollection(item)}
            onRefreshPrice={onRefreshPrice ? () => onRefreshPrice(item.id, false) : undefined}
            themes={themes}
          />
        ))}
      </div>
    </div>
  );
}
