import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDiscoverStore } from '../../src/stores/discoverStore';
import { renderHook, act } from '@testing-library/react';

describe('discoverStore', () => {
  beforeEach(() => {
    // Clear store before each test
    const { result } = renderHook(() => useDiscoverStore());
    act(() => {
      result.current.allAlbums = [];
      result.current.genres = [];
      result.current.selectedGenreIds = new Set();
      result.current.currentAlbumIndex = 0;
      result.current.wishlist = new Set();
    });
  });

  it('initializes albums and shuffles them', () => {
    const data = {
      genres: [
        { id: '01', name: 'Heavy Metal', albumCount: 2 }
      ],
      albums: [
        { id: '01-001', genreId: '01', artist: 'Black Sabbath', album: 'Paranoid', year: 1970 },
        { id: '01-002', genreId: '01', artist: 'Iron Maiden', album: 'Iron Maiden', year: 1980 }
      ]
    };

    const { result } = renderHook(() => useDiscoverStore());
    act(() => {
      result.current.initializeAlbums(data);
    });

    expect(result.current.allAlbums.length).toBe(2);
    expect(result.current.genres.length).toBe(1);
    expect(result.current.shuffledAlbums.length).toBe(2);
    expect(result.current.currentAlbumIndex).toBe(0);
  });

  it('selects and filters albums by genre', () => {
    const data = {
      genres: [
        { id: '01', name: 'Heavy Metal', albumCount: 2 },
        { id: '02', name: 'Punk', albumCount: 1 }
      ],
      albums: [
        { id: '01-001', genreId: '01', artist: 'Black Sabbath', album: 'Paranoid', year: 1970 },
        { id: '01-002', genreId: '01', artist: 'Iron Maiden', album: 'Iron Maiden', year: 1980 },
        { id: '02-001', genreId: '02', artist: 'The Clash', album: 'The Clash', year: 1977 }
      ]
    };

    const { result } = renderHook(() => useDiscoverStore());
    act(() => {
      result.current.initializeAlbums(data);
      result.current.setSelectedGenres(['01']);
    });

    expect(result.current.selectedGenreIds.size).toBe(1);
    expect(result.current.shuffledAlbums.length).toBe(2);
    expect(result.current.shuffledAlbums.every(a => a.genreId === '01')).toBe(true);
  });

  it('navigates albums with next/prev', () => {
    const data = {
      genres: [{ id: '01', name: 'Heavy Metal', albumCount: 2 }],
      albums: [
        { id: '01-001', genreId: '01', artist: 'Artist 1', album: 'Album 1', year: 1970 },
        { id: '01-002', genreId: '01', artist: 'Artist 2', album: 'Album 2', year: 1980 }
      ]
    };

    const { result } = renderHook(() => useDiscoverStore());
    act(() => {
      result.current.initializeAlbums(data);
    });

    expect(result.current.currentAlbumIndex).toBe(0);

    act(() => {
      result.current.nextAlbum();
    });
    expect(result.current.currentAlbumIndex).toBe(1);

    act(() => {
      result.current.prevAlbum();
    });
    expect(result.current.currentAlbumIndex).toBe(0);
  });

  it('toggles wishlist items', () => {
    const data = {
      genres: [{ id: '01', name: 'Heavy Metal', albumCount: 1 }],
      albums: [
        { id: '01-001', genreId: '01', artist: 'Artist', album: 'Album', year: 1970 }
      ]
    };

    const { result } = renderHook(() => useDiscoverStore());
    act(() => {
      result.current.initializeAlbums(data);
      result.current.toggleWishlist('01-001');
    });

    expect(result.current.isInWishlist('01-001')).toBe(true);
    expect(result.current.getWishlistCount()).toBe(1);

    act(() => {
      result.current.toggleWishlist('01-001');
    });

    expect(result.current.isInWishlist('01-001')).toBe(false);
    expect(result.current.getWishlistCount()).toBe(0);
  });

  it('selects/clears all genres', () => {
    const data = {
      genres: [
        { id: '01', name: 'Heavy Metal', albumCount: 1 },
        { id: '02', name: 'Punk', albumCount: 1 }
      ],
      albums: [
        { id: '01-001', genreId: '01', artist: 'A1', album: 'B1', year: 1970 },
        { id: '02-001', genreId: '02', artist: 'A2', album: 'B2', year: 1977 }
      ]
    };

    const { result } = renderHook(() => useDiscoverStore());
    act(() => {
      result.current.initializeAlbums(data);
      result.current.selectAllGenres();
    });

    expect(result.current.selectedGenreIds.size).toBe(2);

    act(() => {
      result.current.clearAllGenres();
    });

    expect(result.current.selectedGenreIds.size).toBe(0);
    expect(result.current.shuffledAlbums.length).toBe(0);
  });
});
