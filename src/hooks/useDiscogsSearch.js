/**
 * useDiscogsSearch Hook
 *
 * Manages Discogs API search operations and state
 * Extracted from App.jsx v2.11.0
 */

import { useState, useCallback } from 'react';
import * as DiscogsService from '../services/discogsService';

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
   * Batches requests to avoid rate limiting
   */
  const fetchAllPrices = useCallback(async (results, maxItems = 50) => {
    // Clear previous prices
    setResultPrices({});

    const itemsToFetch = results.slice(0, Math.min(results.length, maxItems));
    let fetchedPrices = {};
    const batchSize = 3;
    const delayBetweenBatches = 500; // 500ms between batches

    for (let i = 0; i < itemsToFetch.length; i++) {
      const result = itemsToFetch[i];

      try {
        const priceData = await DiscogsService.fetchPriceInfo(result.id);

        if (priceData) {
          fetchedPrices[result.id] = priceData;

          // Update UI every batchSize items
          if ((i + 1) % batchSize === 0 || i === itemsToFetch.length - 1) {
            setResultPrices(prev => ({ ...prev, ...fetchedPrices }));
            fetchedPrices = {}; // Clear batch

            // Delay between batches to avoid rate limiting
            if (i < itemsToFetch.length - 1) {
              await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
            }
          }
        }
      } catch (error) {
        console.error(`Failed to fetch price for ${result.id}:`, error);
      }
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
