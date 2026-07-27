/**
 * Price History Service
 * Manages album price history tracking using localStorage
 */

const MAX_RECORDS_PER_ALBUM = 30;

/**
 * Save a price record for an album
 * @param {string} albumId - The album ID
 * @param {number} price - The price to record
 * @param {string} currency - The currency code (e.g., 'USD', 'EUR')
 * @returns {boolean} true if record was saved, false if duplicate price (unchanged)
 */
function savePriceRecord(albumId, price, currency) {
  if (!albumId || price === undefined || price === null || !currency) {
    throw new Error('albumId, price, and currency are required');
  }

  const key = `price-history-${albumId}`;
  const history = getPriceHistory(albumId);

  // Check if the latest price is the same (avoid duplicates)
  if (history.length > 0) {
    const lastRecord = history[history.length - 1];
    if (lastRecord.price === price && lastRecord.currency === currency) {
      return false; // Duplicate price, don't save
    }
  }

  // Create new record with ISO8601 timestamp
  const newRecord = {
    timestamp: new Date().toISOString(),
    price: parseFloat(price),
    currency: currency,
  };

  history.push(newRecord);

  // Enforce 30 record limit, remove oldest if exceeded
  if (history.length > MAX_RECORDS_PER_ALBUM) {
    history.shift();
  }

  localStorage.setItem(key, JSON.stringify(history));
  return true;
}

/**
 * Get price history for an album
 * @param {string} albumId - The album ID
 * @returns {Array} Array of price records sorted by timestamp (ascending)
 */
function getPriceHistory(albumId) {
  if (!albumId) {
    throw new Error('albumId is required');
  }

  const key = `price-history-${albumId}`;
  const data = localStorage.getItem(key);

  if (!data) {
    return [];
  }

  try {
    const history = JSON.parse(data);
    // Ensure it's an array and sorted by timestamp
    if (Array.isArray(history)) {
      return history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
    return [];
  } catch (error) {
    console.error(`Error parsing price history for album ${albumId}:`, error);
    return [];
  }
}

/**
 * Clear all price history for an album
 * @param {string} albumId - The album ID
 */
function clearPriceHistory(albumId) {
  if (!albumId) {
    throw new Error('albumId is required');
  }

  const key = `price-history-${albumId}`;
  localStorage.removeItem(key);
}

export { savePriceRecord, getPriceHistory, clearPriceHistory };
