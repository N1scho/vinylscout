/**
 * SearchView Component Tests
 *
 * Comprehensive tests for the SearchView component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import SearchView from './SearchView';

// Mock child components
vi.mock('../../components/SearchBar', () => ({
  default: ({ query, onChange, onSearch, placeholder }) => (
    <div data-testid="search-bar">
      <input
        data-testid="search-input"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <button data-testid="search-button" onClick={onSearch}>
        Search
      </button>
    </div>
  )
}));

vi.mock('../../components/AdvancedSearch', () => ({
  default: ({ values, onChange, onSearch }) => (
    <div data-testid="advanced-search">
      <input
        data-testid="artist-input"
        value={values.artist || ''}
        onChange={(e) => onChange({ ...values, artist: e.target.value })}
        placeholder="Artist"
      />
      <button data-testid="advanced-search-button" onClick={onSearch}>
        Advanced Search
      </button>
    </div>
  )
}));

vi.mock('../../components/VinylCard', () => ({
  default: ({ vinyl, onAddToCollection, onRemove, inCollection }) => (
    <div data-testid={`vinyl-card-${vinyl.id}`}>
      <span>{vinyl.title}</span>
      {inCollection ? (
        <button onClick={onRemove}>Remove</button>
      ) : (
        <button onClick={onAddToCollection}>Add</button>
      )}
    </div>
  )
}));

vi.mock('../../components/Pagination', () => ({
  default: ({ currentPage, totalPages, onPageChange }) => (
    <div data-testid="pagination">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        Prev
      </button>
      <span>Page {currentPage} of {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        Next
      </button>
    </div>
  )
}));

vi.mock('../../components/LoadingSpinner', () => ({
  default: ({ message }) => <div data-testid="loading-spinner">{message}</div>
}));

vi.mock('../../components/EmptyState', () => ({
  default: ({ type }) => <div data-testid="empty-state">{type} empty</div>
}));

describe('SearchView', () => {
  const mockThemes = {
    surface: '#ffffff',
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    primary: '#2563eb',
    error: '#ef4444',
    success: '#10b981',
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    surfaceVariant: '#f8f9fa',
    background: '#f5f5f5',
    hoverOverlay: 'rgba(0, 0, 0, 0.05)'
  };

  const mockSearchResults = [
    {
      id: 1,
      title: 'Dark Side of the Moon',
      artist: 'Pink Floyd',
      year: 1973,
      cover_image: 'https://example.com/cover1.jpg'
    },
    {
      id: 2,
      title: 'Abbey Road',
      artist: 'The Beatles',
      year: 1969,
      cover_image: 'https://example.com/cover2.jpg'
    }
  ];

  const defaultProps = {
    // Search State
    searchQuery: '',
    onSearchQueryChange: vi.fn(),
    advancedSearch: {
      artist: '',
      title: '',
      label: '',
      year: '',
      format: '',
      genre: ''
    },
    onAdvancedSearchChange: vi.fn(),
    searchResults: [],
    isLoading: false,

    // Pagination State
    currentPage: 1,
    totalPages: 1,

    // Price State
    resultPrices: {},
    refreshingPrices: {},
    priceChanges: {},

    // Collection State
    collection: [],

    // Actions
    onSearch: vi.fn(),
    onAdvancedSearch: vi.fn(),
    onPageChange: vi.fn(),
    onRefreshPrice: vi.fn(),
    onAddToCollection: vi.fn(),
    onRemoveFromCollection: vi.fn(),
    onViewDetails: vi.fn(),

    // Theme
    themes: mockThemes
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render search bar', () => {
      render(<SearchView {...defaultProps} />);
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search for vinyl...')).toBeInTheDocument();
    });

    it('should render advanced search toggle button', () => {
      render(<SearchView {...defaultProps} />);
      expect(screen.getByText('Advanced Search')).toBeInTheDocument();
    });

    it('should show initial empty state when no search performed', () => {
      render(<SearchView {...defaultProps} />);
      expect(screen.getByText('Start Your Search')).toBeInTheDocument();
      expect(screen.getByText(/Search the Discogs database/)).toBeInTheDocument();
    });

    it('should not show advanced search form by default', () => {
      render(<SearchView {...defaultProps} />);
      expect(screen.queryByTestId('advanced-search')).not.toBeInTheDocument();
    });
  });

  describe('Basic Search', () => {
    it('should update search query when typing', () => {
      const onSearchQueryChange = vi.fn();
      render(<SearchView {...defaultProps} onSearchQueryChange={onSearchQueryChange} />);

      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'Pink Floyd' } });

      expect(onSearchQueryChange).toHaveBeenCalledWith('Pink Floyd');
    });

    it('should call onSearch when search button clicked', () => {
      const onSearch = vi.fn();
      render(
        <SearchView
          {...defaultProps}
          searchQuery="Pink Floyd"
          onSearch={onSearch}
        />
      );

      const button = screen.getByTestId('search-button');
      fireEvent.click(button);

      expect(onSearch).toHaveBeenCalledWith('Pink Floyd', 1);
    });

    it('should not search with empty query', () => {
      const onSearch = vi.fn();
      render(<SearchView {...defaultProps} searchQuery="" onSearch={onSearch} />);

      const button = screen.getByTestId('search-button');
      fireEvent.click(button);

      expect(onSearch).not.toHaveBeenCalled();
    });

    it('should not search with whitespace-only query', () => {
      const onSearch = vi.fn();
      render(<SearchView {...defaultProps} searchQuery="   " onSearch={onSearch} />);

      const button = screen.getByTestId('search-button');
      fireEvent.click(button);

      expect(onSearch).not.toHaveBeenCalled();
    });
  });

  describe('Advanced Search', () => {
    it('should show advanced search form when toggle clicked', () => {
      render(<SearchView {...defaultProps} />);

      const toggleButton = screen.getByText('Advanced Search');
      fireEvent.click(toggleButton);

      expect(screen.getByTestId('advanced-search')).toBeInTheDocument();
    });

    it('should hide advanced search form when toggle clicked again', () => {
      render(<SearchView {...defaultProps} />);

      const toggleButton = screen.getByText('Advanced Search');

      // Show
      fireEvent.click(toggleButton);
      expect(screen.getByTestId('advanced-search')).toBeInTheDocument();

      // Hide
      fireEvent.click(toggleButton);
      expect(screen.queryByTestId('advanced-search')).not.toBeInTheDocument();
    });

    it('should call onAdvancedSearch when advanced search button clicked', () => {
      const onAdvancedSearch = vi.fn();
      render(<SearchView {...defaultProps} onAdvancedSearch={onAdvancedSearch} />);

      // Open advanced search
      fireEvent.click(screen.getByText('Advanced Search'));

      // Click advanced search button
      const searchButton = screen.getByTestId('advanced-search-button');
      fireEvent.click(searchButton);

      expect(onAdvancedSearch).toHaveBeenCalledTimes(1);
    });

    it('should update advanced search values', () => {
      const onAdvancedSearchChange = vi.fn();
      render(<SearchView {...defaultProps} onAdvancedSearchChange={onAdvancedSearchChange} />);

      // Open advanced search
      fireEvent.click(screen.getByText('Advanced Search'));

      // Type in artist field
      const artistInput = screen.getByTestId('artist-input');
      fireEvent.change(artistInput, { target: { value: 'Pink Floyd' } });

      expect(onAdvancedSearchChange).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(<SearchView {...defaultProps} isLoading={true} />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Searching Discogs...')).toBeInTheDocument();
    });

    it('should not show loading spinner when isLoading is false', () => {
      render(<SearchView {...defaultProps} isLoading={false} />);
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });

    it('should hide results during loading', () => {
      render(
        <SearchView
          {...defaultProps}
          isLoading={true}
          searchResults={mockSearchResults}
        />
      );

      // Should not show results when loading
      expect(screen.queryByTestId('vinyl-card-1')).not.toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show initial empty state when no search performed', () => {
      render(<SearchView {...defaultProps} />);
      expect(screen.getByText('Start Your Search')).toBeInTheDocument();
    });

    it('should show no results state after search with no results', () => {
      render(
        <SearchView
          {...defaultProps}
          searchQuery="NonexistentArtist"
          searchResults={[]}
        />
      );

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('search empty')).toBeInTheDocument();
    });

    it('should show no results state after advanced search with no results', () => {
      render(
        <SearchView
          {...defaultProps}
          advancedSearch={{ artist: 'NonexistentArtist', title: '', label: '', year: '', format: '', genre: '' }}
          searchResults={[]}
        />
      );

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  describe('Search Results Display', () => {
    it('should render search results', () => {
      render(
        <SearchView
          {...defaultProps}
          searchResults={mockSearchResults}
        />
      );

      expect(screen.getByTestId('vinyl-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('vinyl-card-2')).toBeInTheDocument();
      expect(screen.getByText('Dark Side of the Moon')).toBeInTheDocument();
      expect(screen.getByText('Abbey Road')).toBeInTheDocument();
    });

    it('should not show initial empty state when results exist', () => {
      render(
        <SearchView
          {...defaultProps}
          searchResults={mockSearchResults}
        />
      );

      expect(screen.queryByText('Start Your Search')).not.toBeInTheDocument();
    });

    it('should render correct number of vinyl cards', () => {
      render(
        <SearchView
          {...defaultProps}
          searchResults={mockSearchResults}
        />
      );

      const cards = screen.getAllByTestId(/vinyl-card-/);
      expect(cards).toHaveLength(2);
    });
  });

  describe('Collection Integration', () => {
    it('should show "Add" button for items not in collection', () => {
      render(
        <SearchView
          {...defaultProps}
          searchResults={mockSearchResults}
          collection={[]}
        />
      );

      const card = screen.getByTestId('vinyl-card-1');
      expect(within(card).getByText('Add')).toBeInTheDocument();
    });

    it('should show "Remove" button for items in collection', () => {
      render(
        <SearchView
          {...defaultProps}
          searchResults={mockSearchResults}
          collection={[{ id: 1, title: 'Dark Side of the Moon' }]}
        />
      );

      const card = screen.getByTestId('vinyl-card-1');
      expect(within(card).getByText('Remove')).toBeInTheDocument();
    });

    it('should call onAddToCollection when Add button clicked', () => {
      const onAddToCollection = vi.fn();
      render(
        <SearchView
          {...defaultProps}
          searchResults={mockSearchResults}
          onAddToCollection={onAddToCollection}
        />
      );

      const card = screen.getByTestId('vinyl-card-1');
      const addButton = within(card).getByText('Add');
      fireEvent.click(addButton);

      expect(onAddToCollection).toHaveBeenCalledTimes(1);
      expect(onAddToCollection).toHaveBeenCalledWith(mockSearchResults[0]);
    });

    it('should call onRemoveFromCollection when Remove button clicked', () => {
      const onRemoveFromCollection = vi.fn();
      render(
        <SearchView
          {...defaultProps}
          searchResults={mockSearchResults}
          collection={[{ id: 1, title: 'Dark Side of the Moon' }]}
          onRemoveFromCollection={onRemoveFromCollection}
        />
      );

      const card = screen.getByTestId('vinyl-card-1');
      const removeButton = within(card).getByText('Remove');
      fireEvent.click(removeButton);

      expect(onRemoveFromCollection).toHaveBeenCalledTimes(1);
      expect(onRemoveFromCollection).toHaveBeenCalledWith(1);
    });
  });

  describe('Pagination', () => {
    it('should not show pagination with single page', () => {
      render(
        <SearchView
          {...defaultProps}
          searchResults={mockSearchResults}
          currentPage={1}
          totalPages={1}
        />
      );

      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });

    it('should show pagination with multiple pages', () => {
      render(
        <SearchView
          {...defaultProps}
          searchResults={mockSearchResults}
          currentPage={1}
          totalPages={5}
        />
      );

      expect(screen.getByTestId('pagination')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
    });

    it('should call onPageChange when page navigation clicked', () => {
      const onPageChange = vi.fn();
      render(
        <SearchView
          {...defaultProps}
          searchResults={mockSearchResults}
          currentPage={2}
          totalPages={5}
          onPageChange={onPageChange}
        />
      );

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('should not show pagination when no results', () => {
      render(
        <SearchView
          {...defaultProps}
          searchResults={[]}
          currentPage={1}
          totalPages={5}
        />
      );

      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });
  });

  describe('PropTypes and Memoization', () => {
    it('should have propTypes defined', () => {
      expect(SearchView.propTypes).toBeDefined();
      expect(SearchView.propTypes.searchQuery).toBeDefined();
      expect(SearchView.propTypes.themes).toBeDefined();
    });

    it('should be wrapped in React.memo', () => {
      expect(SearchView.$$typeof.toString()).toContain('react.memo');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty collection array', () => {
      render(
        <SearchView
          {...defaultProps}
          searchResults={mockSearchResults}
          collection={[]}
        />
      );

      expect(screen.getByTestId('vinyl-card-1')).toBeInTheDocument();
    });

    it('should handle empty search results', () => {
      render(
        <SearchView
          {...defaultProps}
          searchResults={[]}
        />
      );

      expect(screen.queryByTestId(/vinyl-card-/)).not.toBeInTheDocument();
    });

    it('should handle missing advanced search fields', () => {
      const onAdvancedSearchChange = vi.fn();
      render(
        <SearchView
          {...defaultProps}
          advancedSearch={{}}
          onAdvancedSearchChange={onAdvancedSearchChange}
        />
      );

      // Open advanced search
      fireEvent.click(screen.getByText('Advanced Search'));

      expect(screen.getByTestId('advanced-search')).toBeInTheDocument();
    });

    it('should handle undefined optional props gracefully', () => {
      render(
        <SearchView
          {...defaultProps}
          onAddToCollection={undefined}
          onRemoveFromCollection={undefined}
        />
      );

      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('should apply theme colors correctly', () => {
      const customThemes = {
        ...mockThemes,
        primary: '#ff0000',
        text: '#333333'
      };

      render(<SearchView {...defaultProps} themes={customThemes} />);
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle mouse events on advanced search toggle', () => {
      render(<SearchView {...defaultProps} />);

      const toggleButton = screen.getByText('Advanced Search');

      fireEvent.mouseEnter(toggleButton);
      fireEvent.mouseLeave(toggleButton);

      // Should not crash
      expect(toggleButton).toBeInTheDocument();
    });

    it('should maintain advanced search state across re-renders', () => {
      const { rerender } = render(<SearchView {...defaultProps} />);

      // Open advanced search
      fireEvent.click(screen.getByText('Advanced Search'));
      expect(screen.getByTestId('advanced-search')).toBeInTheDocument();

      // Re-render with different props
      rerender(<SearchView {...defaultProps} searchQuery="test" />);

      // Advanced search should still be open
      expect(screen.getByTestId('advanced-search')).toBeInTheDocument();
    });
  });
});
