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
      // State (use Arrays instead of Sets for better serialization)
      allAlbums: [],
      genres: [],
      selectedGenreIds: [],
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
        const selectedSet = new Set(genreIds);
        const filtered = get().allAlbums.filter(a => selectedSet.has(a.genreId));
        const shuffled = shuffleArray(filtered);

        set({
          selectedGenreIds: Array.from(selectedSet),
          shuffledAlbums: shuffled,
          currentAlbumIndex: 0
        });
      },

      selectAllGenres: () => {
        const allGenreIds = get().genres.map(g => g.id);
        const shuffled = shuffleArray(get().allAlbums);

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
      name: 'discover-store'
    }
  )
);
