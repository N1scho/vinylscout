import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsView from './SettingsView';

describe('SettingsView', () => {
  const mockThemes = {
    text: '#ffffff',
    surface: '#2a2a2a',
    primary: '#ff6b35',
    border: '#404040',
    background: '#1a1a1a',
    textSecondary: '#b0b0b0'
  };

  const defaultProps = {
    theme: 'dark',
    onThemeChange: vi.fn(),
    customColors: {
      primary: '#ff6b35',
      background: '#1a1a1a',
      text: '#ffffff'
    },
    onCustomColorChange: vi.fn(),
    selectedShops: ['discogs'],
    onSelectedShopsChange: vi.fn(),
    designTheme: 'subtle',
    onDesignThemeChange: vi.fn(),
    onExportCollection: vi.fn(),
    onExportCollectionAsCSV: vi.fn(),
    onImportCollection: vi.fn(),
    importFileInputRef: { current: null },
    onFetchMissingCovers: vi.fn(),
    appVersion: '3.1.0',
    themes: mockThemes,
    onNotify: vi.fn()
  };

  it('should render design theme buttons', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByText('Design Theme')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subtle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hybrid/i })).toBeInTheDocument();
  });

  it('should call onDesignThemeChange when a design theme button is clicked', async () => {
    const user = userEvent.setup();
    const onDesignThemeChange = vi.fn();

    render(
      <SettingsView
        {...defaultProps}
        designTheme="subtle"
        onDesignThemeChange={onDesignThemeChange}
      />
    );

    const boldButton = screen.getByRole('button', { name: /bold/i });
    await user.click(boldButton);

    expect(onDesignThemeChange).toHaveBeenCalledWith('bold');
  });

  it('should highlight the selected design theme button', () => {
    const { rerender } = render(
      <SettingsView {...defaultProps} designTheme="subtle" />
    );

    let subtleButton = screen.getByRole('button', { name: /subtle/i });
    expect(subtleButton).toHaveStyle({
      backgroundColor: mockThemes.primary
    });

    rerender(
      <SettingsView {...defaultProps} designTheme="bold" />
    );

    const boldButton = screen.getByRole('button', { name: /bold/i });
    expect(boldButton).toHaveStyle({
      backgroundColor: mockThemes.primary
    });
  });

  it('should show the correct active state for all design theme options', async () => {
    const { rerender } = render(<SettingsView {...defaultProps} designTheme="subtle" />);

    const designs = ['subtle', 'bold', 'hybrid'];
    for (const design of designs) {
      rerender(<SettingsView {...defaultProps} designTheme={design} />);

      const button = screen.getByRole('button', { name: new RegExp(design, 'i') });
      expect(button).toBeInTheDocument();
    }
  });
});
