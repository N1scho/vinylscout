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
      result.current.selectedGenreIds = [];
      result.current.yearRange = [1960, 2025];
      result.current.priceRange = [0, 500];
      result.current.currentAlbumIndex = 0;
      result.current.wishlist = [];
      result.current.shuffledAlbums = [];
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

    expect(result.current.selectedGenreIds.length).toBe(1);
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

    expect(result.current.selectedGenreIds.length).toBe(2);

    act(() => {
      result.current.clearAllGenres();
    });

    expect(result.current.selectedGenreIds.length).toBe(0);
    expect(result.current.shuffledAlbums.length).toBe(0);
  });

  it('filters albums by year range', () => {
    const data = {
      genres: [{ id: '01', name: 'Rock', albumCount: 3 }],
      albums: [
        { id: '01-001', genreId: '01', artist: 'A1', album: 'B1', year: 1970 },
        { id: '01-002', genreId: '01', artist: 'A2', album: 'B2', year: 1980 },
        { id: '01-003', genreId: '01', artist: 'A3', album: 'B3', year: 2000 }
      ]
    };

    const { result } = renderHook(() => useDiscoverStore());
    act(() => {
      result.current.initializeAlbums(data);
      result.current.selectAllGenres();
    });

    expect(result.current.shuffledAlbums.length).toBe(3);

    act(() => {
      result.current.setYearRange([1975, 1995]);
    });

    expect(result.current.yearRange).toEqual([1975, 1995]);
    expect(result.current.shuffledAlbums.length).toBe(1);
    expect(result.current.shuffledAlbums[0].year).toBe(1980);
  });

  it('filters albums by price range', () => {
    const data = {
      genres: [{ id: '01', name: 'Rock', albumCount: 3 }],
      albums: [
        { id: '01-001', genreId: '01', artist: 'A1', album: 'B1', year: 1970, lowestPrice: 10 },
        { id: '01-002', genreId: '01', artist: 'A2', album: 'B2', year: 1980, lowestPrice: 30 },
        { id: '01-003', genreId: '01', artist: 'A3', album: 'B3', year: 2000, lowestPrice: 50 }
      ]
    };

    const { result } = renderHook(() => useDiscoverStore());
    act(() => {
      result.current.initializeAlbums(data);
      result.current.selectAllGenres();
    });

    expect(result.current.shuffledAlbums.length).toBe(3);

    act(() => {
      result.current.setPriceRange([20, 40]);
    });

    expect(result.current.priceRange).toEqual([20, 40]);
    expect(result.current.shuffledAlbums.length).toBe(1);
    expect(result.current.shuffledAlbums[0].lowestPrice).toBe(30);
  });

  it('filters albums by price using price.value', () => {
    const data = {
      genres: [{ id: '01', name: 'Rock', albumCount: 2 }],
      albums: [
        { id: '01-001', genreId: '01', artist: 'A1', album: 'B1', year: 1970, price: { value: 15, currency: 'USD' } },
        { id: '01-002', genreId: '01', artist: 'A2', album: 'B2', year: 1980, price: { value: 35, currency: 'USD' } }
      ]
    };

    const { result } = renderHook(() => useDiscoverStore());
    act(() => {
      result.current.initializeAlbums(data);
      result.current.selectAllGenres();
    });

    act(() => {
      result.current.setPriceRange([30, 50]);
    });

    expect(result.current.shuffledAlbums.length).toBe(1);
    expect(result.current.shuffledAlbums[0].price.value).toBe(35);
  });

  it('applies cumulative filters (genre + year + price)', () => {
    const data = {
      genres: [
        { id: '01', name: 'Rock', albumCount: 3 },
        { id: '02', name: 'Jazz', albumCount: 2 }
      ],
      albums: [
        { id: '01-001', genreId: '01', artist: 'A1', album: 'B1', year: 1970, lowestPrice: 10 },
        { id: '01-002', genreId: '01', artist: 'A2', album: 'B2', year: 1980, lowestPrice: 30 },
        { id: '01-003', genreId: '01', artist: 'A3', album: 'B3', year: 2000, lowestPrice: 50 },
        { id: '02-001', genreId: '02', artist: 'A4', album: 'B4', year: 1985, lowestPrice: 25 },
        { id: '02-002', genreId: '02', artist: 'A5', album: 'B5', year: 1990, lowestPrice: 35 }
      ]
    };

    const { result } = renderHook(() => useDiscoverStore());
    act(() => {
      result.current.initializeAlbums(data);
      // Select only Rock genre
      result.current.setSelectedGenres(['01']);
    });

    expect(result.current.shuffledAlbums.length).toBe(3);

    act(() => {
      // Further filter by year range
      result.current.setYearRange([1975, 1995]);
    });

    expect(result.current.shuffledAlbums.length).toBe(1); // Only 01-002
    expect(result.current.shuffledAlbums[0].id).toBe('01-002');

    act(() => {
      // Further filter by price range
      result.current.setPriceRange([20, 40]);
    });

    expect(result.current.shuffledAlbums.length).toBe(1); // Still 01-002
    expect(result.current.shuffledAlbums[0].lowestPrice).toBe(30);
  });

  it('shuffle re-randomizes album order with current filters', () => {
    const data = {
      genres: [{ id: '01', name: 'Rock', albumCount: 5 }],
      albums: [
        { id: '01-001', genreId: '01', artist: 'A1', album: 'B1', year: 1970, lowestPrice: 10 },
        { id: '01-002', genreId: '01', artist: 'A2', album: 'B2', year: 1980, lowestPrice: 20 },
        { id: '01-003', genreId: '01', artist: 'A3', album: 'B3', year: 1990, lowestPrice: 30 },
        { id: '01-004', genreId: '01', artist: 'A4', album: 'B4', year: 2000, lowestPrice: 40 },
        { id: '01-005', genreId: '01', artist: 'A5', album: 'B5', year: 2010, lowestPrice: 50 }
      ]
    };

    const { result } = renderHook(() => useDiscoverStore());
    act(() => {
      result.current.initializeAlbums(data);
      result.current.selectAllGenres();
    });

    const firstShuffle = [...result.current.shuffledAlbums];

    act(() => {
      result.current.shuffle();
    });

    const secondShuffle = [...result.current.shuffledAlbums];

    // After shuffle, should still have all 5 albums
    expect(secondShuffle.length).toBe(5);
    // currentAlbumIndex should reset to 0
    expect(result.current.currentAlbumIndex).toBe(0);
    // Verify same albums are present (though order may differ)
    expect(secondShuffle.map(a => a.id).sort()).toEqual(firstShuffle.map(a => a.id).sort());
  });

  it('shuffle respects active filters', () => {
    const data = {
      genres: [
        { id: '01', name: 'Rock', albumCount: 3 },
        { id: '02', name: 'Jazz', albumCount: 2 }
      ],
      albums: [
        { id: '01-001', genreId: '01', artist: 'A1', album: 'B1', year: 1970, lowestPrice: 10 },
        { id: '01-002', genreId: '01', artist: 'A2', album: 'B2', year: 1980, lowestPrice: 30 },
        { id: '01-003', genreId: '01', artist: 'A3', album: 'B3', year: 2000, lowestPrice: 50 },
        { id: '02-001', genreId: '02', artist: 'A4', album: 'B4', year: 1985, lowestPrice: 25 },
        { id: '02-002', genreId: '02', artist: 'A5', album: 'B5', year: 1990, lowestPrice: 35 }
      ]
    };

    const { result } = renderHook(() => useDiscoverStore());
    act(() => {
      result.current.initializeAlbums(data);
      // Select Rock only and set year/price filters
      result.current.setSelectedGenres(['01']);
      result.current.setYearRange([1975, 1995]);
      result.current.setPriceRange([20, 40]);
    });

    // Should have only 01-002 matching all filters
    expect(result.current.shuffledAlbums.length).toBe(1);

    act(() => {
      result.current.shuffle();
    });

    // Shuffle should still respect all active filters
    expect(result.current.shuffledAlbums.length).toBe(1);
    expect(result.current.shuffledAlbums[0].id).toBe('01-002');
  });
});
