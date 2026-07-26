// src/views/DiscoverView/AlbumGallery.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useDiscoverStore } from '../../stores/discoverStore';
import { getDiscogsAlbumCover } from '../../services/discogsService';
import { designSystem } from '../../designsystem';

export default function AlbumGallery({ themes }) {
  const {
    shuffledAlbums,
    currentAlbumIndex,
    nextAlbum,
    prevAlbum,
    toggleWishlist,
    isInWishlist
  } = useDiscoverStore();

  const [touchStart, setTouchStart] = useState(null);
  const [discogsCoverUrl, setDiscogsCoverUrl] = useState(null);
  const [loadingCover, setLoadingCover] = useState(false);
  const containerRef = useRef(null);

  const currentAlbum = shuffledAlbums[currentAlbumIndex];

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

  // Fetch Discogs cover for current album
  useEffect(() => {
    if (!currentAlbum) {
      setDiscogsCoverUrl(null);
      return;
    }

    const fetchCover = async () => {
      setLoadingCover(true);
      const coverUrl = await getDiscogsAlbumCover(currentAlbum.artist, currentAlbum.album);
      setDiscogsCoverUrl(coverUrl);
      setLoadingCover(false);
    };

    fetchCover();
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
      {/* Album Cover */}
      <div style={{
        width: '280px',
        height: '280px',
        borderRadius: '12px',
        backgroundColor: themes.border,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        boxShadow: `0 4px 12px ${themes.primary}20`,
        cursor: 'grab',
        userSelect: 'none',
        position: 'relative'
      }}>
        {/* Use Discogs cover if available, fallback to local */}
        <img
          src={discogsCoverUrl || currentAlbum.coverUrl}
          alt={`${currentAlbum.artist} - ${currentAlbum.album}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loadingCover ? 0.5 : 1,
            transition: 'opacity 200ms ease'
          }}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        {/* Loading indicator */}
        {loadingCover && (
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
          margin: '0',
          fontSize: '13px',
          color: themes.textTertiary
        }}>
          {currentAlbum.year > 0 ? currentAlbum.year : 'Year unknown'}
          {currentAlbum.label && ` • ${currentAlbum.label}`}
        </p>
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
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: `2px solid ${themes.primary}`,
            backgroundColor: themes.surface,
            color: themes.primary,
            fontSize: '20px',
            cursor: currentAlbumIndex === 0 ? 'not-allowed' : 'pointer',
            opacity: currentAlbumIndex === 0 ? 0.4 : 1,
            transition: 'all 200ms ease'
          }}
        >
          ←
        </button>

        <button
          onClick={() => toggleWishlist(currentAlbum.id)}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: inWishlist ? themes.primary : themes.border,
            color: inWishlist ? themes.buttonText : themes.text,
            fontSize: '20px',
            cursor: 'pointer',
            transition: 'all 200ms ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
          title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          {inWishlist ? '♥' : '♡'}
        </button>

        <button
          onClick={nextAlbum}
          disabled={currentAlbumIndex === shuffledAlbums.length - 1}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: `2px solid ${themes.primary}`,
            backgroundColor: themes.surface,
            color: themes.primary,
            fontSize: '20px',
            cursor: currentAlbumIndex === shuffledAlbums.length - 1 ? 'not-allowed' : 'pointer',
            opacity: currentAlbumIndex === shuffledAlbums.length - 1 ? 0.4 : 1,
            transition: 'all 200ms ease'
          }}
        >
          →
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
