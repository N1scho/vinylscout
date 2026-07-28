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
    userClearedGenres
  } = useDiscoverStore();

  // Initialize store with discover data on mount if needed.
  // Also reinitialize if albums exist but no genres selected (corrupted localStorage) —
  // but not if the user intentionally cleared all genres. There is deliberately NO
  // wall-clock/timer decay here: a mobile tab switch or any other >2s gap between
  // renders must not re-enable auto-recovery on its own. `userClearedGenres` persists
  // across mount/unmount (it lives in the persisted store) and is reset ONLY by a real
  // user action — selecting genres (`setSelectedGenres`/`selectAllGenres`) — or a
  // genuine corrupted-state recovery (`initializeAlbums`, called below or elsewhere).
  useEffect(() => {
    if (allAlbums.length === 0 || (allAlbums.length > 0 && selectedGenreIds.length === 0 && !userClearedGenres)) {
      initializeAlbums(discoverData);
    }
  }, [allAlbums.length, selectedGenreIds.length, initializeAlbums, userClearedGenres]);

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
