import React, { useEffect } from 'react';
import { useDiscoverStore } from '../../stores/discoverStore';
import discoverData from '../../data/discoverAlbums.json';
import { designSystem } from '../../designsystem';
import GenreSelector from './GenreSelector';
import AlbumGallery from './AlbumGallery';

export default function DiscoverView({ themes }) {
  const { allAlbums, selectedGenreIds, initializeAlbums } = useDiscoverStore();

  // Initialize store with discover data on mount if needed
  // Also reinitialize if albums exist but no genres selected (corrupted localStorage)
  useEffect(() => {
    if (allAlbums.length === 0 || (allAlbums.length > 0 && selectedGenreIds.length === 0)) {
      initializeAlbums(discoverData);
    }
  }, [allAlbums.length, selectedGenreIds.length, initializeAlbums]);

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
