import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw } from 'lucide-react';
import { listBackups, restoreBackup, deleteBackup } from '../../services/storageService';
import { designSystem } from '../../designsystem';

export default function RecoveryPanel({ themes, onNotify }) {
  const [backups, setBackups] = useState([]);
  const [restoring, setRestoring] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = () => {
    const available = listBackups();
    setBackups(available);
  };

  const handleRestore = (index) => {
    if (!confirmRestore(index)) return;

    setRestoring(index);
    const result = restoreBackup(index);

    if (result) {
      onNotify('Collection restored from backup', 'success');
      // Reload page to refresh UI
      setTimeout(() => window.location.reload(), 1000);
    } else {
      onNotify('Failed to restore backup', 'error');
    }

    setRestoring(null);
  };

  const handleDelete = (index) => {
    deleteBackup(index);
    onNotify(`Backup ${index} deleted`, 'info');
    loadBackups();
  };

  const confirmRestore = (index) => {
    const backup = backups.find(b => b.index === index);
    const confirmed = window.confirm(
      `Restore backup from ${new Date(backup.timestamp).toLocaleDateString()}?\n` +
      `This will replace your current collection with ${backup.count} items.`
    );
    return confirmed;
  };

  return (
    <div
      style={{
        padding: designSystem.spacing.lg,
        backgroundColor: themes.surface,
        borderRadius: designSystem.borderRadius.md,
        border: `1px solid ${themes.border}`
      }}
    >
      <h3 style={{ margin: `0 0 ${designSystem.spacing.md} 0`, color: themes.text }}>
        Collection Recovery
      </h3>

      <p style={{ color: themes.textSecondary, fontSize: designSystem.typography.sizes.sm, marginBottom: designSystem.spacing.md }}>
        Automatic backups are created when you save. Keep 3 most recent backups.
      </p>

      {backups.length === 0 ? (
        <p style={{ color: themes.textTertiary, textAlign: 'center', padding: designSystem.spacing.lg }}>
          No backups yet. Make changes and save to create one.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: designSystem.spacing.md }}>
          {backups.map((backup) => (
            <div
              key={backup.index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: designSystem.spacing.md,
                backgroundColor: themes.background,
                border: `1px solid ${themes.border}`,
                borderRadius: designSystem.borderRadius.sm
              }}
            >
              <div>
                <p style={{ margin: 0, color: themes.text, fontWeight: 'bold' }}>
                  Backup {backup.index}
                </p>
                <p style={{ margin: `${designSystem.spacing.xs} 0 0 0`, color: themes.textSecondary, fontSize: designSystem.typography.sizes.sm }}>
                  {new Date(backup.timestamp).toLocaleString()} • {backup.count} items • {backup.size}
                </p>
              </div>
              <div style={{ display: 'flex', gap: designSystem.spacing.sm }}>
                <button
                  onClick={() => handleRestore(backup.index)}
                  disabled={restoring === backup.index}
                  style={{
                    padding: `${designSystem.spacing.sm} ${designSystem.spacing.md}`,
                    backgroundColor: themes.primary,
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: designSystem.borderRadius.sm,
                    cursor: restoring === backup.index ? 'not-allowed' : 'pointer',
                    opacity: restoring === backup.index ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: designSystem.spacing.xs,
                    fontSize: designSystem.typography.sizes.sm
                  }}
                >
                  <RotateCcw size={14} />
                  Restore
                </button>
                <button
                  onClick={() => setConfirmDelete(backup.index)}
                  style={{
                    padding: `${designSystem.spacing.sm} ${designSystem.spacing.md}`,
                    backgroundColor: 'transparent',
                    color: themes.textSecondary,
                    border: `1px solid ${themes.border}`,
                    borderRadius: designSystem.borderRadius.sm,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: designSystem.spacing.xs
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDelete !== null && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: themes.surface,
            padding: designSystem.spacing.lg,
            borderRadius: designSystem.borderRadius.md,
            maxWidth: '400px'
          }}>
            <p style={{ color: themes.text, marginBottom: designSystem.spacing.md }}>
              Delete backup {confirmDelete}? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: designSystem.spacing.sm }}>
              <button
                onClick={() => handleDelete(confirmDelete)}
                style={{
                  flex: 1,
                  padding: designSystem.spacing.sm,
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: designSystem.borderRadius.sm,
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1,
                  padding: designSystem.spacing.sm,
                  backgroundColor: themes.background,
                  color: themes.text,
                  border: `1px solid ${themes.border}`,
                  borderRadius: designSystem.borderRadius.sm,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
