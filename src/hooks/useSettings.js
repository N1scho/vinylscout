/**
 * useSettings Hook
 *
 * Manages settings state and persistence
 * Extracted from App.jsx v2.9.0
 */

import { useState, useEffect } from 'react';
import { createTheme } from '../designsystem';
import * as StorageService from '../services/storageService';

export const useSettings = () => {
  // Settings State
  const [discogsToken, setDiscogsToken] = useState('');
  const [anthropicToken, setAnthropicToken] = useState('');
  const [showDiscogsToken, setShowDiscogsToken] = useState(false);
  const [showAnthropicToken, setShowAnthropicToken] = useState(false);
  const [theme, setTheme] = useState('classic');
  const [customColors, setCustomColors] = useState({
    primary: '#FF6B6B',
    background: '#1A1A2E',
    accent: '#4ECDC4',
    text: '#EAEAEA'
  });
  const [selectedShops, setSelectedShops] = useState(['discogs', 'hhv', 'ebay']);

  // Load settings on mount
  useEffect(() => {
    // Check for V1 migration
    if (StorageService.needsV1Migration()) {
      const migrated = StorageService.migrateFromV1();
      if (migrated.token) setDiscogsToken(migrated.token);
    }

    // Load all settings
    const savedDiscogsToken = StorageService.loadDiscogsToken();
    const savedAnthropicToken = StorageService.loadAnthropicToken();
    const savedTheme = StorageService.loadTheme();
    const savedColors = StorageService.loadCustomColors();
    const savedShops = StorageService.loadSelectedShops();

    if (savedDiscogsToken) setDiscogsToken(savedDiscogsToken);
    if (savedAnthropicToken) setAnthropicToken(savedAnthropicToken);
    setTheme(savedTheme);
    setCustomColors(savedColors);
    setSelectedShops(savedShops);
  }, []);

  // Save tokens when they change
  useEffect(() => {
    StorageService.saveDiscogsToken(discogsToken);
  }, [discogsToken]);

  useEffect(() => {
    StorageService.saveAnthropicToken(anthropicToken);
  }, [anthropicToken]);

  // Save theme when it changes
  useEffect(() => {
    StorageService.saveTheme(theme);
  }, [theme]);

  // Save custom colors when they change
  useEffect(() => {
    StorageService.saveCustomColors(customColors);
  }, [customColors]);

  // Save selected shops when they change
  useEffect(() => {
    StorageService.saveSelectedShops(selectedShops);
  }, [selectedShops]);

  // Create theme object
  const themes = createTheme(theme, customColors);

  // Update custom color
  const updateCustomColor = (colorKey, value) => {
    setCustomColors(prev => ({ ...prev, [colorKey]: value }));
  };

  // Toggle shop selection
  const toggleShop = (shop) => {
    setSelectedShops(prev =>
      prev.includes(shop) ? prev.filter(s => s !== shop) : [...prev, shop]
    );
  };

  return {
    // State
    discogsToken,
    anthropicToken,
    showDiscogsToken,
    showAnthropicToken,
    theme,
    customColors,
    selectedShops,
    themes,

    // Setters
    setDiscogsToken,
    setAnthropicToken,
    setShowDiscogsToken,
    setShowAnthropicToken,
    setTheme,
    setCustomColors,
    setSelectedShops,

    // Operations
    updateCustomColor,
    toggleShop
  };
};
