/**
 * useDiscogsSearch Hook
 *
 * Manages Discogs API search operations and state
 * Extracted from App.jsx v2.11.0
 */

import { useState, useCallback } from 'react';
import * as DiscogsService from '../services/discogsService';

export const useDiscogsSearch = (discogsToken) => {
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
    if (!discogsToken) {
      onError?.('Please set your Discogs API token in Settings');
      return null;
    }

    setIsLoading(true);
    try {
      const result = await DiscogsService.searchDiscogs({
        token: discogsToken,
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
      onError?.(err.message || 'Search failed. Please check your API token.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [discogsToken]);

  /**
   * Fetch prices for multiple results with incremental UI updates
   */
  const fetchAllPrices = useCallback(async (results, maxItems = 50) => {
    // Clear previous prices
    setResultPrices({});

    const itemsToFetch = results.slice(0, Math.min(results.length, maxItems));
    let fetchedPrices = {};

    for (let i = 0; i < itemsToFetch.length; i++) {
      const result = itemsToFetch[i];

      try {
        const priceData = await DiscogsService.fetchPriceInfo(result.id, discogsToken);

        if (priceData) {
          fetchedPrices[result.id] = priceData;

          // Update UI every 3 items for smooth incremental loading
          if ((i + 1) % 3 === 0 || i === itemsToFetch.length - 1) {
            setResultPrices(prev => ({ ...prev, ...fetchedPrices }));
            fetchedPrices = {}; // Clear batch
          }
        }

        // Respect Discogs rate limits
        await DiscogsService.waitForRateLimit();
      } catch (error) {
        console.error(`Failed to fetch price for ${result.id}:`, error);
        // Still respect rate limit even on error
        await DiscogsService.waitForRateLimit();
      }
    }
  }, [discogsToken]);

  /**
   * Refresh price for a single item
   */
  const refreshPrice = useCallback(async (itemId, currentPrice = null) => {
    if (!discogsToken) {
      throw new Error('Please add your Discogs API token in Settings');
    }

    const oldPrice = currentPrice || resultPrices[itemId]?.value;
    setRefreshingPrices(prev => ({ ...prev, [itemId]: true }));

    try {
      const priceData = await DiscogsService.fetchPriceInfo(itemId, discogsToken);

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

        return priceData;
      } else {
        throw new Error('No price data available');
      }
    } finally {
      setRefreshingPrices(prev => ({ ...prev, [itemId]: false }));
    }
  }, [discogsToken, resultPrices]);

  /**
   * Fetch full vinyl details
   */
  const fetchDetails = useCallback(async (id) => {
    if (!discogsToken) return null;

    try {
      return await DiscogsService.fetchVinylDetails(id, discogsToken);
    } catch (err) {
      console.error('Failed to fetch details:', err);
      return null;
    }
  }, [discogsToken]);

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
