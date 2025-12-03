/**
 * Collection Store - Zustand
 *
 * Manages vinyl collection state with persistence
 * Replaces the useCollection hook and prop drilling
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sortCollection, filterCollection, calculateCollectionValue } from '../utils/collectionHelpers';
import { toggleItemFavorite, removeItemFromCollection, calculatePriceChange } from '../utils/collectionOperations';

export const useCollectionStore = create(
  persist(
    (set, get) => ({
      // State
      collection: [],
      sortBy: 'artist-asc',
      collectionView: 'grid',
      collectionFilter: 'all',
      collectionSearch: '',
      activeGenreFilter: null,
      activeDecadeFilter: null,
      activeFormatFilter: null,

      // Computed values (using selectors for performance)
      getFilteredAndSorted: () => {
        const state = get();
        return sortCollection(
          filterCollection(
            state.collection,
            state.collectionFilter,
            state.collectionSearch,
            state.activeGenreFilter,
            state.activeDecadeFilter,
            state.activeFormatFilter
          ),
          state.sortBy
        );
      },

      getCollectionValue: () => {
        const state = get();
        return calculateCollectionValue(state.collection);
      },

      getPriceChange: (item) => {
        return calculatePriceChange(item);
      },

      // Actions
      addToCollection: (newItem) => set((state) => ({
        collection: [...state.collection, newItem]
      })),

      removeFromCollection: (id) => set((state) => ({
        collection: removeItemFromCollection(state.collection, id)
      })),

      toggleFavorite: (id) => set((state) => ({
        collection: toggleItemFavorite(state.collection, id)
      })),

      updateItemInCollection: (id, updates) => set((state) => ({
        collection: state.collection.map(item =>
          item.id === id ? { ...item, ...updates } : item
        )
      })),

      setCollection: (collection) => set({ collection }),

      // Filter/Sort Actions
      setSortBy: (sortBy) => set({ sortBy }),
      setCollectionView: (collectionView) => set({ collectionView }),
      setCollectionFilter: (collectionFilter) => set({ collectionFilter }),
      setCollectionSearch: (collectionSearch) => set({ collectionSearch }),
      setActiveGenreFilter: (activeGenreFilter) => set({ activeGenreFilter }),
      setActiveDecadeFilter: (activeDecadeFilter) => set({ activeDecadeFilter }),
      setActiveFormatFilter: (activeFormatFilter) => set({ activeFormatFilter }),

      clearFilters: () => set({
        activeGenreFilter: null,
        activeDecadeFilter: null,
        activeFormatFilter: null,
        collectionSearch: ''
      }),
    }),
    {
      name: 'vinyl-collection-storage',
      // Only persist collection data, not UI state
      partialize: (state) => ({
        collection: state.collection,
        sortBy: state.sortBy,
        collectionView: state.collectionView
      })
    }
  )
);
