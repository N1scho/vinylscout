import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveCollection,
  loadCollection,
  createBackup,
  listBackups,
  restoreBackup,
  deleteBackup
} from '../../src/services/storageService';

describe('storageService backups', () => {
  const testCollection = [
    { id: '1', title: 'Album 1', price: { value: 10, currency: 'USD' } },
    { id: '2', title: 'Album 2', price: { value: 20, currency: 'USD' } }
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  it('creates backup on save', () => {
    saveCollection(testCollection);
    const backups = listBackups();

    expect(backups.length).toBe(1);
    expect(backups[0].count).toBe(2);
    expect(backups[0].index).toBe(1);
  });

  it('rotates backups: new → 1, 1 → 2, 2 → 3, discards 3', () => {
    const col1 = [{ id: '1', title: 'A' }];
    const col2 = [{ id: '1', title: 'A' }, { id: '2', title: 'B' }];
    const col3 = [{ id: '1' }, { id: '2' }, { id: '3' }];
    const col4 = [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }];

    saveCollection(col1);
    saveCollection(col2);
    saveCollection(col3);
    saveCollection(col4);

    const backups = listBackups();
    expect(backups[0].count).toBe(4);
    expect(backups[1].count).toBe(3);
    expect(backups[2].count).toBe(2);
  });

  it('restores backup to main collection', () => {
    saveCollection(testCollection);
    const emptyCollection = [];
    saveCollection(emptyCollection);

    restoreBackup(2);
    const restored = loadCollection();

    expect(restored.length).toBe(2);
    expect(restored[0].id).toBe('1');
  });

  it('lists all available backups', () => {
    saveCollection([{ id: '1' }]);
    saveCollection([{ id: '1' }, { id: '2' }]);
    saveCollection([{ id: '1' }, { id: '2' }, { id: '3' }]);

    const backups = listBackups();
    expect(backups.length).toBe(3);
  });
});
