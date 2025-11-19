/**
 * Collection Operations Utility Module
 *
 * Provides utility functions for collection item operations
 * Extracted from App.jsx v2.8.2
 */

/**
 * Create a new collection item from search result and details
 *
 * @param {Object} searchResult - Search result from Discogs
 * @param {Object} details - Full release details from Discogs
 * @returns {Object} Formatted collection item
 */
export const createCollectionItem = (searchResult, details) => {
  return {
    id: searchResult.id,
    title: searchResult.title,
    year: searchResult.year,
    thumb: searchResult.thumb || searchResult.cover_image,
    cover_image: searchResult.cover_image,
    artist: details.artists?.[0]?.name || 'Unknown',
    label: details.labels?.[0]?.name || 'Unknown',
    genres: details.genres || [],
    styles: details.styles || [],
    tracklist: details.tracklist || [],
    format: details.formats?.[0]?.name || 'Vinyl',
    formats: details.formats || [],
    lowestPrice: null,
    priceHistory: [],
    addedAt: new Date().toISOString(),
    isFavorite: false
  };
};

/**
 * Add item to collection
 *
 * @param {Array} collection - Current collection
 * @param {Object} newItem - Item to add
 * @returns {Array} Updated collection
 */
export const addItemToCollection = (collection, newItem) => {
  // Check if item already exists
  if (collection.some(item => item.id === newItem.id)) {
    throw new Error('Item already in collection');
  }

  return [...collection, newItem];
};

/**
 * Remove item from collection
 *
 * @param {Array} collection - Current collection
 * @param {string} id - Item ID to remove
 * @returns {Array} Updated collection
 */
export const removeItemFromCollection = (collection, id) => {
  return collection.filter(item => item.id !== id);
};

/**
 * Toggle favorite status of an item
 *
 * @param {Array} collection - Current collection
 * @param {string} id - Item ID to toggle
 * @returns {Array} Updated collection
 */
export const toggleItemFavorite = (collection, id) => {
  return collection.map(item =>
    item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
  );
};

/**
 * Update item price and add to price history
 *
 * @param {Object} item - Collection item
 * @param {number} newPrice - New price value
 * @param {string} currency - Currency code
 * @returns {Object} Updated item with new price and history
 */
export const updateItemPrice = (item, newPrice, currency = 'USD') => {
  const priceHistory = [...(item.priceHistory || [])];

  if (newPrice !== null) {
    priceHistory.push({
      date: new Date().toISOString(),
      price: newPrice,
      currency: currency
    });
  }

  return {
    ...item,
    lowestPrice: newPrice,
    priceHistory: priceHistory.slice(-30) // Keep last 30 price points
  };
};

/**
 * Update price for a specific item in collection
 *
 * @param {Array} collection - Current collection
 * @param {string} id - Item ID to update
 * @param {number} newPrice - New price value
 * @param {string} currency - Currency code
 * @returns {Array} Updated collection
 */
export const updateCollectionItemPrice = (collection, id, newPrice, currency = 'USD') => {
  return collection.map(item => {
    if (item.id !== id) return item;
    return updateItemPrice(item, newPrice, currency);
  });
};

/**
 * Calculate price change for an item
 *
 * @param {Object} item - Collection item with price history
 * @returns {Object|null} Price change info or null if insufficient data
 */
export const calculatePriceChange = (item) => {
  const history = item.priceHistory || [];
  if (history.length < 2) return null;

  const current = history[history.length - 1].price;
  const previous = history[history.length - 2].price;
  const change = ((current - previous) / previous) * 100;

  return {
    value: change,
    isPositive: change > 0,
    isNegative: change < 0,
    current,
    previous,
    absolute: current - previous
  };
};

/**
 * Get price history for value modal
 *
 * @param {Object} item - Collection item
 * @returns {Array} Price history array
 */
export const getItemPriceHistory = (item) => {
  return item.priceHistory || [];
};

/**
 * Check if item exists in collection
 *
 * @param {Array} collection - Current collection
 * @param {string} id - Item ID to check
 * @returns {boolean} True if item exists
 */
export const itemExistsInCollection = (collection, id) => {
  return collection.some(item => item.id === id);
};

/**
 * Get collection item by ID
 *
 * @param {Array} collection - Current collection
 * @param {string} id - Item ID to find
 * @returns {Object|null} Item or null if not found
 */
export const getCollectionItemById = (collection, id) => {
  return collection.find(item => item.id === id) || null;
};

/**
 * Get most valuable items from collection
 *
 * @param {Array} collection - Current collection
 * @param {number} limit - Number of items to return
 * @returns {Array} Most valuable items
 */
export const getMostValuableItems = (collection, limit = 5) => {
  return collection
    .filter(item => item.lowestPrice && item.lowestPrice > 0)
    .sort((a, b) => (b.lowestPrice || 0) - (a.lowestPrice || 0))
    .slice(0, limit);
};

/**
 * Get recently added items
 *
 * @param {Array} collection - Current collection
 * @param {number} days - Number of days to look back
 * @returns {Array} Recently added items
 */
export const getRecentlyAddedItems = (collection, days = 7) => {
  const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
  return collection.filter(item =>
    item.addedAt && new Date(item.addedAt).getTime() > cutoffDate
  );
};

/**
 * Get favorite items from collection
 *
 * @param {Array} collection - Current collection
 * @returns {Array} Favorite items
 */
export const getFavoriteItems = (collection) => {
  return collection.filter(item => item.isFavorite);
};
