/**
 * Settings Store - Zustand
 *
 * Manages app settings and preferences
 * Replaces the useSettings hook
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { createTheme } from '../designsystem';

const cleanupLegacyTokenKeys = () => {
  try {
    ['discogsToken', 'anthropicApiKey', 'anthropicToken'].forEach((k) =>
      localStorage.removeItem(k)
    );
    Object.keys(localStorage)
      .filter((k) => k.startsWith('sec_'))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* localStorage nicht verfügbar (SSR/Test) */
  }
};
cleanupLegacyTokenKeys();

export const useSettingsStore = create(
  devtools(
    persist(
      (set, get) => ({
      // UI Settings
      theme: 'orange',
      customColors: {
        background: '#1a1a1a',
        surface: '#2a2a2a',
        primary: '#ff6b35',
        secondary: '#f7931e',
        text: '#ffffff',
        textSecondary: '#b0b0b0',
        border: '#404040',
        success: '#4caf50',
        error: '#f44336',
        warning: '#ff9800'
      },
      selectedShops: ['Discogs Marketplace'],
      designTheme: 'subtle', // 'subtle' | 'bold' | 'hybrid'

      // Computed: Get current theme object
      getThemes: () => {
        const state = get();
        return createTheme(state.theme, state.customColors);
      },

      // Actions
      setTheme: (theme) => {
        set({ theme });
        try {
          localStorage.setItem('theme', theme);
        } catch (e) {
          console.error('Failed to save theme:', e);
        }
      },

      setCustomColors: (customColors) => {
        set({ customColors });
        try {
          localStorage.setItem('customColors', JSON.stringify(customColors));
        } catch (e) {
          console.error('Failed to save colors:', e);
        }
      },

      updateCustomColor: (colorKey, value) => set((state) => {
        const newColors = { ...state.customColors, [colorKey]: value };
        try {
          localStorage.setItem('customColors', JSON.stringify(newColors));
        } catch (e) {
          console.error('Failed to save colors:', e);
        }
        return { customColors: newColors };
      }),

      setSelectedShops: (selectedShops) => {
        set({ selectedShops });
        try {
          localStorage.setItem('selectedShops', JSON.stringify(selectedShops));
        } catch (e) {
          console.error('Failed to save shops:', e);
        }
      },

      setDesignTheme: (designTheme) => set({ designTheme }),
      }),
      {
        name: 'vinyl-settings-storage',
        version: 1,
        migrate: (persistedState) => {
          if (!persistedState) return persistedState;
          const { discogsToken, anthropicToken, ...rest } = persistedState;
          return rest;
        },
        partialize: (state) => ({
          theme: state.theme,
          customColors: state.customColors,
          selectedShops: state.selectedShops,
          designTheme: state.designTheme,
        }),
      }
    ),
    { name: 'SettingsStore' }
  )
);
