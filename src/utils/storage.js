/**
 * Storage Utility
 *
 * Safe wrapper around localStorage with:
 * - Error handling
 * - Size limit checks
 * - Automatic JSON serialization
 * - Fallback values
 */

const STORAGE_QUOTA = 4.5 * 1024 * 1024; // 4.5MB (safe limit)

/**
 * Storage error class
 */
class StorageError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'StorageError';
    this.cause = cause;
  }
}

/**
 * Check if localStorage is available
 */
export const isStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get used storage size in bytes
 */
export const getStorageSize = () => {
  if (!isStorageAvailable()) return 0;

  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return total;
};

/**
 * Safe localStorage wrapper
 */
export const storage = {
  /**
   * Set item in localStorage with validation
   */
  set: (key, value) => {
    if (!isStorageAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }

    try {
      const serialized = JSON.stringify(value);

      // Check size limit
      if (serialized.length > STORAGE_QUOTA) {
        throw new StorageError(
          `Data too large: ${(serialized.length / 1024 / 1024).toFixed(2)}MB exceeds limit`,
          'QUOTA_EXCEEDED'
        );
      }

      // Check if adding this would exceed total quota
      const currentSize = getStorageSize();
      const newItemSize = key.length + serialized.length;

      if (currentSize + newItemSize > STORAGE_QUOTA) {
        throw new StorageError(
          'Storage quota exceeded. Try removing some items.',
          'QUOTA_EXCEEDED'
        );
      }

      localStorage.setItem(key, serialized);
      return true;

    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded:', error);
        return false;
      }

      if (error instanceof StorageError) {
        console.error(error.message);
        return false;
      }

      console.error('Failed to save to storage:', error);
      return false;
    }
  },

  /**
   * Get item from localStorage with fallback
   */
  get: (key, fallback = null) => {
    if (!isStorageAvailable()) {
      return fallback;
    }

    try {
      const item = localStorage.getItem(key);

      if (item === null) {
        return fallback;
      }

      return JSON.parse(item);

    } catch (error) {
      console.error('Failed to parse stored data:', error);
      return fallback;
    }
  },

  /**
   * Remove item from localStorage
   */
  remove: (key) => {
    if (!isStorageAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to remove item:', error);
      return false;
    }
  },

  /**
   * Clear all localStorage
   */
  clear: () => {
    if (!isStorageAvailable()) {
      return false;
    }

    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  },

  /**
   * Check if key exists
   */
  has: (key) => {
    if (!isStorageAvailable()) {
      return false;
    }

    return localStorage.getItem(key) !== null;
  },

  /**
   * Get all keys
   */
  keys: () => {
    if (!isStorageAvailable()) {
      return [];
    }

    return Object.keys(localStorage);
  },

  /**
   * Get storage info
   */
  getInfo: () => {
    const used = getStorageSize();
    const available = isStorageAvailable();

    return {
      available,
      used,
      usedMB: (used / 1024 / 1024).toFixed(2),
      quota: STORAGE_QUOTA,
      quotaMB: (STORAGE_QUOTA / 1024 / 1024).toFixed(2),
      percentUsed: ((used / STORAGE_QUOTA) * 100).toFixed(1)
    };
  }
};

/**
 * Migration helper for old data
 */
export const migrateStorage = (oldKey, newKey, transform = (data) => data) => {
  if (!storage.has(oldKey)) {
    return false;
  }

  try {
    const oldData = storage.get(oldKey);
    const newData = transform(oldData);
    storage.set(newKey, newData);
    storage.remove(oldKey);
    console.log(`Migrated ${oldKey} -> ${newKey}`);
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
};
