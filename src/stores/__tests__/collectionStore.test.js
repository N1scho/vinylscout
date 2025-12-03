/**
 * Collection Store Tests
 *
 * Comprehensive test suite for Zustand collection store
 */

import { renderHook, act } from '@testing-library/react';
import { useCollectionStore } from '../collectionStore';

describe('CollectionStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useCollectionStore());
    act(() => {
      result.current.setCollection([]);
      result.current.clearFilters();
    });
  });

  describe('addToCollection', () => {
    it('adds valid vinyl to collection', () => {
      const { result } = renderHook(() => useCollectionStore());

      const vinyl = {
        id: 1,
        title: 'Test Album',
        artist: 'Test Artist',
        year: 2024
      };

      act(() => {
        const response = result.current.addToCollection(vinyl);
        expect(response.success).toBe(true);
      });

      expect(result.current.collection).toHaveLength(1);
      expect(result.current.collection[0].title).toBe('Test Album');
    });

    it('rejects invalid vinyl (missing title)', () => {
      const { result } = renderHook(() => useCollectionStore());

      const invalidVinyl = {
        id: 1,
        title: '' // Invalid: empty title
      };

      act(() => {
        const response = result.current.addToCollection(invalidVinyl);
        expect(response.success).toBe(false);
        expect(response.error).toContain('Title is required');
      });

      expect(result.current.collection).toHaveLength(0);
    });

    it('rejects invalid vinyl (invalid year)', () => {
      const { result } = renderHook(() => useCollectionStore());

      const invalidVinyl = {
        id: 1,
        title: 'Test Album',
        year: 1800 // Invalid: too old
      };

      act(() => {
        const response = result.current.addToCollection(invalidVinyl);
        expect(response.success).toBe(false);
      });

      expect(result.current.collection).toHaveLength(0);
    });
  });

  describe('removeFromCollection', () => {
    it('removes vinyl from collection', () => {
      const { result } = renderHook(() => useCollectionStore());

      // Add vinyl first
      const vinyl = { id: 1, title: 'Test Album' };
      act(() => {
        result.current.addToCollection(vinyl);
      });

      expect(result.current.collection).toHaveLength(1);

      // Remove it
      act(() => {
        const response = result.current.removeFromCollection(1);
        expect(response.success).toBe(true);
      });

      expect(result.current.collection).toHaveLength(0);
    });

    it('returns error when ID is missing', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        const response = result.current.removeFromCollection(null);
        expect(response.success).toBe(false);
        expect(response.error).toBe('ID is required');
      });
    });
  });

  describe('toggleFavorite', () => {
    it('toggles favorite status', () => {
      const { result } = renderHook(() => useCollectionStore());

      const vinyl = { id: 1, title: 'Test Album', favorite: false };
      act(() => {
        result.current.addToCollection(vinyl);
      });

      // Toggle on
      act(() => {
        const response = result.current.toggleFavorite(1);
        expect(response.success).toBe(true);
      });

      expect(result.current.collection[0].favorite).toBe(true);

      // Toggle off
      act(() => {
        result.current.toggleFavorite(1);
      });

      expect(result.current.collection[0].favorite).toBe(false);
    });
  });

  describe('updateItemInCollection', () => {
    it('updates vinyl with valid data', () => {
      const { result } = renderHook(() => useCollectionStore());

      const vinyl = { id: 1, title: 'Test Album' };
      act(() => {
        result.current.addToCollection(vinyl);
      });

      act(() => {
        const response = result.current.updateItemInCollection(1, { artist: 'New Artist' });
        expect(response.success).toBe(true);
      });

      expect(result.current.collection[0].artist).toBe('New Artist');
    });

    it('validates price updates', () => {
      const { result } = renderHook(() => useCollectionStore());

      const vinyl = { id: 1, title: 'Test Album' };
      act(() => {
        result.current.addToCollection(vinyl);
      });

      const invalidPrice = { value: -10, currency: 'USD' };
      act(() => {
        const response = result.current.updateItemInCollection(1, { price: invalidPrice });
        expect(response.success).toBe(false);
        expect(response.error).toContain('positive');
      });
    });
  });

  describe('filters and sorting', () => {
    it('sets collection search', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.setCollectionSearch('pink floyd');
      });

      expect(result.current.collectionSearch).toBe('pink floyd');
    });

    it('sets sort by', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.setSortBy('year-desc');
      });

      expect(result.current.sortBy).toBe('year-desc');
    });

    it('clears all filters', () => {
      const { result } = renderHook(() => useCollectionStore());

      act(() => {
        result.current.setCollectionSearch('test');
        result.current.setActiveGenreFilter('rock');
        result.current.setActiveDecadeFilter('80s');
      });

      expect(result.current.collectionSearch).toBe('test');
      expect(result.current.activeGenreFilter).toBe('rock');

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.collectionSearch).toBe('');
      expect(result.current.activeGenreFilter).toBeNull();
      expect(result.current.activeDecadeFilter).toBeNull();
    });
  });

  describe('computed values', () => {
    it('calculates collection value', () => {
      const { result } = renderHook(() => useCollectionStore());

      const vinyl1 = {
        id: 1,
        title: 'Album 1',
        price: { value: 10, currency: 'USD' }
      };
      const vinyl2 = {
        id: 2,
        title: 'Album 2',
        price: { value: 20, currency: 'USD' }
      };

      act(() => {
        result.current.addToCollection(vinyl1);
        result.current.addToCollection(vinyl2);
      });

      const value = result.current.getCollectionValue();
      expect(value).toBeGreaterThan(0);
    });
  });

  describe('persistence', () => {
    it('persists collection to localStorage', () => {
      const { result } = renderHook(() => useCollectionStore());

      const vinyl = { id: 1, title: 'Test Album' };
      act(() => {
        result.current.addToCollection(vinyl);
      });

      // Check localStorage
      const stored = localStorage.getItem('vinyl-collection-storage');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored);
      expect(parsed.state.collection).toHaveLength(1);
    });
  });
});
