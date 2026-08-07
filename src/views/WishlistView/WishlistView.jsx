import React, { useState, useMemo, useEffect } from 'react';
import { Heart, Trash2, Plus, RotateCcw } from 'lucide-react';
import { designSystem } from '../../designsystem';
import { useDiscoverStore } from '../../stores/discoverStore';
import { useCollectionStore } from '../../stores/collectionStore';
import { fetchPriceInfo } from '../../services/discogsService';
import VinylCard from '../../components/VinylCard';
import EmptyState from '../../components/EmptyState';

export default function WishlistView({ themes, allAlbums, wishlistIds, onNavigateToDiscover, onAddToCollection, onViewDetails }) {
  const { toggleWishlist } = useDiscoverStore();
  const [selectedAlbumIndex, setSelectedAlbumIndex] = useState(null);
  const [priceCache, setPriceCache] = useState({});
  const [loadingPrices, setLoadingPrices] = useState({});

  const wishlistItems = useMemo(() => {
    if (!allAlbums || !wishlistIds) return [];
    const albumMap = new Map(allAlbums.map(a => [String(a.id), a]));
    return wishlistIds
      .map(id => albumMap.get(String(id)))
      .filter(Boolean);
  }, [allAlbums, wishlistIds]);

  // Fetch prices for all wishlist items on mount/change
  useEffect(() => {
    const fetchAllPrices = async () => {
      for (const item of wishlistItems) {
        if (!priceCache[item.id] && !loadingPrices[item.id]) {
          try {
            setLoadingPrices(prev => ({ ...prev, [item.id]: true }));
            const priceData = await fetchPriceInfo(item.id);
            if (priceData) {
              setPriceCache(prev => ({ ...prev, [item.id]: priceData }));
            }
          } catch (error) {
            console.error(`Failed to fetch price for ${item.id}:`, error);
          } finally {
            setLoadingPrices(prev => ({ ...prev, [item.id]: false }));
          }
        }
      }
    };

    if (wishlistItems.length > 0) {
      fetchAllPrices();
    }
  }, [wishlistItems]);

  const refreshPrice = async (albumId) => {
    try {
      setLoadingPrices(prev => ({ ...prev, [albumId]: true }));
      const priceData = await fetchPriceInfo(albumId);
      if (priceData) {
        setPriceCache(prev => ({ ...prev, [albumId]: priceData }));
      }
    } catch (error) {
      console.error(`Failed to refresh price for ${albumId}:`, error);
    } finally {
      setLoadingPrices(prev => ({ ...prev, [albumId]: false }));
    }
  };

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
            onClick={() => handleAddToCollection(item)}
            style={{
              position: 'relative',
              backgroundColor: themes.surface,
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: designSystem.shadows.md,
              border: `1px solid ${themes.border}`,
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = designSystem.shadows.lg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = designSystem.shadows.md;
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

              {item.year && (
                <p
                  style={{
                    fontSize: designSystem.typography.sizes.xs,
                    color: themes.textSecondary,
                    margin: `${designSystem.spacing.xs} 0 0 0`
                  }}
                >
                  {item.year}
                </p>
              )}

              {/* Price and Refresh Button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: designSystem.spacing.xs
                }}
              >
                <div>
                  {priceCache[item.id] ? (
                    <p
                      style={{
                        fontSize: designSystem.typography.sizes.xs,
                        color: themes.primary,
                        fontWeight: 600,
                        margin: 0
                      }}
                    >
                      {priceCache[item.id].currency} {
                        typeof priceCache[item.id].value === 'number'
                          ? priceCache[item.id].value.toFixed(2)
                          : '—'
                      }
                    </p>
                  ) : loadingPrices[item.id] ? (
                    <p
                      style={{
                        fontSize: designSystem.typography.sizes.xs,
                        color: themes.textTertiary,
                        margin: 0
                      }}
                    >
                      Loading...
                    </p>
                  ) : (
                    <p
                      style={{
                        fontSize: designSystem.typography.sizes.xs,
                        color: themes.textTertiary,
                        margin: 0
                      }}
                    >
                      —
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    refreshPrice(item.id);
                  }}
                  disabled={loadingPrices[item.id]}
                  style={{
                    width: '24px',
                    height: '24px',
                    padding: 0,
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: themes.primary,
                    cursor: loadingPrices[item.id] ? 'not-allowed' : 'pointer',
                    opacity: loadingPrices[item.id] ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: designSystem.transitions.fast,
                    animation: loadingPrices[item.id] ? 'spin 1s linear infinite' : 'none'
                  }}
                  title="Refresh price"
                >
                  <RotateCcw size={14} />
                </button>
              </div>

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
