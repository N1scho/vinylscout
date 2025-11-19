/**
 * Input Validation Utilities
 *
 * Provides secure validation for user inputs and API responses
 */

export const validators = {
  /**
   * Validate year is within reasonable range
   */
  isValidYear: (year) => {
    const y = parseInt(year);
    const currentYear = new Date().getFullYear();
    return !isNaN(y) && y >= 1900 && y <= currentYear + 1;
  },

  /**
   * Sanitize string input to prevent XSS
   */
  sanitizeString: (str, maxLength = 200) => {
    if (typeof str !== 'string') return '';
    return str
      .trim()
      .slice(0, maxLength)
      .replace(/[<>]/g, ''); // Basic XSS protection
  },

  /**
   * Validate Discogs ID format
   */
  isValidDiscogsId: (id) => {
    const numId = parseInt(id);
    return !isNaN(numId) && numId > 0 && numId < Number.MAX_SAFE_INTEGER;
  },

  /**
   * Validate URL format
   */
  isValidUrl: (url) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  },

  /**
   * Validate price value
   */
  isValidPrice: (price) => {
    const p = parseFloat(price);
    return !isNaN(p) && p >= 0 && p < 1000000; // Max 1M
  },

  /**
   * Validate currency code (ISO 4217)
   */
  isValidCurrency: (code) => {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'];
    return typeof code === 'string' && validCurrencies.includes(code.toUpperCase());
  },

  /**
   * Validate pagination parameters
   */
  isValidPage: (page) => {
    const p = parseInt(page);
    return !isNaN(p) && p > 0 && p <= 10000; // Reasonable limit
  },

  /**
   * Validate search query
   */
  isValidSearchQuery: (query) => {
    if (typeof query !== 'string') return false;
    const trimmed = query.trim();
    return trimmed.length >= 1 && trimmed.length <= 200;
  },

  /**
   * Validate vinyl object structure
   */
  isValidVinyl: (vinyl) => {
    if (!vinyl || typeof vinyl !== 'object') return false;

    return (
      validators.isValidDiscogsId(vinyl.id) &&
      typeof vinyl.title === 'string' &&
      vinyl.title.length > 0 &&
      vinyl.title.length <= 500
    );
  },

  /**
   * Validate image data URI
   */
  isValidImageDataUri: (dataUri) => {
    if (typeof dataUri !== 'string') return false;
    return /^data:image\/(jpeg|jpg|png|webp);base64,/.test(dataUri);
  },

  /**
   * Sanitize filename for downloads
   */
  sanitizeFilename: (filename) => {
    if (typeof filename !== 'string') return 'download';
    return filename
      .replace(/[^a-zA-Z0-9-_\.]/g, '_')
      .slice(0, 100);
  }
};

/**
 * Error messages for validation failures
 */
export const validationErrors = {
  invalidYear: 'Year must be between 1900 and current year',
  invalidId: 'Invalid ID format',
  invalidUrl: 'Invalid URL format',
  invalidPrice: 'Price must be a positive number',
  invalidCurrency: 'Invalid currency code',
  invalidPage: 'Page number must be positive',
  invalidQuery: 'Search query must be 1-200 characters',
  invalidVinyl: 'Invalid vinyl record data',
  invalidImage: 'Invalid image format'
};
