import React, { useState, useEffect, useRef } from 'react';
import { Search, Camera, Grid, BarChart3, Settings, Heart, X, Eye, EyeOff, Star, TrendingUp, TrendingDown, Minus, RefreshCw, Plus, Music, User, ExternalLink, Info, List } from 'lucide-react';
import { designSystem } from './designsystem';
import SearchView from './views/SearchView';
import CameraView from './views/CameraView';
import CollectionView from './views/CollectionView';
import StatsView from './views/StatsView';
import SettingsView from './views/SettingsView';

// Utilities
import { calculateCollectionStats } from './utils/statistics';
import { formatPrice } from './utils/collectionHelpers';
import { captureAndAnalyzeVinyl } from './utils/cameraHelpers';
import { validators } from './utils/validators';

// Services
import * as StorageService from './services/storageService';
import { migrateExistingTokens } from './services/secureStorage';

// Custom Hooks
import { useCollection } from './hooks/useCollection';
import { useSearch } from './hooks/useSearch';
import { useSettings } from './hooks/useSettings';
import { useModals } from './hooks/useModals';
import { useCamera } from './hooks/useCamera';
import { useDiscogsSearch } from './hooks/useDiscogsSearch';
import DetailModal from './components/DetailModal';
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

  // Navigation & View State - Load from localStorage if available
  const [view, setView] = useState(() => {
    try {
      const saved = localStorage.getItem('currentView');
      return saved || 'search';
    } catch {
      return 'search';
    }
  });
  const [viewHistory, setViewHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('viewHistory');
      return saved ? JSON.parse(saved) : ['search'];
    } catch {
      return ['search'];
    }
  });

  // Custom Hooks
  const collection = useCollection();
  const search = useSearch();
  const settings = useSettings();
  const modals = useModals();
  const camera = useCamera(view === 'camera');
  const discogsApi = useDiscogsSearch(settings.discogsToken);

  // Price update state (still managed here for now)
  const [isUpdatingAllPrices, setIsUpdatingAllPrices] = useState(false);
  const updatePricesAbortControllerRef = useRef(null);

  // Destructure commonly used values for cleaner code
  const { themes, showDiscogsToken, setShowDiscogsToken, showAnthropicToken, setShowAnthropicToken, customColors } = settings;
  const { toast, showToast, selectedResult, selectedVinyl, showValueModal, setShowValueModal, valueHistory, setValueHistory, confirmDelete, setConfirmDelete, openValueModal } = modals;
  const { isAnalyzing, cameraError, setIsAnalyzing } = camera;


  // Save view state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('currentView', view);
    } catch (error) {
      console.error('Failed to save current view:', error);
    }
  }, [view]);

  // Save view history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('viewHistory', JSON.stringify(viewHistory));
    } catch (error) {
      console.error('Failed to save view history:', error);
    }
  }, [viewHistory]);

  // View Transition Handler
  const handleViewChange = (newView) => {
    if (newView === view) return; // Don't transition to same view

    setView(newView);

    // Add to history stack
    setViewHistory(prev => [...prev, newView]);

    // Push state to browser history for back button support
    window.history.pushState({ view: newView }, '', `#${newView}`);
  };

  // Use refs to avoid stale closures in event listener
  const viewRef = useRef(view);
  const viewHistoryRef = useRef(viewHistory);

  // Keep refs in sync with state
  useEffect(() => {
    viewRef.current = view;
    viewHistoryRef.current = viewHistory;
  }, [view, viewHistory]);

  // Handle browser back button (only set up once)
  useEffect(() => {
    const handlePopState = (event) => {
      event.preventDefault();

      if (viewHistoryRef.current.length > 1) {
        // Go back to previous view in our history
        const newHistory = [...viewHistoryRef.current];
        newHistory.pop(); // Remove current
        const previousView = newHistory[newHistory.length - 1];

        setViewHistory(newHistory);
        setView(previousView);
      } else {
        // If we're at the first view, don't close the app
        // Just stay on the current view
        window.history.pushState({ view: viewRef.current }, '', `#${viewRef.current}`);
      }
    };

    // Listen for back button (only once)
    window.addEventListener('popstate', handlePopState);

    // Initialize history state
    window.history.replaceState({ view: viewRef.current }, '', `#${viewRef.current}`);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []); // Empty dependency array - only runs once

  // Backup & Export Functions
  const exportCollection = () => {
    try {
      StorageService.exportCollection(collection.collection);
      showToast(`Exported ${collection.collection.length} records`, 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showToast('Failed to export collection', 'error');
    }
  };

  const handleImportCollection = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const imported = await StorageService.importCollection(file);
      collection.setCollection(imported);
      StorageService.saveCollection(imported);
      showToast(`Imported ${imported.length} records`, 'success');
    } catch (error) {
      console.error('Import failed:', error);
      showToast('Failed to import collection', 'error');
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


  // Discogs API wrapper functions using hook
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
        modals.showToast(error, 'error');
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
          modals.showToast('Received invalid price data from Discogs', 'error');
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
        StorageService.saveCollection(newCollection);
      } else if (isCollectionItem && !priceData) {
        modals.showToast('No price data available for this item', 'error');
      }
    } catch (error) {
      console.error('Error refreshing price:', error);
      modals.showToast(error.message || 'Error refreshing price', 'error');
    }
  };

  // Camera capture and analyze function
  const captureAndAnalyze = async () => {
    if (!settings.anthropicToken) {
      showToast('Please enter your Anthropic API key in Settings', 'error');
      return;
    }

    setIsAnalyzing(true);
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
        showToast('Could not identify vinyl. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Camera analysis failed:', error);
      showToast(error.message || 'Failed to analyze vinyl', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Update all prices in collection
  const updateAllPrices = async () => {
    if (collection.collection.length === 0) {
      showToast('No items in collection to update', 'error');
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
          showToast(`Price update cancelled. Updated ${updated} of ${itemsToUpdate.length} items`, 'info');
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
        showToast(`Updated prices for ${updated} of ${itemsToUpdate.length} items`, 'success');
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
      onViewDetails={modals.setSelectedResult}
      themes={themes}
    />
  );

  const renderCameraView = () => {
    const handleCapture = () => {
      if (!settings.anthropicToken) {
        showToast('Please enter your Anthropic API key in Settings to use camera identification', 'error');
        return;
      }
      if (!camera.isCameraActive) {
        showToast('Camera is not active. Please allow camera access.', 'error');
        return;
      }
      captureAndAnalyze();
    };

    return (
      <CameraView
        videoRef={camera.videoRef}
        canvasRef={camera.canvasRef}
        isAnalyzing={isAnalyzing}
        cameraError={cameraError}
        onCapture={handleCapture}
        themes={themes}
      />
    );
  };

  const renderCollectionView = () => {
    return (
      <CollectionView
        collection={collection.collection}
        filteredAndSorted={collection.filteredAndSorted}
        collectionValue={collection.collectionValue}
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
        onViewDetails={modals.setSelectedVinyl}
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
        onDiscogsTokenChange={(value) => {
          settings.setDiscogsToken(value);
          localStorage.setItem('discogsToken', value);
        }}
        showDiscogsToken={showDiscogsToken}
        onToggleShowDiscogsToken={() => setShowDiscogsToken(!showDiscogsToken)}
        anthropicToken={settings.anthropicToken}
        onAnthropicTokenChange={(value) => {
          settings.setAnthropicToken(value);
          localStorage.setItem('anthropicApiKey', value);
        }}
        showAnthropicToken={showAnthropicToken}
        onToggleShowAnthropicToken={() => setShowAnthropicToken(!showAnthropicToken)}
        theme={settings.theme}
        onThemeChange={(newTheme) => {
          settings.setTheme(newTheme);
          localStorage.setItem('theme', newTheme);
        }}
        customColors={settings.customColors}
        onCustomColorChange={(colorKey, value) => {
          const newColors = { ...customColors, [colorKey]: value };
          settings.updateCustomColor(colorKey, value);
          localStorage.setItem('customColors', JSON.stringify(newColors));
        }}
        selectedShops={settings.selectedShops}
        onSelectedShopsChange={(shops) => {
          settings.setSelectedShops(shops);
          localStorage.setItem('selectedShops', JSON.stringify(shops));
        }}
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

      {/* View Container with Optimized Rendering - Only render current view */}
      <div style={{
        width: '100%',
        minHeight: 'calc(100vh - 140px)',
        opacity: 1,
        animation: 'fadeIn 200ms ease-in'
      }}>
        {view === 'search' && (
          <ViewErrorBoundary
            viewName="Search"
            themes={themes}
            onNavigateHome={() => handleViewChange('search')}
          >
            {renderSearchView()}
          </ViewErrorBoundary>
        )}
        {view === 'camera' && (
          <ViewErrorBoundary
            viewName="Camera"
            themes={themes}
            onNavigateHome={() => handleViewChange('search')}
          >
            {renderCameraView()}
          </ViewErrorBoundary>
        )}
        {view === 'collection' && (
          <ViewErrorBoundary
            viewName="Collection"
            themes={themes}
            onNavigateHome={() => handleViewChange('search')}
          >
            {renderCollectionView()}
          </ViewErrorBoundary>
        )}
        {view === 'stats' && (
          <ViewErrorBoundary
            viewName="Statistics"
            themes={themes}
            onNavigateHome={() => handleViewChange('search')}
          >
            {renderStatsView()}
          </ViewErrorBoundary>
        )}
        {view === 'settings' && (
          <ViewErrorBoundary
            viewName="Settings"
            themes={themes}
            onNavigateHome={() => handleViewChange('search')}
          >
            {renderSettingsView()}
          </ViewErrorBoundary>
        )}
      </div>

      {/* Simple fade-in animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <Navigation view={view} onViewChange={handleViewChange} themes={themes} />
      <DetailModal
        selectedResult={selectedResult}
        collection={collection.collection}
        onClose={() => modals.setSelectedResult(null)}
        onAddToCollection={collection.addToCollection}
        onRemoveFromCollection={collection.removeFromCollection}
        themes={themes}
      />
      <ValueHistoryModal
        showValueModal={showValueModal}
        selectedResult={selectedResult}
        valueHistory={valueHistory}
        onClose={() => {
          setShowValueModal(false);
          setValueHistory([]);
        }}
        themes={themes}
      />
      <VinylDetailsModal
        selectedVinyl={selectedVinyl}
        onClose={() => modals.setSelectedVinyl(null)}
        onToggleFavorite={collection.toggleFavorite}
        onOpenValueModal={openValueModal}
        onUpdatePrice={(id) => refreshPrice(id, true)}
        onConfirmDelete={setConfirmDelete}
        themes={themes}
      />

      {/* Toast Notification */}
      <Toast
        toast={toast}
        onClose={() => modals.closeAllModals()}
        themes={themes}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        confirmDelete={confirmDelete}
        onConfirm={(id) => {
          collection.removeFromCollection(id);
          setConfirmDelete(null);
          modals.setSelectedVinyl(null);
          showToast('Removed from collection', 'success');
        }}
        onCancel={() => setConfirmDelete(null)}
        themes={themes}
      />
    </div>
  );
}