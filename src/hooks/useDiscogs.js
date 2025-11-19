import { useState, useCallback } from 'react';
import { handleError, withRetry, withTimeout } from '../utils/errorHandler';
import { validators } from '../utils/validators';

/**
 * Custom Hook for Discogs API
 *
 * Provides a clean interface for all Discogs operations with:
 * - Automatic error handling
 * - Request validation
 * - Loading states
 * - Retry logic
 * - Rate limiting
 */

export function useDiscogs(showToast) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Search Discogs database
   */
  const search = useCallback(async (query, page = 1, isAdvanced = false, advancedParams = {}) => {
    // Validate input
    if (!isAdvanced && !validators.isValidSearchQuery(query)) {
      const message = 'Please enter a search query (1-200 characters)';
      if (showToast) showToast(message, 'error');
      return null;
    }

    if (!validators.isValidPage(page)) {
      const message = 'Invalid page number';
      if (showToast) showToast(message, 'error');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build request parameters
      const params = {
        type: 'release',
        per_page: 50,
        page
      };

      if (isAdvanced) {
        if (advancedParams.artist) params.artist = advancedParams.artist;
        if (advancedParams.album) params.release_title = advancedParams.album;
        if (advancedParams.year) params.year = advancedParams.year;
        if (advancedParams.label) params.label = advancedParams.label;
        if (advancedParams.genre) params.genre = advancedParams.genre;
      } else {
        params.q = query;
      }

      // Make request through proxy (keeps API key server-side)
      const response = await withTimeout(
        () => fetch('/api/discogs-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: '/database/search',
            params
          })
        }),
        15000 // 15 second timeout
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        results: data.results || [],
        pagination: data.pagination || { page: 1, pages: 1 }
      };

    } catch (err) {
      const message = handleError(err, 'searchDiscogs', null, showToast);
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  /**
   * Get release details
   */
  const getRelease = useCallback(async (releaseId) => {
    if (!validators.isValidDiscogsId(releaseId)) {
      const message = 'Invalid release ID';
      if (showToast) showToast(message, 'error');
      return null;
    }

    try {
      const response = await withTimeout(
        () => fetch('/api/discogs-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: `/releases/${releaseId}`
          })
        }),
        10000
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch release: ${response.status}`);
      }

      return await response.json();

    } catch (err) {
      handleError(err, 'getRelease', null, showToast);
      return null;
    }
  }, [showToast]);

  /**
   * Get marketplace statistics (price info)
   */
  const getMarketPrice = useCallback(async (releaseId) => {
    if (!validators.isValidDiscogsId(releaseId)) {
      return null;
    }

    try {
      // Retry with exponential backoff for rate limiting
      const response = await withRetry(
        () => fetch('/api/discogs-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: `/marketplace/stats/${releaseId}`
          })
        }),
        3, // 3 retries
        1000 // Start with 1 second delay
      );

      if (!response.ok) {
        // Silent failure for price fetching (non-critical)
        return null;
      }

      const data = await response.json();

      if (data.lowest_price && data.num_for_sale > 0) {
        return {
          value: data.lowest_price.value,
          currency: data.lowest_price.currency,
          numForSale: data.num_for_sale,
          stats: data
        };
      }

      return null;

    } catch (err) {
      // Silent failure for prices
      console.warn('Price fetch failed:', err.message);
      return null;
    }
  }, []);

  /**
   * Batch fetch prices for multiple releases
   * Uses smart rate limiting to avoid 429 errors
   */
  const batchFetchPrices = useCallback(async (releaseIds, onProgress) => {
    const prices = {};
    const batchSize = 5; // Process 5 at a time
    const delayBetweenBatches = 5000; // 5 seconds between batches

    for (let i = 0; i < releaseIds.length; i += batchSize) {
      const batch = releaseIds.slice(i, i + batchSize);

      // Fetch batch in parallel
      const batchResults = await Promise.allSettled(
        batch.map(id => getMarketPrice(id))
      );

      // Store results
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          prices[batch[index]] = result.value;
        }
      });

      // Report progress
      if (onProgress) {
        onProgress({
          completed: Math.min(i + batchSize, releaseIds.length),
          total: releaseIds.length,
          prices
        });
      }

      // Wait before next batch (respect rate limits)
      if (i + batchSize < releaseIds.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    return prices;
  }, [getMarketPrice]);

  return {
    // State
    isLoading,
    error,

    // Actions
    search,
    getRelease,
    getMarketPrice,
    batchFetchPrices,

    // Utilities
    clearError: () => setError(null)
  };
}
