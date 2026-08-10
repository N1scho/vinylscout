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

  it('meets the 50px minimum touch-target height on tab buttons', () => {
    render(
      <SubtabBar currentTab="filter" onTabChange={() => {}} themes={mockThemes} />
    );
    expect(screen.getByText('filter')).toHaveStyle('minHeight: 50px');
    expect(screen.getByText('discover')).toHaveStyle('minHeight: 50px');
  });

  it('renders without crashing for the bold design theme', () => {
    useSettingsStore.mockReturnValue('bold');
    render(
      <SubtabBar currentTab="filter" onTabChange={() => {}} themes={mockThemes} />
    );
    expect(screen.getByText('filter')).toBeInTheDocument();
    expect(screen.getByText('discover')).toBeInTheDocument();
  });

  it('renders without crashing for the hybrid design theme', () => {
    useSettingsStore.mockReturnValue('hybrid');
    render(
      <SubtabBar currentTab="filter" onTabChange={() => {}} themes={mockThemes} />
    );
    expect(screen.getByText('filter')).toBeInTheDocument();
    expect(screen.getByText('discover')).toBeInTheDocument();
  });

  it('renders using the light-theme glass branch for a full 6-digit white background', () => {
    const lightThemes = { ...mockThemes, background: '#ffffff' };
    render(
      <SubtabBar currentTab="filter" onTabChange={() => {}} themes={lightThemes} />
    );
    expect(screen.getByText('filter')).toBeInTheDocument();
    expect(screen.getByText('discover')).toBeInTheDocument();
  });

  it('renders using the dark-theme glass branch for a dark background', () => {
    const darkThemes = { ...mockThemes, background: '#1a1a1a' };
    render(
      <SubtabBar currentTab="filter" onTabChange={() => {}} themes={darkThemes} />
    );
    expect(screen.getByText('filter')).toBeInTheDocument();
    expect(screen.getByText('discover')).toBeInTheDocument();
  });
});
