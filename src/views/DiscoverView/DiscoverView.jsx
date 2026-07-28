import React, { useEffect } from 'react';
import { useDiscoverStore } from '../../stores/discoverStore';
import discoverData from '../../data/discoverAlbums.json';
import { designSystem } from '../../designsystem';
import GenreSelector from './GenreSelector';
import AlbumGallery from './AlbumGallery';

export default function DiscoverView({ themes }) {
  const {
    allAlbums,
    selectedGenreIds,
    initializeAlbums,
    userClearedGenres,
    userClearTimestamp,
    resetUserClearFlag
  } = useDiscoverStore();

  // Initialize store with discover data on mount if needed
  // Also reinitialize if albums exist but no genres selected (corrupted localStorage) —
  // but not if the user just intentionally cleared all genres.
  useEffect(() => {
    const now = Date.now();
    const isRecentUserClear = userClearedGenres && (now - userClearTimestamp) < 2000;

    if (allAlbums.length === 0 || (allAlbums.length > 0 && selectedGenreIds.length === 0 && !isRecentUserClear)) {
      initializeAlbums(discoverData);
    }

    // Reset flag after 2 seconds
    if (isRecentUserClear) {
      const timer = setTimeout(() => {
        resetUserClearFlag();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [allAlbums.length, selectedGenreIds.length, initializeAlbums, userClearedGenres, userClearTimestamp, resetUserClearFlag]);

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        backgroundColor: themes.background,
        padding: designSystem.spacing.md,
        paddingTop: '72px',
        paddingBottom: `calc(${designSystem.spacing.nav} + ${designSystem.spacing.md})`
      }}
    >
      <GenreSelector themes={themes} />
      <AlbumGallery themes={themes} />
    </div>
  );
}
