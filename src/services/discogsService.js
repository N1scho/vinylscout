/**
 * Discogs API Service Module
 *
 * Handles all interactions with the Discogs API
 * Extracted from App.jsx v2.8.0
 */

const APP_VERSION = '2.8.0';
const RATE_LIMIT_DELAY = 1100; // 1.1 seconds to respect Discogs 60 req/min limit

/**
 * Search Discogs database for vinyl records
 *
 * @param {Object} params - Search parameters
 * @param {string} params.token - Discogs API token
 * @param {boolean} params.isAdvanced - Whether to use advanced search
 * @param {string} params.query - Simple search query
 * @param {Object} params.advancedSearch - Advanced search parameters
 * @param {number} params.page - Page number for pagination
 * @param {number} params.perPage - Items per page
 * @returns {Promise<Object>} Search results with pagination info
 */
export const searchDiscogs = async ({
  token,
  isAdvanced = false,
  query = '',
  advancedSearch = {},
  page = 1,
  perPage = 50
}) => {
  if (!token) {
    throw new Error('Discogs API token required');
  }

  let searchUrl = 'https://api.discogs.com/database/search?';

  if (isAdvanced) {
    const params = [];
    if (advancedSearch.artist) params.push(`artist=${encodeURIComponent(advancedSearch.artist)}`);
    if (advancedSearch.album) params.push(`release_title=${encodeURIComponent(advancedSearch.album)}`);
    if (advancedSearch.year) params.push(`year=${encodeURIComponent(advancedSearch.year)}`);
    if (advancedSearch.label) params.push(`label=${encodeURIComponent(advancedSearch.label)}`);
    if (advancedSearch.genre) params.push(`genre=${encodeURIComponent(advancedSearch.genre)}`);

    if (params.length === 0) {
      throw new Error('Please fill in at least one search field');
    }

    searchUrl += params.join('&') + `&per_page=${perPage}&page=${page}&type=release`;
  } else {
    if (!query.trim()) {
      throw new Error('Search query required');
    }
    searchUrl += `q=${encodeURIComponent(query)}&type=release&per_page=${perPage}&page=${page}`;
  }

  const response = await fetch(searchUrl, {
    headers: {
      'Authorization': `Discogs token=${token}`,
      'User-Agent': `VinylScout/${APP_VERSION}`
    }
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    throw new Error('Search failed');
  }

  const data = await response.json();
  return {
    results: data.results || [],
    pagination: {
      page: data.pagination?.page || page,
      pages: data.pagination?.pages || 1,
      items: data.pagination?.items || 0
    }
  };
};

/**
 * Fetch price information for a release
 *
 * @param {string} releaseId - Discogs release ID
 * @param {string} token - Discogs API token
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<Object|null>} Price data or null if unavailable
 */
export const fetchPriceInfo = async (releaseId, token, timeoutMs = 8000) => {
  if (!token) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(
      `https://api.discogs.com/marketplace/stats/${releaseId}`,
      {
        headers: {
          'Authorization': `Discogs token=${token}`,
          'User-Agent': `VinylScout/${APP_VERSION}`
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.lowest_price && data.num_for_sale > 0) {
        return {
          value: data.lowest_price.value,
          currency: data.lowest_price.currency,
          num_for_sale: data.num_for_sale,
          stats: data
        };
      }
    }

    if (response.status === 429) {
      console.warn('Rate limited by Discogs API');
      return null;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`Price fetch timeout for ${releaseId}`);
    } else {
      console.error('Price error:', error);
    }
  }
  return null;
};

/**
 * Fetch prices for multiple items with rate limiting
 *
 * @param {Array} items - Array of items with id property
 * @param {string} token - Discogs API token
 * @param {Function} onProgress - Progress callback (currentIndex, total, prices)
 * @param {number} batchSize - Number of items to process before updating
 * @returns {Promise<Object>} Map of item IDs to price data
 */
export const fetchMultiplePrices = async (items, token, onProgress = null, batchSize = 3) => {
  const allPrices = {};
  let batchPrices = {};

  const itemsToFetch = items.slice(0, Math.min(items.length, 50));

  for (let i = 0; i < itemsToFetch.length; i++) {
    const item = itemsToFetch[i];

    try {
      const priceData = await fetchPriceInfo(item.id, token);

      if (priceData) {
        batchPrices[item.id] = priceData;
        allPrices[item.id] = priceData;

        // Call progress callback on batch completion
        if (onProgress && ((i + 1) % batchSize === 0 || i === itemsToFetch.length - 1)) {
          onProgress(i + 1, itemsToFetch.length, { ...batchPrices });
          batchPrices = {};
        }
      }

      // Respect rate limits
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    } catch (error) {
      console.error(`Failed to fetch price for ${item.id}:`, error);
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
  }

  return allPrices;
};

/**
 * Fetch detailed information for a vinyl release
 *
 * @param {string} id - Discogs release ID
 * @param {string} token - Discogs API token
 * @returns {Promise<Object|null>} Release details or null
 */
export const fetchVinylDetails = async (id, token) => {
  if (!token) return null;

  try {
    const response = await fetch(
      `https://api.discogs.com/releases/${id}`,
      {
        headers: {
          'Authorization': `Discogs token=${token}`,
          'User-Agent': `VinylScout/${APP_VERSION}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error('Failed to fetch details:', err);
    return null;
  }
};

/**
 * Rate limit helper - wait for safe API call
 */
export const waitForRateLimit = () => {
  return new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
};
