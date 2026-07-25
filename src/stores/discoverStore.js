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

export const useDiscoverStore = create(
  persist(
    (set, get) => ({
      // State
      allAlbums: [],
      genres: [],
      selectedGenreIds: new Set(),
      shuffledAlbums: [],
      currentAlbumIndex: 0,
      wishlist: new Set(),

      // Initialize with album data
      initializeAlbums: (data) => {
        const allGenreIds = new Set(data.genres.map(g => g.id));
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
        const selectedSet = new Set(genreIds);
        const filtered = get().allAlbums.filter(a => selectedSet.has(a.genreId));
        const shuffled = shuffleArray(filtered);

        set({
          selectedGenreIds: selectedSet,
          shuffledAlbums: shuffled,
          currentAlbumIndex: 0
        });
      },

      selectAllGenres: () => {
        const allGenreIds = new Set(get().genres.map(g => g.id));
        const shuffled = shuffleArray(get().allAlbums);

        set({
          selectedGenreIds: allGenreIds,
          shuffledAlbums: shuffled,
          currentAlbumIndex: 0
        });
      },

      clearAllGenres: () => {
        set({
          selectedGenreIds: new Set(),
          shuffledAlbums: [],
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
        const wishlist = new Set(get().wishlist);
        if (wishlist.has(albumId)) {
          wishlist.delete(albumId);
        } else {
          wishlist.add(albumId);
        }
        set({ wishlist });
      },

      isInWishlist: (albumId) => {
        return get().wishlist.has(albumId);
      },

      getWishlistCount: () => {
        return get().wishlist.size;
      },

      getFilteredAlbums: () => {
        return get().shuffledAlbums;
      }
    }),
    {
      name: 'discover-store',
      partialize: (state) => ({
        wishlist: Array.from(state.wishlist)
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.wishlist) {
          state.wishlist = new Set(state.wishlist);
        }
      }
    }
  )
);
