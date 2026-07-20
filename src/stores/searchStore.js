/**
 * Search Store - Zustand
 *
 * Manages search state and results
 * Replaces the useSearch hook
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useSearchStore = create(
  devtools(
    (set) => ({
  // Search Query State
  searchQuery: '',
  advancedSearch: {
    artist: '',
    album: '',
    year: '',
    label: '',
    genre: ''
  },

  // Results State
  searchResults: [],
  currentPage: 1,
  totalPages: 1,

  // Search History
  searchHistory: [],

  // Actions
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  addToSearchHistory: (query) => set((state) => {
    if (!query.trim()) return state;
    const filtered = state.searchHistory.filter(q => q !== query);
    return { searchHistory: [query, ...filtered].slice(0, 10) };
  }),

  clearSearchHistory: () => set({ searchHistory: [] }),

  setAdvancedSearch: (advancedSearch) => set({ advancedSearch }),

  updateAdvancedSearchField: (field, value) => set((state) => ({
    advancedSearch: {
      ...state.advancedSearch,
      [field]: value
    }
  })),

  setSearchResults: (searchResults) => set({ searchResults }),

  setCurrentPage: (currentPage) => set({ currentPage }),

  setTotalPages: (totalPages) => set({ totalPages }),

  clearSearch: () => set({
    searchQuery: '',
    advancedSearch: {
      artist: '',
      album: '',
      year: '',
      label: '',
      genre: ''
    },
    searchResults: [],
    currentPage: 1,
    totalPages: 1
  }),

  clearAdvancedSearch: () => set({
    advancedSearch: {
      artist: '',
      album: '',
      year: '',
      label: '',
      genre: ''
    }
  })
    }),
    { name: 'SearchStore' }
  )
);
