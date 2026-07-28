import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Fisher-Yates shuffle
const shuffleArray = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Helper function to get price from album
const getAlbumPrice = (album) => {
  return album.price?.value ?? album.lowestPrice ?? 0;
};

// Helper function to apply all filters
const applyAllFilters = (albums, selectedGenreIds, yearRange, priceRange) => {
  const selectedSet = new Set(selectedGenreIds);
  return albums.filter(album => {
    // Must match genre
    if (!selectedSet.has(album.genreId)) return false;
    // Must be in year range
    if (album.year && (album.year < yearRange[0] || album.year > yearRange[1])) return false;
    // Must be in price range
    const price = getAlbumPrice(album);
    if (price < priceRange[0] || price > priceRange[1]) return false;
    return true;
  });
};

export const useDiscoverStore = create(
  persist(
    (set, get) => ({
      // State (use Arrays instead of Sets for better serialization)
      allAlbums: [],
      genres: [],
      selectedGenreIds: [],
      yearRange: [1960, 2025],
      priceRange: [0, 500],
      shuffledAlbums: [],
      currentAlbumIndex: 0,
      wishlist: [],

      // Initialize with album data
      initializeAlbums: (data) => {
        const allGenreIds = data.genres.map(g => g.id);
        const shuffled = shuffleArray(data.albums);

        set({
          allAlbums: data.albums,
          genres: data.genres,
          selectedGenreIds: allGenreIds,
          shuffledAlbums: shuffled,
          currentAlbumIndex: 0
        });
      },

      // Genre selection
      setSelectedGenres: (genreIds) => {
        const state = get();
        const filtered = applyAllFilters(state.allAlbums, genreIds, state.yearRange, state.priceRange);
        const shuffled = shuffleArray(filtered);

        set({
          selectedGenreIds: genreIds,
          shuffledAlbums: shuffled,
          currentAlbumIndex: 0
        });
      },

      selectAllGenres: () => {
        const state = get();
        const allGenreIds = state.genres.map(g => g.id);
        const filtered = applyAllFilters(state.allAlbums, allGenreIds, state.yearRange, state.priceRange);
        const shuffled = shuffleArray(filtered);

        set({
          selectedGenreIds: allGenreIds,
          shuffledAlbums: shuffled,
          currentAlbumIndex: 0
        });
      },

      clearAllGenres: () => {
        set({
          selectedGenreIds: [],
          shuffledAlbums: [],
          currentAlbumIndex: 0
        });
      },

      // Year range filter
      setYearRange: (range) => {
        const state = get();
        const filtered = applyAllFilters(state.allAlbums, state.selectedGenreIds, range, state.priceRange);
        const shuffled = shuffleArray(filtered);

        set({
          yearRange: range,
          shuffledAlbums: shuffled,
          currentAlbumIndex: 0
        });
      },

      // Price range filter
      setPriceRange: (range) => {
        const state = get();
        const filtered = applyAllFilters(state.allAlbums, state.selectedGenreIds, state.yearRange, range);
        const shuffled = shuffleArray(filtered);

        set({
          priceRange: range,
          shuffledAlbums: shuffled,
          currentAlbumIndex: 0
        });
      },

      // Shuffle with current filters applied
      shuffle: () => {
        const state = get();
        const filtered = applyAllFilters(state.allAlbums, state.selectedGenreIds, state.yearRange, state.priceRange);
        const shuffled = shuffleArray(filtered);

        set({
          shuffledAlbums: shuffled,
          currentAlbumIndex: 0
        });
      },

      // Gallery navigation
      nextAlbum: () => {
        const state = get();
        const max = state.shuffledAlbums.length - 1;
        const next = Math.min(state.currentAlbumIndex + 1, max);
        set({ currentAlbumIndex: next });
      },

      prevAlbum: () => {
        const prev = Math.max(get().currentAlbumIndex - 1, 0);
        set({ currentAlbumIndex: prev });
      },

      resetGallery: () => {
        set({ currentAlbumIndex: 0 });
      },

      // Wishlist
      toggleWishlist: (albumId) => {
        const wishlist = get().wishlist;
        if (wishlist.includes(albumId)) {
          set({ wishlist: wishlist.filter(id => id !== albumId) });
        } else {
          set({ wishlist: [...wishlist, albumId] });
        }
      },

      isInWishlist: (albumId) => {
        return get().wishlist.includes(albumId);
      },

      getWishlistCount: () => {
        return get().wishlist.length;
      },

      getFilteredAlbums: () => {
        return get().shuffledAlbums;
      }
    }),
    {
      name: 'discover-store',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.wishlist = Array.isArray(state.wishlist) ? state.wishlist : [];
          if (!Array.isArray(state.selectedGenreIds)) {
            state.selectedGenreIds = [];
          }
        }
      }
    }
  )
);
