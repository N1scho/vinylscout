/**
 * Collection Helpers Utility Module
 *
 * Provides utility functions for sorting, filtering, and calculating collection values
 * Extracted from App.jsx v2.8.0
 */

import { useDiscoverStore } from '../stores/discoverStore';

/**
 * Sort collection items by various criteria
 *
 * @param {Array} items - Collection items to sort
 * @param {string} sortBy - Sort criterion (artist-asc, artist-desc, album-asc, album-desc, price-asc, price-desc, date-new, date-old)
 * @returns {Array} Sorted collection items
 */
export const sortCollection = (items, sortBy) => {
  const sorted = [...items];
  switch(sortBy) {
    case 'artist-asc':
      return sorted.sort((a, b) => {
        const aArtist = (a.title?.split(' - ')[0] || '').toLowerCase();
        const bArtist = (b.title?.split(' - ')[0] || '').toLowerCase();
        return aArtist.localeCompare(bArtist);
      });
    case 'artist-desc':
      return sorted.sort((a, b) => {
        const aArtist = (a.title?.split(' - ')[0] || '').toLowerCase();
        const bArtist = (b.title?.split(' - ')[0] || '').toLowerCase();
        return bArtist.localeCompare(aArtist);
      });
    case 'album-asc':
      return sorted.sort((a, b) => {
        const aAlbum = (a.title?.split(' - ')[1] || a.title || '').toLowerCase();
        const bAlbum = (b.title?.split(' - ')[1] || b.title || '').toLowerCase();
        return aAlbum.localeCompare(bAlbum);
      });
    case 'album-desc':
      return sorted.sort((a, b) => {
        const aAlbum = (a.title?.split(' - ')[1] || a.title || '').toLowerCase();
        const bAlbum = (b.title?.split(' - ')[1] || b.title || '').toLowerCase();
        return bAlbum.localeCompare(aAlbum);
      });
    case 'price-asc':
      return sorted.sort((a, b) => (a.price?.value || a.lowestPrice || 0) - (b.price?.value || b.lowestPrice || 0));
    case 'price-desc':
      return sorted.sort((a, b) => (b.price?.value || b.lowestPrice || 0) - (a.price?.value || a.lowestPrice || 0));
    case 'date-new':
      return sorted.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
    case 'date-old':
      return sorted.sort((a, b) => new Date(a.addedAt || 0) - new Date(b.addedAt || 0));
    default:
      return sorted;
  }
};

/**
 * Filter collection items by favorites, wishlist, search query, genre, decade, and format
 *
 * @param {Array} items - Collection items to filter
 * @param {string} filter - Filter type ('all', 'favorites', or 'wishlist')
 * @param {string} searchQuery - Search query for artist/album filtering
 * @param {string|null} genreFilter - Genre to filter by
 * @param {string|null} decadeFilter - Decade to filter by (e.g., '1980s')
 * @param {string|null} formatFilter - Format to filter by
 * @returns {Array} Filtered collection items
 */
export const filterCollection = (items, filter, searchQuery = '', genreFilter = null, decadeFilter = null, formatFilter = null) => {
  let filtered = items;

  // Apply main filter (all, favorites, or wishlist)
  if (filter === 'favorites') {
    filtered = items.filter(item => item.isFavorite);
  } else if (filter === 'wishlist') {
    const wishlistIds = useDiscoverStore().wishlist;
    filtered = items.filter(item => wishlistIds.includes(item.id));
  }

  // Apply search filter if query exists
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(item => {
      const title = (item.title || '').toLowerCase();
      const artist = (item.artist || '').toLowerCase();
      return title.includes(query) || artist.includes(query);
    });
  }

  // Apply genre filter
  if (genreFilter) {
    filtered = filtered.filter(item =>
      item.genres && item.genres.some(g => g === genreFilter)
    );
  }

  // Apply decade filter
  if (decadeFilter) {
    filtered = filtered.filter(item => {
      if (!item.year) return false;
      const decade = Math.floor(item.year / 10) * 10;
      return `${decade}s` === decadeFilter;
    });
  }

  // Apply format filter
  if (formatFilter) {
    filtered = filtered.filter(item => {
      const format = item.format || item.formats?.[0] || 'Unknown';
      return format === formatFilter;
    });
  }

  return filtered;
};

/**
 * Calculate total value of collection
 *
 * @param {Array} collection - Collection items
 * @returns {Object} Object with total value, count of priced items, and currency
 */
export const calculateCollectionValue = (collection) => {
  let total = 0, count = 0, currency = 'EUR';
  collection.forEach(item => {
    const price = item.price?.value || item.lowestPrice;
    if (price && typeof price === 'number') {
      total += price;
      count++;
      if (item.price?.currency) currency = item.price.currency;
    }
  });
  return { total, count, currency };
};

/**
 * Format price for display
 *
 * @param {number} value - Price value
 * @param {string} currency - Currency code (EUR, USD, etc.)
 * @returns {string} Formatted price string
 */
export const formatPrice = (value, currency) => {
  if (value === null || value === undefined) return 'N/A';
  return `${currency === 'USD' ? '$' : '€'}${value.toFixed(2)}`;
};
