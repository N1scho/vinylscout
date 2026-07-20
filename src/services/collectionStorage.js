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

const PersistedShape = z.object({
  state: z.object({ collection: z.array(z.unknown()) }).passthrough(),
}).passthrough();

function isValidPersistedValue(raw) {
  try {
    return PersistedShape.safeParse(JSON.parse(raw)).success;
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
    rotateBackups(localStorage.getItem(name));
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      if (error && error.name === 'QuotaExceededError') {
        // Ältestes Backup opfern, dann erneut versuchen
        localStorage.removeItem(`${BACKUP_PREFIX}${MAX_BACKUPS}`);
        localStorage.setItem(name, value);
      } else {
        throw error;
      }
    }
  },

  removeItem: (name) => {
    localStorage.removeItem(name);
  },
};
