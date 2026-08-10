import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useSettingsStore } from '../../stores/settingsStore';
import AlbumGallery from './AlbumGallery';
import GenreSelector from './GenreSelector';

describe('Design Theme Switching in Discover Views', () => {
  const mockThemes = {
    text: '#ffffff',
    surface: '#2a2a2a',
    primary: '#ff6b35',
    border: '#404040',
    background: '#1a1a1a',
    textSecondary: '#b0b0b0',
    accent: '#f7931e'
  };

  beforeEach(() => {
    // Reset the settings store to default state
    useSettingsStore.setState({
      designTheme: 'subtle'
    });
  });

  it('should use subtle design theme by default', () => {
    const state = useSettingsStore.getState();
    expect(state.designTheme).toBe('subtle');
  });

  it('should allow switching to bold design theme', () => {
    const { setDesignTheme } = useSettingsStore.getState();
    setDesignTheme('bold');

    const state = useSettingsStore.getState();
    expect(state.designTheme).toBe('bold');
  });

  it('should allow switching to hybrid design theme', () => {
    const { setDesignTheme } = useSettingsStore.getState();
    setDesignTheme('hybrid');

    const state = useSettingsStore.getState();
    expect(state.designTheme).toBe('hybrid');
  });

  it('should persist design theme change across components', async () => {
    const { setDesignTheme } = useSettingsStore.getState();

    // Render GenreSelector first
    const { unmount: unmountGenre } = render(
      <GenreSelector themes={mockThemes} />
    );

    // Switch to bold theme
    setDesignTheme('bold');

    await waitFor(() => {
      const state = useSettingsStore.getState();
      expect(state.designTheme).toBe('bold');
    });

    unmountGenre();

    // Render AlbumGallery - it should have bold theme available from store
    render(<AlbumGallery themes={mockThemes} />);

    const state = useSettingsStore.getState();
    expect(state.designTheme).toBe('bold');
  });

  it('should have all three design theme options available', () => {
    const designOptions = ['subtle', 'bold', 'hybrid'];

    designOptions.forEach((option) => {
      const { setDesignTheme } = useSettingsStore.getState();
      setDesignTheme(option);

      const state = useSettingsStore.getState();
      expect(state.designTheme).toBe(option);
    });
  });
});
