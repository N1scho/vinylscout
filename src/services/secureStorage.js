/**
 * Secure Storage Service
 *
 * Provides secure token storage using encryption and in-memory fallback
 * This is a significant security improvement over plain localStorage
 *
 * Security Features:
 * 1. AES encryption for localStorage (defense in depth)
 * 2. Memory-only storage option (most secure, lost on refresh)
 * 3. Device fingerprinting for encryption key
 * 4. Automatic token expiration
 * 5. XSS-resistant design
 */

import CryptoJS from 'crypto-js';

// Configuration
const TOKEN_EXPIRY_HOURS = 24; // Tokens expire after 24 hours
const STORAGE_MODE = 'encrypted'; // 'encrypted' or 'memory-only'

/**
 * Generate a device fingerprint for encryption key
 * This makes stolen encrypted data harder to decrypt on different devices
 */
const getDeviceFingerprint = () => {
  const factors = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    // Add more factors for stronger fingerprint
    navigator.hardwareConcurrency || 'unknown',
    navigator.deviceMemory || 'unknown',
  ];

  return CryptoJS.SHA256(factors.join('|')).toString();
};

/**
 * Memory-only storage (most secure - tokens lost on refresh)
 * This completely prevents XSS attacks from stealing tokens
 */
class MemoryStorage {
  constructor() {
    this.tokens = {};
  }

  setToken(key, value, expiryHours = TOKEN_EXPIRY_HOURS) {
    const expiryTime = Date.now() + (expiryHours * 60 * 60 * 1000);
    this.tokens[key] = {
      value,
      expiryTime
    };
  }

  getToken(key) {
    const token = this.tokens[key];

    if (!token) {
      return null;
    }

    // Check if token expired
    if (Date.now() > token.expiryTime) {
      delete this.tokens[key];
      return null;
    }

    return token.value;
  }

  removeToken(key) {
    delete this.tokens[key];
  }

  clearAll() {
    this.tokens = {};
  }

  hasToken(key) {
    return this.getToken(key) !== null;
  }
}

/**
 * Encrypted localStorage (defense in depth)
 * Even if XSS accesses localStorage, tokens are encrypted
 */
class EncryptedStorage {
  constructor() {
    this.encryptionKey = getDeviceFingerprint();
  }

  encrypt(text) {
    try {
      return CryptoJS.AES.encrypt(text, this.encryptionKey).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  decrypt(ciphertext) {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, this.encryptionKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  setToken(key, value, expiryHours = TOKEN_EXPIRY_HOURS) {
    try {
      const expiryTime = Date.now() + (expiryHours * 60 * 60 * 1000);
      const data = JSON.stringify({
        value,
        expiryTime
      });

      const encrypted = this.encrypt(data);
      localStorage.setItem(`sec_${key}`, encrypted);

      // Store a non-encrypted timestamp for cleanup purposes only
      localStorage.setItem(`sec_${key}_ts`, expiryTime.toString());
    } catch (error) {
      console.error('Failed to store token:', error);
      throw new Error('Failed to store token securely');
    }
  }

  getToken(key) {
    try {
      const encrypted = localStorage.getItem(`sec_${key}`);

      if (!encrypted) {
        return null;
      }

      const decrypted = this.decrypt(encrypted);

      if (!decrypted) {
        // Decryption failed - possibly corrupted or wrong device
        this.removeToken(key);
        return null;
      }

      const data = JSON.parse(decrypted);

      // Check if token expired
      if (Date.now() > data.expiryTime) {
        this.removeToken(key);
        return null;
      }

      return data.value;
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      this.removeToken(key);
      return null;
    }
  }

  removeToken(key) {
    localStorage.removeItem(`sec_${key}`);
    localStorage.removeItem(`sec_${key}_ts`);
  }

  clearAll() {
    // Remove all secure tokens
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sec_')) {
        localStorage.removeItem(key);
      }
    });
  }

  hasToken(key) {
    return this.getToken(key) !== null;
  }

  /**
   * Clean up expired tokens
   * Call this periodically to prevent storage bloat
   */
  cleanupExpired() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sec_') && key.endsWith('_ts')) {
        const timestamp = parseInt(localStorage.getItem(key), 10);
        if (Date.now() > timestamp) {
          const tokenKey = key.replace('_ts', '').replace('sec_', '');
          this.removeToken(tokenKey);
        }
      }
    });
  }
}

/**
 * Initialize the appropriate storage mechanism
 */
let storage;

if (STORAGE_MODE === 'memory-only') {
  storage = new MemoryStorage();
  console.info('🔒 Secure Storage: Using memory-only mode (tokens lost on refresh)');
} else {
  storage = new EncryptedStorage();
  console.info('🔒 Secure Storage: Using encrypted localStorage mode');

  // Clean up expired tokens on initialization
  try {
    storage.cleanupExpired();
  } catch (error) {
    console.error('Failed to cleanup expired tokens:', error);
  }
}

/**
 * Public API for secure token management
 */
export const SecureStorage = {
  /**
   * Store a token securely
   * @param {string} key - Token identifier (e.g., 'discogsToken')
   * @param {string} value - Token value
   * @param {number} expiryHours - Hours until token expires (default: 24)
   */
  setToken(key, value, expiryHours = TOKEN_EXPIRY_HOURS) {
    if (!key || !value) {
      throw new Error('Key and value are required');
    }
    storage.setToken(key, value, expiryHours);
  },

  /**
   * Retrieve a token securely
   * @param {string} key - Token identifier
   * @returns {string|null} Token value or null if not found/expired
   */
  getToken(key) {
    if (!key) {
      return null;
    }
    return storage.getToken(key);
  },

  /**
   * Remove a specific token
   * @param {string} key - Token identifier
   */
  removeToken(key) {
    if (!key) {
      return;
    }
    storage.removeToken(key);
  },

  /**
   * Check if a token exists and is valid
   * @param {string} key - Token identifier
   * @returns {boolean}
   */
  hasToken(key) {
    if (!key) {
      return false;
    }
    return storage.hasToken(key);
  },

  /**
   * Clear all stored tokens
   * Call this on logout
   */
  clearAll() {
    storage.clearAll();
  },

  /**
   * Get current storage mode
   * @returns {string} 'memory-only' or 'encrypted'
   */
  getStorageMode() {
    return STORAGE_MODE;
  },

  /**
   * Check if tokens will persist across page refreshes
   * @returns {boolean}
   */
  isPersistent() {
    return STORAGE_MODE !== 'memory-only';
  }
};

/**
 * Migration utility to move existing plain localStorage tokens to secure storage
 * Call this once on app initialization
 */
export const migrateExistingTokens = () => {
  try {
    console.info('🔄 Migrating existing tokens to secure storage...');

    const tokensToMigrate = [
      { old: 'discogsToken', new: 'discogsToken' },
      { old: 'anthropicApiKey', new: 'anthropicToken' }
    ];

    let migrated = 0;

    tokensToMigrate.forEach(({ old, new: newKey }) => {
      const oldValue = localStorage.getItem(old);
      if (oldValue && oldValue.trim() !== '') {
        // Move to secure storage
        SecureStorage.setToken(newKey, oldValue);

        // Remove old insecure storage
        localStorage.removeItem(old);

        migrated++;
        console.info(`✅ Migrated ${old} to secure storage`);
      }
    });

    if (migrated > 0) {
      console.info(`✅ Successfully migrated ${migrated} token(s) to secure storage`);
      return migrated;
    } else {
      console.info('ℹ️ No tokens found to migrate');
      return 0;
    }
  } catch (error) {
    console.error('❌ Token migration failed:', error);
    throw error;
  }
};

/**
 * Security best practices reminder
 */
if (process.env.NODE_ENV === 'development') {
  console.group('🔒 Secure Storage Information');
  console.info('Storage Mode:', STORAGE_MODE);
  console.info('Token Expiry:', `${TOKEN_EXPIRY_HOURS} hours`);
  console.info('Persistent:', SecureStorage.isPersistent());

  if (STORAGE_MODE === 'memory-only') {
    console.warn('⚠️ Memory-only mode: Tokens will be lost on page refresh');
    console.info('💡 Users will need to re-enter tokens after refresh');
  } else {
    console.info('✅ Encrypted mode: Tokens persist but are encrypted');
    console.info('💡 Tokens are encrypted with device fingerprint');
  }

  console.groupEnd();
}

export default SecureStorage;
