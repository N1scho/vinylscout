/**
 * useDiscogsSearch Hook
 *
 * Manages Discogs API search operations and state
 * Extracted from App.jsx v2.11.0
 */

import { useState, useCallback } from 'react';
import * as DiscogsService from '../services/discogsService';
import { savePriceRecord } from '../services/priceHistoryService';

export const useDiscogsSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [resultPrices, setResultPrices] = useState({});
  const [refreshingPrices, setRefreshingPrices] = useState({});
  const [priceChanges, setPriceChanges] = useState({});

  /**
   * Perform Discogs search
   */
  const performSearch = useCallback(async ({
    isAdvanced = false,
    query = '',
    advancedSearch = {},
    page = 1,
    perPage = 50,
    onSuccess,
    onError
  }) => {
    setIsLoading(true);
    try {
      const result = await DiscogsService.searchDiscogs({
        isAdvanced,
        query,
        advancedSearch,
        page,
        perPage
      });

      onSuccess?.(result);
      return result;
    } catch (err) {
      console.error('Search failed:', err);
      onError?.(err.message || 'Suche fehlgeschlagen.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch prices for multiple results with incremental UI updates
   */
  const fetchAllPrices = useCallback(async (results, maxItems = 20) => {
    const itemsToFetch = results.slice(0, Math.min(results.length, maxItems));

    if (itemsToFetch.length === 0) return;

    const fetchPromises = itemsToFetch.map(async (result) => {
      try {
        const priceData = await DiscogsService.fetchPriceInfo(result.id);
        if (priceData) {
          return { id: result.id, priceData };
        }
      } catch (error) {
        console.error(`Failed to fetch price for ${result.id}:`, error.message);
      }
      return null;
    });

    // Fetch all prices in parallel (proxy handles rate limiting)
    const results_prices = await Promise.all(fetchPromises);

    // Build prices object from successful fetches
    const newPrices = {};
    results_prices.forEach(result => {
      if (result) {
        newPrices[result.id] = result.priceData;
      }
    });

    // Update state once with all prices
    if (Object.keys(newPrices).length > 0) {
      setResultPrices(newPrices);
    }
  }, []);

  /**
   * Refresh price for a single item
   */
  const refreshPrice = useCallback(async (itemId, currentPrice = null) => {
    const oldPrice = currentPrice || resultPrices[itemId]?.value;
    setRefreshingPrices(prev => ({ ...prev, [itemId]: true }));

    try {
      const priceData = await DiscogsService.fetchPriceInfo(itemId);

      if (priceData) {
        // Calculate price change if we have old price
        if (oldPrice !== null && oldPrice !== undefined) {
          const change = priceData.value - oldPrice;
          setPriceChanges(prev => ({
            ...prev,
            [itemId]: {
              amount: change,
              currency: priceData.currency
            }
          }));

          // Clear price change indicator after 5 seconds
          setTimeout(() => {
            setPriceChanges(prev => {
              const newChanges = { ...prev };
              delete newChanges[itemId];
              return newChanges;
            });
          }, 5000);
        }

        // Update result prices
        setResultPrices(prev => ({
          ...prev,
          [itemId]: priceData
        }));

        // Save price record to history
        try {
          savePriceRecord(itemId, priceData.value, priceData.currency);
        } catch (error) {
          console.error('Failed to save price record:', error);
          // Continue anyway - price update is successful even if history save fails
        }

        return priceData;
      } else {
        // Don't throw - just return null silently (price data often unavailable)
        return null;
      }
    } finally {
      setRefreshingPrices(prev => ({ ...prev, [itemId]: false }));
    }
  }, [resultPrices]);

  /**
   * Fetch full vinyl details
   */
  const fetchDetails = useCallback(async (id) => {
    try {
      return await DiscogsService.fetchVinylDetails(id);
    } catch (err) {
      console.error('Failed to fetch details:', err);
      return null;
    }
  }, []);

  return {
    // State
    isLoading,
    resultPrices,
    refreshingPrices,
    priceChanges,

    // Operations
    performSearch,
    fetchAllPrices,
    refreshPrice,
    fetchDetails,

    // Setters (for direct state updates if needed)
    setResultPrices,
    setRefreshingPrices,
    setPriceChanges
  };
};
