import React from 'react';
import { designSystem, themeDefinitions } from '../../designsystem';

/**
 * SettingsView Component
 *
 * Application settings and configuration interface
 *
 * Features:
 * - Theme selection and customization
 * - Custom color picker
 * - Shop selection for price fetching
 * - Collection import/export
 * - Version information
 *
 * @component
 */
export default function SettingsView({
  // Theme State
  theme,
  onThemeChange,
  customColors,
  onCustomColorChange,

  // Shop Selection
  selectedShops,
  onSelectedShopsChange,

  // Actions
  onExportCollection,
  onImportCollection,

  // App Info
  appVersion,

  // Theme
  themes
}) {
  const availableShops = [
    { id: 'discogs', name: 'Discogs' },
    { id: 'hhv', name: 'HHV' },
    { id: 'ebay', name: 'eBay' }
  ];

  const handleShopToggle = (shopId) => {
    if (selectedShops.includes(shopId)) {
      onSelectedShopsChange(selectedShops.filter((id) => id !== shopId));
    } else {
      onSelectedShopsChange([...selectedShops, shopId]);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        padding: designSystem.spacing.md,
        paddingTop: '72px',
        paddingBottom: `calc(${designSystem.spacing.nav} + ${designSystem.spacing.md})`
      }}
    >
      <h2
        style={{
          fontSize: designSystem.typography.sizes.xl,
          fontWeight: designSystem.typography.weights.bold,
          color: themes.text,
          marginBottom: designSystem.spacing.lg
        }}
      >
        Settings
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: designSystem.spacing.lg }}>
        {/* Theme Selection */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: designSystem.typography.sizes.sm,
              fontWeight: designSystem.typography.weights.medium,
              color: themes.text,
              marginBottom: designSystem.spacing.sm
            }}
          >
            Theme
          </label>
          <select
            value={theme}
            onChange={(e) => onThemeChange(e.target.value)}
            style={{
              width: '100%',
              padding: designSystem.spacing.md,
              fontSize: designSystem.typography.sizes.base,
              backgroundColor: themes.surface,
              color: themes.text,
              border: `1px solid ${themes.border}`,
              borderRadius: designSystem.borderRadius.md,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {Object.keys(themeDefinitions).map((themeKey) => (
              <option key={themeKey} value={themeKey}>
                {themeDefinitions[themeKey].name}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Colors (only for custom theme) */}
        {theme === 'custom' && (
          <div>
            <label
              style={{
                display: 'block',
                fontSize: designSystem.typography.sizes.sm,
                fontWeight: designSystem.typography.weights.medium,
                color: themes.text,
                marginBottom: designSystem.spacing.sm
              }}
            >
              Custom Colors
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: designSystem.spacing.md
              }}
            >
              {['primary', 'background', 'accent', 'text'].map((colorKey) => (
                <div key={colorKey}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: designSystem.typography.sizes.xs,
                      color: themes.textSecondary,
                      marginBottom: designSystem.spacing.xs,
                      textTransform: 'capitalize'
                    }}
                  >
                    {colorKey}
                  </label>
                  <input
                    type="color"
                    value={customColors[colorKey]}
                    onChange={(e) => onCustomColorChange(colorKey, e.target.value)}
                    style={{
                      width: '100%',
                      height: '48px',
                      border: `1px solid ${themes.border}`,
                      borderRadius: designSystem.borderRadius.sm,
                      cursor: 'pointer'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shop Selection */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: designSystem.typography.sizes.sm,
              fontWeight: designSystem.typography.weights.medium,
              color: themes.text,
              marginBottom: designSystem.spacing.sm
            }}
          >
            Price Sources
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: designSystem.spacing.sm }}>
            {availableShops.map((shop) => (
              <label
                key={shop.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: designSystem.spacing.sm,
                  padding: designSystem.spacing.md,
                  backgroundColor: themes.surface,
                  border: `1px solid ${themes.border}`,
                  borderRadius: designSystem.borderRadius.md,
                  cursor: 'pointer'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedShops.includes(shop.id)}
                  onChange={() => handleShopToggle(shop.id)}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer'
                  }}
                />
                <span
                  style={{
                    fontSize: designSystem.typography.sizes.base,
                    color: themes.text
                  }}
                >
                  {shop.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Collection Management */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: designSystem.typography.sizes.sm,
              fontWeight: designSystem.typography.weights.medium,
              color: themes.text,
              marginBottom: designSystem.spacing.sm
            }}
          >
            Collection Management
          </label>
          <div style={{ display: 'flex', gap: designSystem.spacing.sm }}>
            <button
              onClick={onExportCollection}
              style={{
                flex: 1,
                padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
                minHeight: designSystem.touchTarget.min,
                backgroundColor: themes.primary,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: designSystem.borderRadius.md,
                cursor: 'pointer',
                fontSize: designSystem.typography.sizes.base,
                fontWeight: designSystem.typography.weights.medium
              }}
            >
              Export Collection
            </button>
            <label
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
                minHeight: designSystem.touchTarget.min,
                backgroundColor: 'transparent',
                color: themes.primary,
                border: `2px solid ${themes.primary}`,
                borderRadius: designSystem.borderRadius.md,
                cursor: 'pointer',
                fontSize: designSystem.typography.sizes.base,
                fontWeight: designSystem.typography.weights.medium
              }}
            >
              Import Collection
              <input
                type="file"
                accept=".json"
                onChange={onImportCollection}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {/* App Version */}
        <div
          style={{
            padding: designSystem.spacing.md,
            backgroundColor: themes.surface,
            border: `1px solid ${themes.border}`,
            borderRadius: designSystem.borderRadius.md,
            textAlign: 'center'
          }}
        >
          <p
            style={{
              fontSize: designSystem.typography.sizes.sm,
              color: themes.textSecondary,
              margin: 0
            }}
          >
            VinylScout v{appVersion}
          </p>
        </div>
      </div>
    </div>
  );
}
