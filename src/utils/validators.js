/**
 * Input Validation Utilities
 *
 * Provides secure validation for user inputs and API responses
 */

import DOMPurify from 'dompurify';

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
   * Uses DOMPurify for comprehensive XSS protection
   */
  sanitizeString: (str, maxLength = 200) => {
    if (typeof str !== 'string') return '';

    // Use DOMPurify to sanitize the string
    const cleaned = DOMPurify.sanitize(str, {
      ALLOWED_TAGS: [], // Strip all HTML tags
      ALLOWED_ATTR: [], // Strip all attributes
      KEEP_CONTENT: true // Keep text content
    });

    return cleaned
      .trim()
      .slice(0, maxLength);
  },

  /**
   * Sanitize HTML content (for cases where HTML is needed)
   * Allows only safe HTML tags
   */
  sanitizeHtml: (html, maxLength = 1000) => {
    if (typeof html !== 'string') return '';

    const cleaned = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });

    return cleaned.slice(0, maxLength);
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
   * Validate price data object from API
   */
  isValidPriceData: (priceData) => {
    if (!priceData || typeof priceData !== 'object') return false;

    return (
      typeof priceData.value === 'number' &&
      !isNaN(priceData.value) &&
      isFinite(priceData.value) &&
      priceData.value >= 0 &&
      priceData.value < 1000000 &&
      validators.isValidCurrency(priceData.currency)
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
