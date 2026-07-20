/**
 * Storage Service Module
 *
 * Handles all localStorage operations for VinylScout
 * Extracted from App.jsx v2.8.0
 */

// Storage keys
const STORAGE_KEYS = {
  COLLECTION: 'vinylCollection',
  THEME: 'theme',
  CUSTOM_COLORS: 'customColors',
  SELECTED_SHOPS: 'selectedShops',
  SEARCH_HISTORY: 'vinylSearchHistory'
};

/**
 * Save collection to localStorage
 *
 * @param {Array} collection - The vinyl collection
 */
export const saveCollection = (collection) => {
  try {
    localStorage.setItem(STORAGE_KEYS.COLLECTION, JSON.stringify(collection));
  } catch (error) {
    console.error('Failed to save collection:', error);
  }
};

/**
 * Load collection from localStorage
 *
 * @returns {Array} The vinyl collection
 */
export const loadCollection = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.COLLECTION);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load collection:', error);
    return [];
  }
};

/**
 * Export collection as JSON file
 *
 * @param {Array} collection - The vinyl collection
 * @param {string} filename - Export filename (default: collection-backup-[date].json)
 */
export const exportCollection = (collection, filename = null) => {
  const exportData = {
    version: '2.0',
    exportDate: new Date().toISOString(),
    collection: collection
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename || `collection-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Import collection from JSON file
 *
 * @param {File} file - The file to import
 * @returns {Promise<Array>} The imported collection
 */
export const importCollection = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);

        // Handle both old and new format
        let importedCollection = [];
        if (imported.version && imported.collection) {
          importedCollection = imported.collection;
        } else if (Array.isArray(imported)) {
          importedCollection = imported;
        } else {
          throw new Error('Invalid collection format');
        }

        resolve(importedCollection);
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Export collection as CSV
 *
 * @param {Array} collection - The vinyl collection
 * @param {string} filename - Export filename
 */
export const exportCollectionAsCSV = (collection, filename = null) => {
  if (!collection || collection.length === 0) {
    alert('Collection is empty');
    return;
  }

  const headers = ['ID', 'Title', 'Artist', 'Year', 'Format', 'Genre', 'Label', 'Price', 'Currency', 'Favorite'];
  const rows = collection.map(item => [
    item.id || '',
    (item.title || '').replace(/"/g, '""'),
    (item.artist || '').replace(/"/g, '""'),
    item.year || '',
    Array.isArray(item.format) ? item.format.join('; ') : (item.format || ''),
    Array.isArray(item.genres) ? item.genres.join('; ') : (item.genre || ''),
    Array.isArray(item.label) ? item.label.join('; ') : (item.label || ''),
    item.lowestPrice || item.price?.value || '',
    item.price?.currency || '',
    item.favorite ? 'Yes' : 'No'
  ]);

  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename || `collection-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Save theme
 *
 * @param {string} theme - Theme name
 */
export const saveTheme = (theme) => {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
};

/**
 * Load theme
 *
 * @returns {string} Theme name (default: 'classic')
 */
export const loadTheme = () => {
  return localStorage.getItem(STORAGE_KEYS.THEME) || 'classic';
};

/**
 * Save custom colors
 *
 * @param {Object} colors - Custom color object
 */
export const saveCustomColors = (colors) => {
  localStorage.setItem(STORAGE_KEYS.CUSTOM_COLORS, JSON.stringify(colors));
};

/**
 * Load custom colors
 *
 * @returns {Object} Custom colors object
 */
export const loadCustomColors = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CUSTOM_COLORS);
    return stored ? JSON.parse(stored) : {
      primary: '#FF6B6B',
      background: '#1A1A2E',
      accent: '#4ECDC4',
      text: '#EAEAEA'
    };
  } catch {
    return {
      primary: '#FF6B6B',
      background: '#1A1A2E',
      accent: '#4ECDC4',
      text: '#EAEAEA'
    };
  }
};

/**
 * Save selected shops
 *
 * @param {Array<string>} shops - Array of shop IDs
 */
export const saveSelectedShops = (shops) => {
  localStorage.setItem(STORAGE_KEYS.SELECTED_SHOPS, JSON.stringify(shops));
};

/**
 * Load selected shops
 *
 * @returns {Array<string>} Array of shop IDs (default: all shops)
 */
export const loadSelectedShops = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_SHOPS);
    return stored ? JSON.parse(stored) : ['discogs', 'hhv', 'ebay'];
  } catch {
    return ['discogs', 'hhv', 'ebay'];
  }
};

/**
 * Save search history
 *
 * @param {Array<string>} history - Search history array
 */
export const saveSearchHistory = (history) => {
  localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history));
};

/**
 * Load search history
 *
 * @returns {Array<string>} Search history array
 */
export const loadSearchHistory = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Clear all stored data
 */
export const clearAllData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

