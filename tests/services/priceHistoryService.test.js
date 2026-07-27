import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { savePriceRecord, getPriceHistory, clearPriceHistory } from '../../src/services/priceHistoryService';

describe('priceHistoryService', () => {
  const testAlbumId = 'album-123';
  const testAlbumId2 = 'album-456';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  describe('savePriceRecord', () => {
    it('should save a new price record', () => {
      const result = savePriceRecord(testAlbumId, 19.99, 'USD');
      expect(result).toBe(true);

      const history = getPriceHistory(testAlbumId);
      expect(history).toHaveLength(1);
      expect(history[0].price).toBe(19.99);
      expect(history[0].currency).toBe('USD');
      expect(history[0].timestamp).toBeDefined();
    });

    it('should return false if price is unchanged (duplicate)', () => {
      savePriceRecord(testAlbumId, 19.99, 'USD');
      const result = savePriceRecord(testAlbumId, 19.99, 'USD');
      expect(result).toBe(false);

      const history = getPriceHistory(testAlbumId);
      expect(history).toHaveLength(1);
    });

    it('should save a new record if price changes', () => {
      savePriceRecord(testAlbumId, 19.99, 'USD');
      const result = savePriceRecord(testAlbumId, 17.99, 'USD');
      expect(result).toBe(true);

      const history = getPriceHistory(testAlbumId);
      expect(history).toHaveLength(2);
      expect(history[0].price).toBe(19.99);
      expect(history[1].price).toBe(17.99);
    });

    it('should save a new record if currency changes', () => {
      savePriceRecord(testAlbumId, 19.99, 'USD');
      const result = savePriceRecord(testAlbumId, 19.99, 'EUR');
      expect(result).toBe(true);

      const history = getPriceHistory(testAlbumId);
      expect(history).toHaveLength(2);
      expect(history[1].currency).toBe('EUR');
    });

    it('should enforce 30 record limit and remove oldest', () => {
      // Save 31 records
      for (let i = 0; i < 31; i++) {
        savePriceRecord(testAlbumId, 10 + i, 'USD');
      }

      const history = getPriceHistory(testAlbumId);
      expect(history).toHaveLength(30);
      // First record should be the second one we saved (oldest removed)
      expect(history[0].price).toBe(11);
      // Last record should be the most recent
      expect(history[29].price).toBe(40);
    });

    it('should throw error if albumId is missing', () => {
      expect(() => savePriceRecord(null, 19.99, 'USD')).toThrow('albumId, price, and currency are required');
      expect(() => savePriceRecord('', 19.99, 'USD')).toThrow('albumId, price, and currency are required');
    });

    it('should throw error if price is missing', () => {
      expect(() => savePriceRecord(testAlbumId, undefined, 'USD')).toThrow('albumId, price, and currency are required');
      expect(() => savePriceRecord(testAlbumId, null, 'USD')).toThrow('albumId, price, and currency are required');
    });

    it('should throw error if currency is missing', () => {
      expect(() => savePriceRecord(testAlbumId, 19.99, null)).toThrow('albumId, price, and currency are required');
      expect(() => savePriceRecord(testAlbumId, 19.99, '')).toThrow('albumId, price, and currency are required');
    });

    it('should store price as a number', () => {
      savePriceRecord(testAlbumId, '19.99', 'USD');
      const history = getPriceHistory(testAlbumId);
      expect(typeof history[0].price).toBe('number');
      expect(history[0].price).toBe(19.99);
    });

    it('should store records in separate albums independently', () => {
      savePriceRecord(testAlbumId, 19.99, 'USD');
      savePriceRecord(testAlbumId2, 24.99, 'EUR');

      const history1 = getPriceHistory(testAlbumId);
      const history2 = getPriceHistory(testAlbumId2);

      expect(history1).toHaveLength(1);
      expect(history2).toHaveLength(1);
      expect(history1[0].price).toBe(19.99);
      expect(history2[0].price).toBe(24.99);
    });
  });

  describe('getPriceHistory', () => {
    it('should return empty array for non-existent album', () => {
      const history = getPriceHistory('non-existent-album');
      expect(history).toEqual([]);
    });

    it('should return all records sorted by timestamp ascending', () => {
      savePriceRecord(testAlbumId, 19.99, 'USD');
      // Manually add older record to test sorting (can't do via API due to new timestamps)
      const key = `price-history-${testAlbumId}`;
      const existingHistory = JSON.parse(localStorage.getItem(key));
      const olderRecord = {
        timestamp: new Date(Date.now() - 10000).toISOString(), // 10 seconds ago
        price: 21.99,
        currency: 'USD',
      };
      existingHistory.push(olderRecord);
      localStorage.setItem(key, JSON.stringify(existingHistory));

      const history = getPriceHistory(testAlbumId);
      expect(history).toHaveLength(2);
      // Should be sorted with older first
      expect(history[0].price).toBe(21.99);
      expect(history[1].price).toBe(19.99);
    });

    it('should handle gracefully if localStorage contains invalid JSON', () => {
      const key = `price-history-${testAlbumId}`;
      localStorage.setItem(key, 'invalid json data');

      const history = getPriceHistory(testAlbumId);
      expect(history).toEqual([]);
    });

    it('should handle gracefully if localStorage contains non-array data', () => {
      const key = `price-history-${testAlbumId}`;
      localStorage.setItem(key, JSON.stringify({ invalid: 'data' }));

      const history = getPriceHistory(testAlbumId);
      expect(history).toEqual([]);
    });

    it('should throw error if albumId is missing', () => {
      expect(() => getPriceHistory(null)).toThrow('albumId is required');
      expect(() => getPriceHistory('')).toThrow('albumId is required');
    });
  });

  describe('clearPriceHistory', () => {
    it('should delete all history for an album', () => {
      savePriceRecord(testAlbumId, 19.99, 'USD');
      savePriceRecord(testAlbumId, 17.99, 'USD');

      let history = getPriceHistory(testAlbumId);
      expect(history).toHaveLength(2);

      clearPriceHistory(testAlbumId);
      history = getPriceHistory(testAlbumId);
      expect(history).toEqual([]);
    });

    it('should only delete history for specified album', () => {
      savePriceRecord(testAlbumId, 19.99, 'USD');
      savePriceRecord(testAlbumId2, 24.99, 'EUR');

      clearPriceHistory(testAlbumId);

      const history1 = getPriceHistory(testAlbumId);
      const history2 = getPriceHistory(testAlbumId2);

      expect(history1).toEqual([]);
      expect(history2).toHaveLength(1);
    });

    it('should not error if clearing non-existent album', () => {
      expect(() => clearPriceHistory('non-existent-album')).not.toThrow();
    });

    it('should throw error if albumId is missing', () => {
      expect(() => clearPriceHistory(null)).toThrow('albumId is required');
      expect(() => clearPriceHistory('')).toThrow('albumId is required');
    });
  });

  describe('timestamp handling', () => {
    it('should store valid ISO8601 timestamps', () => {
      savePriceRecord(testAlbumId, 19.99, 'USD');
      const history = getPriceHistory(testAlbumId);
      const timestamp = history[0].timestamp;

      // Check if it's a valid ISO8601 string
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });
});
