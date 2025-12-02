/**
 * DetailModal Component
 *
 * Displays detailed information for a search result
 * Extracted from App.jsx v2.10.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import { designSystem, withOpacity } from '../../designsystem';

const DetailModal = React.memo(({
  selectedResult,
  collection,
  onClose,
  onAddToCollection,
  onRemoveFromCollection,
  themes
}) => {
  if (!selectedResult) return null;

  const inCollection = collection.some(v => v.id === selectedResult.id);

  const handleAction = () => {
    if (inCollection) {
      onRemoveFromCollection(selectedResult.id);
    } else {
      onAddToCollection(selectedResult);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: withOpacity('#000000', 0.8),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: designSystem.spacing.md,
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: themes.surface,
          borderRadius: designSystem.borderRadius.md,
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        <button
          data-modal-button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: designSystem.spacing.sm,
            right: designSystem.spacing.sm,
            padding: designSystem.spacing.sm,
            minWidth: designSystem.touchTarget.min,
            minHeight: designSystem.touchTarget.min,
            backgroundColor: withOpacity(themes.background, 0.9),
            border: 'none',
            borderRadius: designSystem.borderRadius.circle,
            color: themes.text,
            cursor: 'pointer',
            zIndex: 1
          }}
        >
          <X size={designSystem.iconSize.md} />
        </button>

        <img
          src={selectedResult.cover_image || selectedResult.thumb}
          alt={selectedResult.title}
          style={{
            width: '100%',
            aspectRatio: '1',
            objectFit: 'cover',
            backgroundColor: themes.border
          }}
        />

        <div style={{ padding: designSystem.spacing.lg }}>
          <h2 style={{
            fontSize: designSystem.typography.sizes.xl,
            fontWeight: designSystem.typography.weights.bold,
            color: themes.text,
            margin: `0 0 ${designSystem.spacing.sm} 0`
          }}>
            {selectedResult.title}
          </h2>
          <p style={{
            fontSize: designSystem.typography.sizes.base,
            color: themes.textSecondary,
            margin: `0 0 ${designSystem.spacing.lg} 0`
          }}>
            {selectedResult.year || 'Year unknown'}
          </p>

          {selectedResult.genre && selectedResult.genre.length > 0 && (
            <div style={{ marginBottom: designSystem.spacing.md }}>
              <h3 style={{
                fontSize: designSystem.typography.sizes.sm,
                fontWeight: designSystem.typography.weights.semibold,
                color: themes.text,
                margin: `0 0 ${designSystem.spacing.xs} 0`
              }}>
                Genres
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: designSystem.spacing.xs }}>
                {selectedResult.genre.map(g => (
                  <span
                    key={g}
                    style={{
                      padding: `${designSystem.spacing.xs} ${designSystem.spacing.sm}`,
                      backgroundColor: withOpacity(themes.primary, 0.1),
                      color: themes.primary,
                      borderRadius: designSystem.borderRadius.sm,
                      fontSize: designSystem.typography.sizes.xs
                    }}
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: designSystem.spacing.sm,
            marginTop: designSystem.spacing.lg
          }}>
            <button
              data-modal-button
              onClick={handleAction}
              style={{
                flex: 1,
                padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
                minHeight: designSystem.touchTarget.min,
                backgroundColor: inCollection ? themes.error : themes.primary,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: designSystem.borderRadius.md,
                cursor: 'pointer',
                fontSize: designSystem.typography.sizes.base,
                fontWeight: designSystem.typography.weights.medium
              }}
            >
              {inCollection ? 'Remove from Collection' : 'Add to Collection'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

DetailModal.propTypes = {
  selectedResult: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    artist: PropTypes.string,
    year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string,
    format: PropTypes.string,
    genre: PropTypes.arrayOf(PropTypes.string),
    cover_image: PropTypes.string,
    thumb: PropTypes.string
  }),
  collection: PropTypes.arrayOf(PropTypes.object).isRequired,
  onClose: PropTypes.func.isRequired,
  onAddToCollection: PropTypes.func.isRequired,
  onRemoveFromCollection: PropTypes.func.isRequired,
  themes: PropTypes.shape({
    background: PropTypes.string.isRequired,
    surface: PropTypes.string.isRequired,
    primary: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    textSecondary: PropTypes.string.isRequired,
    border: PropTypes.string.isRequired
  }).isRequired
};

export default DetailModal;
