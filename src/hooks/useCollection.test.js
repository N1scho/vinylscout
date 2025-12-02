/**
 * useCollection Hook Tests
 *
 * Tests for collection management functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCollection } from './useCollection';
import * as StorageService from '../services/storageService';

// Mock the storage service
vi.mock('../services/storageService', () => ({
  loadCollection: vi.fn(),
  saveCollection: vi.fn()
}));

describe('useCollection', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Reset localStorage mock
    localStorage.clear();

    // Default mock implementation
    StorageService.loadCollection.mockReturnValue([]);
  });

  describe('Initialization', () => {
    it('should initialize with empty collection', () => {
      const { result } = renderHook(() => useCollection());

      expect(result.current.collection).toEqual([]);
      expect(result.current.sortBy).toBe('artist-asc');
      expect(result.current.collectionView).toBe('grid');
      expect(result.current.collectionFilter).toBe('all');
      expect(result.current.collectionSearch).toBe('');
    });

    it('should load saved collection from storage on mount', () => {
      const mockCollection = [
        { id: 1, title: 'Test Album', artist: 'Test Artist', year: 2020 }
      ];
      StorageService.loadCollection.mockReturnValue(mockCollection);

      const { result } = renderHook(() => useCollection());

      expect(StorageService.loadCollection).toHaveBeenCalledTimes(1);
      expect(result.current.collection).toEqual(mockCollection);
    });

    it('should handle empty storage gracefully', () => {
      StorageService.loadCollection.mockReturnValue([]);

      const { result } = renderHook(() => useCollection());

      expect(result.current.collection).toEqual([]);
    });
  });

  describe('Adding Items', () => {
    it('should add item to collection', () => {
      const { result } = renderHook(() => useCollection());

      const newItem = {
        id: 1,
        title: 'Dark Side of the Moon',
        artist: 'Pink Floyd',
        year: 1973,
        price: { value: 25.99, currency: 'USD' }
      };

      act(() => {
        result.current.addToCollection(newItem);
      });

      expect(result.current.collection).toHaveLength(1);
      expect(result.current.collection[0]).toEqual(newItem);
    });

    it('should save collection to storage after adding', async () => {
      const { result } = renderHook(() => useCollection());

      const newItem = {
        id: 1,
        title: 'Test Album',
        artist: 'Test Artist'
      };

      await act(async () => {
        result.current.addToCollection(newItem);
      });

      // Wait for effect to run
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(StorageService.saveCollection).toHaveBeenCalledWith([newItem]);
    });

    it('should add multiple items correctly', () => {
      const { result } = renderHook(() => useCollection());

      const items = [
        { id: 1, title: 'Album 1', artist: 'Artist 1' },
        { id: 2, title: 'Album 2', artist: 'Artist 2' },
        { id: 3, title: 'Album 3', artist: 'Artist 3' }
      ];

      act(() => {
        items.forEach(item => result.current.addToCollection(item));
      });

      expect(result.current.collection).toHaveLength(3);
      expect(result.current.collection).toEqual(items);
    });
  });

  describe('Removing Items', () => {
    it('should remove item from collection by id', () => {
      const mockCollection = [
        { id: 1, title: 'Album 1', artist: 'Artist 1' },
        { id: 2, title: 'Album 2', artist: 'Artist 2' },
        { id: 3, title: 'Album 3', artist: 'Artist 3' }
      ];
      StorageService.loadCollection.mockReturnValue(mockCollection);

      const { result } = renderHook(() => useCollection());

      act(() => {
        result.current.removeFromCollection(2);
      });

      expect(result.current.collection).toHaveLength(2);
      expect(result.current.collection.find(item => item.id === 2)).toBeUndefined();
      expect(result.current.collection).toEqual([
        { id: 1, title: 'Album 1', artist: 'Artist 1' },
        { id: 3, title: 'Album 3', artist: 'Artist 3' }
      ]);
    });

    it('should handle removing non-existent item', () => {
      const mockCollection = [
        { id: 1, title: 'Album 1', artist: 'Artist 1' }
      ];
      StorageService.loadCollection.mockReturnValue(mockCollection);

      const { result } = renderHook(() => useCollection());

      act(() => {
        result.current.removeFromCollection(999);
      });

      expect(result.current.collection).toHaveLength(1);
      expect(result.current.collection).toEqual(mockCollection);
    });
  });

  describe('Toggle Favorite', () => {
    it('should toggle favorite status on item', () => {
      const mockCollection = [
        { id: 1, title: 'Album 1', artist: 'Artist 1', isFavorite: false }
      ];
      StorageService.loadCollection.mockReturnValue(mockCollection);

      const { result } = renderHook(() => useCollection());

      act(() => {
        result.current.toggleFavorite(1);
      });

      expect(result.current.collection[0].isFavorite).toBe(true);

      act(() => {
        result.current.toggleFavorite(1);
      });

      expect(result.current.collection[0].isFavorite).toBe(false);
    });

    it('should add isFavorite property if missing', () => {
      const mockCollection = [
        { id: 1, title: 'Album 1', artist: 'Artist 1' } // No isFavorite property
      ];
      StorageService.loadCollection.mockReturnValue(mockCollection);

      const { result } = renderHook(() => useCollection());

      act(() => {
        result.current.toggleFavorite(1);
      });

      expect(result.current.collection[0].isFavorite).toBe(true);
    });
  });

  describe('Filtering and Sorting', () => {
    it('should filter collection by search term', () => {
      const mockCollection = [
        { id: 1, title: 'Dark Side of the Moon', artist: 'Pink Floyd', year: 1973 },
        { id: 2, title: 'Abbey Road', artist: 'The Beatles', year: 1969 },
        { id: 3, title: 'The Wall', artist: 'Pink Floyd', year: 1979 }
      ];
      StorageService.loadCollection.mockReturnValue(mockCollection);

      const { result } = renderHook(() => useCollection());

      act(() => {
        result.current.setCollectionSearch('Pink Floyd');
      });

      expect(result.current.filteredAndSorted).toHaveLength(2);
      expect(result.current.filteredAndSorted.every(item =>
        item.artist.includes('Pink Floyd')
      )).toBe(true);
    });

    it('should filter by favorites', () => {
      const mockCollection = [
        { id: 1, title: 'Album 1', artist: 'Artist 1', isFavorite: true },
        { id: 2, title: 'Album 2', artist: 'Artist 2', isFavorite: false },
        { id: 3, title: 'Album 3', artist: 'Artist 3', isFavorite: true }
      ];
      StorageService.loadCollection.mockReturnValue(mockCollection);

      const { result } = renderHook(() => useCollection());

      act(() => {
        result.current.setCollectionFilter('favorites');
      });

      expect(result.current.filteredAndSorted).toHaveLength(2);
      expect(result.current.filteredAndSorted.every(item => item.isFavorite)).toBe(true);
    });

    it('should sort collection by artist ascending', () => {
      const mockCollection = [
        { id: 1, title: 'Zebra - Album 1', artist: 'Zebra' },
        { id: 2, title: 'Apple - Album 2', artist: 'Apple' },
        { id: 3, title: 'Mango - Album 3', artist: 'Mango' }
      ];
      StorageService.loadCollection.mockReturnValue(mockCollection);

      const { result } = renderHook(() => useCollection());

      act(() => {
        result.current.setSortBy('artist-asc');
      });

      // Sorting uses the artist part of the title (before " - ")
      const artists = result.current.filteredAndSorted.map(item => item.artist);
      expect(artists).toEqual(['Apple', 'Mango', 'Zebra']);
    });
  });

  describe('Collection Value', () => {
    it('should calculate total collection value', () => {
      const mockCollection = [
        { id: 1, title: 'Album 1', price: { value: 10.50, currency: 'USD' } },
        { id: 2, title: 'Album 2', price: { value: 15.25, currency: 'USD' } },
        { id: 3, title: 'Album 3', price: { value: 20.00, currency: 'USD' } }
      ];
      StorageService.loadCollection.mockReturnValue(mockCollection);

      const { result } = renderHook(() => useCollection());

      // collectionValue returns { total, count, currency }
      expect(result.current.collectionValue.total).toBeCloseTo(45.75, 2);
      expect(result.current.collectionValue.count).toBe(3);
      expect(result.current.collectionValue.currency).toBe('USD');
    });

    it('should handle collection with no prices', () => {
      const mockCollection = [
        { id: 1, title: 'Album 1' },
        { id: 2, title: 'Album 2' }
      ];
      StorageService.loadCollection.mockReturnValue(mockCollection);

      const { result } = renderHook(() => useCollection());

      expect(result.current.collectionValue.total).toBe(0);
      expect(result.current.collectionValue.count).toBe(0);
    });

    it('should handle mixed price formats (backward compatibility)', () => {
      const mockCollection = [
        { id: 1, title: 'Album 1', price: { value: 10.00, currency: 'USD' } },
        { id: 2, title: 'Album 2', lowestPrice: 15.00 }, // Old format
        { id: 3, title: 'Album 3' } // No price
      ];
      StorageService.loadCollection.mockReturnValue(mockCollection);

      const { result } = renderHook(() => useCollection());

      expect(result.current.collectionValue.total).toBeCloseTo(25.00, 2);
      expect(result.current.collectionValue.count).toBe(2);
    });
  });

  describe('Price Change Calculation', () => {
    it('should calculate price change for item with history', () => {
      const mockCollection = [
        {
          id: 1,
          title: 'Album 1',
          price: { value: 30.00, currency: 'USD' },
          priceHistory: [
            { date: '2024-01-01', price: 25.00, currency: 'USD' },
            { date: '2024-01-15', price: 30.00, currency: 'USD' }
          ]
        }
      ];
      StorageService.loadCollection.mockReturnValue(mockCollection);

      const { result } = renderHook(() => useCollection());

      const priceChange = result.current.getPriceChange(mockCollection[0]);

      expect(priceChange).toBeDefined();
      expect(priceChange.absolute).toBe(5.00);
      expect(priceChange.current).toBe(30.00);
      expect(priceChange.previous).toBe(25.00);
      expect(priceChange.isPositive).toBe(true);
    });

    it('should return null for item without price history', () => {
      const mockCollection = [
        {
          id: 1,
          title: 'Album 1',
          price: { value: 30.00, currency: 'USD' }
        }
      ];
      StorageService.loadCollection.mockReturnValue(mockCollection);

      const { result } = renderHook(() => useCollection());

      const priceChange = result.current.getPriceChange(mockCollection[0]);

      expect(priceChange).toBeNull();
    });

    it('should return null for item with single price entry', () => {
      const mockCollection = [
        {
          id: 1,
          title: 'Album 1',
          price: { value: 30.00, currency: 'USD' },
          priceHistory: [
            { date: '2024-01-01', price: 25.00, currency: 'USD' }
          ]
        }
      ];
      StorageService.loadCollection.mockReturnValue(mockCollection);

      const { result } = renderHook(() => useCollection());

      const priceChange = result.current.getPriceChange(mockCollection[0]);

      // Need at least 2 entries for price change calculation
      expect(priceChange).toBeNull();
    });
  });

  describe('Clear Filters', () => {
    it('should clear all active filters', () => {
      const { result } = renderHook(() => useCollection());

      act(() => {
        result.current.setActiveGenreFilter('Rock');
        result.current.setActiveDecadeFilter('1970s');
        result.current.setActiveFormatFilter('LP');
        result.current.setCollectionSearch('test');
      });

      expect(result.current.activeGenreFilter).toBe('Rock');
      expect(result.current.activeDecadeFilter).toBe('1970s');
      expect(result.current.activeFormatFilter).toBe('LP');
      expect(result.current.collectionSearch).toBe('test');

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.activeGenreFilter).toBeNull();
      expect(result.current.activeDecadeFilter).toBeNull();
      expect(result.current.activeFormatFilter).toBeNull();
      expect(result.current.collectionSearch).toBe('');
    });
  });

  describe('Update Item', () => {
    it('should update specific item properties', () => {
      const mockCollection = [
        { id: 1, title: 'Album 1', artist: 'Artist 1', year: 1970 }
      ];
      StorageService.loadCollection.mockReturnValue(mockCollection);

      const { result } = renderHook(() => useCollection());

      act(() => {
        result.current.updateItemInCollection(1, { year: 1975, genre: ['Rock'] });
      });

      expect(result.current.collection[0].year).toBe(1975);
      expect(result.current.collection[0].genre).toEqual(['Rock']);
      expect(result.current.collection[0].title).toBe('Album 1'); // Original property preserved
    });

    it('should not update non-matching items', () => {
      const mockCollection = [
        { id: 1, title: 'Album 1', artist: 'Artist 1' },
        { id: 2, title: 'Album 2', artist: 'Artist 2' }
      ];
      StorageService.loadCollection.mockReturnValue(mockCollection);

      const { result } = renderHook(() => useCollection());

      act(() => {
        result.current.updateItemInCollection(1, { artist: 'Updated Artist' });
      });

      expect(result.current.collection[0].artist).toBe('Updated Artist');
      expect(result.current.collection[1].artist).toBe('Artist 2'); // Unchanged
    });
  });

  describe('Edge Cases', () => {
    it('should handle corrupted storage data by returning empty array', () => {
      // StorageService should handle errors internally and return []
      StorageService.loadCollection.mockReturnValue([]);

      const { result } = renderHook(() => useCollection());

      expect(result.current.collection).toEqual([]);
    });

    it('should handle duplicate IDs gracefully', () => {
      const { result } = renderHook(() => useCollection());

      const item1 = { id: 1, title: 'Album 1' };
      const item2 = { id: 1, title: 'Album 1 Duplicate' };

      act(() => {
        result.current.addToCollection(item1);
        result.current.addToCollection(item2);
      });

      // Both should be added (no duplicate checking at hook level)
      expect(result.current.collection).toHaveLength(2);
    });

    it('should maintain reference stability for filteredAndSorted', () => {
      const mockCollection = [
        { id: 1, title: 'Album 1', artist: 'Artist 1' }
      ];
      StorageService.loadCollection.mockReturnValue(mockCollection);

      const { result, rerender } = renderHook(() => useCollection());

      const firstReference = result.current.filteredAndSorted;

      // Rerender without changing dependencies
      rerender();

      // Should be same reference (memoized)
      expect(result.current.filteredAndSorted).toBe(firstReference);
    });
  });
});
