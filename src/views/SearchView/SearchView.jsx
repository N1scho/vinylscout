import React, { useState } from 'react';
import { Plus, Minus, Music, Info } from 'lucide-react';
import { designSystem } from '../../designsystem';
import SearchBar from '../../components/SearchBar';
import AdvancedSearch from '../../components/AdvancedSearch';
import VinylCard from '../../components/VinylCard';
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

/**
 * SearchView Component
 *
 * Main search interface for finding vinyl records on Discogs
 *
 * Features:
 * - Basic search with query input
 * - Advanced multi-field search
 * - Results display with VinylCard components
 * - Pagination for large result sets
 * - Price fetching and refresh
 * - Add/remove from collection
 *
 * @component
 */
export default function SearchView({
  // Search State
  searchQuery,
  onSearchQueryChange,
  advancedSearch,
  onAdvancedSearchChange,
  searchResults,
  isLoading,

  // Pagination State
  currentPage,
  totalPages,

  // Price State
  resultPrices,
  refreshingPrices,
  priceChanges,

  // Collection State
  collection,

  // Actions
  onSearch,
  onAdvancedSearch,
  onPageChange,
  onRefreshPrice,
  onAddToCollection,
  onRemoveFromCollection,
  onViewDetails,

  // Theme
  themes
}) {
  // Local UI State
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  // Helper to check if vinyl is in collection
  const isInCollection = (vinylId) => {
    return collection.some(v => v.id === vinylId);
  };

  // Handle basic search
  const handleBasicSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery, 1);
    }
  };

  // Handle advanced search
  const handleAdvancedSearch = () => {
    onAdvancedSearch();
  };

  // Handle page navigation
  const handlePageChange = (page) => {
    onPageChange(page);
  };

  // Check if there's any search performed
  const hasSearched = searchQuery || Object.values(advancedSearch).some(v => v);

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
      {/* Basic Search Bar */}
      <SearchBar
        query={searchQuery}
        onChange={onSearchQueryChange}
        onSearch={handleBasicSearch}
        isLoading={isLoading}
        placeholder="Search for vinyl..."
        themes={themes}
      />

      {/* Advanced Search Toggle */}
      <button
        onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: designSystem.spacing.xs,
          padding: `${designSystem.spacing.sm} ${designSystem.spacing.md}`,
          backgroundColor: 'transparent',
          color: themes.text,
          border: `1px solid ${themes.border}`,
          borderRadius: designSystem.borderRadius.sm,
          cursor: 'pointer',
          fontSize: designSystem.typography.sizes.sm,
          fontWeight: designSystem.typography.weights.medium,
          marginBottom: designSystem.spacing.md,
          transition: designSystem.transitions.fast
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = themes.hoverOverlay || 'rgba(0, 0, 0, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {showAdvancedSearch ? <Minus size={16} /> : <Plus size={16} />}
        Advanced Search
      </button>

      {/* Advanced Search Form */}
      {showAdvancedSearch && (
        <AdvancedSearch
          values={advancedSearch}
          onChange={onAdvancedSearchChange}
          onSearch={handleAdvancedSearch}
          isLoading={isLoading}
          themes={themes}
        />
      )}

      {/* Loading State */}
      {isLoading && (
        <LoadingSpinner
          size="xl"
          message="Searching Discogs..."
          fullScreen={false}
          themes={themes}
        />
      )}

      {/* No Results State */}
      {!isLoading && searchResults.length === 0 && hasSearched && (
        <EmptyState
          type="search"
          themes={themes}
        />
      )}

      {/* Initial Empty State */}
      {!isLoading && searchResults.length === 0 && !hasSearched && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Music
            size={64}
            color={themes.primary}
            style={{ opacity: 0.4, marginBottom: designSystem.spacing.lg }}
          />
          <h3
            style={{
              color: themes.text,
              fontSize: designSystem.typography.sizes.xl,
              fontWeight: designSystem.typography.weights.semibold,
              margin: `0 0 ${designSystem.spacing.sm} 0`
            }}
          >
            Start Your Search
          </h3>
          <p
            style={{
              color: themes.textSecondary,
              fontSize: designSystem.typography.sizes.base,
              margin: `0 0 ${designSystem.spacing.lg} 0`,
              maxWidth: '400px',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: '1.6'
            }}
          >
            Search the Discogs database for vinyl records to add to your collection. Use the
            search bar above or try Advanced Search for more specific results.
          </p>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: designSystem.spacing.sm,
              alignItems: 'center',
              color: themes.textSecondary,
              fontSize: designSystem.typography.sizes.sm
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: designSystem.spacing.xs }}>
              <Info size={16} />
              <span>Try searching for an artist, album, or record label</span>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {!isLoading && searchResults.length > 0 && (
        <>
          {/* Results Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: designSystem.spacing.md,
              marginBottom: designSystem.spacing.lg
            }}
          >
            {searchResults.map((result) => {
              const inCollection = isInCollection(result.id);
              const price = resultPrices[result.id];
              const priceChange = priceChanges[result.id];
              const isRefreshing = refreshingPrices[result.id];

              return (
                <VinylCard
                  key={result.id}
                  vinyl={result}
                  price={price}
                  isRefreshing={isRefreshing}
                  priceChange={priceChange}
                  inCollection={inCollection}
                  onRefreshPrice={() => onRefreshPrice(result.id, false)}
                  onAddToCollection={() => onAddToCollection(result)}
                  onRemove={() => onRemoveFromCollection(result.id)}
                  onViewDetails={() => onViewDetails(result)}
                  themes={themes}
                />
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              themes={themes}
            />
          )}
        </>
      )}
    </div>
  );
}
