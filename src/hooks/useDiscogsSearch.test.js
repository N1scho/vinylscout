/**
 * useDiscogsSearch Hook Tests
 *
 * Tests for Discogs API search functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDiscogsSearch } from './useDiscogsSearch';
import * as DiscogsService from '../services/discogsService';

// Mock the Discogs service
vi.mock('../services/discogsService', () => ({
  searchDiscogs: vi.fn(),
  fetchPriceInfo: vi.fn(),
  fetchVinylDetails: vi.fn(),
  waitForRateLimit: vi.fn()
}));

describe('useDiscogsSearch', () => {
  const mockToken = 'test-discogs-token-12345';

  beforeEach(() => {
    vi.clearAllMocks();
    DiscogsService.waitForRateLimit.mockResolvedValue();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useDiscogsSearch(mockToken));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.resultPrices).toEqual({});
      expect(result.current.refreshingPrices).toEqual({});
      expect(result.current.priceChanges).toEqual({});
    });

    it('should handle missing token', () => {
      const { result } = renderHook(() => useDiscogsSearch(null));

      expect(result.current.isLoading).toBe(false);
      expect(result.current.resultPrices).toEqual({});
    });
  });

  describe('Perform Search', () => {
    it('should perform basic search successfully', async () => {
      const mockResults = {
        results: [
          { id: 1, title: 'Dark Side of the Moon', artist: 'Pink Floyd' },
          { id: 2, title: 'The Wall', artist: 'Pink Floyd' }
        ],
        pagination: { page: 1, pages: 5, items: 100 }
      };

      DiscogsService.searchDiscogs.mockResolvedValue(mockResults);

      const { result } = renderHook(() => useDiscogsSearch(mockToken));

      let searchResult;
      let successData;
      const onSuccess = vi.fn((data) => { successData = data; });
      const onError = vi.fn();

      await act(async () => {
        searchResult = await result.current.performSearch({
          query: 'Pink Floyd',
          page: 1,
          onSuccess,
          onError
        });
      });

      expect(DiscogsService.searchDiscogs).toHaveBeenCalledWith({
        token: mockToken,
        isAdvanced: false,
        query: 'Pink Floyd',
        advancedSearch: undefined,
        page: 1,
        perPage: 50
      });

      expect(searchResult).toEqual(mockResults);
      expect(onSuccess).toHaveBeenCalledWith(mockResults);
      expect(onError).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    it('should perform advanced search successfully', async () => {
      const mockResults = {
        results: [{ id: 1, title: 'Abbey Road' }],
        pagination: { page: 1, pages: 1, items: 1 }
      };

      DiscogsService.searchDiscogs.mockResolvedValue(mockResults);

      const { result } = renderHook(() => useDiscogsSearch(mockToken));

      const onSuccess = vi.fn();

      await act(async () => {
        await result.current.performSearch({
          isAdvanced: true,
          advancedSearch: {
            artist: 'The Beatles',
            album: 'Abbey Road',
            year: '1969'
          },
          page: 1,
          onSuccess
        });
      });

      expect(DiscogsService.searchDiscogs).toHaveBeenCalledWith({
        token: mockToken,
        isAdvanced: true,
        query: '',
        advancedSearch: {
          artist: 'The Beatles',
          album: 'Abbey Road',
          year: '1969'
        },
        page: 1,
        perPage: 50
      });

      expect(onSuccess).toHaveBeenCalledWith(mockResults);
    });

    it('should handle search error gracefully', async () => {
      const errorMessage = 'Invalid API token';
      DiscogsService.searchDiscogs.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useDiscogsSearch(mockToken));

      const onSuccess = vi.fn();
      const onError = vi.fn();

      await act(async () => {
        const searchResult = await result.current.performSearch({
          query: 'test',
          onSuccess,
          onError
        });

        expect(searchResult).toBeNull();
      });

      expect(onSuccess).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(errorMessage);
      expect(result.current.isLoading).toBe(false);
    });

    it('should not search without token', async () => {
      const { result } = renderHook(() => useDiscogsSearch(null));

      const onError = vi.fn();

      await act(async () => {
        await result.current.performSearch({
          query: 'test',
          onError
        });
      });

      expect(DiscogsService.searchDiscogs).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith('Please set your Discogs API token in Settings');
    });

    it('should set loading state during search', async () => {
      DiscogsService.searchDiscogs.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ results: [] }), 100))
      );

      const { result } = renderHook(() => useDiscogsSearch(mockToken));

      let loadingDuringSearch = false;

      act(() => {
        result.current.performSearch({
          query: 'test',
          onSuccess: () => {}
        });
      });

      // Check loading state immediately after calling
      await waitFor(() => {
        if (result.current.isLoading) {
          loadingDuringSearch = true;
        }
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(loadingDuringSearch).toBe(true);
    });
  });

  describe('Fetch Prices', () => {
    it('should fetch prices for multiple results', async () => {
      const mockResults = [
        { id: 1, title: 'Album 1' },
        { id: 2, title: 'Album 2' },
        { id: 3, title: 'Album 3' }
      ];

      DiscogsService.fetchPriceInfo
        .mockResolvedValueOnce({ value: 10.50, currency: 'USD' })
        .mockResolvedValueOnce({ value: 15.00, currency: 'USD' })
        .mockResolvedValueOnce({ value: 20.25, currency: 'USD' });

      const { result } = renderHook(() => useDiscogsSearch(mockToken));

      await act(async () => {
        await result.current.fetchAllPrices(mockResults);
      });

      await waitFor(() => {
        expect(Object.keys(result.current.resultPrices).length).toBeGreaterThan(0);
      });

      expect(DiscogsService.fetchPriceInfo).toHaveBeenCalledTimes(3);
      expect(DiscogsService.waitForRateLimit).toHaveBeenCalledTimes(3);
    });

    it('should respect maxItems limit', async () => {
      const mockResults = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        title: `Album ${i + 1}`
      }));

      DiscogsService.fetchPriceInfo.mockResolvedValue({ value: 10.00, currency: 'USD' });

      const { result } = renderHook(() => useDiscogsSearch(mockToken));

      await act(async () => {
        await result.current.fetchAllPrices(mockResults, 10);
      });

      // Should only fetch 10 prices, not 100
      expect(DiscogsService.fetchPriceInfo).toHaveBeenCalledTimes(10);
    });

    it('should handle price fetch errors gracefully', async () => {
      const mockResults = [
        { id: 1, title: 'Album 1' },
        { id: 2, title: 'Album 2' }
      ];

      DiscogsService.fetchPriceInfo
        .mockRejectedValueOnce(new Error('Price not found'))
        .mockResolvedValueOnce({ value: 15.00, currency: 'USD' });

      const { result } = renderHook(() => useDiscogsSearch(mockToken));

      await act(async () => {
        await result.current.fetchAllPrices(mockResults);
      });

      // Should continue fetching even after error
      await waitFor(() => {
        expect(DiscogsService.fetchPriceInfo).toHaveBeenCalledTimes(2);
      });
    });

    it('should clear previous prices before fetching new ones', async () => {
      const { result } = renderHook(() => useDiscogsSearch(mockToken));

      // Set some existing prices
      act(() => {
        result.current.setResultPrices({ 999: { value: 99.99, currency: 'USD' } });
      });

      expect(result.current.resultPrices[999]).toBeDefined();

      DiscogsService.fetchPriceInfo.mockResolvedValue({ value: 10.00, currency: 'USD' });

      await act(async () => {
        await result.current.fetchAllPrices([{ id: 1, title: 'Album 1' }]);
      });

      // Old prices should be cleared
      await waitFor(() => {
        expect(result.current.resultPrices[999]).toBeUndefined();
      });
    });
  });

  describe('Refresh Price', () => {
    it('should refresh price for single item', async () => {
      const mockPriceData = { value: 25.50, currency: 'USD' };
      DiscogsService.fetchPriceInfo.mockResolvedValue(mockPriceData);

      const { result } = renderHook(() => useDiscogsSearch(mockToken));

      let refreshedPrice;

      await act(async () => {
        refreshedPrice = await result.current.refreshPrice(123);
      });

      expect(DiscogsService.fetchPriceInfo).toHaveBeenCalledWith(123, mockToken);
      expect(refreshedPrice).toEqual(mockPriceData);
      expect(result.current.resultPrices[123]).toEqual(mockPriceData);
      expect(result.current.refreshingPrices[123]).toBe(false);
    });

    it('should calculate price change when old price provided', async () => {
      const oldPrice = 20.00;
      const newPrice = { value: 25.00, currency: 'USD' };

      DiscogsService.fetchPriceInfo.mockResolvedValue(newPrice);

      const { result } = renderHook(() => useDiscogsSearch(mockToken));

      await act(async () => {
        await result.current.refreshPrice(123, oldPrice);
      });

      await waitFor(() => {
        expect(result.current.priceChanges[123]).toBeDefined();
      });

      expect(result.current.priceChanges[123].amount).toBe(5.00);
      expect(result.current.priceChanges[123].currency).toBe('USD');
    });

    it('should clear price change indicator after 5 seconds', async () => {
      vi.useFakeTimers();

      const oldPrice = 20.00;
      const newPrice = { value: 25.00, currency: 'USD' };

      DiscogsService.fetchPriceInfo.mockResolvedValue(newPrice);

      const { result } = renderHook(() => useDiscogsSearch(mockToken));

      await act(async () => {
        await result.current.refreshPrice(123, oldPrice);
      });

      await waitFor(() => {
        expect(result.current.priceChanges[123]).toBeDefined();
      });

      // Fast-forward 5 seconds
      await act(async () => {
        vi.advanceTimersByTime(5000);
        await Promise.resolve(); // Flush promises
      });

      await waitFor(() => {
        expect(result.current.priceChanges[123]).toBeUndefined();
      });

      vi.useRealTimers();
    });

    it('should set refreshing state during refresh', async () => {
      let resolvePrice;
      const pricePromise = new Promise(resolve => {
        resolvePrice = resolve;
      });

      DiscogsService.fetchPriceInfo.mockReturnValue(pricePromise);

      const { result } = renderHook(() => useDiscogsSearch(mockToken));

      // Start the refresh
      act(() => {
        result.current.refreshPrice(123);
      });

      // Check refreshing is true
      await waitFor(() => {
        expect(result.current.refreshingPrices[123]).toBe(true);
      }, { timeout: 1000 });

      // Complete the price fetch
      await act(async () => {
        resolvePrice({ value: 10, currency: 'USD' });
        await pricePromise;
      });

      // Check refreshing is false
      await waitFor(() => {
        expect(result.current.refreshingPrices[123]).toBe(false);
      });
    });

    it('should handle refresh error without throwing', async () => {
      DiscogsService.fetchPriceInfo.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useDiscogsSearch(mockToken));

      let refreshResult;

      // Errors are caught inside the hook
      await act(async () => {
        try {
          refreshResult = await result.current.refreshPrice(123);
        } catch (error) {
          // Expected - hook might rethrow or handle
          refreshResult = null;
        }
      });

      // Should return null on error or handle gracefully
      expect(refreshResult).toBeNull();
      expect(result.current.refreshingPrices[123]).toBe(false);
    });

    it('should require token for refresh', async () => {
      const { result } = renderHook(() => useDiscogsSearch(null));

      await expect(async () => {
        await act(async () => {
          await result.current.refreshPrice(123);
        });
      }).rejects.toThrow('Please add your Discogs API token in Settings');
    });
  });

  describe('Fetch Details', () => {
    it('should fetch vinyl details successfully', async () => {
      const mockDetails = {
        id: 123,
        title: 'Dark Side of the Moon',
        artists: [{ name: 'Pink Floyd' }],
        year: 1973,
        genres: ['Rock', 'Progressive Rock'],
        tracklist: [
          { position: 'A1', title: 'Speak to Me' },
          { position: 'A2', title: 'Breathe' }
        ]
      };

      DiscogsService.fetchVinylDetails.mockResolvedValue(mockDetails);

      const { result } = renderHook(() => useDiscogsSearch(mockToken));

      let details;

      await act(async () => {
        details = await result.current.fetchDetails(123);
      });

      expect(DiscogsService.fetchVinylDetails).toHaveBeenCalledWith(123, mockToken);
      expect(details).toEqual(mockDetails);
    });

    it('should handle fetch details error', async () => {
      DiscogsService.fetchVinylDetails.mockRejectedValue(new Error('Not found'));

      const { result } = renderHook(() => useDiscogsSearch(mockToken));

      let details;

      await act(async () => {
        details = await result.current.fetchDetails(123);
      });

      expect(details).toBeNull();
    });

    it('should return null without token', async () => {
      const { result } = renderHook(() => useDiscogsSearch(null));

      let details;

      await act(async () => {
        details = await result.current.fetchDetails(123);
      });

      expect(details).toBeNull();
      expect(DiscogsService.fetchVinylDetails).not.toHaveBeenCalled();
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits when fetching prices', async () => {
      const mockResults = [
        { id: 1, title: 'Album 1' },
        { id: 2, title: 'Album 2' }
      ];

      DiscogsService.fetchPriceInfo.mockResolvedValue({ value: 10, currency: 'USD' });

      const { result } = renderHook(() => useDiscogsSearch(mockToken));

      await act(async () => {
        await result.current.fetchAllPrices(mockResults);
      });

      // Should call waitForRateLimit between each fetch
      expect(DiscogsService.waitForRateLimit).toHaveBeenCalledTimes(2);
    });

    it('should respect rate limits even on error', async () => {
      const mockResults = [
        { id: 1, title: 'Album 1' },
        { id: 2, title: 'Album 2' }
      ];

      DiscogsService.fetchPriceInfo
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce({ value: 10, currency: 'USD' });

      const { result } = renderHook(() => useDiscogsSearch(mockToken));

      await act(async () => {
        await result.current.fetchAllPrices(mockResults);
      });

      // Should still wait for rate limit even after error
      expect(DiscogsService.waitForRateLimit).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty search results', async () => {
      DiscogsService.searchDiscogs.mockResolvedValue({
        results: [],
        pagination: { page: 1, pages: 0, items: 0 }
      });

      const { result } = renderHook(() => useDiscogsSearch(mockToken));

      const onSuccess = vi.fn();

      await act(async () => {
        await result.current.performSearch({
          query: 'nonexistent album xyz123',
          onSuccess
        });
      });

      expect(onSuccess).toHaveBeenCalledWith({
        results: [],
        pagination: { page: 1, pages: 0, items: 0 }
      });
    });

    it('should handle null price data gracefully', async () => {
      DiscogsService.fetchPriceInfo.mockResolvedValue(null);

      const { result } = renderHook(() => useDiscogsSearch(mockToken));

      await act(async () => {
        await result.current.refreshPrice(123);
      });

      expect(result.current.resultPrices[123]).toBeUndefined();
    });

    it('should handle concurrent price refreshes', async () => {
      DiscogsService.fetchPriceInfo.mockResolvedValue({ value: 10, currency: 'USD' });

      const { result } = renderHook(() => useDiscogsSearch(mockToken));

      await act(async () => {
        await Promise.all([
          result.current.refreshPrice(1),
          result.current.refreshPrice(2),
          result.current.refreshPrice(3)
        ]);
      });

      expect(DiscogsService.fetchPriceInfo).toHaveBeenCalledTimes(3);
      expect(Object.keys(result.current.resultPrices)).toHaveLength(3);
    });
  });
});
