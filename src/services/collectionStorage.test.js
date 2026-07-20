import { describe, it, expect, beforeEach } from 'vitest';
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
});
