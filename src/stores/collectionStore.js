/**
 * Collection Store - Zustand
 *
 * Manages vinyl collection state with persistence
 * Replaces the useCollection hook and prop drilling
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { sortCollection, filterCollection, calculateCollectionValue } from '../utils/collectionHelpers';
import { toggleItemFavorite, removeItemFromCollection, calculatePriceChange } from '../utils/collectionOperations';
import { VinylSchema, validateData } from '../schemas/vinylSchemas';

// Migration: Load collection from old storage key if new one doesn't exist
const migrateOldCollection = () => {
  try {
    // Check if new storage exists
    const newStorage = localStorage.getItem('vinyl-collection-storage');
    if (newStorage) return; // Already migrated

    // Try to load from old key
    const oldCollection = localStorage.getItem('vinylCollection');
    if (oldCollection) {
      const collection = JSON.parse(oldCollection);
      // Write to new format
      const newFormat = {
        state: {
          collection: collection,
          sortBy: 'artist-asc',
          collectionView: 'grid'
        },
        version: 0
      };
      localStorage.setItem('vinyl-collection-storage', JSON.stringify(newFormat));
      console.log(`Migrated ${collection.length} vinyl records from old storage`);
    }
  } catch (error) {
    console.error('Collection migration failed:', error);
  }
};

// Run migration before creating store
migrateOldCollection();

export const useCollectionStore = create(
  devtools(
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

      // Actions with validation
      addToCollection: (newItem) => {
        const validation = validateData(VinylSchema, newItem);

        if (!validation.success) {
          console.error('Invalid vinyl data:', validation.error);
          return { success: false, error: validation.error };
        }

        set((state) => ({
          collection: [...state.collection, validation.data]
        }));

        return { success: true };
      },

      removeFromCollection: (id) => {
        if (!id) {
          return { success: false, error: 'ID is required' };
        }

        set((state) => ({
          collection: removeItemFromCollection(state.collection, id)
        }));

        return { success: true };
      },

      toggleFavorite: (id) => {
        if (!id) {
          return { success: false, error: 'ID is required' };
        }

        set((state) => ({
          collection: toggleItemFavorite(state.collection, id)
        }));

        return { success: true };
      },

      updateItemInCollection: (id, updates) => {
        if (!id) {
          return { success: false, error: 'ID is required' };
        }

        // Validate updates if they contain critical fields
        if (updates.price) {
          const validation = validateData(VinylSchema.shape.price, updates.price);
          if (!validation.success) {
            console.error('Invalid price data:', validation.error);
            return { success: false, error: validation.error };
          }
        }

        set((state) => ({
          collection: state.collection.map(item =>
            item.id === id ? { ...item, ...updates } : item
          )
        }));

        return { success: true };
      },

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
      })
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
    ),
    { name: 'CollectionStore' }
  )
);
