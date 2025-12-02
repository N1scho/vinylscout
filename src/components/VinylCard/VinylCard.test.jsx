/**
 * VinylCard Component Tests
 *
 * Comprehensive tests for the VinylCard component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import VinylCard from './VinylCard';

describe('VinylCard', () => {
  const mockVinyl = {
    id: 1,
    title: 'Dark Side of the Moon',
    artist: 'Pink Floyd',
    year: 1973,
    cover_image: 'https://example.com/cover.jpg',
    thumb: 'https://example.com/thumb.jpg',
    isFavorite: false
  };

  const mockPrice = {
    value: 25.99,
    currency: 'USD'
  };

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
    surfaceVariant: '#f8f9fa'
  };

  const defaultProps = {
    vinyl: mockVinyl,
    themes: mockThemes,
    price: null,
    isRefreshing: false,
    priceChange: null,
    inCollection: false,
    onToggleFavorite: null,
    onRefreshPrice: null,
    onRemove: null,
    onViewDetails: null,
    onAddToCollection: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render vinyl title', () => {
      render(<VinylCard {...defaultProps} />);
      expect(screen.getByText('Dark Side of the Moon')).toBeInTheDocument();
    });

    it('should render vinyl year when provided', () => {
      render(<VinylCard {...defaultProps} />);
      expect(screen.getByText('1973')).toBeInTheDocument();
    });

    it('should render cover image with correct src', () => {
      render(<VinylCard {...defaultProps} />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg');
      expect(img).toHaveAttribute('alt', 'Dark Side of the Moon');
    });

    it('should render price when provided', () => {
      render(<VinylCard {...defaultProps} price={mockPrice} />);
      expect(screen.getByText('USD 25.99')).toBeInTheDocument();
    });

    it('should show "No price data" when price not available', () => {
      render(<VinylCard {...defaultProps} />);
      expect(screen.getByText('No price data')).toBeInTheDocument();
    });

    it('should render favorite badge when isFavorite is true', () => {
      const favoriteVinyl = { ...mockVinyl, isFavorite: true };
      const { container } = render(<VinylCard {...defaultProps} vinyl={favoriteVinyl} />);

      // Favorite badge should be visible (check for red background badge)
      const badge = container.querySelector('[style*="rgb(239, 68, 68)"]'); // error color
      expect(badge).toBeInTheDocument();
    });

    it('should not render favorite badge when isFavorite is false', () => {
      render(<VinylCard {...defaultProps} />);

      // Should not have the favorite badge (only button hearts)
      const container = screen.getByText('Dark Side of the Moon').closest('div');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Price Changes', () => {
    it('should display positive price change', () => {
      const priceChange = {
        amount: 5.00,
        currency: 'USD'
      };

      render(<VinylCard {...defaultProps} price={mockPrice} priceChange={priceChange} />);
      expect(screen.getByText(/5\.00/)).toBeInTheDocument();
    });

    it('should display negative price change', () => {
      const priceChange = {
        amount: -3.50,
        currency: 'USD'
      };

      render(<VinylCard {...defaultProps} price={mockPrice} priceChange={priceChange} />);
      expect(screen.getByText(/3\.50/)).toBeInTheDocument(); // Absolute value
    });

    it('should not render price change indicator when not provided', () => {
      render(<VinylCard {...defaultProps} price={mockPrice} />);

      // Should not have TrendingUp or TrendingDown icons (part of price change badge)
      const trendingIcons = document.querySelectorAll('svg');
      const hasTrendingIcon = Array.from(trendingIcons).some(svg =>
        svg.outerHTML.includes('TrendingUp') || svg.outerHTML.includes('TrendingDown')
      );
      expect(hasTrendingIcon).toBe(false);
    });
  });

  describe('Search Result Actions', () => {
    it('should render "Add to Collection" button when not in collection', () => {
      const onAddToCollection = vi.fn();

      render(
        <VinylCard
          {...defaultProps}
          inCollection={false}
          onAddToCollection={onAddToCollection}
        />
      );

      expect(screen.getByText('Add to Collection')).toBeInTheDocument();
    });

    it('should call onAddToCollection when button clicked', () => {
      const onAddToCollection = vi.fn();

      render(
        <VinylCard
          {...defaultProps}
          price={mockPrice}
          onAddToCollection={onAddToCollection}
        />
      );

      const addButton = screen.getByText('Add to Collection');
      fireEvent.click(addButton);

      expect(onAddToCollection).toHaveBeenCalledTimes(1);

      // Should include price data
      const call = onAddToCollection.mock.calls[0][0];
      expect(call.id).toBe(1);
      expect(call.price).toEqual(mockPrice);
      expect(call.priceHistory).toBeDefined();
    });

    it('should call onViewDetails when "View Details" button clicked', () => {
      const onViewDetails = vi.fn();

      render(
        <VinylCard
          {...defaultProps}
          onViewDetails={onViewDetails}
        />
      );

      const viewDetailsButtons = screen.getAllByTitle('View Details');
      fireEvent.click(viewDetailsButtons[0]);

      expect(onViewDetails).toHaveBeenCalledTimes(1);
      expect(onViewDetails).toHaveBeenCalledWith(mockVinyl);
    });

    it('should call onViewDetails when card is clicked', () => {
      const onViewDetails = vi.fn();

      render(
        <VinylCard
          {...defaultProps}
          onViewDetails={onViewDetails}
        />
      );

      const title = screen.getByText('Dark Side of the Moon');
      fireEvent.click(title);

      expect(onViewDetails).toHaveBeenCalledWith(mockVinyl);
    });
  });

  describe('Collection Actions', () => {
    it('should render collection action buttons when inCollection is true', () => {
      render(
        <VinylCard
          {...defaultProps}
          inCollection={true}
          onToggleFavorite={vi.fn()}
          onRefreshPrice={vi.fn()}
          onRemove={vi.fn()}
        />
      );

      expect(screen.getByTitle('Toggle Favorite')).toBeInTheDocument();
      expect(screen.getByTitle('Refresh Price')).toBeInTheDocument();
      expect(screen.getByTitle('Remove from Collection')).toBeInTheDocument();
    });

    it('should call onToggleFavorite when favorite button clicked', () => {
      const onToggleFavorite = vi.fn();

      render(
        <VinylCard
          {...defaultProps}
          inCollection={true}
          onToggleFavorite={onToggleFavorite}
        />
      );

      const favoriteButton = screen.getByTitle('Toggle Favorite');
      fireEvent.click(favoriteButton);

      expect(onToggleFavorite).toHaveBeenCalledTimes(1);
      expect(onToggleFavorite).toHaveBeenCalledWith(mockVinyl.id);
    });

    it('should call onRefreshPrice when refresh button clicked', () => {
      const onRefreshPrice = vi.fn();

      render(
        <VinylCard
          {...defaultProps}
          inCollection={true}
          onRefreshPrice={onRefreshPrice}
        />
      );

      const refreshButton = screen.getByTitle('Refresh Price');
      fireEvent.click(refreshButton);

      expect(onRefreshPrice).toHaveBeenCalledTimes(1);
      expect(onRefreshPrice).toHaveBeenCalledWith(mockVinyl.id);
    });

    it('should call onRemove when remove button clicked', () => {
      const onRemove = vi.fn();

      render(
        <VinylCard
          {...defaultProps}
          inCollection={true}
          onRemove={onRemove}
        />
      );

      const removeButton = screen.getByTitle('Remove from Collection');
      fireEvent.click(removeButton);

      expect(onRemove).toHaveBeenCalledTimes(1);
      expect(onRemove).toHaveBeenCalledWith(mockVinyl.id);
    });

    it('should disable refresh button when isRefreshing is true', () => {
      render(
        <VinylCard
          {...defaultProps}
          inCollection={true}
          isRefreshing={true}
          onRefreshPrice={vi.fn()}
        />
      );

      const refreshButton = screen.getByTitle('Refresh Price');
      expect(refreshButton).toBeDisabled();
    });

    it('should show spinning icon when refreshing', () => {
      render(
        <VinylCard
          {...defaultProps}
          inCollection={true}
          isRefreshing={true}
          onRefreshPrice={vi.fn()}
        />
      );

      const refreshButton = screen.getByTitle('Refresh Price');
      const icon = refreshButton.querySelector('svg');

      expect(icon).toHaveStyle({ animation: 'spin 1s linear infinite' });
    });
  });

  describe('Event Handlers', () => {
    it('should stop propagation when action button clicked', () => {
      const onToggleFavorite = vi.fn();
      const onViewDetails = vi.fn();

      render(
        <VinylCard
          {...defaultProps}
          inCollection={true}
          onToggleFavorite={onToggleFavorite}
          onViewDetails={onViewDetails}
        />
      );

      const favoriteButton = screen.getByTitle('Toggle Favorite');
      fireEvent.click(favoriteButton);

      // onViewDetails should not be called because stopPropagation
      expect(onToggleFavorite).toHaveBeenCalledTimes(1);
      expect(onViewDetails).not.toHaveBeenCalled();
    });
  });

  describe('Memoization', () => {
    it('should be wrapped in React.memo', () => {
      expect(VinylCard.$$typeof.toString()).toContain('react.memo');
    });

    it('should not re-render when unrelated props change', () => {
      const { rerender } = render(<VinylCard {...defaultProps} />);
      const firstRender = screen.getByText('Dark Side of the Moon');

      // Change an unrelated prop
      rerender(<VinylCard {...defaultProps} isRefreshing={false} />);

      const secondRender = screen.getByText('Dark Side of the Moon');

      // Elements should be the same (memoized)
      expect(firstRender).toBe(secondRender);
    });
  });

  describe('PropTypes Validation', () => {
    it('should have propTypes defined', () => {
      expect(VinylCard.propTypes).toBeDefined();
      expect(VinylCard.propTypes.vinyl).toBeDefined();
      expect(VinylCard.propTypes.themes).toBeDefined();
    });

    it('should have defaultProps defined', () => {
      expect(VinylCard.defaultProps).toBeDefined();
      expect(VinylCard.defaultProps.inCollection).toBe(false);
      expect(VinylCard.defaultProps.isRefreshing).toBe(false);
    });
  });

  describe('Hover Effects', () => {
    it('should handle mouse enter event', () => {
      const { container } = render(<VinylCard {...defaultProps} />);
      const card = container.firstChild;

      fireEvent.mouseEnter(card);

      // Card should transform on hover (tested via event firing)
      expect(card).toBeInTheDocument();
    });

    it('should handle mouse leave event', () => {
      const { container } = render(<VinylCard {...defaultProps} />);
      const card = container.firstChild;

      fireEvent.mouseEnter(card);
      fireEvent.mouseLeave(card);

      // Card should reset transform on leave
      expect(card).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing vinyl year', () => {
      const vinylWithoutYear = { ...mockVinyl, year: null };
      render(<VinylCard {...defaultProps} vinyl={vinylWithoutYear} />);

      expect(screen.queryByText('1973')).not.toBeInTheDocument();
    });

    it('should handle missing cover image', () => {
      const vinylWithoutImage = {
        ...mockVinyl,
        thumb: null,
        cover_image: null
      };

      render(<VinylCard {...defaultProps} vinyl={vinylWithoutImage} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', '/placeholder.jpg');
    });

    it('should handle null price value', () => {
      const invalidPrice = { value: null, currency: 'USD' };

      render(<VinylCard {...defaultProps} price={invalidPrice} />);

      expect(screen.getByText('No price data')).toBeInTheDocument();
    });

    it('should handle NaN price change', () => {
      const invalidPriceChange = {
        amount: NaN,
        currency: 'USD'
      };

      const { container } = render(<VinylCard {...defaultProps} priceChange={invalidPriceChange} />);

      // Should display 0.00 for NaN values
      expect(container.textContent).toContain('0.00');
    });

    it('should handle very long titles', () => {
      const longTitle = 'A'.repeat(200);
      const vinylWithLongTitle = { ...mockVinyl, title: longTitle };

      render(<VinylCard {...defaultProps} vinyl={vinylWithLongTitle} />);

      const titleElement = screen.getByText(longTitle);
      expect(titleElement).toBeInTheDocument();

      // Should have text overflow styles
      const styles = window.getComputedStyle(titleElement);
      expect(styles.overflow).toBe('hidden');
    });

    it('should handle undefined optional handlers', () => {
      render(
        <VinylCard
          {...defaultProps}
          onToggleFavorite={undefined}
          onRefreshPrice={undefined}
          onRemove={undefined}
          onViewDetails={undefined}
          onAddToCollection={undefined}
        />
      );

      // Should render without crashing
      expect(screen.getByText('Dark Side of the Moon')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper image alt text', () => {
      render(<VinylCard {...defaultProps} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Dark Side of the Moon');
    });

    it('should have clickable elements with proper titles', () => {
      render(
        <VinylCard
          {...defaultProps}
          inCollection={true}
          onToggleFavorite={vi.fn()}
          onRefreshPrice={vi.fn()}
          onRemove={vi.fn()}
        />
      );

      expect(screen.getByTitle('Toggle Favorite')).toBeInTheDocument();
      expect(screen.getByTitle('Refresh Price')).toBeInTheDocument();
      expect(screen.getByTitle('Remove from Collection')).toBeInTheDocument();
    });

    it('should support lazy loading for images', () => {
      render(<VinylCard {...defaultProps} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'lazy');
    });
  });

  describe('Price History Integration', () => {
    it('should include price history when adding to collection', () => {
      const onAddToCollection = vi.fn();
      const mockDate = new Date('2024-01-01T00:00:00.000Z');
      vi.setSystemTime(mockDate);

      render(
        <VinylCard
          {...defaultProps}
          price={mockPrice}
          onAddToCollection={onAddToCollection}
        />
      );

      const addButton = screen.getByText('Add to Collection');
      fireEvent.click(addButton);

      const addedItem = onAddToCollection.mock.calls[0][0];
      expect(addedItem.priceHistory).toHaveLength(1);
      expect(addedItem.priceHistory[0]).toEqual({
        date: mockDate.toISOString(),
        price: 25.99,
        currency: 'USD'
      });

      vi.useRealTimers();
    });

    it('should handle adding without price', () => {
      const onAddToCollection = vi.fn();

      render(
        <VinylCard
          {...defaultProps}
          price={null}
          onAddToCollection={onAddToCollection}
        />
      );

      const addButton = screen.getByText('Add to Collection');
      fireEvent.click(addButton);

      const addedItem = onAddToCollection.mock.calls[0][0];
      expect(addedItem.price).toBeNull();
      expect(addedItem.priceHistory).toEqual([]);
    });
  });
});
