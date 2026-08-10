import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubtabBar from './SubtabBar';
import { useSettingsStore } from '../../stores/settingsStore';

// Mock the settings store
vi.mock('../../stores/settingsStore', () => ({
  useSettingsStore: vi.fn()
}));

describe('SubtabBar', () => {
  const mockThemes = {
    primary: '#007bff',
    border: '#ddd',
    text: '#333',
    buttonText: '#fff',
    background: '#fff'
  };

  beforeEach(() => {
    useSettingsStore.mockReturnValue('subtle');
  });

  it('renders both tabs', () => {
    render(
      <SubtabBar currentTab="filter" onTabChange={() => {}} themes={mockThemes} />
    );
    expect(screen.getByText('filter')).toBeInTheDocument();
    expect(screen.getByText('discover')).toBeInTheDocument();
  });

  it('highlights the current tab', () => {
    render(
      <SubtabBar currentTab="filter" onTabChange={() => {}} themes={mockThemes} />
    );
    const filterBtn = screen.getByText('filter');
    expect(filterBtn).toHaveStyle(`backgroundColor: ${mockThemes.primary}`);
  });

  it('calls onTabChange when a tab is clicked', async () => {
    const mockOnChange = vi.fn();
    render(
      <SubtabBar currentTab="filter" onTabChange={mockOnChange} themes={mockThemes} />
    );
    await userEvent.click(screen.getByText('discover'));
    expect(mockOnChange).toHaveBeenCalledWith('discover');
  });
});
