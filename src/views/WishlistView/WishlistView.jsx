import React, { useState, useMemo } from 'react';
import { Heart, Trash2, Plus } from 'lucide-react';
import { designSystem } from '../../designsystem';
import { useDiscoverStore } from '../../stores/discoverStore';
import { useCollectionStore } from '../../stores/collectionStore';
import VinylCard from '../../components/VinylCard';
import EmptyState from '../../components/EmptyState';

export default function WishlistView({ themes, allAlbums, wishlistIds, onNavigateToDiscover, onAddToCollection, onViewDetails }) {
  const { toggleWishlist } = useDiscoverStore();
  const [selectedAlbumIndex, setSelectedAlbumIndex] = useState(null);

  const wishlistItems = useMemo(() => {
    if (!allAlbums || !wishlistIds) return [];
    const albumMap = new Map(allAlbums.map(a => [String(a.id), a]));
    return wishlistIds
      .map(id => albumMap.get(String(id)))
      .filter(Boolean);
  }, [allAlbums, wishlistIds]);

  const handleAddToCollection = (item) => {
    if (onViewDetails) {
      onViewDetails(item);
    }
  };

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
          <div
            key={item.id}
            style={{
              position: 'relative',
              backgroundColor: themes.surface,
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: designSystem.shadows.md,
              border: `1px solid ${themes.border}`,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Image */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                paddingTop: '100%',
                backgroundColor: themes.surfaceVariant,
                overflow: 'hidden'
              }}
            >
              <img
                src={item.coverUrl || item.cover_image || item.thumb || '/placeholder.jpg'}
                alt={item.album || item.title}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              {/* Remove from Wishlist */}
              <button
                onClick={() => toggleWishlist(item.id)}
                style={{
                  position: 'absolute',
                  top: designSystem.spacing.sm,
                  right: designSystem.spacing.sm,
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: themes.error,
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: designSystem.transitions.fast
                }}
                title="Remove from Wishlist"
              >
                <Heart size={16} fill="white" />
              </button>
            </div>

            {/* Info */}
            <div
              style={{
                padding: designSystem.spacing.lg,
                display: 'flex',
                flexDirection: 'column',
                gap: designSystem.spacing.sm,
                flex: 1
              }}
            >
              <h3
                style={{
                  fontSize: designSystem.typography.sizes.sm,
                  fontWeight: 600,
                  color: themes.text,
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {item.album || item.title}
              </h3>

              <p
                style={{
                  fontSize: designSystem.typography.sizes.xs,
                  color: themes.textSecondary,
                  margin: 0
                }}
              >
                {item.artist || 'Unknown'}
              </p>

              {/* Add to Collection Button */}
              <button
                onClick={() => handleAddToCollection(item)}
                style={{
                  marginTop: 'auto',
                  padding: designSystem.spacing.sm,
                  backgroundColor: themes.primary,
                  color: themes.buttonText || 'white',
                  border: 'none',
                  borderRadius: designSystem.borderRadius.sm,
                  cursor: 'pointer',
                  fontSize: designSystem.typography.sizes.xs,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: designSystem.spacing.xs,
                  transition: designSystem.transitions.fast
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <Plus size={14} />
                Add to Collection
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
