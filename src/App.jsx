import React, { useState, useEffect, useRef, lazy, Suspense, useMemo } from 'react';
import { designSystem } from './designsystem';
import { version as APP_VERSION } from '../package.json';

// Code-split views for better performance
const SearchView = lazy(() => import('./views/SearchView'));
const CameraView = lazy(() => import('./views/CameraView'));
const CollectionView = lazy(() => import('./views/CollectionView'));
const StatsView = lazy(() => import('./views/StatsView'));
const SettingsView = lazy(() => import('./views/SettingsView'));
const DiscoverView = lazy(() => import('./views/DiscoverView'));
const WishlistView = lazy(() => import('./views/WishlistView'));

// Components
import ErrorModal from './components/ErrorModal/ErrorModal';

// Utilities
import { calculateCollectionStats } from './utils/statistics';
import { formatPrice, sortCollection, filterCollection, calculateCollectionValue } from './utils/collectionHelpers';
import { captureAndAnalyzeVinyl, captureImageFromVideo } from './utils/cameraHelpers';
import { validators } from './utils/validators';
import { fetchMissingCovers, fetchCoverFromDiscogs } from './utils/fetchMissingCovers';

// Services
import * as StorageService from './services/storageService';
import { savePriceRecord } from './services/priceHistoryService';
import discoverData from './data/discoverAlbums.json';

// Zustand Stores
import { useCollectionStore } from './stores/collectionStore';
import { useSearchStore } from './stores/searchStore';
import { useSettingsStore } from './stores/settingsStore';
import { useUIStore } from './stores/uiStore';
import { useDiscoverStore } from './stores/discoverStore';
import { useShallow } from 'zustand/react/shallow';

// Custom Hooks (still needed for some functionality)
import { useCamera } from './hooks/useCamera';
import { useDiscogsSearch } from './hooks/useDiscogsSearch';

// Components
import ValueHistoryModal from './components/ValueHistoryModal';
import VinylDetailsModal from './components/VinylDetailsModal';
import ConfirmDialog from './components/ConfirmDialog';
import Toast from './components/Toast';
import Header from './components/Header';
import Navigation from './components/Navigation';
import ViewErrorBoundary from './components/ViewErrorBoundary';

export default function App() {
  // Zustand Stores - Much cleaner than before!
  const collection = useCollectionStore();
  const search = useSearchStore();
  const settings = useSettingsStore();
  const ui = useUIStore();
  const wishlist = useDiscoverStore((s) => s.wishlist);

  // File input ref for Chrome compatibility
  const fileInputRef = useRef(null);

  // Get allAlbums from discover store for wishlist mapping
  const allAlbums = useDiscoverStore((s) => s.allAlbums);

  // Memoized selectors for computed values (fixes performance issue)
  const filteredAndSorted = useMemo(() => {
    const wishlistIds = useDiscoverStore.getState().wishlist;
    return sortCollection(
      filterCollection(
        collection.collection,
        collection.collectionFilter,
        collection.collectionSearch,
        collection.activeGenreFilter,
        collection.activeDecadeFilter,
        collection.activeFormatFilter,
        wishlistIds
      ),
      collection.sortBy
    );
  }, [
    collection.collection,
    collection.collectionFilter,
    collection.collectionSearch,
    collection.activeGenreFilter,
    collection.activeDecadeFilter,
    collection.activeFormatFilter,
    wishlist
  ]);

  const collectionValue = useCollectionStore(
    useShallow((s) => calculateCollectionValue(s.collection))
  );

  // Memoized collection stats (performance optimization for StatsView)
  const collectionStats = useMemo(
    () => calculateCollectionStats(collection.collection, collection.getPriceChange),
    [collection.collection, collection.getPriceChange]
  );

  // Derived values
  const themes = settings.getThemes();
  const view = ui.currentView;

  // Hooks that still need local state
  const camera = useCamera(view === 'camera');
  const discogsApi = useDiscogsSearch();

  // Price update state (still managed here for now)
  const [isUpdatingAllPrices, setIsUpdatingAllPrices] = useState(false);
  const updatePricesAbortControllerRef = useRef(null);

  // View Transition Handler - Now much simpler!
  const handleViewChange = (newView) => {
    if (newView === view) return;
    ui.setView(newView);
    window.history.pushState({ view: newView }, '', `#${newView}`);
  };

  // Handle viewing search results in detail modal
  const handleViewSearchResult = (result) => {
    ui.setSelectedVinyl({
      ...result,
      id: String(result.id),
      isFavorite: collection.collection.some(v => v.id === result.id && v.isFavorite)
    });
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
      ui.showToast(`Exported ${collection.collection.length} records as JSON`, 'success');
    } catch (error) {
      console.error('Export failed:', error);
      ui.showToast('Failed to export collection', 'error');
    }
  };

  const exportCollectionAsCSV = () => {
    try {
      StorageService.exportCollectionAsCSV(collection.collection);
      ui.showToast(`Exported ${collection.collection.length} records as CSV`, 'success');
    } catch (error) {
      console.error('CSV export failed:', error);
      ui.showToast('Failed to export collection', 'error');
    }
  };

  const handleImportCollection = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imported = await StorageService.importCollection(file);
      if (!Array.isArray(imported) || imported.length === 0) {
        ui.showToast('Collection is empty', 'error');
        return;
      }
      collection.setCollection(imported);
      ui.showToast(`Imported ${imported.length} records`, 'success');
    } catch (error) {
      console.error('Import failed:', error.message);
      ui.showError('Import Failed', `File: ${file.name}\n\nError:\n${error.message}\n\nCheck the DevTools console (F12) for more details.`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerImportInput = () => {
    fileInputRef.current?.click();
  };

  // Initialize discover data on app mount so wishlist works on reload
  useEffect(() => {
    const discover = useDiscoverStore.getState();
    if (discover.allAlbums.length === 0) {
      discover.initializeAlbums(discoverData);
    }
  }, []);

  // Load Google Fonts Inter & Add CSS Animations (once on mount)
  useEffect(() => {
    // Check if fonts already loaded
    const existingLink = document.querySelector('link[href*="fonts.googleapis.com"]');
    if (!existingLink) {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    // Check if spin animation already exists
    if (!document.getElementById('app-animations')) {
      const style = document.createElement('style');
      style.id = 'app-animations';
      style.innerHTML = `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Settings now loaded by useSettings hook
  // Collection save now in hooks
  // Theme save now in hooks
  // Tokens save now in hooks
  // Camera lifecycle now in useCamera hook
  // Modal state and ESC handling now in useModals hook


  // Discogs API wrapper functions - Now with stores!
  const searchDiscogs = async (isAdvanced = false, queryOverride = null, page = 1) => {
    const query = queryOverride || search.searchQuery;
    await discogsApi.performSearch({
      isAdvanced,
      query,
      advancedSearch: search.advancedSearch,
      page,
      perPage: 50,
      onSuccess: async (data) => {
        const results = data.results || [];
        search.setSearchResults(results);
        search.setCurrentPage(data.pagination?.page || page);
        search.setTotalPages(data.pagination?.pages || 1);
        if (!isAdvanced && query) search.addToSearchHistory(query);

        if (results.length > 0) {
          // Fetch prices for first 20 results only to avoid rate limiting
          await discogsApi.fetchAllPrices(results, 20);
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

        // Save price record to history
        try {
          savePriceRecord(itemId, priceData.value, priceData.currency);
        } catch (error) {
          console.error('Failed to save price record:', error);
          // Continue anyway - price update is successful even if history save fails
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
    camera.setIsAnalyzing(true);
    try {
      // Pause video and show captured image
      camera.pauseCamera();
      const base64Image = captureImageFromVideo(camera.videoRef.current, camera.canvasRef.current, 0.8);
      camera.setCapturedImageData(`data:image/jpeg;base64,${base64Image}`);

      const result = await captureAndAnalyzeVinyl(camera.videoRef.current, camera.canvasRef.current);

      const parts = [result.artist, result.album].filter((p) => p && p !== 'Unknown');
      if (parts.length > 0) {
        const query = parts.join(' ');
        search.setSearchQuery(query);
        await searchDiscogs(false, query, 1);
        handleViewChange('search');
        camera.clearCapturedImage();
      } else {
        ui.showToast('Vinyl nicht erkannt. Bitte erneut versuchen.', 'error');
        camera.clearCapturedImage();
      }
    } catch (error) {
      console.error('Camera analysis failed:', error);
      ui.showToast(error.message || 'Analyse fehlgeschlagen', 'error');
      camera.clearCapturedImage();
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
          // Use abortable delay with AbortSignal.timeout
          await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(resolve, 1100);
            const abortHandler = () => {
              clearTimeout(timeoutId);
              reject(new Error('Aborted'));
            };
            abortController.signal.addEventListener('abort', abortHandler, { once: true });
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
      onViewDetails={handleViewSearchResult}
      themes={themes}
    />
  );

  const renderCameraView = () => {
    const handleCapture = () => {
      if (!camera.isCameraActive) {
        ui.showToast('Camera is not active. Please allow camera access.', 'error');
        return;
      }
      captureAndAnalyze();
    };

    const handleClearCapture = () => {
      camera.clearCapturedImage();
    };

    return (
      <CameraView
        videoRef={camera.videoRef}
        canvasRef={camera.canvasRef}
        isAnalyzing={camera.isAnalyzing}
        cameraError={camera.cameraError}
        capturedImageData={camera.capturedImageData}
        onCapture={handleCapture}
        onClearCapture={handleClearCapture}
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
        onReloadCover={handleReloadCover}
        onViewDetails={ui.setSelectedVinyl}
        onNavigateToSearch={() => handleViewChange('search')}
        getPriceChange={collection.getPriceChange}
        themes={themes}
      />
    );
  };

  const renderStatsView = () => {
    const stats = collectionStats;

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

    const handleDiscoverClick = () => {
      handleViewChange('discover');
    };

    const handleWishlistClick = () => {
      handleViewChange('wishlist');
    };

    return (
      <StatsView
        stats={stats}
        onGenreClick={handleGenreClick}
        onDecadeClick={handleDecadeClick}
        onFormatClick={handleFormatClick}
        onDiscoverClick={handleDiscoverClick}
        onWishlistClick={handleWishlistClick}
        formatPrice={formatPrice}
        themes={themes}
      />
    );
  };

  const handleFetchMissingCovers = async () => {
    if (!collection.collection.length) {
      ui.showToast('Collection is empty', 'error');
      return;
    }

    ui.showToast('Fetching covers (this may take a moment)...', 'info');

    try {
      const result = await fetchMissingCovers(collection.collection, (current, total) => {
        ui.showToast(`Fetching covers... ${current}/${total}`, 'info');
      });

      collection.setCollection(result.updated_collection);
      ui.showToast(`Fetched ${result.updated} covers (${result.failed} not found)`, 'success');
    } catch (error) {
      console.error('Fetch covers failed:', error);
      ui.showError('Fetch Covers Failed', `Error: ${error.message}`);
    }
  };

  const handleReloadCover = async (vinylId) => {
    try {
      const cover = await fetchCoverFromDiscogs(vinylId);
      if (cover) {
        const updatedCollection = collection.collection.map(item =>
          item.id === vinylId ? { ...item, cover_image: cover } : item
        );
        collection.setCollection(updatedCollection);
        ui.showToast('Cover updated', 'success');
      } else {
        ui.showToast('No cover found', 'warning');
      }
    } catch (error) {
      console.error('Reload cover failed:', error);
      ui.showToast('Failed to reload cover', 'error');
    }
  };

  const renderSettingsView = () => {
    return (
      <SettingsView
        theme={settings.theme}
        onThemeChange={settings.setTheme}
        customColors={settings.customColors}
        onCustomColorChange={settings.updateCustomColor}
        selectedShops={settings.selectedShops}
        onSelectedShopsChange={settings.setSelectedShops}
        designTheme={settings.designTheme}
        onDesignThemeChange={settings.setDesignTheme}
        onExportCollection={exportCollection}
        onExportCollectionAsCSV={exportCollectionAsCSV}
        onImportCollection={handleImportCollection}
        importFileInputRef={fileInputRef}
        appVersion={APP_VERSION}
        themes={themes}
        onNotify={ui.showToast}
        onFetchMissingCovers={handleFetchMissingCovers}
      />
    );
  };

  const renderDiscoverView = () => {
    return (
      <DiscoverView
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
            key={view}
            viewName={view.charAt(0).toUpperCase() + view.slice(1)}
            themes={themes}
            onNavigateHome={() => handleViewChange('search')}
          >
            {view === 'search' && renderSearchView()}
            {view === 'camera' && renderCameraView()}
            {view === 'collection' && renderCollectionView()}
            {view === 'stats' && renderStatsView()}
            {view === 'discover' && renderDiscoverView()}
            {view === 'wishlist' && <WishlistView key="wishlist" themes={themes} allAlbums={allAlbums} wishlistIds={wishlist} onNavigateToDiscover={() => handleViewChange('discover')} onViewDetails={handleViewSearchResult} onAddToCollection={collection.addToCollection} onRefreshPrice={(id) => refreshPrice(id, false)} />}
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

      <Navigation view={view} onViewChange={handleViewChange} wishlistCount={wishlist.length} themes={themes} />
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
        onReloadCover={handleReloadCover}
        onUpdateVinyl={(vinyl) => collection.updateItemInCollection(vinyl.id, vinyl)}
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

      {/* Error Modal */}
      <ErrorModal
        show={ui.errorModal.show}
        title={ui.errorModal.title}
        message={ui.errorModal.message}
        onClose={() => ui.hideError()}
        themes={themes}
      />
    </div>
  );
}