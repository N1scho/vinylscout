import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useDiscoverStore } from '../../src/stores/discoverStore';
import DiscoverView from '../../src/views/DiscoverView/DiscoverView';
import GenreSelector from '../../src/views/DiscoverView/GenreSelector';
import AlbumGallery from '../../src/views/DiscoverView/AlbumGallery';

const mockThemes = {
  background: '#fff',
  surface: '#f5f5f5',
  border: '#ddd',
  text: '#000',
  textSecondary: '#666',
  textTertiary: '#999',
  primary: '#007AFF',
  primaryHover: '#0051D5',
  buttonText: '#fff'
};

// Initialize store for each test
const initializeStoreForTest = (data) => {
  const { allAlbums, initializeAlbums } = useDiscoverStore.getState();
  if (allAlbums.length === 0) {
    initializeAlbums(data);
  }
};

describe('GenreSelector Component', () => {
  beforeEach(() => {
    const testData = {
      genres: [
        { id: '01', name: 'Heavy Metal', albumCount: 2 },
        { id: '02', name: 'Punk', albumCount: 1 }
      ],
      albums: [
        { id: '01-001', genreId: '01', artist: 'A', album: 'B', year: 1970 },
        { id: '01-002', genreId: '01', artist: 'C', album: 'D', year: 1980 },
        { id: '02-001', genreId: '02', artist: 'E', album: 'F', year: 1977 }
      ]
    };
    initializeStoreForTest(testData);
  });

  it('renders all genres with checkboxes', () => {
    render(<GenreSelector themes={mockThemes} />);
    expect(screen.getByText('Heavy Metal')).toBeInTheDocument();
    expect(screen.getByText('Punk')).toBeInTheDocument();
  });

  it('toggles genre selection', () => {
    const { container } = render(<GenreSelector themes={mockThemes} />);
    const checkbox = container.querySelector('input[type="checkbox"]');

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it('selects all genres on "Select All" click', () => {
    render(<GenreSelector themes={mockThemes} />);
    const selectAllBtn = screen.getByText(/Select All/);

    fireEvent.click(selectAllBtn);
    const { selectedGenreIds } = useDiscoverStore.getState();
    expect(selectedGenreIds.length).toBe(2);
  });

  it('clears all genres on "Clear All" click', () => {
    render(<GenreSelector themes={mockThemes} />);
    const clearAllBtn = screen.getByText(/Clear All/);

    fireEvent.click(clearAllBtn);
    const { selectedGenreIds } = useDiscoverStore.getState();
    expect(selectedGenreIds.length).toBe(0);
  });
});

describe('AlbumGallery Component', () => {
  beforeEach(() => {
    const testData = {
      genres: [{ id: '01', name: 'Heavy Metal', albumCount: 2 }],
      albums: [
        { id: '01-001', genreId: '01', artist: 'Black Sabbath', album: 'Paranoid', year: 1970, coverUrl: '/test.png' },
        { id: '01-002', genreId: '01', artist: 'Iron Maiden', album: 'Iron Maiden', year: 1980, coverUrl: '/test2.png' }
      ]
    };
    initializeStoreForTest(testData);
    useDiscoverStore.setState({ selectedGenreIds: ['01'], shuffledAlbums: testData.albums, currentAlbumIndex: 0 });
  });

  it('displays current album information', () => {
    render(<AlbumGallery themes={mockThemes} />);
    expect(screen.getByText('Black Sabbath')).toBeInTheDocument();
    expect(screen.getByText('Paranoid')).toBeInTheDocument();
  });

  it('navigates to next album', () => {
    render(<AlbumGallery themes={mockThemes} />);
    const nextBtn = screen.getByText('→');

    fireEvent.click(nextBtn);
    const { currentAlbumIndex } = useDiscoverStore.getState();
    expect(currentAlbumIndex).toBe(1);
  });

  it('navigates to previous album', () => {
    useDiscoverStore.setState({ currentAlbumIndex: 1 });
    render(<AlbumGallery themes={mockThemes} />);
    const prevBtn = screen.getByText('←');

    fireEvent.click(prevBtn);
    const { currentAlbumIndex } = useDiscoverStore.getState();
    expect(currentAlbumIndex).toBe(0);
  });

  it('toggles wishlist on heart button click', () => {
    render(<AlbumGallery themes={mockThemes} />);
    const heartBtn = screen.getByTitle('Add to Wishlist');

    fireEvent.click(heartBtn);
    const { isInWishlist } = useDiscoverStore.getState();
    expect(isInWishlist('01-001')).toBe(true);
  });

  it('handles arrow key navigation', () => {
    render(<AlbumGallery themes={mockThemes} />);

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(useDiscoverStore.getState().currentAlbumIndex).toBe(1);

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(useDiscoverStore.getState().currentAlbumIndex).toBe(0);
  });

  it('shows empty state when no genres selected', () => {
    useDiscoverStore.setState({ shuffledAlbums: [] });
    render(<AlbumGallery themes={mockThemes} />);
    expect(screen.getByText(/Select genres to browse albums/)).toBeInTheDocument();
  });
});

describe('DiscoverView - Clear All Genres regression', () => {
  const testData = {
    genres: [
      { id: '01', name: 'Heavy Metal', albumCount: 2 },
      { id: '02', name: 'Punk', albumCount: 1 }
    ],
    albums: [
      { id: '01-001', genreId: '01', artist: 'A', album: 'B', year: 1970 },
      { id: '01-002', genreId: '01', artist: 'C', album: 'D', year: 1980 },
      { id: '02-001', genreId: '02', artist: 'E', album: 'F', year: 1977 }
    ]
  };

  beforeEach(() => {
    vi.useFakeTimers();
    // Start from a fully populated, non-corrupted store so the mount effect
    // doesn't need to auto-initialize.
    useDiscoverStore.getState().initializeAlbums(testData);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not silently repopulate genres 2+ seconds after the user clears them', () => {
    render(<DiscoverView themes={mockThemes} />);

    act(() => {
      useDiscoverStore.getState().clearAllGenres();
    });
    expect(useDiscoverStore.getState().selectedGenreIds).toEqual([]);

    // Advance well past the old 2-second "reset flag" timer window.
    act(() => {
      vi.advanceTimersByTime(2100);
    });

    // Regression check: genres must still be cleared, not silently
    // repopulated by the corrupted-state recovery effect re-firing.
    expect(useDiscoverStore.getState().selectedGenreIds).toEqual([]);
  });

  it('genres stay cleared after an unmount/remount (mobile tab-switch) more than 2s later', () => {
    // Mirrors real usage: DiscoverView is conditionally rendered, so switching to
    // another tab/view and back unmounts and re-mounts it.
    const { unmount } = render(<DiscoverView themes={mockThemes} />);

    const clearAllBtn = screen.getByText(/Clear All/);
    fireEvent.click(clearAllBtn);
    expect(useDiscoverStore.getState().selectedGenreIds).toEqual([]);

    // Navigate away (unmount) — the store itself is untouched by this, only the component.
    unmount();

    // Ordinary mobile tab-switch: well over 2 seconds of wall-clock time passes
    // while the view is unmounted.
    act(() => {
      vi.advanceTimersByTime(2100);
    });

    // User switches back to the Discover tab — remount.
    render(<DiscoverView themes={mockThemes} />);

    // Regression check: the user never re-selected any genres, so auto-recovery
    // must NOT have fired on remount just because wall-clock time passed.
    expect(useDiscoverStore.getState().selectedGenreIds.length).toBe(0);
  });

  it('still auto-recovers genuinely corrupted state (no prior user clear)', () => {
    render(<DiscoverView themes={mockThemes} />);

    // Simulate corruption directly (not via clearAllGenres, so
    // userClearedGenres stays false) — mirrors a corrupted localStorage load.
    act(() => {
      useDiscoverStore.setState({ selectedGenreIds: [] });
    });

    expect(useDiscoverStore.getState().selectedGenreIds.length).toBeGreaterThan(0);
  });
});
