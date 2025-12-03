import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { designSystem } from './designsystem';

// Code-split views for better performance
const SearchView = lazy(() => import('./views/SearchView'));
const CameraView = lazy(() => import('./views/CameraView'));
const CollectionView = lazy(() => import('./views/CollectionView'));
const StatsView = lazy(() => import('./views/StatsView'));
const SettingsView = lazy(() => import('./views/SettingsView'));

// Utilities
import { calculateCollectionStats } from './utils/statistics';
import { formatPrice, sortCollection, filterCollection, calculateCollectionValue } from './utils/collectionHelpers';
import { captureAndAnalyzeVinyl } from './utils/cameraHelpers';
import { validators } from './utils/validators';

// Services
import * as StorageService from './services/storageService';
import { migrateExistingTokens } from './services/secureStorage';

// Zustand Stores
import { useCollectionStore } from './stores/collectionStore';
import { useSearchStore } from './stores/searchStore';
import { useSettingsStore } from './stores/settingsStore';
import { useUIStore } from './stores/uiStore';
import { useShallow } from 'zustand/react/shallow';

// Custom Hooks (still needed for some functionality)
import { useCamera } from './hooks/useCamera';
import { useDiscogsSearch } from './hooks/useDiscogsSearch';

// Components
import EnhancedDetailModal from './components/DetailModal/EnhancedDetailModal';
import ValueHistoryModal from './components/ValueHistoryModal';
import VinylDetailsModal from './components/VinylDetailsModal';
import ConfirmDialog from './components/ConfirmDialog';
import Toast from './components/Toast';
import Header from './components/Header';
import Navigation from './components/Navigation';
import ViewErrorBoundary from './components/ViewErrorBoundary';

// App Version
const APP_VERSION = '2.12.1';

export default function App() {
  // SECURITY: Migrate existing plain tokens to encrypted storage (runs once)
  useEffect(() => {
    try {
      migrateExistingTokens();
    } catch (error) {
      console.error('Token migration failed:', error);
      // Non-blocking - app can still function
    }
  }, []); // Run only once on mount

  // Zustand Stores - Much cleaner than before!
  const collection = useCollectionStore();
  const search = useSearchStore();
  const settings = useSettingsStore();
  const ui = useUIStore();

  // Memoized selectors for computed values (fixes performance issue)
  const filteredAndSorted = useCollectionStore(
    useShallow((s) =>
      sortCollection(
        filterCollection(
          s.collection,
          s.collectionFilter,
          s.collectionSearch,
          s.activeGenreFilter,
          s.activeDecadeFilter,
          s.activeFormatFilter
        ),
        s.sortBy
      )
    )
  );

  const collectionValue = useCollectionStore(
    useShallow((s) => calculateCollectionValue(s.collection))
  );

  // Derived values
  const themes = settings.getThemes();
  const view = ui.currentView;

  // Hooks that still need local state
  const camera = useCamera(view === 'camera');
  const discogsApi = useDiscogsSearch(settings.discogsToken);

  // Price update state (still managed here for now)
  const [isUpdatingAllPrices, setIsUpdatingAllPrices] = useState(false);
  const updatePricesAbortControllerRef = useRef(null);

  // View Transition Handler - Now much simpler!
  const handleViewChange = (newView) => {
    if (newView === view) return;
    ui.setView(newView);
    window.history.pushState({ view: newView }, '', `#${newView}`);
  };

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event) => {
      event.preventDefault();
      ui.goBack();
    };

    window.addEventListener('popstate', handlePopState);
    window.history.replaceState({ view }, '', `#${view}`);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [ui, view]); // Fixed dependencies

  // Backup & Export Functions - Now use stores!
  const exportCollection = () => {
    try {
      StorageService.exportCollection(collection.collection);
      ui.showToast(`Exported ${collection.collection.length} records`, 'success');
    } catch (error) {
      console.error('Export failed:', error);
      ui.showToast('Failed to export collection', 'error');
    }
  };

  const handleImportCollection = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const imported = await StorageService.importCollection(file);
      collection.setCollection(imported);
      ui.showToast(`Imported ${imported.length} records`, 'success');
    } catch (error) {
      console.error('Import failed:', error);
      ui.showToast('Failed to import collection', 'error');
    }

    event.target.value = '';
  };

  // Load Google Fonts Inter & Add CSS Animations
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  // Settings now loaded by useSettings hook
  // Collection save now in hooks
  // Theme save now in hooks
  // Tokens save now in hooks
  // Camera lifecycle now in useCamera hook
  // Modal state and ESC handling now in useModals hook


  // Discogs API wrapper functions - Now with stores!
  const searchDiscogs = async (isAdvanced = false, queryOverride = null, page = 1) => {
    await discogsApi.performSearch({
      isAdvanced,
      query: queryOverride || search.searchQuery,
      advancedSearch: search.advancedSearch,
      page,
      perPage: 50,
      onSuccess: (data) => {
        const results = data.results || [];
        search.setSearchResults(results);
        search.setCurrentPage(data.pagination?.page || page);
        search.setTotalPages(data.pagination?.pages || 1);

        if (results.length > 0) {
          discogsApi.fetchAllPrices(results);
        }
      },
      onError: (error) => {
        ui.showToast(error, 'error');
        if (error.includes('token')) {
          handleViewChange('settings');
        }
      }
    });
  };

  const refreshPrice = async (itemId, isCollectionItem = false) => {
    try {
      // Get old price for comparison
      let oldPrice = null;
      if (discogsApi.resultPrices[itemId]) {
        oldPrice = discogsApi.resultPrices[itemId].value;
      } else if (isCollectionItem) {
        const item = collection.collection.find(i => i.id === itemId);
        if (item) {
          // Support both price structures for backward compatibility
          oldPrice = item.price?.value || item.lowestPrice || null;
        }
      }

      const priceData = await discogsApi.refreshPrice(itemId, oldPrice);

      // If collection item, update collection with price history
      if (isCollectionItem && priceData) {
        // Validate price data comprehensively
        if (!validators.isValidPriceData(priceData)) {
          console.error('Invalid price data received:', priceData);
          ui.showToast('Received invalid price data from Discogs', 'error');
          return;
        }

        const newCollection = collection.collection.map(item => {
          if (item.id === itemId) {
            // Add to price history
            const priceHistory = [...(item.priceHistory || [])];
            priceHistory.push({
              date: new Date().toISOString(),
              price: priceData.value,
              currency: priceData.currency
            });

            return {
              ...item,
              price: { value: priceData.value, currency: priceData.currency },
              lowestPrice: priceData.value, // Keep for backward compatibility
              priceHistory: priceHistory.slice(-30) // Keep last 30 entries
            };
          }
          return item;
        });
        collection.setCollection(newCollection);
      } else if (isCollectionItem && !priceData) {
        ui.showToast('No price data available for this item', 'error');
      }
    } catch (error) {
      console.error('Error refreshing price:', error);
      ui.showToast(error.message || 'Error refreshing price', 'error');
    }
  };

  // Camera capture and analyze function
  const captureAndAnalyze = async () => {
    if (!settings.anthropicToken) {
      ui.showToast('Please enter your Anthropic API key in Settings', 'error');
      return;
    }

    camera.setIsAnalyzing(true);
    try {
      const result = await captureAndAnalyzeVinyl(
        camera.videoRef,
        camera.canvasRef,
        settings.anthropicToken
      );

      if (result && result.searchTerms) {
        // Search for the vinyl
        search.setSearchQuery(result.searchTerms);
        await searchDiscogs(false, result.searchTerms, 1);
        handleViewChange('search');
      } else {
        ui.showToast('Could not identify vinyl. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Camera analysis failed:', error);
      ui.showToast(error.message || 'Failed to analyze vinyl', 'error');
    } finally {
      camera.setIsAnalyzing(false);
    }
  };

  // Update all prices in collection
  const updateAllPrices = async () => {
    if (collection.collection.length === 0) {
      ui.showToast('No items in collection to update', 'error');
      return;
    }

    // Cancel any existing update operation
    if (updatePricesAbortControllerRef.current) {
      updatePricesAbortControllerRef.current.abort();
    }

    // Create new AbortController for this operation
    const abortController = new AbortController();
    updatePricesAbortControllerRef.current = abortController;

    setIsUpdatingAllPrices(true);
    const itemsToUpdate = collection.collection.filter(item => item.id);
    let updated = 0;

    try {
      for (const item of itemsToUpdate) {
        // Check if operation was cancelled
        if (abortController.signal.aborted) {
          ui.showToast(`Price update cancelled. Updated ${updated} of ${itemsToUpdate.length} items`, 'info');
          break;
        }

        try {
          await refreshPrice(item.id, true);
          updated++;

          // Rate limit: Wait 1.1 seconds between requests (Discogs allows 60/min)
          // Use abortable delay
          await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(resolve, 1100);
            abortController.signal.addEventListener('abort', () => {
              clearTimeout(timeoutId);
              reject(new Error('Aborted'));
            });
          });
        } catch (error) {
          if (error.message === 'Aborted') break;
          console.error(`Failed to update price for ${item.id}:`, error);
        }
      }

      if (!abortController.signal.aborted) {
        ui.showToast(`Updated prices for ${updated} of ${itemsToUpdate.length} items`, 'success');
      }
    } finally {
      setIsUpdatingAllPrices(false);
      updatePricesAbortControllerRef.current = null;
    }
  };

  // Cancel price updates when component unmounts or view changes
  useEffect(() => {
    return () => {
      if (updatePricesAbortControllerRef.current) {
        updatePricesAbortControllerRef.current.abort();
      }
    };
  }, [view]); // Cancel when navigating away

// Collection Sorting & Filtering (V2.1)
  // Memoize expensive filtering and sorting operations





  const renderSearchView = () => (
    <SearchView
      searchQuery={search.searchQuery}
      onSearchQueryChange={search.setSearchQuery}
      advancedSearch={search.advancedSearch}
      onAdvancedSearchChange={search.setAdvancedSearch}
      searchResults={search.searchResults}
      isLoading={discogsApi.isLoading}
      currentPage={search.currentPage}
      totalPages={search.totalPages}
      resultPrices={discogsApi.resultPrices}
      refreshingPrices={discogsApi.refreshingPrices}
      priceChanges={discogsApi.priceChanges}
      collection={collection.collection}
      onSearch={(query, page) => searchDiscogs(false, query, page)}
      onAdvancedSearch={() => searchDiscogs(true, null, 1)}
      onPageChange={(page) => searchDiscogs(false, search.searchQuery, page)}
      onRefreshPrice={refreshPrice}
      onAddToCollection={collection.addToCollection}
      onRemoveFromCollection={collection.removeFromCollection}
      onViewDetails={ui.setSelectedResult}
      themes={themes}
    />
  );

  const renderCameraView = () => {
    const handleCapture = () => {
      if (!settings.anthropicToken) {
        ui.showToast('Please enter your Anthropic API key in Settings to use camera identification', 'error');
        return;
      }
      if (!camera.isCameraActive) {
        ui.showToast('Camera is not active. Please allow camera access.', 'error');
        return;
      }
      captureAndAnalyze();
    };

    return (
      <CameraView
        videoRef={camera.videoRef}
        canvasRef={camera.canvasRef}
        isAnalyzing={camera.isAnalyzing}
        cameraError={camera.cameraError}
        onCapture={handleCapture}
        themes={themes}
      />
    );
  };

  const renderCollectionView = () => {
    return (
      <CollectionView
        collection={collection.collection}
        filteredAndSorted={filteredAndSorted}
        collectionValue={collectionValue}
        collectionSearch={collection.collectionSearch}
        onCollectionSearchChange={collection.setCollectionSearch}
        collectionFilter={collection.collectionFilter}
        onCollectionFilterChange={collection.setCollectionFilter}
        activeGenreFilter={collection.activeGenreFilter}
        onActiveGenreFilterChange={collection.setActiveGenreFilter}
        activeDecadeFilter={collection.activeDecadeFilter}
        onActiveDecadeFilterChange={collection.setActiveDecadeFilter}
        activeFormatFilter={collection.activeFormatFilter}
        onActiveFormatFilterChange={collection.setActiveFormatFilter}
        collectionView={collection.collectionView}
        onCollectionViewChange={collection.setCollectionView}
        sortBy={collection.sortBy}
        onSortByChange={collection.setSortBy}
        isUpdatingAllPrices={isUpdatingAllPrices}
        refreshingPrices={discogsApi.refreshingPrices}
        priceChanges={discogsApi.priceChanges}
        onUpdateAllPrices={updateAllPrices}
        onToggleFavorite={collection.toggleFavorite}
        onRefreshPrice={refreshPrice}
        onRemove={collection.removeFromCollection}
        onViewDetails={ui.setSelectedVinyl}
        onNavigateToSearch={() => handleViewChange('search')}
        getPriceChange={collection.getPriceChange}
        themes={themes}
      />
    );
  };

  const renderStatsView = () => {
    const stats = calculateCollectionStats(collection.collection, collection.getPriceChange);

    const handleGenreClick = (genre) => {
      collection.setActiveGenreFilter(genre);
      collection.setActiveDecadeFilter(null);
      collection.setActiveFormatFilter(null);
      handleViewChange('collection');
    };

    const handleDecadeClick = (decade) => {
      collection.setActiveDecadeFilter(decade);
      collection.setActiveGenreFilter(null);
      collection.setActiveFormatFilter(null);
      handleViewChange('collection');
    };

    const handleFormatClick = (format) => {
      collection.setActiveFormatFilter(format);
      collection.setActiveGenreFilter(null);
      collection.setActiveDecadeFilter(null);
      handleViewChange('collection');
    };

    return (
      <StatsView
        stats={stats}
        onGenreClick={handleGenreClick}
        onDecadeClick={handleDecadeClick}
        onFormatClick={handleFormatClick}
        formatPrice={formatPrice}
        themes={themes}
      />
    );
  };

  const renderSettingsView = () => {
    return (
      <SettingsView
        discogsToken={settings.discogsToken}
        onDiscogsTokenChange={settings.setDiscogsToken}
        showDiscogsToken={settings.showDiscogsToken}
        onToggleShowDiscogsToken={() => settings.setShowDiscogsToken(!settings.showDiscogsToken)}
        anthropicToken={settings.anthropicToken}
        onAnthropicTokenChange={settings.setAnthropicToken}
        showAnthropicToken={settings.showAnthropicToken}
        onToggleShowAnthropicToken={() => settings.setShowAnthropicToken(!settings.showAnthropicToken)}
        theme={settings.theme}
        onThemeChange={settings.setTheme}
        customColors={settings.customColors}
        onCustomColorChange={settings.updateCustomColor}
        selectedShops={settings.selectedShops}
        onSelectedShopsChange={settings.setSelectedShops}
        onExportCollection={exportCollection}
        onImportCollection={handleImportCollection}
        appVersion={APP_VERSION}
        themes={themes}
      />
    );
  };


return (
    <div style={{
      backgroundColor: themes.background,
      minHeight: '100vh',
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden',
      color: themes.text,
      fontFamily: designSystem.typography.fontFamily
    }}>
      <Header themes={themes} />

      {/* View Container with Code Splitting and Suspense */}
      <div style={{
        width: '100%',
        minHeight: 'calc(100vh - 140px)',
        opacity: 1,
        animation: 'fadeIn 200ms ease-in'
      }}>
        <Suspense fallback={
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
            color: themes.text
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: `3px solid ${themes.border}`,
                borderTopColor: themes.primary,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }} />
              <p>Loading...</p>
            </div>
          </div>
        }>
          <ViewErrorBoundary
            viewName={view.charAt(0).toUpperCase() + view.slice(1)}
            themes={themes}
            onNavigateHome={() => handleViewChange('search')}
          >
            {view === 'search' && renderSearchView()}
            {view === 'camera' && renderCameraView()}
            {view === 'collection' && renderCollectionView()}
            {view === 'stats' && renderStatsView()}
            {view === 'settings' && renderSettingsView()}
          </ViewErrorBoundary>
        </Suspense>
      </div>

      {/* Simple fade-in animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Navigation view={view} onViewChange={handleViewChange} themes={themes} />
      <EnhancedDetailModal
        selectedResult={ui.selectedResult}
        collection={collection.collection}
        discogsToken={settings.discogsToken}
        onClose={() => ui.setSelectedResult(null)}
        onAddToCollection={collection.addToCollection}
        onRemoveFromCollection={collection.removeFromCollection}
        themes={themes}
      />
      <ValueHistoryModal
        showValueModal={ui.showValueModal}
        selectedResult={ui.selectedResult}
        valueHistory={ui.valueHistory}
        onClose={() => {
          ui.setShowValueModal(false);
          ui.setValueHistory([]);
        }}
        themes={themes}
      />
      <VinylDetailsModal
        selectedVinyl={ui.selectedVinyl}
        onClose={() => ui.setSelectedVinyl(null)}
        onToggleFavorite={collection.toggleFavorite}
        onOpenValueModal={ui.openValueModal}
        onUpdatePrice={(id) => refreshPrice(id, true)}
        onConfirmDelete={ui.setConfirmDelete}
        themes={themes}
      />

      {/* Toast Notification */}
      <Toast
        toast={ui.toast}
        onClose={() => ui.hideToast()}
        themes={themes}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        confirmDelete={ui.confirmDelete}
        onConfirm={(id) => {
          collection.removeFromCollection(id);
          ui.setConfirmDelete(null);
          ui.setSelectedVinyl(null);
          ui.showToast('Removed from collection', 'success');
        }}
        onCancel={() => ui.setConfirmDelete(null)}
        themes={themes}
      />
    </div>
  );
}