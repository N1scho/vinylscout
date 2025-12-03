/**
 * Search Store - Zustand
 *
 * Manages search state and results
 * Replaces the useSearch hook
 */

import { create } from 'zustand';

export const useSearchStore = create((set) => ({
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

  // Actions
  setSearchQuery: (searchQuery) => set({ searchQuery }),

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
}));
