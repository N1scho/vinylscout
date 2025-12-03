/**
 * Search Store Tests
 *
 * Test suite for Zustand search store
 */

import { renderHook, act } from '@testing-library/react';
import { useSearchStore } from '../searchStore';

describe('SearchStore', () => {
  beforeEach(() => {
    // Reset store
    const { result } = renderHook(() => useSearchStore());
    act(() => {
      result.current.clearSearch();
    });
  });

  describe('search query', () => {
    it('sets search query', () => {
      const { result } = renderHook(() => useSearchStore());

      act(() => {
        result.current.setSearchQuery('pink floyd');
      });

      expect(result.current.searchQuery).toBe('pink floyd');
    });

    it('clears search query', () => {
      const { result } = renderHook(() => useSearchStore());

      act(() => {
        result.current.setSearchQuery('test');
        result.current.clearSearch();
      });

      expect(result.current.searchQuery).toBe('');
    });
  });

  describe('advanced search', () => {
    it('updates advanced search field', () => {
      const { result } = renderHook(() => useSearchStore());

      act(() => {
        result.current.updateAdvancedSearchField('artist', 'Pink Floyd');
      });

      expect(result.current.advancedSearch.artist).toBe('Pink Floyd');
    });

    it('sets complete advanced search', () => {
      const { result } = renderHook(() => useSearchStore());

      const advancedSearch = {
        artist: 'Pink Floyd',
        album: 'Dark Side',
        year: '1973',
        label: 'Harvest',
        genre: 'Rock'
      };

      act(() => {
        result.current.setAdvancedSearch(advancedSearch);
      });

      expect(result.current.advancedSearch).toEqual(advancedSearch);
    });

    it('clears advanced search', () => {
      const { result } = renderHook(() => useSearchStore());

      act(() => {
        result.current.setAdvancedSearch({
          artist: 'Test',
          album: 'Test Album'
        });
        result.current.clearAdvancedSearch();
      });

      expect(result.current.advancedSearch.artist).toBe('');
      expect(result.current.advancedSearch.album).toBe('');
    });
  });

  describe('search results', () => {
    it('sets search results', () => {
      const { result } = renderHook(() => useSearchStore());

      const results = [
        { id: 1, title: 'Album 1' },
        { id: 2, title: 'Album 2' }
      ];

      act(() => {
        result.current.setSearchResults(results);
      });

      expect(result.current.searchResults).toHaveLength(2);
    });

    it('sets pagination', () => {
      const { result } = renderHook(() => useSearchStore());

      act(() => {
        result.current.setCurrentPage(3);
        result.current.setTotalPages(10);
      });

      expect(result.current.currentPage).toBe(3);
      expect(result.current.totalPages).toBe(10);
    });
  });

  describe('clearSearch', () => {
    it('clears all search state', () => {
      const { result } = renderHook(() => useSearchStore());

      act(() => {
        result.current.setSearchQuery('test');
        result.current.setAdvancedSearch({ artist: 'Test Artist' });
        result.current.setSearchResults([{ id: 1, title: 'Test' }]);
        result.current.setCurrentPage(5);
        result.current.setTotalPages(20);
      });

      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.searchQuery).toBe('');
      expect(result.current.advancedSearch.artist).toBe('');
      expect(result.current.searchResults).toHaveLength(0);
      expect(result.current.currentPage).toBe(1);
      expect(result.current.totalPages).toBe(1);
    });
  });
});
