import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Collection Store
 *
 * Centralized state management for vinyl collection using Zustand
 * Features:
 * - Automatic localStorage persistence
 * - Optimized re-renders (only updates when specific data changes)
 * - Clean separation from UI logic
 * - Easy to test
 */

export const useCollectionStore = create(
  persist(
    (set, get) => ({
      // ============================================
      // STATE
      // ============================================
      collection: [],

      // Filters & Sorting
      sortBy: 'artist-asc',
      filter: 'all', // 'all' | 'favorites'
      searchQuery: '',
      activeGenreFilter: null,
      activeDecadeFilter: null,
      activeFormatFilter: null,

      // View State
      viewMode: 'grid', // 'grid' | 'list'

      // ============================================
      // ACTIONS - Collection Management
      // ============================================

      /**
       * Add vinyl to collection
       */
      addVinyl: (vinyl) => set((state) => ({
        collection: [...state.collection, {
          ...vinyl,
          addedAt: new Date().toISOString(),
          isFavorite: false
        }]
      })),

      /**
       * Remove vinyl from collection
       */
      removeVinyl: (id) => set((state) => ({
        collection: state.collection.filter((v) => v.id !== id)
      })),

      /**
       * Update vinyl data
       */
      updateVinyl: (id, updates) => set((state) => ({
        collection: state.collection.map((v) =>
          v.id === id ? { ...v, ...updates } : v
        )
      })),

      /**
       * Toggle favorite status
       */
      toggleFavorite: (id) => set((state) => ({
        collection: state.collection.map((v) =>
          v.id === id ? { ...v, isFavorite: !v.isFavorite } : v
        )
      })),

      /**
       * Update price for a vinyl
       */
      updatePrice: (id, priceData) => set((state) => ({
        collection: state.collection.map((v) => {
          if (v.id !== id) return v;

          const priceHistory = [...(v.priceHistory || [])];
          if (priceData.value !== null) {
            priceHistory.push({
              date: new Date().toISOString(),
              price: priceData.value,
              currency: priceData.currency || 'EUR'
            });
          }

          return {
            ...v,
            lowestPrice: priceData.value,
            priceHistory: priceHistory.slice(-30) // Keep last 30 entries
          };
        })
      })),

      /**
       * Bulk import collection
       */
      importCollection: (vinyls) => set(() => ({
        collection: vinyls
      })),

      /**
       * Clear entire collection
       */
      clearCollection: () => set(() => ({
        collection: []
      })),

      // ============================================
      // ACTIONS - Filters & Sorting
      // ============================================

      setSortBy: (sortBy) => set(() => ({ sortBy })),
      setFilter: (filter) => set(() => ({ filter })),
      setSearchQuery: (searchQuery) => set(() => ({ searchQuery })),
      setGenreFilter: (genre) => set(() => ({ activeGenreFilter: genre })),
      setDecadeFilter: (decade) => set(() => ({ activeDecadeFilter: decade })),
      setFormatFilter: (format) => set(() => ({ activeFormatFilter: format })),
      setViewMode: (viewMode) => set(() => ({ viewMode })),

      /**
       * Clear all filters
       */
      clearFilters: () => set(() => ({
        filter: 'all',
        searchQuery: '',
        activeGenreFilter: null,
        activeDecadeFilter: null,
        activeFormatFilter: null
      })),

      // ============================================
      // SELECTORS - Computed Values
      // ============================================

      /**
       * Get filtered and sorted collection
       */
      getFilteredCollection: () => {
        const state = get();
        let filtered = state.collection;

        // Apply favorite filter
        if (state.filter === 'favorites') {
          filtered = filtered.filter((v) => v.isFavorite);
        }

        // Apply search query
        if (state.searchQuery.trim()) {
          const query = state.searchQuery.toLowerCase();
          filtered = filtered.filter((v) => {
            const title = (v.title || '').toLowerCase();
            const artist = (v.artist || '').toLowerCase();
            return title.includes(query) || artist.includes(query);
          });
        }

        // Apply genre filter
        if (state.activeGenreFilter) {
          filtered = filtered.filter((v) =>
            v.genres?.includes(state.activeGenreFilter)
          );
        }

        // Apply decade filter
        if (state.activeDecadeFilter) {
          filtered = filtered.filter((v) => {
            if (!v.year) return false;
            const decade = Math.floor(v.year / 10) * 10;
            return `${decade}s` === state.activeDecadeFilter;
          });
        }

        // Apply format filter
        if (state.activeFormatFilter) {
          filtered = filtered.filter((v) => {
            const format = v.format || v.formats?.[0] || 'Unknown';
            return format === state.activeFormatFilter;
          });
        }

        // Apply sorting
        return sortCollection(filtered, state.sortBy);
      },

      /**
       * Get collection statistics
       */
      getStats: () => {
        const { collection } = get();

        const total = collection.length;
        const favorites = collection.filter((v) => v.isFavorite).length;
        const withPrice = collection.filter((v) =>
          v.lowestPrice !== null && v.lowestPrice !== undefined
        ).length;

        const totalValue = collection.reduce((sum, v) => {
          const price = v.lowestPrice;
          return sum + (typeof price === 'number' ? price : 0);
        }, 0);

        const avgValue = withPrice > 0 ? totalValue / withPrice : 0;

        return {
          total,
          favorites,
          withPrice,
          totalValue,
          avgValue,
          completeness: total > 0 ? (withPrice / total) * 100 : 0
        };
      },

      /**
       * Get vinyl by ID
       */
      getVinylById: (id) => {
        const { collection } = get();
        return collection.find((v) => v.id === id) || null;
      },

      /**
       * Check if vinyl exists in collection
       */
      hasVinyl: (id) => {
        const { collection } = get();
        return collection.some((v) => v.id === id);
      }
    }),
    {
      name: 'vinyl-collection', // localStorage key
      // Only persist collection data, not UI state
      partialize: (state) => ({
        collection: state.collection,
        sortBy: state.sortBy,
        viewMode: state.viewMode
      })
    }
  )
);

/**
 * Helper function for sorting collection
 */
function sortCollection(items, sortBy) {
  const sorted = [...items];

  switch (sortBy) {
    case 'artist-asc':
      return sorted.sort((a, b) => {
        const aArtist = (a.title?.split(' - ')[0] || '').toLowerCase();
        const bArtist = (b.title?.split(' - ')[0] || '').toLowerCase();
        return aArtist.localeCompare(bArtist);
      });

    case 'artist-desc':
      return sorted.sort((a, b) => {
        const aArtist = (a.title?.split(' - ')[0] || '').toLowerCase();
        const bArtist = (b.title?.split(' - ')[0] || '').toLowerCase();
        return bArtist.localeCompare(aArtist);
      });

    case 'album-asc':
      return sorted.sort((a, b) => {
        const aAlbum = (a.title?.split(' - ')[1] || a.title || '').toLowerCase();
        const bAlbum = (b.title?.split(' - ')[1] || b.title || '').toLowerCase();
        return aAlbum.localeCompare(bAlbum);
      });

    case 'album-desc':
      return sorted.sort((a, b) => {
        const aAlbum = (a.title?.split(' - ')[1] || a.title || '').toLowerCase();
        const bAlbum = (b.title?.split(' - ')[1] || b.title || '').toLowerCase();
        return bAlbum.localeCompare(aAlbum);
      });

    case 'price-asc':
      return sorted.sort((a, b) =>
        (a.price?.value || a.lowestPrice || 0) - (b.price?.value || b.lowestPrice || 0)
      );

    case 'price-desc':
      return sorted.sort((a, b) =>
        (b.price?.value || b.lowestPrice || 0) - (a.price?.value || a.lowestPrice || 0)
      );

    case 'date-new':
      return sorted.sort((a, b) =>
        new Date(b.addedAt || 0) - new Date(a.addedAt || 0)
      );

    case 'date-old':
      return sorted.sort((a, b) =>
        new Date(a.addedAt || 0) - new Date(b.addedAt || 0)
      );

    default:
      return sorted;
  }
}
