/**
 * Storage-Adapter für den Collection-Store:
 * - rollierende Backups (letzte MAX_BACKUPS Stände)
 * - Struktur-Validierung beim Laden mit Fallback auf Backups
 * - QuotaExceeded-Handling
 *
 * Bewusst NUR Struktur-Validierung (kein striktes Item-Schema):
 * ein einzelnes ungewöhnliches Feld darf nie zum Verlust der
 * ganzen Sammlung führen.
 */
import { z } from 'zod';

export const BACKUP_PREFIX = 'vinyl-collection-backup-';
export const MAX_BACKUPS = 3;

function isValidPersistedValue(raw) {
  try {
    const parsed = JSON.parse(raw);
    // Check that it's an object with a state property
    if (typeof parsed !== 'object' || parsed === null || !('state' in parsed)) {
      return false;
    }
    // Check that state.collection is an array
    if (!Array.isArray(parsed.state.collection)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function rotateBackups(previousValue) {
  try {
    for (let i = MAX_BACKUPS - 1; i >= 1; i--) {
      const older = localStorage.getItem(`${BACKUP_PREFIX}${i}`);
      if (older !== null) {
        localStorage.setItem(`${BACKUP_PREFIX}${i + 1}`, older);
      }
    }
    if (previousValue !== null) {
      localStorage.setItem(`${BACKUP_PREFIX}1`, previousValue);
    }
    localStorage.removeItem(`${BACKUP_PREFIX}${MAX_BACKUPS + 1}`);
  } catch {
    /* Backups sind best effort — dürfen das Speichern nie verhindern */
  }
}

export const backupStorage = {
  getItem: (name) => {
    const candidates = [localStorage.getItem(name)];
    for (let i = 1; i <= MAX_BACKUPS; i++) {
      candidates.push(localStorage.getItem(`${BACKUP_PREFIX}${i}`));
    }
    for (const candidate of candidates) {
      if (candidate !== null && isValidPersistedValue(candidate)) {
        return candidate;
      }
    }
    return null;
  },

  setItem: (name, value) => {
    try {
      rotateBackups(localStorage.getItem(name));
      localStorage.setItem(name, value);
      console.log(`[backupStorage] saved ${name}, size: ${value.length} bytes`);
    } catch (error) {
      if (error && error.name === 'QuotaExceededError') {
        console.warn('[backupStorage] quota exceeded, retrying after clearing backups');

        let backupCleared = false;
        for (let i = MAX_BACKUPS; i >= 1; i--) {
          try {
            localStorage.removeItem(`${BACKUP_PREFIX}${i}`);
            backupCleared = true;
            console.warn(`[backupStorage] cleared backup slot ${i}, retrying...`);

            try {
              localStorage.setItem(name, value);
              console.log(`[backupStorage] saved ${name} after clearing backups, size: ${value.length} bytes`);
              return; // Success
            } catch (retryError) {
              if (retryError.name !== 'QuotaExceededError') {
                throw retryError;
              }
              // Continue to next backup
            }
          } catch (clearError) {
            console.error(`[backupStorage] failed to clear backup ${i}:`, clearError);
            // Continue to next backup
          }
        }

        if (!backupCleared) {
          throw new Error('localStorage quota exceeded and no space could be freed');
        }
        throw new Error('localStorage quota exceeded: insufficient space after clearing all backups');
      } else {
        console.error('[backupStorage] error:', error);
        throw error;
      }
    }
  },

  removeItem: (name) => {
    localStorage.removeItem(name);
  },
};
