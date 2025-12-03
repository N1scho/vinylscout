/**
 * Settings Store - Zustand
 *
 * Manages app settings and preferences
 * Replaces the useSettings hook
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createTheme } from '../designsystem';

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      // API Tokens
      discogsToken: '',
      anthropicToken: '',

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

      // Visibility toggles
      showDiscogsToken: false,
      showAnthropicToken: false,

      // Computed: Get current theme object
      getThemes: () => {
        const state = get();
        return createTheme(state.theme, state.customColors);
      },

      // Actions
      setDiscogsToken: (discogsToken) => {
        set({ discogsToken });
        // Also save to localStorage for backward compatibility
        try {
          localStorage.setItem('discogsToken', discogsToken);
        } catch (e) {
          console.error('Failed to save token:', e);
        }
      },

      setAnthropicToken: (anthropicToken) => {
        set({ anthropicToken });
        try {
          localStorage.setItem('anthropicApiKey', anthropicToken);
        } catch (e) {
          console.error('Failed to save token:', e);
        }
      },

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

      setShowDiscogsToken: (showDiscogsToken) => set({ showDiscogsToken }),
      setShowAnthropicToken: (showAnthropicToken) => set({ showAnthropicToken }),
    }),
    {
      name: 'vinyl-settings-storage',
      // Persist everything except visibility toggles
      partialize: (state) => ({
        discogsToken: state.discogsToken,
        anthropicToken: state.anthropicToken,
        theme: state.theme,
        customColors: state.customColors,
        selectedShops: state.selectedShops
      })
    }
  )
);
