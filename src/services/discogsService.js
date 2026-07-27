/**
 * Discogs Service — dünner Client für api/discogs-proxy.js.
 * Kein Token im Client; Auth passiert server-seitig.
 */

import { NetworkError, RateLimitError, ApiError } from '../utils/errors';

const PROXY_URL = '/api/discogs-proxy';

async function proxyRequest(endpoint, params = {}, retries = 3) {
  let lastError;

  for (let attempt = 0; attempt < retries; attempt++) {
    let response;
    try {
      response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, params }),
      });
    } catch (error) {
      throw new NetworkError('Keine Verbindung zum Server. Bitte Internetverbindung prüfen.');
    }

    if (response.ok) {
      return response.json();
    }

    const data = await response.json().catch(() => ({}));

    if (response.status === 429) {
      const retryAfter = data.retryAfter ?? (Math.pow(2, attempt) * 2);
      lastError = new RateLimitError(retryAfter);

      // Retry on rate limit with exponential backoff
      if (attempt < retries - 1) {
        console.warn(`Rate limited. Retrying in ${retryAfter}s (attempt ${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
    }

    throw new ApiError(
      data.error || `Anfrage fehlgeschlagen (HTTP ${response.status})`,
      response.status,
      data.details
    );
  }

  throw lastError || new ApiError('Max retries exceeded', 429);
}

export const searchDiscogs = async ({
  isAdvanced = false,
  query = '',
  advancedSearch = {},
  page = 1,
  perPage = 50,
}) => {
  const params = { type: 'release', per_page: String(perPage), page: String(page) };

  if (isAdvanced) {
    if (advancedSearch.artist) params.artist = advancedSearch.artist;
    if (advancedSearch.album) params.release_title = advancedSearch.album;
    if (advancedSearch.year) params.year = advancedSearch.year;
    if (advancedSearch.label) params.label = advancedSearch.label;
    if (advancedSearch.genre) params.genre = advancedSearch.genre;
    if (advancedSearch.country) params.country = advancedSearch.country;

    const hasField = ['artist', 'release_title', 'year', 'label', 'genre', 'country']
      .some((key) => params[key]);
    if (!hasField) {
      throw new ApiError('Bitte mindestens ein Suchfeld ausfüllen', 400);
    }
  } else {
    if (!query.trim()) {
      throw new ApiError('Suchbegriff erforderlich', 400);
    }
    params.q = query;
  }

  const data = await proxyRequest('/database/search', params);
  return {
    results: data.results || [],
    pagination: {
      page: data.pagination?.page || page,
      pages: data.pagination?.pages || 1,
      items: data.pagination?.items || 0,
    },
  };
};

export const fetchPriceInfo = async (releaseId) => {
  try {
    const data = await proxyRequest(`/marketplace/stats/${releaseId}`);
    if (data.lowest_price && data.num_for_sale > 0) {
      return {
        value: data.lowest_price.value,
        currency: data.lowest_price.currency,
        num_for_sale: data.num_for_sale,
        stats: data,
      };
    }
    return null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null; // Release ohne Marketplace-Daten
    }
    throw error;
  }
};

export const fetchVinylDetails = async (id) => {
  return proxyRequest(`/releases/${id}`);
};

export const waitForRateLimit = () => {
  // No delay - Discogs API handles rate limiting server-side
  return Promise.resolve();
};

export const fetchMultiplePrices = async (items, onProgress = null, batchSize = 3) => {
  const allPrices = {};
  let batchPrices = {};
  const itemsToFetch = items.slice(0, Math.min(items.length, 50));

  for (let i = 0; i < itemsToFetch.length; i++) {
    const item = itemsToFetch[i];
    try {
      const priceData = await fetchPriceInfo(item.id);
      if (priceData) {
        batchPrices[item.id] = priceData;
        allPrices[item.id] = priceData;
        if (onProgress && ((i + 1) % batchSize === 0 || i === itemsToFetch.length - 1)) {
          onProgress(i + 1, itemsToFetch.length, { ...batchPrices });
          batchPrices = {};
        }
      }
    } catch (error) {
      console.error(`Preisabruf fehlgeschlagen für ${item.id}:`, error);
    }
  }

  return allPrices;
};

// Cache for album cover + metadata (Discover mode)
const albumMetadataCache = new Map();

export const getDiscogsAlbumMetadata = async (artist, album) => {
  const cacheKey = `${artist}|${album}`.toLowerCase();

  if (albumMetadataCache.has(cacheKey)) {
    return albumMetadataCache.get(cacheKey);
  }

  try {
    const data = await proxyRequest('/database/search', {
      q: `${artist} ${album}`,
      type: 'release',
      per_page: '1'
    });

    const result = data.results?.[0];
    if (!result) {
      albumMetadataCache.set(cacheKey, null);
      return null;
    }

    const metadata = {
      coverUrl: result.cover_image ? result.cover_image.replace(/_\d+\.(jpg|jpeg|png)$/i, '_350.$1') : null,
      year: result.year || 0,
      releaseId: result.id
    };

    albumMetadataCache.set(cacheKey, metadata);
    return metadata;
  } catch (error) {
    console.warn(`Metadata fetch failed for ${artist} - ${album}:`, error.message);
    albumMetadataCache.set(cacheKey, null);
    return null;
  }
};
