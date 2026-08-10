// src/views/DiscoverView/AlbumGallery.jsx
import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { useDiscoverStore } from '../../stores/discoverStore';
import { getDiscogsAlbumMetadata, fetchPriceInfo } from '../../services/discogsService';
import { designSystem } from '../../designsystem';
import { useSettingsStore } from '../../stores/settingsStore';

export default function AlbumGallery({ themes }) {
  const {
    shuffledAlbums,
    currentAlbumIndex,
    nextAlbum,
    prevAlbum,
    toggleWishlist,
    isInWishlist,
    genres
  } = useDiscoverStore();

  const [touchStart, setTouchStart] = useState(null);
  const [discogsMetadata, setDiscogsMetadata] = useState(null);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const containerRef = useRef(null);

  const designTheme = useSettingsStore(s => s.designTheme);

  const currentAlbum = shuffledAlbums[currentAlbumIndex];
  const genreName = currentAlbum && genres.find(g => g.id === currentAlbum.genreId)?.name;

  const isDarkBg = themes.background && parseInt(themes.background.slice(1, 3), 16) < 128;
  const glass = designSystem.glassMorphism[designTheme];

  // Get glass morphism styles based on current design theme
  const getCardGlassStyle = () => {
    if (designTheme === 'hybrid') {
      // Hybrid: subtle glass effect on cards
      return {
        background: `rgba(${isDarkBg ? '30, 30, 30' : '255, 255, 255'}, 0.85)`,
        backdropFilter: `blur(${glass.cardBlur})`,
        borderRadius: glass.radius,
        border: `1px solid rgba(255, 255, 255, 0.2)`
      };
    }

    // Subtle and Bold: apply their respective glass settings
    return {
      background: `rgba(${isDarkBg ? '30, 30, 30' : '255, 255, 255'}, ${glass.bgOpacity})`,
      backdropFilter: `blur(${glass.blur})`,
      borderRadius: glass.radius,
      border: `1px solid ${glass.borderColor}`,
      boxShadow: `0 8px 32px rgba(${isDarkBg ? '0, 183, 255' : '0, 0, 0'}, ${glass.glowAlpha})`
    };
  };

  // Get glass button styles
  const getButtonGlassStyle = () => {
    if (designTheme === 'hybrid') {
      return {
        background: `rgba(${isDarkBg ? '60, 60, 60' : '240, 240, 240'}, 0.9)`,
        backdropFilter: 'none',
        border: `1.5px solid ${themes.primary}`
      };
    }

    return {
      background: `rgba(${isDarkBg ? '20, 20, 20' : '255, 255, 255'}, ${glass.bgOpacity})`,
      backdropFilter: `blur(${glass.blur})`,
      border: `1px solid ${glass.borderColor}`,
      boxShadow: `0 4px 12px rgba(${isDarkBg ? '0, 183, 255' : '0, 0, 0'}, ${glass.glowAlpha * 0.6})`
    };
  };

  // Keyboard navigation (MUST be before conditional return)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        nextAlbum();
      } else if (e.key === 'ArrowLeft') {
        prevAlbum();
      } else if (e.code === 'Space') {
        e.preventDefault();
        nextAlbum();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextAlbum, prevAlbum]);

  // Fetch Discogs metadata (cover + year + price) for current album
  useEffect(() => {
    if (!currentAlbum) {
      setDiscogsMetadata(null);
      return;
    }

    setCurrentImageIndex(0);

    const fetchMetadata = async () => {
      setLoadingMetadata(true);
      try {
        // Fetch cover and year from metadata search
        const metadata = await getDiscogsAlbumMetadata(currentAlbum.artist, currentAlbum.album);

        // If we got a releaseId, fetch price data
        let priceData = null;
        if (metadata?.releaseId) {
          priceData = await fetchPriceInfo(metadata.releaseId);
        }

        setDiscogsMetadata({
          ...metadata,
          price: priceData
        });
      } catch (error) {
        console.error('Error fetching metadata:', error);
        setDiscogsMetadata(null);
      } finally {
        setLoadingMetadata(false);
      }
    };

    fetchMetadata();
  }, [currentAlbum?.id]);

  if (!currentAlbum) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        color: themes.textSecondary,
        fontSize: '16px'
      }}>
        Select genres to browse albums
      </div>
    );
  }

  // Touch swipe handling
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;

    // Swipe left = next, swipe right = prev
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextAlbum();
      } else {
        prevAlbum();
      }
    }
    setTouchStart(null);
  };

  const inWishlist = isInWishlist(currentAlbum.id);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        minHeight: '500px'
      }}
    >
      {/* Album Cover with Image Gallery */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'center'
      }}>
        <div style={{
          width: '280px',
          height: '280px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          cursor: 'grab',
          userSelect: 'none',
          position: 'relative',
          ...getCardGlassStyle()
        }}>
          {/* Use Discogs cover if available, fallback to local */}
          <img
            src={discogsMetadata?.images?.[currentImageIndex]?.url || discogsMetadata?.coverUrl || currentAlbum.coverUrl}
            alt={`${currentAlbum.artist} - ${currentAlbum.album}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: loadingMetadata ? 0.5 : 1,
              transition: 'opacity 200ms ease'
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          {/* Loading indicator */}
          {loadingMetadata && (
            <div style={{
              position: 'absolute',
              width: '20px',
              height: '20px',
              border: `2px solid ${themes.primary}`,
              borderTop: `2px solid transparent`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          )}
        </div>

        {/* Image Gallery Navigation */}
        {discogsMetadata?.images && discogsMetadata.images.length > 1 && (
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <button
              onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
              disabled={currentImageIndex === 0}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: designSystem.borderRadius.circle,
                ...getButtonGlassStyle(),
                color: currentImageIndex === 0 ? themes.textTertiary : themes.primary,
                cursor: currentImageIndex === 0 ? 'not-allowed' : 'pointer',
                opacity: currentImageIndex === 0 ? 0.4 : 1,
                transition: 'all 200ms ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
              title="Previous image"
            >
              <ChevronLeft size={22} strokeWidth={3} />
            </button>
            <div style={{
              fontSize: '13px',
              color: themes.textSecondary,
              minWidth: '45px',
              textAlign: 'center',
              fontWeight: 500
            }}>
              {currentImageIndex + 1}/{discogsMetadata.images.length}
            </div>
            <button
              onClick={() => setCurrentImageIndex(prev => Math.min(discogsMetadata.images.length - 1, prev + 1))}
              disabled={currentImageIndex === discogsMetadata.images.length - 1}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: designSystem.borderRadius.circle,
                ...getButtonGlassStyle(),
                color: currentImageIndex === discogsMetadata.images.length - 1 ? themes.textTertiary : themes.primary,
                cursor: currentImageIndex === discogsMetadata.images.length - 1 ? 'not-allowed' : 'pointer',
                opacity: currentImageIndex === discogsMetadata.images.length - 1 ? 0.4 : 1,
                transition: 'all 200ms ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 'bold'
              }}
              title="Next image"
            >
              <ChevronRight size={22} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>

      {/* Album Info */}
      <div style={{
        textAlign: 'center',
        width: '100%'
      }}>
        <h2 style={{
          margin: '0 0 4px 0',
          fontSize: '18px',
          fontWeight: 600,
          color: themes.text
        }}>
          {currentAlbum.artist}
        </h2>
        <p style={{
          margin: '0 0 8px 0',
          fontSize: '16px',
          color: themes.textSecondary,
          fontWeight: 500
        }}>
          {currentAlbum.album}
        </p>
        <p style={{
          margin: '0 0 6px 0',
          fontSize: '13px',
          color: themes.textTertiary
        }}>
          {discogsMetadata?.year > 0 ? discogsMetadata.year : (currentAlbum.year > 0 ? currentAlbum.year : 'Year unknown')}
          {currentAlbum.label && ` • ${currentAlbum.label}`}
        </p>
        {genreName && (
          <p style={{
            margin: '0 0 6px 0',
            fontSize: '12px',
            color: themes.primary,
            fontWeight: 500
          }}>
            {genreName}
          </p>
        )}
        {/* Price */}
        {discogsMetadata?.price ? (
          <p style={{
            margin: '0',
            fontSize: '14px',
            fontWeight: 600,
            color: themes.primary
          }}>
            {discogsMetadata.price.currency} {
              typeof discogsMetadata.price.value === 'number'
                ? discogsMetadata.price.value.toFixed(2)
                : (discogsMetadata.price.value && !isNaN(parseFloat(discogsMetadata.price.value))
                    ? parseFloat(discogsMetadata.price.value).toFixed(2)
                    : '0.00')
            }
          </p>
        ) : (
          <p style={{
            margin: '0',
            fontSize: '12px',
            color: themes.textTertiary
          }}>
            No price available
          </p>
        )}
      </div>

      {/* Navigation Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        width: '100%',
        justifyContent: 'center'
      }}>
        <button
          onClick={prevAlbum}
          disabled={currentAlbumIndex === 0}
          style={{
            width: '52px',
            height: '52px',
            borderRadius: designSystem.borderRadius.circle,
            ...getButtonGlassStyle(),
            color: currentAlbumIndex === 0 ? themes.textTertiary : themes.primary,
            cursor: currentAlbumIndex === 0 ? 'not-allowed' : 'pointer',
            opacity: currentAlbumIndex === 0 ? 0.4 : 1,
            transition: 'all 200ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={() => toggleWishlist(currentAlbum.id)}
          style={{
            width: '52px',
            height: '52px',
            borderRadius: designSystem.borderRadius.circle,
            ...getButtonGlassStyle(),
            color: inWishlist ? themes.primary : themes.text,
            cursor: 'pointer',
            transition: 'all 200ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart size={24} fill={inWishlist ? 'currentColor' : 'none'} />
        </button>

        <button
          onClick={nextAlbum}
          disabled={currentAlbumIndex === shuffledAlbums.length - 1}
          style={{
            width: '52px',
            height: '52px',
            borderRadius: designSystem.borderRadius.circle,
            ...getButtonGlassStyle(),
            color: currentAlbumIndex === shuffledAlbums.length - 1 ? themes.textTertiary : themes.primary,
            cursor: currentAlbumIndex === shuffledAlbums.length - 1 ? 'not-allowed' : 'pointer',
            opacity: currentAlbumIndex === shuffledAlbums.length - 1 ? 0.4 : 1,
            transition: 'all 200ms ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Progress indicator */}
      <div style={{
        fontSize: '13px',
        color: themes.textSecondary
      }}>
        {currentAlbumIndex + 1} of {shuffledAlbums.length}
      </div>

      {/* Hint */}
      <div style={{
        fontSize: '12px',
        color: themes.textTertiary,
        textAlign: 'center',
        marginTop: '8px'
      }}>
        Swipe left/right • Arrow keys • Spacebar to navigate
      </div>
    </div>
  );
}
