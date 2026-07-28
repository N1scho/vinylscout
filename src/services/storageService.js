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
  SEARCH_HISTORY: 'vinylSearchHistory',
  BACKUP_1: 'vinylCollectionBackup1',
  BACKUP_2: 'vinylCollectionBackup2',
  BACKUP_3: 'vinylCollectionBackup3'
};

const MAX_BACKUPS = 3;

/**
 * Save collection to localStorage
 *
 * @param {Array} collection - The vinyl collection
 */
export const saveCollection = (collection) => {
  try {
    const collectionJson = JSON.stringify(collection);

    // Rotate backups before saving: 3→discard, 2→3, 1→2
    if (localStorage.getItem(STORAGE_KEYS.BACKUP_2)) {
      localStorage.setItem(STORAGE_KEYS.BACKUP_3, localStorage.getItem(STORAGE_KEYS.BACKUP_2));
    }
    if (localStorage.getItem(STORAGE_KEYS.BACKUP_1)) {
      localStorage.setItem(STORAGE_KEYS.BACKUP_2, localStorage.getItem(STORAGE_KEYS.BACKUP_1));
    }

    // Save the new collection
    localStorage.setItem(STORAGE_KEYS.COLLECTION, collectionJson);

    // Copy newly saved collection to backup 1 with metadata
    const backupWithMetadata = JSON.stringify({
      collection,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEYS.BACKUP_1, backupWithMetadata);
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

  // Revoke URL after download is triggered (defer to next tick)
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV must have header row and at least one data row');

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  const headerMap = {
    id: headers.indexOf('ID'),
    title: headers.indexOf('Title'),
    artist: headers.indexOf('Artist'),
    year: headers.indexOf('Year'),
    format: headers.indexOf('Format'),
    genres: headers.indexOf('Genre'),
    label: headers.indexOf('Label'),
    price: headers.indexOf('Price'),
    currency: headers.indexOf('Currency'),
    favorite: headers.indexOf('Favorite')
  };

  if (headerMap.id === -1 || headerMap.title === -1) {
    throw new Error('CSV must have ID and Title columns');
  }

  const collection = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = parseCSVLine(lines[i]);
    const item = {
      id: values[headerMap.id]?.trim() || '',
      title: values[headerMap.title]?.trim() || '',
      artist: values[headerMap.artist]?.trim() || undefined,
      year: values[headerMap.year]?.trim() ? parseInt(values[headerMap.year].trim(), 10) : undefined,
      favorite: values[headerMap.favorite]?.trim().toLowerCase() === 'yes'
    };

    if (!item.id || !item.title) continue;

    if (headerMap.format !== -1 && values[headerMap.format]?.trim()) {
      const fmt = values[headerMap.format].trim();
      item.format = fmt.includes(';') ? fmt.split(';').map(s => s.trim()) : fmt;
    }

    if (headerMap.genres !== -1 && values[headerMap.genres]?.trim()) {
      const genreStr = values[headerMap.genres].trim();
      item.genres = genreStr.includes(';') ? genreStr.split(';').map(s => s.trim()) : [genreStr];
    }

    if (headerMap.label !== -1 && values[headerMap.label]?.trim()) {
      const labelStr = values[headerMap.label].trim();
      item.label = labelStr.includes(';') ? labelStr.split(';').map(s => s.trim()) : labelStr;
    }

    if (headerMap.price !== -1) {
      const priceStr = values[headerMap.price]?.trim();
      item.price = {
        value: priceStr ? parseFloat(priceStr) : null,
        currency: values[headerMap.currency]?.trim() || 'USD'
      };
    } else {
      item.price = {
        value: null,
        currency: 'USD'
      };
    }

    collection.push(item);
  }

  return collection;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Import collection from JSON or CSV file
 *
 * @param {File} file - The file to import (.json or .csv)
 * @returns {Promise<Array>} The imported collection
 */
export const importCollection = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target.result;
        let importedCollection = [];

        // Try JSON first
        let jsonError = null;
        try {
          const imported = JSON.parse(content);
          console.log('[importCollection] JSON parsed successfully');
          if (imported.version && imported.collection) {
            importedCollection = imported.collection;
          } else if (Array.isArray(imported)) {
            importedCollection = imported;
          } else {
            jsonError = new Error('Invalid collection format');
          }
        } catch (e) {
          console.log('[importCollection] JSON parse failed, trying CSV:', e.message);
          jsonError = e;
        }

        // If JSON failed, try CSV
        if (jsonError && importedCollection.length === 0) {
          console.log('[importCollection] Attempting CSV parse...');
          importedCollection = parseCSV(content);
          console.log('[importCollection] CSV parsed successfully, records:', importedCollection.length);
        } else if (jsonError) {
          throw jsonError;
        }

        if (!Array.isArray(importedCollection)) {
          throw new Error('Collection must be an array');
        }

        for (const item of importedCollection) {
          if (typeof item !== 'object' || !item.id || !item.title) {
            throw new Error(`Invalid item: missing required fields (id, title)`);
          }
        }

        resolve(importedCollection);
      } catch (error) {
        console.error('Collection import parse error:', error, 'File:', file.name);
        reject(new Error(`Invalid file: ${error.message}`));
      }
    };

    reader.onerror = (error) => {
      console.error('FileReader error:', error, 'File:', file.name);
      reject(new Error('Failed to read file'));
    };

    reader.onabort = () => {
      console.error('FileReader aborted:', file.name);
      reject(new Error('File read was aborted'));
    };

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

  // Revoke URL after download is triggered (defer to next tick)
  setTimeout(() => URL.revokeObjectURL(url), 100);
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

/**
 * List available backups (uses new backup system with vinyl-collection-backup-* keys)
 */
export const listBackups = () => {
  const backups = [];
  const BACKUP_PREFIX = 'vinyl-collection-backup-';

  for (let i = 1; i <= MAX_BACKUPS; i++) {
    const backupKey = `${BACKUP_PREFIX}${i}`;
    const backupData = localStorage.getItem(backupKey);

    if (backupData) {
      try {
        const backup = JSON.parse(backupData);
        // Handle both old format (array) and new format (with metadata + wishlist)
        let collection = backup;
        let timestamp = new Date().toISOString();
        let size = '';

        if (backup.collection && Array.isArray(backup.collection)) {
          collection = backup.collection;
          timestamp = backup.timestamp || timestamp;
          // Estimate size
          const sizeBytes = new Blob([backupData]).size;
          size = sizeBytes > 1024 ? `${(sizeBytes / 1024).toFixed(1)} KB` : `${sizeBytes} B`;
        }

        backups.push({
          index: i,
          count: Array.isArray(collection) ? collection.length : 0,
          timestamp,
          size
        });
      } catch (error) {
        console.error(`Failed to parse backup ${i}:`, error);
      }
    }
  }

  return backups;
};

/**
 * Restore a backup (uses new backup system with vinyl-collection-backup-* keys)
 * @param {number} index - Backup index (1-3)
 * @returns {boolean} true if restore was successful
 */
export const restoreBackup = (index) => {
  try {
    if (index < 1 || index > MAX_BACKUPS) {
      console.error('Invalid backup index');
      return false;
    }

    const BACKUP_PREFIX = 'vinyl-collection-backup-';
    const backupKey = `${BACKUP_PREFIX}${index}`;
    const backupData = localStorage.getItem(backupKey);

    if (!backupData) {
      console.error(`Backup ${index} not found`);
      return false;
    }

    // Handle both old format (array) and new format (with metadata + wishlist)
    const backup = JSON.parse(backupData);
    const collection = backup.collection && Array.isArray(backup.collection) ? backup.collection : backup;

    if (!Array.isArray(collection)) {
      console.error('Invalid backup format');
      return false;
    }

    // Restore collection to new storage key
    const zustandState = {
      state: {
        collection: collection,
        sortBy: 'artist-asc',
        collectionView: 'grid'
      },
      version: 0
    };
    localStorage.setItem('vinyl-collection-storage', JSON.stringify(zustandState));

    // Restore wishlist if present in backup
    if (backup.wishlist && Array.isArray(backup.wishlist)) {
      const discoverStore = localStorage.getItem('discover-store');
      if (discoverStore) {
        try {
          const parsed = JSON.parse(discoverStore);
          if (parsed.state) {
            parsed.state.wishlist = backup.wishlist;
            localStorage.setItem('discover-store', JSON.stringify(parsed));
            console.log(`[restoreBackup] restored ${backup.wishlist.length} wishlist items`);
          }
        } catch (e) {
          console.warn('[restoreBackup] failed to restore wishlist:', e.message);
        }
      }
    }

    console.log(`[restoreBackup] restored backup ${index} with ${collection.length} items`);
    return true;
  } catch (error) {
    console.error('Failed to restore backup:', error);
    return false;
  }
};

/**
 * Delete a backup (uses new backup system with vinyl-collection-backup-* keys)
 * @param {number} index - Backup index (1-3)
 * @returns {boolean} true if delete was successful
 */
export const deleteBackup = (index) => {
  try {
    if (index < 1 || index > MAX_BACKUPS) {
      console.error('Invalid backup index');
      return false;
    }

    const BACKUP_PREFIX = 'vinyl-collection-backup-';
    const backupKey = `${BACKUP_PREFIX}${index}`;
    localStorage.removeItem(backupKey);
    console.log(`[deleteBackup] deleted backup ${index}`);
    return true;
  } catch (error) {
    console.error('Failed to delete backup:', error);
    return false;
  }
};
