import { describe, it, expect, beforeEach, vi } from 'vitest';
import { backupStorage, BACKUP_PREFIX, MAX_BACKUPS } from './collectionStorage';

const KEY = 'vinyl-collection-storage';
const validState = (n) =>
  JSON.stringify({ state: { collection: [{ id: n, title: `Album ${n}` }] }, version: 0 });

describe('backupStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('setItem writes value and rotates previous value into backup-1', () => {
    backupStorage.setItem(KEY, validState(1));
    backupStorage.setItem(KEY, validState(2));

    expect(backupStorage.getItem(KEY)).toBe(validState(2));
    expect(localStorage.getItem(`${BACKUP_PREFIX}1`)).toBe(validState(1));
  });

  it('keeps at most MAX_BACKUPS backups', () => {
    for (let i = 1; i <= MAX_BACKUPS + 3; i++) {
      backupStorage.setItem(KEY, validState(i));
    }
    expect(localStorage.getItem(`${BACKUP_PREFIX}${MAX_BACKUPS}`)).not.toBeNull();
    expect(localStorage.getItem(`${BACKUP_PREFIX}${MAX_BACKUPS + 1}`)).toBeNull();
  });

  it('getItem falls back to newest valid backup when current value is corrupt', () => {
    backupStorage.setItem(KEY, validState(1));
    backupStorage.setItem(KEY, validState(2));
    backupStorage.setItem(KEY, validState(3));
    localStorage.setItem(KEY, '{not valid json');

    expect(backupStorage.getItem(KEY)).toBe(validState(2));
  });

  it('getItem falls back when current value has wrong shape', () => {
    backupStorage.setItem(KEY, validState(1));
    backupStorage.setItem(KEY, validState(2));
    backupStorage.setItem(KEY, validState(3));
    localStorage.setItem(KEY, JSON.stringify({ state: { collection: 'kaputt' } }));

    expect(backupStorage.getItem(KEY)).toBe(validState(2));
  });

  it('getItem returns null when nothing stored', () => {
    expect(backupStorage.getItem(KEY)).toBeNull();
  });

  it('saves item successfully on first attempt', () => {
    const value = '{"state": {"collection": []}}';
    backupStorage.setItem('test-key', value);
    expect(localStorage.getItem('test-key')).toBe(value);
  });

  it('retries and clears backups on QuotaExceededError', () => {
    // Mock localStorage.setItem to throw QuotaExceededError for 'test-key' until
    // every backup slot has been cleared (the implementation frees oldest-first),
    // then succeed. rotateBackups() also calls setItem internally for shifting
    // backup slots, so we key the failure condition off the target name, not a
    // raw call count.
    let testKeyAttempts = 0;
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = vi.fn((key, value) => {
      if (key === 'test-key') {
        testKeyAttempts++;
        if (testKeyAttempts <= MAX_BACKUPS) {
          const error = new Error('QuotaExceededError');
          error.name = 'QuotaExceededError';
          throw error;
        }
      }
      originalSetItem.call(localStorage, key, value);
    });

    // Pre-populate backups
    originalSetItem.call(localStorage, `${BACKUP_PREFIX}1`, '{"state": {"collection": []}}');
    originalSetItem.call(localStorage, `${BACKUP_PREFIX}2`, '{"state": {"collection": []}}');

    const value = '{"state": {"collection": []}}';
    backupStorage.setItem('test-key', value);

    expect(localStorage.getItem('test-key')).toBe(value);
    expect(localStorage.getItem(`${BACKUP_PREFIX}1`)).toBeNull(); // Cleared during retry

    localStorage.setItem = originalSetItem;
  });

  it('throws user-friendly error when all retries exhausted', () => {
    // Mock localStorage.setItem to always throw QuotaExceededError
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = vi.fn(() => {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    });

    const value = '{"state": {"collection": []}}';
    expect(() => backupStorage.setItem('test-key', value)).toThrow('localStorage quota exceeded');

    localStorage.setItem = originalSetItem;
  });
});
