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

        // Validate it's an array
        if (!Array.isArray(importedCollection)) {
          throw new Error('Collection must be an array');
        }

        // Validate each item has required fields (id and title)
        for (const item of importedCollection) {
          if (typeof item !== 'object' || !item.id || !item.title) {
            throw new Error(`Invalid item: missing required fields (id, title)`);
          }
        }

        resolve(importedCollection);
      } catch (error) {
        console.error('Collection import parse error:', error, 'File:', file.name);
        reject(new Error(`Invalid JSON file: ${error.message}`));
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
 * List available backups
 */
export const listBackups = () => {
  const backups = [];

  for (let i = 1; i <= MAX_BACKUPS; i++) {
    const backupKey = STORAGE_KEYS[`BACKUP_${i}`];
    const backupData = localStorage.getItem(backupKey);

    if (backupData) {
      try {
        const backup = JSON.parse(backupData);
        // Handle both old format (array) and new format (with metadata)
        let collection = backup;
        let timestamp = new Date().toISOString();
        if (backup.collection && Array.isArray(backup.collection)) {
          collection = backup.collection;
          timestamp = backup.timestamp || timestamp;
        }
        backups.push({
          index: i,
          count: Array.isArray(collection) ? collection.length : 0,
          timestamp
        });
      } catch (error) {
        console.error(`Failed to parse backup ${i}:`, error);
      }
    }
  }

  return backups;
};

/**
 * Restore a backup
 * @param {number} index - Backup index (1-3)
 * @returns {boolean} true if restore was successful
 */
export const restoreBackup = (index) => {
  try {
    if (index < 1 || index > MAX_BACKUPS) {
      console.error('Invalid backup index');
      return false;
    }

    const backupKey = STORAGE_KEYS[`BACKUP_${index}`];
    const backupData = localStorage.getItem(backupKey);

    if (!backupData) {
      console.error(`Backup ${index} not found`);
      return false;
    }

    // Handle both old format (array) and new format (with metadata)
    const backup = JSON.parse(backupData);
    const collection = backup.collection && Array.isArray(backup.collection) ? backup.collection : backup;

    if (!Array.isArray(collection)) {
      console.error('Invalid backup format');
      return false;
    }

    localStorage.setItem(STORAGE_KEYS.COLLECTION, JSON.stringify(collection));
    return true;
  } catch (error) {
    console.error('Failed to restore backup:', error);
    return false;
  }
};

/**
 * Delete a backup
 * @param {number} index - Backup index (1-3)
 * @returns {boolean} true if delete was successful
 */
export const deleteBackup = (index) => {
  try {
    if (index < 1 || index > MAX_BACKUPS) {
      console.error('Invalid backup index');
      return false;
    }

    const backupKey = STORAGE_KEYS[`BACKUP_${index}`];
    localStorage.removeItem(backupKey);
    return true;
  } catch (error) {
    console.error('Failed to delete backup:', error);
    return false;
  }
};
