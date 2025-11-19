import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Camera, Grid, BarChart3, Settings, Heart, X, Eye, EyeOff, Star, TrendingUp, TrendingDown, Minus, RefreshCw, Plus, Music, User, ExternalLink, Info, List } from 'lucide-react';
import { designSystem, createTheme, withOpacity, themeDefinitions } from './designsystem';
import DemoPanel from './components/DemoPanel';
import SearchView from './views/SearchView';

// App Version
const APP_VERSION = '2.7.1';

export default function App() {
  // Logo Configuration
  const LOGO_PATH = "/VinylScoutLogo.png";

  // Navigation & View State
  const [view, setView] = useState('search');
  const [previousView, setPreviousView] = useState(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedSearch, setAdvancedSearch] = useState({
    artist: '', album: '', year: '', label: '', genre: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // Price State (V2.1)
  const [resultPrices, setResultPrices] = useState({});
  const [refreshingPrices, setRefreshingPrices] = useState({});
  const [priceChanges, setPriceChanges] = useState({});
  const [isUpdatingAllPrices, setIsUpdatingAllPrices] = useState(false);

  // Collection State
  const [collection, setCollection] = useState([]);
  const [sortBy, setSortBy] = useState('artist-asc');
  const [collectionView, setCollectionView] = useState('grid');
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [collectionSearch, setCollectionSearch] = useState('');
  const [activeGenreFilter, setActiveGenreFilter] = useState(null);
  const [activeDecadeFilter, setActiveDecadeFilter] = useState(null);
  const [activeFormatFilter, setActiveFormatFilter] = useState(null);

  // Modal State
  const [selectedVinyl, setSelectedVinyl] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const [showValueModal, setShowValueModal] = useState(false);
  const [valueHistory, setValueHistory] = useState([]);

  // Settings State
  const [discogsToken, setDiscogsToken] = useState('');
  const [anthropicToken, setAnthropicToken] = useState('');
  const [showDiscogsToken, setShowDiscogsToken] = useState(false);
  const [showAnthropicToken, setShowAnthropicToken] = useState(false);
  const [theme, setTheme] = useState('classic');
  const [customColors, setCustomColors] = useState({
    primary: '#2563eb',
    background: '#ffffff',
    accent: '#10b981',
    text: '#0f172a'
  });
  const [selectedShops, setSelectedShops] = useState(['discogs', 'hhv', 'ebay']);

  // Camera State
  const [cameraStream, setCameraStream] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Logo State
  const [logoError, setLogoError] = useState(false);

  // Toast & Confirmation
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Theme System
  const themes = createTheme(theme, customColors);

  // View Transition Handler
  const handleViewChange = (newView) => {
    if (newView === view) return; // Don't transition to same view

    setPreviousView(view);
    setView(newView);

    // Clear previous view after transition completes
    setTimeout(() => {
      setPreviousView(null);
    }, 300);
  };

  // Helper Functions
  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const formatPrice = (value, currency) => {
    const symbols = { USD: '$', EUR: '€', GBP: '£' };
    const symbol = symbols[currency] || '';
    return `${symbol}${parseFloat(value).toFixed(2)} ${currency}`;
  };

  // Backup & Export Functions
  const exportCollection = () => {
    try {
      const backupData = {
        collection,
        exportDate: new Date().toISOString(),
        version: APP_VERSION
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `vinylscout-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Exported ${collection.length} records`, 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showToast('Failed to export collection', 'error');
    }
  };

  const importCollection = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target.result);

        if (!backupData.collection || !Array.isArray(backupData.collection)) {
          showToast('Invalid backup file format', 'error');
          return;
        }

        setCollection(backupData.collection);
        localStorage.setItem('vinylCollection', JSON.stringify(backupData.collection));
        showToast(`Imported ${backupData.collection.length} records`, 'success');
      } catch (error) {
        console.error('Import failed:', error);
        showToast('Failed to import collection', 'error');
      }
    };
    reader.readAsText(file);

    // Reset input so the same file can be selected again
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

  // V1 Migration + Load Settings
  useEffect(() => {
    // Migration from V1
    const oldCollection = localStorage.getItem('collection');
    if (oldCollection && !localStorage.getItem('vinylCollection')) {
      localStorage.setItem('vinylCollection', oldCollection);
    }

    const oldTheme = localStorage.getItem('selectedTheme');
    if (oldTheme && !localStorage.getItem('appTheme')) {
      localStorage.setItem('appTheme', oldTheme);
    }

    const oldPrimary = localStorage.getItem('primaryColor');
    const oldSecondary = localStorage.getItem('secondaryColor');
    const oldAccent = localStorage.getItem('accentColor');

    if (oldPrimary && oldSecondary && oldAccent && !localStorage.getItem('customColors')) {
      localStorage.setItem('customColors', JSON.stringify({
        primary: oldPrimary,
        background: oldSecondary,
        accent: oldAccent
      }));
    }

    // Load settings
    const saved = {
      collection: localStorage.getItem('vinylCollection'),
      token: localStorage.getItem('discogsToken'),
      anthropic: localStorage.getItem('anthropicToken'),
      theme: localStorage.getItem('appTheme'),
      colors: localStorage.getItem('customColors'),
      shops: localStorage.getItem('selectedShops')
    };

    if (saved.collection) setCollection(JSON.parse(saved.collection));
    if (saved.token) setDiscogsToken(saved.token);
    if (saved.anthropic) setAnthropicToken(saved.anthropic);
    if (saved.theme) setTheme(saved.theme);
    if (saved.colors) setCustomColors(JSON.parse(saved.colors));
    if (saved.shops) setSelectedShops(JSON.parse(saved.shops));
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (collection.length > 0) {
      localStorage.setItem('vinylCollection', JSON.stringify(collection));
    }
  }, [collection]);

  useEffect(() => {
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('discogsToken', discogsToken);
  }, [discogsToken]);

  useEffect(() => {
    localStorage.setItem('anthropicToken', anthropicToken);
  }, [anthropicToken]);

  useEffect(() => {
    localStorage.setItem('customColors', JSON.stringify(customColors));
  }, [customColors]);

  useEffect(() => {
    localStorage.setItem('selectedShops', JSON.stringify(selectedShops));
  }, [selectedShops]);

  useEffect(() => {
    if (view === 'camera' && !isCameraActive) {
      startCamera();
    } else if (view !== 'camera' && isCameraActive) {
      stopCamera();
    }
    return () => {
      if (isCameraActive) stopCamera();
    };
  }, [view]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (confirmDelete) {
          setConfirmDelete(null);
        } else if (showValueModal) {
          setShowValueModal(false);
          setValueHistory([]);
        } else if (selectedResult) {
          setSelectedResult(null);
        } else if (selectedVinyl) {
          setSelectedVinyl(null);
        }
      }
    };

    if (selectedResult || selectedVinyl || showValueModal || confirmDelete) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [selectedResult, selectedVinyl, showValueModal, confirmDelete]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedResult || selectedVinyl || showValueModal || confirmDelete) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = 'auto'; };
    }
  }, [selectedResult, selectedVinyl, showValueModal, confirmDelete]);

  useEffect(() => {
    if (selectedResult || selectedVinyl) {
      const firstButton = document.querySelector('[data-modal-button]');
      if (firstButton) {
        firstButton.focus();
      }
    }
  }, [selectedResult, selectedVinyl]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(err.message || 'Failed to access camera');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setIsCameraActive(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) {
      showToast('Camera not ready. Please try again.', 'error');
      return;
    }

    if (!anthropicToken) {
      showToast('Please enter your Anthropic API key in Settings', 'error');
      return;
    }

    setIsAnalyzing(true);
    setCameraError(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      const base64Image = imageData.split(',')[1];

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          apiKey: anthropicToken
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.artist && data.album) {
        showToast(`Found: ${data.artist} - ${data.album}`, 'success');
        setSearchQuery(`${data.artist} ${data.album}`);
        handleViewChange('search');
        await searchDiscogs(false, `${data.artist} ${data.album}`, 1);
      } else {
        showToast('Could not identify album. Try again with better lighting.', 'error');
        setCameraError('Could not identify album');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      showToast(err.message || 'Analysis failed. Please try again.', 'error');
      setCameraError(err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Discogs API Functions
  const searchDiscogs = async (isAdvanced = false, queryOverride = null, page = 1) => {
    if (!discogsToken) {
      showToast('Please set your Discogs API token in Settings', 'error');
      handleViewChange('settings');
      return;
    }

    setIsLoading(true);
    try {
      let searchUrl = 'https://api.discogs.com/database/search?';

      if (isAdvanced) {
        const params = [];
        if (advancedSearch.artist) params.push(`artist=${encodeURIComponent(advancedSearch.artist)}`);
        if (advancedSearch.album) params.push(`release_title=${encodeURIComponent(advancedSearch.album)}`);
        if (advancedSearch.year) params.push(`year=${encodeURIComponent(advancedSearch.year)}`);
        if (advancedSearch.label) params.push(`label=${encodeURIComponent(advancedSearch.label)}`);
        if (advancedSearch.genre) params.push(`genre=${encodeURIComponent(advancedSearch.genre)}`);

        if (params.length === 0) {
          showToast('Please fill in at least one field', 'error');
          setIsLoading(false);
          return;
        }

        searchUrl += params.join('&') + `&per_page=${ITEMS_PER_PAGE}&page=${page}&type=release`;
      } else {
        const query = queryOverride || searchQuery;
        if (!query.trim()) {
          setIsLoading(false);
          return;
        }
        searchUrl += `q=${encodeURIComponent(query)}&type=release&per_page=${ITEMS_PER_PAGE}&page=${page}`;
      }

      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Discogs token=${discogsToken}`,
          'User-Agent': 'VinylScout/2.3'
        }
      });

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      const results = data.results || [];
      setSearchResults(results);
      setCurrentPage(data.pagination?.page || page);
      setTotalPages(data.pagination?.pages || 1);

      if (results.length > 0) {
        fetchAllPrices(results);
      }
    } catch (err) {
      console.error('Search failed:', err);
      showToast('Search failed. Please check your API token.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPriceInfo = async (releaseId, timeoutMs = 8000) => {
    if (!discogsToken) return null;

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(
        `https://api.discogs.com/marketplace/stats/${releaseId}`,
        {
          headers: {
            'Authorization': `Discogs token=${discogsToken}`,
            'User-Agent': 'VinylScout/2.4'
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.lowest_price && data.num_for_sale > 0) {
          return {
            value: data.lowest_price.value,
            currency: data.lowest_price.currency,
            num_for_sale: data.num_for_sale,
            stats: data
          };
        }
      }

      // Handle rate limiting
      if (response.status === 429) {
        console.warn('Rate limited by Discogs API');
        return null;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`Price fetch timeout for ${releaseId}`);
      } else {
        console.error('Price error:', error);
      }
    }
    return null;
  };

  const fetchAllPrices = async (results) => {
    // Clear previous prices
    setResultPrices({});

    // Load prices for ALL results (not just 10), but with smart limits
    const itemsToFetch = results.slice(0, Math.min(results.length, 50));

    // Batch processing: Update UI incrementally, not all at once
    let fetchedPrices = {};

    for (let i = 0; i < itemsToFetch.length; i++) {
      const result = itemsToFetch[i];

      try {
        const priceData = await fetchPriceInfo(result.id);

        if (priceData) {
          fetchedPrices[result.id] = priceData;

          // Update UI every 3 items for smooth incremental loading
          if ((i + 1) % 3 === 0 || i === itemsToFetch.length - 1) {
            setResultPrices(prev => ({ ...prev, ...fetchedPrices }));
            fetchedPrices = {}; // Clear batch
          }
        }

        // Respect Discogs rate limits: 60 requests/min = 1 per second
        // Use 1100ms to be safe
        await new Promise(resolve => setTimeout(resolve, 1100));

      } catch (error) {
        // Log but continue - don't let one failure block everything
        console.error(`Failed to fetch price for ${result.id}:`, error);
        // Still respect rate limit even on error
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
    }
  };

  const refreshPrice = async (itemId, isCollectionItem = false) => {
    if (!discogsToken) {
      showToast('Please add your Discogs API token in Settings', 'error');
      return;
    }

    let oldPrice = null;
    if (resultPrices[itemId]) {
      oldPrice = resultPrices[itemId].value;
    } else if (isCollectionItem) {
      const item = collection.find(i => i.id === itemId);
      if (item && item.price) {
        oldPrice = item.price.value;
      }
    }

    setRefreshingPrices(prev => ({ ...prev, [itemId]: true }));

    try {
      const priceData = await fetchPriceInfo(itemId);

      if (priceData) {
        if (oldPrice !== null) {
          const change = priceData.value - oldPrice;
          setPriceChanges(prev => ({
            ...prev,
            [itemId]: {
              amount: change,
              currency: priceData.currency
            }
          }));

          setTimeout(() => {
            setPriceChanges(prev => {
              const newChanges = { ...prev };
              delete newChanges[itemId];
              return newChanges;
            });
          }, 5000);
        }

        setResultPrices(prev => ({
          ...prev,
          [itemId]: priceData
        }));

        if (isCollectionItem) {
          const newCollection = collection.map(item => {
            if (item.id === itemId) {
              return {
                ...item,
                price: { value: priceData.value, currency: priceData.currency }
              };
            }
            return item;
          });
          setCollection(newCollection);
          localStorage.setItem('vinylCollection', JSON.stringify(newCollection));
        }
      } else {
        showToast('No price data available', 'error');
      }
    } catch (error) {
      showToast(`Error refreshing price: ${error.message}`, 'error');
    }

    setRefreshingPrices(prev => ({ ...prev, [itemId]: false }));
  };

  const fetchVinylDetails = async (id) => {
    if (!discogsToken) return null;

    try {
      const response = await fetch(
        `https://api.discogs.com/releases/${id}`,
        {
          headers: {
            'Authorization': `Discogs token=${discogsToken}`,
            'User-Agent': 'VinylScout/2.3'
          }
        }
      );
      return await response.json();
    } catch (err) {
      console.error('Failed to fetch details:', err);
      return null;
    }
  };

  const addToCollection = async (item) => {
    const details = await fetchVinylDetails(item.id);
    if (!details) return;

    const newItem = {
      id: item.id,
      title: item.title,
      year: item.year,
      thumb: item.thumb || item.cover_image,
      cover_image: item.cover_image,
      artist: details.artists?.[0]?.name || 'Unknown',
      label: details.labels?.[0]?.name || 'Unknown',
      genres: details.genres || [],
      styles: details.styles || [],
      tracklist: details.tracklist || [],
      lowestPrice: null,
      priceHistory: [],
      addedAt: new Date().toISOString(),
      isFavorite: false
    };

    setCollection(prev => [...prev, newItem]);
    await updatePrice(newItem.id);
  };

  const removeFromCollection = (id) => {
    setCollection(prev => prev.filter(item => item.id !== id));
  };

  const toggleFavorite = (id) => {
    setCollection(prev => prev.map(item =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  };

  const updatePrice = async (id) => {
    if (!discogsToken) return;

    try {
      const response = await fetch(
        `https://api.discogs.com/marketplace/stats/${id}`,
        {
          headers: {
            'Authorization': `Discogs token=${discogsToken}`,
            'User-Agent': 'VinylScout/2.3'
          }
        }
      );
      const data = await response.json();
      const price = data.lowest_price?.value !== undefined ? data.lowest_price.value : null;

      setCollection(prev => prev.map(item => {
        if (item.id !== id) return item;
        
        const priceHistory = [...(item.priceHistory || [])];
        if (price !== null) {
          priceHistory.push({
            date: new Date().toISOString(),
            price: price,
            currency: data.lowest_price?.currency || 'USD'
          });
        }

        return {
          ...item,
          lowestPrice: price,
          priceHistory: priceHistory.slice(-30)
        };
      }));
    } catch (err) {
      console.error('Price update failed:', err);
    }
  };

  const updateAllPrices = async () => {
    setIsUpdatingAllPrices(true);
    try {
      for (const item of collection) {
        await updatePrice(item.id);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      showToast('All prices updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update some prices', 'error');
    } finally {
      setIsUpdatingAllPrices(false);
    }
  };

  const openValueModal = (item) => {
    setSelectedResult(item);
    setShowValueModal(true);
    
    const history = item.priceHistory || [];
    setValueHistory(history);
  };

  const getPriceChange = (item) => {
    const history = item.priceHistory || [];
    if (history.length < 2) return null;
    
    const current = history[history.length - 1].price;
    const previous = history[history.length - 2].price;
    const change = ((current - previous) / previous) * 100;
    
    return {
      value: change,
      isPositive: change > 0,
      isNegative: change < 0
    };
  };

  const getStats = () => {
    const total = collection.length;
    const favorites = collection.filter(v => v.isFavorite).length;
    const withPrice = collection.filter(v => v.lowestPrice !== null && v.lowestPrice !== undefined).length;
    const totalValue = collection.reduce((sum, v) => {
      const price = v.lowestPrice;
      return sum + (typeof price === 'number' ? price : 0);
    }, 0);
    const avgValue = withPrice > 0 ? totalValue / withPrice : 0;

    // Get most common currency from price history
    const currencies = collection
      .flatMap(v => v.priceHistory || [])
      .map(p => p.currency)
      .filter(Boolean);
    const currencyCount = currencies.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {});
    const currency = Object.keys(currencyCount).length > 0
      ? Object.keys(currencyCount).sort((a, b) => currencyCount[b] - currencyCount[a])[0]
      : 'EUR';

    // Genre statistics
    const genreCounts = {};
    collection.forEach(v => {
      v.genres?.forEach(g => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Most valuable record
    const mostValuable = collection
      .filter(v => v.lowestPrice && v.lowestPrice > 0)
      .sort((a, b) => (b.lowestPrice || 0) - (a.lowestPrice || 0))[0] || null;

    // Recent additions (last 7 days)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recentAdditions = collection.filter(v =>
      v.addedAt && new Date(v.addedAt).getTime() > sevenDaysAgo
    ).length;

    // Price gainers (top 3)
    const priceGainers = collection
      .filter(v => {
        const change = getPriceChange(v);
        return change && change.isPositive;
      })
      .sort((a, b) => {
        const aChange = getPriceChange(a);
        const bChange = getPriceChange(b);
        return (bChange?.value || 0) - (aChange?.value || 0);
      })
      .slice(0, 3);

    // Price losers (top 3)
    const priceLosers = collection
      .filter(v => {
        const change = getPriceChange(v);
        return change && change.isNegative;
      })
      .sort((a, b) => {
        const aChange = getPriceChange(a);
        const bChange = getPriceChange(b);
        return (aChange?.value || 0) - (bChange?.value || 0);
      })
      .slice(0, 3);

    // Decade breakdown
    const decadeCounts = {};
    collection.forEach(v => {
      if (v.year) {
        const decade = Math.floor(v.year / 10) * 10;
        decadeCounts[`${decade}s`] = (decadeCounts[`${decade}s`] || 0) + 1;
      }
    });
    const topDecades = Object.entries(decadeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Format breakdown
    const formatCounts = {};
    collection.forEach(v => {
      const format = v.format || v.formats?.[0] || 'Unknown';
      formatCounts[format] = (formatCounts[format] || 0) + 1;
    });
    const topFormats = Object.entries(formatCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // === NEW COMPETITOR-INSPIRED STATS ===

    // Top Artists (most albums)
    const artistCounts = {};
    collection.forEach(v => {
      const artist = v.artist || 'Unknown';
      artistCounts[artist] = (artistCounts[artist] || 0) + 1;
    });
    const topArtists = Object.entries(artistCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Top Labels
    const labelCounts = {};
    collection.forEach(v => {
      const label = v.label || 'Unknown';
      labelCounts[label] = (labelCounts[label] || 0) + 1;
    });
    const topLabels = Object.entries(labelCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Total runtime (if tracklist has durations)
    let totalRuntime = 0;
    let totalTracks = 0;
    collection.forEach(v => {
      if (v.tracklist) {
        totalTracks += v.tracklist.length;
        v.tracklist.forEach(track => {
          if (track.duration) {
            const parts = track.duration.split(':');
            if (parts.length === 2) {
              const minutes = parseInt(parts[0]) || 0;
              const seconds = parseInt(parts[1]) || 0;
              totalRuntime += (minutes * 60) + seconds;
            }
          }
        });
      }
    });
    const avgTracksPerAlbum = collection.length > 0 ? totalTracks / collection.length : 0;

    // Oldest and newest releases
    const sortedByYear = collection
      .filter(v => v.year)
      .sort((a, b) => a.year - b.year);
    const oldestRelease = sortedByYear[0] || null;
    const newestRelease = sortedByYear[sortedByYear.length - 1] || null;

    // Collection diversity score (genres per album ratio)
    const totalGenres = Object.keys(genreCounts).length;
    const diversityScore = collection.length > 0 ? totalGenres / collection.length : 0;

    // Added this month/year
    const now = new Date();
    const thisMonth = collection.filter(v => {
      if (!v.addedAt) return false;
      const added = new Date(v.addedAt);
      return added.getMonth() === now.getMonth() && added.getFullYear() === now.getFullYear();
    }).length;

    const thisYear = collection.filter(v => {
      if (!v.addedAt) return false;
      const added = new Date(v.addedAt);
      return added.getFullYear() === now.getFullYear();
    }).length;

    // Value distribution
    const priceRanges = {
      '0-10': 0,
      '10-25': 0,
      '25-50': 0,
      '50-100': 0,
      '100+': 0
    };
    collection.forEach(v => {
      const price = v.lowestPrice;
      if (typeof price === 'number') {
        if (price < 10) priceRanges['0-10']++;
        else if (price < 25) priceRanges['10-25']++;
        else if (price < 50) priceRanges['25-50']++;
        else if (price < 100) priceRanges['50-100']++;
        else priceRanges['100+']++;
      }
    });

    // Completeness score (% with price data)
    const completenessScore = collection.length > 0 ? (withPrice / collection.length) * 100 : 0;

    // Average collection age (years since release)
    const currentYear = new Date().getFullYear();
    const totalAge = collection.reduce((sum, v) => {
      if (v.year) {
        return sum + (currentYear - v.year);
      }
      return sum;
    }, 0);
    const avgAge = collection.length > 0 ? totalAge / collection.length : 0;

    // Rarest items (least collected on Discogs - placeholder, would need API data)
    // For now, show items with highest value as proxy for rarity
    const rarestItems = collection
      .filter(v => v.lowestPrice && v.lowestPrice > 100)
      .sort((a, b) => (b.lowestPrice || 0) - (a.lowestPrice || 0))
      .slice(0, 5);

    // Total value growth (comparing first vs last price in history)
    let totalValueGrowth = 0;
    let itemsWithGrowth = 0;
    collection.forEach(v => {
      if (v.priceHistory && v.priceHistory.length >= 2) {
        const firstPrice = v.priceHistory[0].price;
        const lastPrice = v.priceHistory[v.priceHistory.length - 1].price;
        const growth = lastPrice - firstPrice;
        totalValueGrowth += growth;
        itemsWithGrowth++;
      }
    });
    const avgValueGrowth = itemsWithGrowth > 0 ? totalValueGrowth / itemsWithGrowth : 0;

    return {
      // Core stats
      total,
      favorites,
      withPrice,
      totalValue,
      avgValue,
      currency,

      // Breakdowns
      topGenres,
      topDecades,
      topFormats,

      // Value stats
      mostValuable,
      priceGainers,
      priceLosers,
      priceRanges,
      avgValueGrowth,

      // Collection insights
      recentAdditions,
      thisMonth,
      thisYear,
      oldestRelease,
      newestRelease,
      avgAge,

      // Artist & Label stats
      topArtists,
      topLabels,

      // Audio stats
      totalTracks,
      totalRuntime,
      avgTracksPerAlbum,

      // Quality metrics
      completenessScore,
      diversityScore,
      totalGenres,
      rarestItems
    };
  };

  // Collection Sorting & Filtering (V2.1)
  const sortCollection = (items, sortBy) => {
    const sorted = [...items];
    switch(sortBy) {
      case 'artist-asc':
        return sorted.sort((a, b) => {
          const aArtist = (a.title?.split(' - ')[0] || '').toLowerCase();
          const bArtist = (b.title?.split(' - ')[0] || '').toLowerCase();
          return aArtist.localeCompare(bArtist);
        });
      case 'artist-desc':
        return sorted.sort((a, b) => {
          const aArtist = (a.title?.split(' - ')[0] || '').toLowerCase();
          const bArtist = (b.title?.split(' - ')[0] || '').toLowerCase();
          return bArtist.localeCompare(aArtist);
        });
      case 'album-asc':
        return sorted.sort((a, b) => {
          const aAlbum = (a.title?.split(' - ')[1] || a.title || '').toLowerCase();
          const bAlbum = (b.title?.split(' - ')[1] || b.title || '').toLowerCase();
          return aAlbum.localeCompare(bAlbum);
        });
      case 'album-desc':
        return sorted.sort((a, b) => {
          const aAlbum = (a.title?.split(' - ')[1] || a.title || '').toLowerCase();
          const bAlbum = (b.title?.split(' - ')[1] || b.title || '').toLowerCase();
          return bAlbum.localeCompare(aAlbum);
        });
      case 'price-asc':
        return sorted.sort((a, b) => (a.price?.value || a.lowestPrice || 0) - (b.price?.value || b.lowestPrice || 0));
      case 'price-desc':
        return sorted.sort((a, b) => (b.price?.value || b.lowestPrice || 0) - (a.price?.value || a.lowestPrice || 0));
      case 'date-new':
        return sorted.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
      case 'date-old':
        return sorted.sort((a, b) => new Date(a.addedAt || 0) - new Date(b.addedAt || 0));
      default:
        return sorted;
    }
  };

  const filterCollection = (items, filter, searchQuery = '', genreFilter = null, decadeFilter = null, formatFilter = null) => {
    let filtered = filter === 'favorites' ? items.filter(item => item.isFavorite) : items;

    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const title = (item.title || '').toLowerCase();
        const artist = (item.artist || '').toLowerCase();
        return title.includes(query) || artist.includes(query);
      });
    }

    // Apply genre filter
    if (genreFilter) {
      filtered = filtered.filter(item =>
        item.genres && item.genres.some(g => g === genreFilter)
      );
    }

    // Apply decade filter
    if (decadeFilter) {
      filtered = filtered.filter(item => {
        if (!item.year) return false;
        const decade = Math.floor(item.year / 10) * 10;
        return `${decade}s` === decadeFilter;
      });
    }

    // Apply format filter
    if (formatFilter) {
      filtered = filtered.filter(item => {
        const format = item.format || item.formats?.[0] || 'Unknown';
        return format === formatFilter;
      });
    }

    return filtered;
  };

  const calculateCollectionValue = () => {
    let total = 0, count = 0, currency = 'EUR';
    collection.forEach(item => {
      const price = item.price?.value || item.lowestPrice;
      if (price && typeof price === 'number') {
        total += price;
        count++;
        if (item.price?.currency) currency = item.price.currency;
      }
    });
    return { value: total.toFixed(2), currency, count };
  };

  const toggleShop = (shop) => {
    setSelectedShops(prev =>
      prev.includes(shop) ? prev.filter(s => s !== shop) : [...prev, shop]
    );
  };

  // Memoize expensive filtering and sorting operations
  const filteredAndSorted = useMemo(() =>
    sortCollection(filterCollection(collection, collectionFilter, collectionSearch, activeGenreFilter, activeDecadeFilter, activeFormatFilter), sortBy),
    [collection, collectionFilter, collectionSearch, activeGenreFilter, activeDecadeFilter, activeFormatFilter, sortBy]
  );

  const collectionValue = useMemo(() =>
    calculateCollectionValue(),
    [collection]
  );

  const renderHeader = () => (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '56px',
      backgroundColor: themes.surface,
      borderBottom: `1px solid ${themes.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `0 ${designSystem.spacing.md}`,
      zIndex: 100,
      boxShadow: designSystem.shadows.sm
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: designSystem.spacing.sm
      }}>
        {!logoError ? (
          <img
            src={LOGO_PATH}
            alt="VinylScout Logo"
            style={{
              height: '36px',
              width: 'auto',
              objectFit: 'contain'
            }}
            onError={() => setLogoError(true)}
          />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: designSystem.spacing.xs
          }}>
            <Music size={22} color={themes.primary} />
            <h1 style={{
              fontSize: designSystem.typography.sizes.base,
              fontWeight: designSystem.typography.weights.bold,
              color: themes.text,
              margin: 0
            }}>
              VinylScout
            </h1>
          </div>
        )}
      </div>
    </header>
  );

  const renderNavigation = () => (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: designSystem.spacing.md,
      backgroundColor: themes.surface,
      borderTop: `1px solid ${themes.border}`,
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100
    }}>
      {[
        { id: 'search', icon: Search, label: 'Search' },
        { id: 'camera', icon: Camera, label: 'Camera' },
        { id: 'collection', icon: Grid, label: 'Collection' },
        { id: 'stats', icon: BarChart3, label: 'Stats' },
        { id: 'settings', icon: Settings, label: 'Settings' }
      ].map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => handleViewChange(id)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: designSystem.spacing.xs,
            padding: designSystem.spacing.sm,
            minWidth: designSystem.touchTarget.min,
            minHeight: designSystem.touchTarget.min,
            backgroundColor: 'transparent',
            border: 'none',
            color: view === id ? themes.primary : themes.textSecondary,
            cursor: 'pointer',
            transition: designSystem.transitions.fast
          }}
        >
          <Icon size={designSystem.iconSize.md} />
          <span style={{ fontSize: designSystem.typography.sizes.xs }}>{label}</span>
        </button>
      ))}
    </nav>
  );

  const renderSearchView = () => (
    <SearchView
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      advancedSearch={advancedSearch}
      onAdvancedSearchChange={setAdvancedSearch}
      searchResults={searchResults}
      isLoading={isLoading}
      currentPage={currentPage}
      totalPages={totalPages}
      resultPrices={resultPrices}
      refreshingPrices={refreshingPrices}
      priceChanges={priceChanges}
      collection={collection}
      onSearch={(query, page) => searchDiscogs(false, query, page)}
      onAdvancedSearch={() => searchDiscogs(true, null, 1)}
      onPageChange={(page) => searchDiscogs(false, searchQuery, page)}
      onRefreshPrice={refreshPrice}
      onAddToCollection={addToCollection}
      onRemoveFromCollection={removeFromCollection}
      onViewDetails={setSelectedResult}
      themes={themes}
    />
  );

  const renderCameraView = () => (
    <div style={{
      position: 'relative',
      width: '100%',
      height: 'calc(100vh - 56px - 80px)',
      backgroundColor: '#000',
      display: 'flex',
      flexDirection: 'column',
      marginTop: '56px',
      overflow: 'hidden'
    }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: '100%',
          flex: 1,
          objectFit: 'cover',
          backgroundColor: '#000'
        }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      <div style={{
        position: 'absolute',
        bottom: designSystem.spacing.xl,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        padding: designSystem.spacing.md,
        zIndex: 101
      }}>
        <button
          onClick={() => {
            if (!anthropicToken) {
              showToast('Please enter your Anthropic API key in Settings to use camera identification', 'error');
              return;
            }
            if (!isCameraActive) {
              showToast('Camera is not active. Please allow camera access.', 'error');
              return;
            }
            captureAndAnalyze();
          }}
          disabled={isAnalyzing}
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: '4px solid #FFFFFF',
            cursor: isAnalyzing ? 'not-allowed' : 'pointer',
            opacity: isAnalyzing ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.1s ease',
            position: 'relative'
          }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: isAnalyzing ? '#FFA500' : '#EF4444',
            border: '3px solid #FFFFFF'
          }} />
        </button>
      </div>

      {cameraError && (
        <div style={{
          position: 'absolute',
          top: designSystem.spacing.md,
          left: designSystem.spacing.md,
          right: designSystem.spacing.md,
          padding: designSystem.spacing.md,
          backgroundColor: withOpacity(themes.error, 0.9),
          color: '#FFFFFF',
          borderRadius: designSystem.borderRadius.md,
          fontSize: designSystem.typography.sizes.sm
        }}>
          {cameraError}
        </div>
      )}
    </div>
  );

  const renderCollectionView = () => {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        padding: designSystem.spacing.md,
        paddingTop: '72px',
        paddingBottom: `calc(${designSystem.spacing.nav} + ${designSystem.spacing.md})`
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: designSystem.spacing.lg
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: designSystem.spacing.sm }}>
              <h2 style={{
                fontSize: designSystem.typography.sizes.xl,
                fontWeight: designSystem.typography.weights.bold,
                color: themes.text,
                margin: 0
              }}>
                Collection
              </h2>
              <span style={{
                backgroundColor: themes.primary,
                color: '#FFFFFF',
                padding: `${designSystem.spacing.xs} ${designSystem.spacing.sm}`,
                borderRadius: designSystem.borderRadius.sm,
                fontSize: designSystem.typography.sizes.sm,
                fontWeight: designSystem.typography.weights.medium
              }}>
                {filteredAndSorted.length}{filteredAndSorted.length !== collection.length ? `/${collection.length}` : ''}
              </span>
            </div>
            {collectionValue.count > 0 && (
              <p style={{
                fontSize: designSystem.typography.sizes.sm,
                color: themes.primary,
                margin: `${designSystem.spacing.xs} 0 0 0`,
                fontWeight: designSystem.typography.weights.medium
              }}>
                Total Value: {collectionValue.value} {collectionValue.currency}
              </p>
            )}
          </div>
          <button
            onClick={updateAllPrices}
            disabled={isUpdatingAllPrices}
            style={{
              padding: `${designSystem.spacing.sm} ${designSystem.spacing.md}`,
              minHeight: designSystem.touchTarget.min,
              backgroundColor: themes.primary,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: designSystem.borderRadius.sm,
              cursor: isUpdatingAllPrices ? 'not-allowed' : 'pointer',
              opacity: isUpdatingAllPrices ? 0.6 : 1,
              fontSize: designSystem.typography.sizes.sm,
              fontWeight: designSystem.typography.weights.medium,
              display: 'flex',
              alignItems: 'center',
              gap: designSystem.spacing.xs
            }}
          >
            {isUpdatingAllPrices ? (
              <>
                <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Updating...</span>
              </>
            ) : 'Update Prices'}
          </button>
        </div>

        {/* Search Input */}
        <div style={{ marginBottom: designSystem.spacing.md }}>
          <input
            type="text"
            value={collectionSearch}
            onChange={(e) => setCollectionSearch(e.target.value)}
            placeholder="Search by artist or album..."
            style={{
              width: '100%',
              padding: designSystem.spacing.md,
              fontSize: designSystem.typography.sizes.base,
              backgroundColor: themes.surface,
              color: themes.text,
              border: `1px solid ${themes.border}`,
              borderRadius: designSystem.borderRadius.md,
              outline: 'none',
              transition: designSystem.transitions.fast
            }}
            onFocus={(e) => e.target.style.borderColor = themes.primary}
            onBlur={(e) => e.target.style.borderColor = themes.border}
          />
        </div>

        {/* Active Filter Badges */}
        {(activeGenreFilter || activeDecadeFilter || activeFormatFilter) && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: designSystem.spacing.xs,
            marginBottom: designSystem.spacing.md,
            padding: designSystem.spacing.md,
            backgroundColor: themes.primary10,
            border: `1px solid ${themes.primary20}`,
            borderRadius: designSystem.borderRadius.md
          }}>
            <span style={{
              fontSize: designSystem.typography.sizes.sm,
              color: themes.textSecondary,
              display: 'flex',
              alignItems: 'center',
              paddingRight: designSystem.spacing.sm
            }}>
              Filters:
            </span>
            {activeGenreFilter && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: designSystem.spacing.xs,
                padding: `${designSystem.spacing.xs} ${designSystem.spacing.sm}`,
                backgroundColor: themes.primary,
                color: '#FFFFFF',
                borderRadius: designSystem.borderRadius.sm,
                fontSize: designSystem.typography.sizes.sm,
                fontWeight: designSystem.typography.weights.medium
              }}>
                <span>Genre: {activeGenreFilter}</span>
                <button
                  onClick={() => setActiveGenreFilter(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}
            {activeDecadeFilter && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: designSystem.spacing.xs,
                padding: `${designSystem.spacing.xs} ${designSystem.spacing.sm}`,
                backgroundColor: themes.primary,
                color: '#FFFFFF',
                borderRadius: designSystem.borderRadius.sm,
                fontSize: designSystem.typography.sizes.sm,
                fontWeight: designSystem.typography.weights.medium
              }}>
                <span>Decade: {activeDecadeFilter}</span>
                <button
                  onClick={() => setActiveDecadeFilter(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}
            {activeFormatFilter && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: designSystem.spacing.xs,
                padding: `${designSystem.spacing.xs} ${designSystem.spacing.sm}`,
                backgroundColor: themes.primary,
                color: '#FFFFFF',
                borderRadius: designSystem.borderRadius.sm,
                fontSize: designSystem.typography.sizes.sm,
                fontWeight: designSystem.typography.weights.medium
              }}>
                <span>Format: {activeFormatFilter}</span>
                <button
                  onClick={() => setActiveFormatFilter(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <button
              onClick={() => {
                setActiveGenreFilter(null);
                setActiveDecadeFilter(null);
                setActiveFormatFilter(null);
              }}
              style={{
                marginLeft: 'auto',
                padding: `${designSystem.spacing.xs} ${designSystem.spacing.sm}`,
                backgroundColor: 'transparent',
                color: themes.textSecondary,
                border: `1px solid ${themes.border}`,
                borderRadius: designSystem.borderRadius.sm,
                cursor: 'pointer',
                fontSize: designSystem.typography.sizes.sm,
                fontWeight: designSystem.typography.weights.medium,
                transition: designSystem.transitions.fast
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = themes.hoverOverlay;
                e.currentTarget.style.borderColor = themes.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = themes.border;
              }}
            >
              Clear All
            </button>
          </div>
        )}

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: designSystem.spacing.md,
          marginBottom: designSystem.spacing.lg,
          padding: designSystem.spacing.md,
          backgroundColor: themes.surface,
          border: `1px solid ${themes.border}`,
          borderRadius: designSystem.borderRadius.md
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: designSystem.spacing.xs }}>
            <button
              onClick={() => setCollectionView('grid')}
              style={{
                padding: designSystem.spacing.sm,
                minWidth: designSystem.touchTarget.min,
                minHeight: designSystem.touchTarget.min,
                backgroundColor: collectionView === 'grid' ? themes.primary : 'transparent',
                color: collectionView === 'grid' ? '#FFFFFF' : themes.textSecondary,
                border: `1px solid ${collectionView === 'grid' ? themes.primary : themes.border}`,
                borderRadius: designSystem.borderRadius.sm,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setCollectionView('list')}
              style={{
                padding: designSystem.spacing.sm,
                minWidth: designSystem.touchTarget.min,
                minHeight: designSystem.touchTarget.min,
                backgroundColor: collectionView === 'list' ? themes.primary : 'transparent',
                color: collectionView === 'list' ? '#FFFFFF' : themes.textSecondary,
                border: `1px solid ${collectionView === 'list' ? themes.primary : themes.border}`,
                borderRadius: designSystem.borderRadius.sm,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <List size={20} />
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              flex: 1,
              minWidth: '150px',
              padding: designSystem.spacing.sm,
              fontSize: designSystem.typography.sizes.sm,
              backgroundColor: themes.background,
              color: themes.text,
              border: `1px solid ${themes.border}`,
              borderRadius: designSystem.borderRadius.sm,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="artist-asc">Artist (A-Z)</option>
            <option value="artist-desc">Artist (Z-A)</option>
            <option value="album-asc">Album (A-Z)</option>
            <option value="album-desc">Album (Z-A)</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
            <option value="date-new">Recently Added</option>
            <option value="date-old">Oldest First</option>
          </select>

          <select
            value={collectionFilter}
            onChange={(e) => setCollectionFilter(e.target.value)}
            style={{
              minWidth: '120px',
              padding: designSystem.spacing.sm,
              fontSize: designSystem.typography.sizes.sm,
              backgroundColor: themes.background,
              color: themes.text,
              border: `1px solid ${themes.border}`,
              borderRadius: designSystem.borderRadius.sm,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Items</option>
            <option value="favorites">Favorites Only</option>
          </select>
        </div>

        {filteredAndSorted.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            backgroundColor: themes.surface,
            borderRadius: designSystem.borderRadius.lg,
            border: `2px dashed ${themes.border}`
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              backgroundColor: withOpacity(themes.primary, 0.1),
              borderRadius: designSystem.borderRadius.circle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Music size={40} color={themes.primary} style={{ opacity: 0.6 }} />
            </div>
            <h3 style={{
              color: themes.text,
              fontSize: designSystem.typography.sizes.xl,
              fontWeight: designSystem.typography.weights.bold,
              margin: '0 0 12px 0'
            }}>
              {collectionSearch ? 'No Results Found' : collectionFilter === 'favorites' ? 'No Favorites Yet' : 'Start Your Collection'}
            </h3>
            <p style={{
              color: themes.textSecondary,
              fontSize: designSystem.typography.sizes.base,
              margin: '0 0 24px 0',
              maxWidth: '400px',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6
            }}>
              {collectionSearch
                ? `No vinyls match "${collectionSearch}". Try a different search term.`
                : collectionFilter === 'favorites'
                ? 'Star your favorite vinyls to quickly access them here'
                : 'Search for your vinyl records and add them to track their value over time'}
            </p>
            {collectionFilter === 'all' && !collectionSearch && (
              <button
                onClick={() => handleViewChange('search')}
                style={{
                  padding: `${designSystem.spacing.md} ${designSystem.spacing.xl}`,
                  backgroundColor: themes.primary,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: designSystem.borderRadius.md,
                  cursor: 'pointer',
                  fontSize: designSystem.typography.sizes.base,
                  fontWeight: designSystem.typography.weights.medium,
                  boxShadow: designSystem.shadows.md,
                  transition: designSystem.transitions.fast
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = designSystem.shadows.lg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = designSystem.shadows.md;
                }}
              >
                Start Searching
              </button>
            )}
            {collectionSearch && (
              <button
                onClick={() => setCollectionSearch('')}
                style={{
                  padding: `${designSystem.spacing.sm} ${designSystem.spacing.lg}`,
                  backgroundColor: 'transparent',
                  color: themes.primary,
                  border: `2px solid ${themes.primary}`,
                  borderRadius: designSystem.borderRadius.md,
                  cursor: 'pointer',
                  fontSize: designSystem.typography.sizes.sm,
                  fontWeight: designSystem.typography.weights.medium,
                  transition: designSystem.transitions.fast
                }}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: collectionView === 'grid' ? 'grid' : 'flex',
            gridTemplateColumns: collectionView === 'grid' ? 'repeat(auto-fill, minmax(160px, 1fr))' : 'unset',
            flexDirection: collectionView === 'list' ? 'column' : 'unset',
            gap: collectionView === 'list' ? designSystem.spacing.sm : designSystem.spacing.md
          }}>
            {filteredAndSorted.map(item => {
            const priceChange = getPriceChange(item);
            const isListView = collectionView === 'list';
            return (
              <div
                key={item.id}
                onClick={() => setSelectedVinyl(item)}
                style={{
                  backgroundColor: themes.surface,
                  borderRadius: designSystem.borderRadius.md,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: `1px solid ${themes.border}`,
                  transition: 'all 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                  position: 'relative',
                  transform: 'translateY(0)',
                  boxShadow: designSystem.shadows.sm,
                  display: isListView ? 'flex' : 'block',
                  flexDirection: isListView ? 'row' : 'column',
                  alignItems: isListView ? 'center' : 'stretch'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = isListView ? 'translateX(4px)' : 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = designSystem.shadows.lg;
                  e.currentTarget.style.borderColor = themes.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = isListView ? 'translateX(0)' : 'translateY(0)';
                  e.currentTarget.style.boxShadow = designSystem.shadows.sm;
                  e.currentTarget.style.borderColor = themes.border;
                }}
              >
                {item.isFavorite && (
                  <div style={{
                    position: 'absolute',
                    top: designSystem.spacing.sm,
                    right: designSystem.spacing.sm,
                    backgroundColor: withOpacity(themes.warning, 0.9),
                    borderRadius: designSystem.borderRadius.circle,
                    padding: designSystem.spacing.xs,
                    zIndex: 1
                  }}>
                    <Star size={designSystem.iconSize.sm} fill={themes.warning} color={themes.warning} />
                  </div>
                )}
                <img
                  src={item.thumb || item.cover_image}
                  alt={item.title}
                  loading="lazy"
                  style={{
                    width: isListView ? '80px' : '100%',
                    height: isListView ? '80px' : 'auto',
                    aspectRatio: '1',
                    objectFit: 'cover',
                    backgroundColor: themes.border,
                    flexShrink: 0
                  }}
                />
                <div style={{
                  padding: designSystem.spacing.sm,
                  flex: isListView ? 1 : 'unset',
                  display: isListView ? 'flex' : 'block',
                  flexDirection: isListView ? 'row' : 'column',
                  justifyContent: isListView ? 'space-between' : 'flex-start',
                  alignItems: isListView ? 'center' : 'stretch',
                  gap: isListView ? designSystem.spacing.md : 0
                }}>
                  <div style={{ flex: isListView ? 1 : 'unset' }}>
                    <h3 style={{
                      fontSize: isListView ? designSystem.typography.sizes.base : designSystem.typography.sizes.sm,
                      fontWeight: designSystem.typography.weights.medium,
                      color: themes.text,
                      margin: `0 0 ${designSystem.spacing.xs} 0`,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.title}
                    </h3>
                    {isListView && item.year && (
                      <p style={{
                        fontSize: designSystem.typography.sizes.sm,
                        color: themes.textSecondary,
                        margin: 0
                      }}>
                        {item.year}
                      </p>
                    )}
                  </div>
                  {item.lowestPrice !== null && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: designSystem.spacing.xs,
                      marginTop: designSystem.spacing.xs
                    }}>
                      <span style={{
                        fontSize: designSystem.typography.sizes.sm,
                        fontWeight: designSystem.typography.weights.medium,
                        color: themes.primary
                      }}>
                        ${item.lowestPrice?.toFixed(2)}
                      </span>
                      {priceChange && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          fontSize: designSystem.typography.sizes.xs,
                          color: priceChange.isPositive ? themes.success : priceChange.isNegative ? themes.error : themes.textSecondary
                        }}>
                          {priceChange.isPositive && <TrendingUp size={12} />}
                          {priceChange.isNegative && <TrendingDown size={12} />}
                          {!priceChange.isPositive && !priceChange.isNegative && <Minus size={12} />}
                          <span>{Math.abs(priceChange.value).toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
    );
  };

  const renderStatsView = () => {
    const stats = getStats();

    return (
      <div style={{
        width: '100%',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        padding: designSystem.spacing.md,
        paddingTop: '72px',
        paddingBottom: `calc(${designSystem.spacing.nav} + ${designSystem.spacing.md})`
      }}>
        <h2 style={{
          fontSize: designSystem.typography.sizes.xl,
          fontWeight: designSystem.typography.weights.bold,
          color: themes.text,
          marginBottom: designSystem.spacing.lg
        }}>
          Statistics
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: designSystem.spacing.md,
          marginBottom: designSystem.spacing.xl
        }}>
          {[
            { label: 'Total Vinyls', value: stats.total },
            { label: 'Favorites', value: stats.favorites },
            { label: 'With Price', value: stats.withPrice },
            { label: 'Added (7 days)', value: stats.recentAdditions },
            { label: 'Total Value', value: formatPrice(stats.totalValue, stats.currency) },
            { label: 'Avg Value', value: formatPrice(stats.avgValue, stats.currency) },
            { label: 'Most Valuable', value: stats.mostValuable ? `$${stats.mostValuable.lowestPrice.toFixed(2)}` : 'N/A' }
          ].map(stat => (
            <div
              key={stat.label}
              style={{
                backgroundColor: themes.surface,
                padding: designSystem.spacing.md,
                borderRadius: designSystem.borderRadius.md,
                border: `1px solid ${themes.border}`
              }}
            >
              <p style={{
                fontSize: designSystem.typography.sizes.xs,
                color: themes.textSecondary,
                margin: `0 0 ${designSystem.spacing.xs} 0`
              }}>
                {stat.label}
              </p>
              <p style={{
                fontSize: designSystem.typography.sizes.lg,
                fontWeight: designSystem.typography.weights.bold,
                color: themes.text,
                margin: 0
              }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {stats.topGenres.length > 0 && (
          <div style={{ marginBottom: designSystem.spacing.xl }}>
            <h3 style={{
              fontSize: designSystem.typography.sizes.lg,
              fontWeight: designSystem.typography.weights.semibold,
              color: themes.text,
              marginBottom: designSystem.spacing.md
            }}>
              Top Genres
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: designSystem.spacing.sm }}>
              {stats.topGenres.map(([genre, count]) => (
                <div
                  key={genre}
                  onClick={() => {
                    setActiveGenreFilter(genre);
                    setActiveDecadeFilter(null);
                    setActiveFormatFilter(null);
                    handleViewChange('collection');
                  }}
                  style={{
                    backgroundColor: themes.surface,
                    padding: designSystem.spacing.md,
                    borderRadius: designSystem.borderRadius.md,
                    border: `1px solid ${themes.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: designSystem.transitions.fast
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = themes.hoverOverlay;
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = themes.surface;
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <span style={{
                    fontSize: designSystem.typography.sizes.base,
                    color: themes.text
                  }}>
                    {genre}
                  </span>
                  <span style={{
                    fontSize: designSystem.typography.sizes.sm,
                    fontWeight: designSystem.typography.weights.medium,
                    color: themes.primary
                  }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.topDecades.length > 0 && (
          <div style={{ marginBottom: designSystem.spacing.xl }}>
            <h3 style={{
              fontSize: designSystem.typography.sizes.lg,
              fontWeight: designSystem.typography.weights.semibold,
              color: themes.text,
              marginBottom: designSystem.spacing.md
            }}>
              By Decade
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: designSystem.spacing.sm }}>
              {stats.topDecades.map(([decade, count]) => (
                <div
                  key={decade}
                  onClick={() => {
                    setActiveDecadeFilter(decade);
                    setActiveGenreFilter(null);
                    setActiveFormatFilter(null);
                    handleViewChange('collection');
                  }}
                  style={{
                    backgroundColor: themes.surface,
                    padding: designSystem.spacing.md,
                    borderRadius: designSystem.borderRadius.md,
                    border: `1px solid ${themes.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: designSystem.transitions.fast
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = themes.hoverOverlay;
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = themes.surface;
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <span style={{
                    fontSize: designSystem.typography.sizes.base,
                    color: themes.text
                  }}>
                    {decade}
                  </span>
                  <span style={{
                    fontSize: designSystem.typography.sizes.sm,
                    fontWeight: designSystem.typography.weights.medium,
                    color: themes.primary
                  }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.topFormats.length > 0 && (
          <div>
            <h3 style={{
              fontSize: designSystem.typography.sizes.lg,
              fontWeight: designSystem.typography.weights.semibold,
              color: themes.text,
              marginBottom: designSystem.spacing.md
            }}>
              By Format
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: designSystem.spacing.sm }}>
              {stats.topFormats.map(([format, count]) => (
                <div
                  key={format}
                  onClick={() => {
                    setActiveFormatFilter(format);
                    setActiveGenreFilter(null);
                    setActiveDecadeFilter(null);
                    handleViewChange('collection');
                  }}
                  style={{
                    backgroundColor: themes.surface,
                    padding: designSystem.spacing.md,
                    borderRadius: designSystem.borderRadius.md,
                    border: `1px solid ${themes.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: designSystem.transitions.fast
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = themes.hoverOverlay;
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = themes.surface;
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <span style={{
                    fontSize: designSystem.typography.sizes.base,
                    color: themes.text
                  }}>
                    {format}
                  </span>
                  <span style={{
                    fontSize: designSystem.typography.sizes.sm,
                    fontWeight: designSystem.typography.weights.medium,
                    color: themes.primary
                  }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NEW: Top Artists Section */}
        {stats.topArtists.length > 0 && (
          <div style={{ marginBottom: designSystem.spacing.xl }}>
            <h3 style={{
              fontSize: designSystem.typography.sizes.lg,
              fontWeight: designSystem.typography.weights.semibold,
              color: themes.text,
              marginBottom: designSystem.spacing.md
            }}>
              Top Artists
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: designSystem.spacing.sm }}>
              {stats.topArtists.slice(0, 5).map(([artist, count]) => (
                <div
                  key={artist}
                  style={{
                    backgroundColor: themes.surface,
                    padding: designSystem.spacing.md,
                    borderRadius: designSystem.borderRadius.md,
                    border: `1px solid ${themes.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{
                    fontSize: designSystem.typography.sizes.base,
                    color: themes.text,
                    fontWeight: designSystem.typography.weights.medium
                  }}>
                    {artist}
                  </span>
                  <span style={{
                    fontSize: designSystem.typography.sizes.sm,
                    fontWeight: designSystem.typography.weights.bold,
                    color: themes.primary
                  }}>
                    {count} album{count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NEW: Top Labels Section */}
        {stats.topLabels.length > 0 && (
          <div style={{ marginBottom: designSystem.spacing.xl }}>
            <h3 style={{
              fontSize: designSystem.typography.sizes.lg,
              fontWeight: designSystem.typography.weights.semibold,
              color: themes.text,
              marginBottom: designSystem.spacing.md
            }}>
              Top Record Labels
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: designSystem.spacing.sm }}>
              {stats.topLabels.map(([label, count]) => (
                <div
                  key={label}
                  style={{
                    backgroundColor: themes.surface,
                    padding: designSystem.spacing.md,
                    borderRadius: designSystem.borderRadius.md,
                    border: `1px solid ${themes.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{
                    fontSize: designSystem.typography.sizes.base,
                    color: themes.text
                  }}>
                    {label}
                  </span>
                  <span style={{
                    fontSize: designSystem.typography.sizes.sm,
                    fontWeight: designSystem.typography.weights.medium,
                    color: themes.primary
                  }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NEW: Collection Insights Grid */}
        <div style={{ marginBottom: designSystem.spacing.xl }}>
          <h3 style={{
            fontSize: designSystem.typography.sizes.lg,
            fontWeight: designSystem.typography.weights.semibold,
            color: themes.text,
            marginBottom: designSystem.spacing.md
          }}>
            Collection Insights
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: designSystem.spacing.md
          }}>
            <div style={{
              backgroundColor: themes.surface,
              padding: designSystem.spacing.md,
              borderRadius: designSystem.borderRadius.md,
              border: `1px solid ${themes.border}`
            }}>
              <p style={{
                fontSize: designSystem.typography.sizes.xs,
                color: themes.textSecondary,
                margin: `0 0 ${designSystem.spacing.xs} 0`
              }}>Added This Month</p>
              <p style={{
                fontSize: designSystem.typography.sizes.xl,
                fontWeight: designSystem.typography.weights.bold,
                color: themes.primary,
                margin: 0
              }}>{stats.thisMonth}</p>
            </div>

            <div style={{
              backgroundColor: themes.surface,
              padding: designSystem.spacing.md,
              borderRadius: designSystem.borderRadius.md,
              border: `1px solid ${themes.border}`
            }}>
              <p style={{
                fontSize: designSystem.typography.sizes.xs,
                color: themes.textSecondary,
                margin: `0 0 ${designSystem.spacing.xs} 0`
              }}>Added This Year</p>
              <p style={{
                fontSize: designSystem.typography.sizes.xl,
                fontWeight: designSystem.typography.weights.bold,
                color: themes.primary,
                margin: 0
              }}>{stats.thisYear}</p>
            </div>

            <div style={{
              backgroundColor: themes.surface,
              padding: designSystem.spacing.md,
              borderRadius: designSystem.borderRadius.md,
              border: `1px solid ${themes.border}`
            }}>
              <p style={{
                fontSize: designSystem.typography.sizes.xs,
                color: themes.textSecondary,
                margin: `0 0 ${designSystem.spacing.xs} 0`
              }}>Total Tracks</p>
              <p style={{
                fontSize: designSystem.typography.sizes.xl,
                fontWeight: designSystem.typography.weights.bold,
                color: themes.text,
                margin: 0
              }}>{stats.totalTracks.toLocaleString()}</p>
            </div>

            <div style={{
              backgroundColor: themes.surface,
              padding: designSystem.spacing.md,
              borderRadius: designSystem.borderRadius.md,
              border: `1px solid ${themes.border}`
            }}>
              <p style={{
                fontSize: designSystem.typography.sizes.xs,
                color: themes.textSecondary,
                margin: `0 0 ${designSystem.spacing.xs} 0`
              }}>Avg Tracks/Album</p>
              <p style={{
                fontSize: designSystem.typography.sizes.xl,
                fontWeight: designSystem.typography.weights.bold,
                color: themes.text,
                margin: 0
              }}>{stats.avgTracksPerAlbum.toFixed(1)}</p>
            </div>

            <div style={{
              backgroundColor: themes.surface,
              padding: designSystem.spacing.md,
              borderRadius: designSystem.borderRadius.md,
              border: `1px solid ${themes.border}`
            }}>
              <p style={{
                fontSize: designSystem.typography.sizes.xs,
                color: themes.textSecondary,
                margin: `0 0 ${designSystem.spacing.xs} 0`
              }}>Total Runtime</p>
              <p style={{
                fontSize: designSystem.typography.sizes.xl,
                fontWeight: designSystem.typography.weights.bold,
                color: themes.text,
                margin: 0
              }}>
                {Math.floor(stats.totalRuntime / 3600)}h {Math.floor((stats.totalRuntime % 3600) / 60)}m
              </p>
            </div>

            <div style={{
              backgroundColor: themes.surface,
              padding: designSystem.spacing.md,
              borderRadius: designSystem.borderRadius.md,
              border: `1px solid ${themes.border}`
            }}>
              <p style={{
                fontSize: designSystem.typography.sizes.xs,
                color: themes.textSecondary,
                margin: `0 0 ${designSystem.spacing.xs} 0`
              }}>Avg Collection Age</p>
              <p style={{
                fontSize: designSystem.typography.sizes.xl,
                fontWeight: designSystem.typography.weights.bold,
                color: themes.text,
                margin: 0
              }}>{stats.avgAge.toFixed(0)} years</p>
            </div>

            <div style={{
              backgroundColor: themes.surface,
              padding: designSystem.spacing.md,
              borderRadius: designSystem.borderRadius.md,
              border: `1px solid ${themes.border}`
            }}>
              <p style={{
                fontSize: designSystem.typography.sizes.xs,
                color: themes.textSecondary,
                margin: `0 0 ${designSystem.spacing.xs} 0`
              }}>Genre Diversity</p>
              <p style={{
                fontSize: designSystem.typography.sizes.xl,
                fontWeight: designSystem.typography.weights.bold,
                color: themes.text,
                margin: 0
              }}>{stats.totalGenres} genres</p>
            </div>

            <div style={{
              backgroundColor: themes.surface,
              padding: designSystem.spacing.md,
              borderRadius: designSystem.borderRadius.md,
              border: `1px solid ${themes.border}`
            }}>
              <p style={{
                fontSize: designSystem.typography.sizes.xs,
                color: themes.textSecondary,
                margin: `0 0 ${designSystem.spacing.xs} 0`
              }}>Data Completeness</p>
              <p style={{
                fontSize: designSystem.typography.sizes.xl,
                fontWeight: designSystem.typography.weights.bold,
                color: stats.completenessScore > 80 ? '#10b981' : stats.completenessScore > 50 ? '#f59e0b' : '#ef4444',
                margin: 0
              }}>{stats.completenessScore.toFixed(0)}%</p>
            </div>
          </div>
        </div>

        {/* NEW: Release Timeline */}
        {(stats.oldestRelease || stats.newestRelease) && (
          <div style={{ marginBottom: designSystem.spacing.xl }}>
            <h3 style={{
              fontSize: designSystem.typography.sizes.lg,
              fontWeight: designSystem.typography.weights.semibold,
              color: themes.text,
              marginBottom: designSystem.spacing.md
            }}>
              Release Timeline
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: designSystem.spacing.md
            }}>
              {stats.oldestRelease && (
                <div style={{
                  backgroundColor: themes.surface,
                  padding: designSystem.spacing.md,
                  borderRadius: designSystem.borderRadius.md,
                  border: `1px solid ${themes.border}`
                }}>
                  <p style={{
                    fontSize: designSystem.typography.sizes.xs,
                    color: themes.textSecondary,
                    marginBottom: designSystem.spacing.sm
                  }}>Oldest Release</p>
                  <p style={{
                    fontSize: designSystem.typography.sizes.base,
                    fontWeight: designSystem.typography.weights.semibold,
                    color: themes.text,
                    margin: `0 0 ${designSystem.spacing.xs} 0`
                  }}>{stats.oldestRelease.title}</p>
                  <p style={{
                    fontSize: designSystem.typography.sizes.sm,
                    color: themes.textSecondary,
                    margin: 0
                  }}>{stats.oldestRelease.artist} • {stats.oldestRelease.year}</p>
                </div>
              )}
              {stats.newestRelease && (
                <div style={{
                  backgroundColor: themes.surface,
                  padding: designSystem.spacing.md,
                  borderRadius: designSystem.borderRadius.md,
                  border: `1px solid ${themes.border}`
                }}>
                  <p style={{
                    fontSize: designSystem.typography.sizes.xs,
                    color: themes.textSecondary,
                    marginBottom: designSystem.spacing.sm
                  }}>Newest Release</p>
                  <p style={{
                    fontSize: designSystem.typography.sizes.base,
                    fontWeight: designSystem.typography.weights.semibold,
                    color: themes.text,
                    margin: `0 0 ${designSystem.spacing.xs} 0`
                  }}>{stats.newestRelease.title}</p>
                  <p style={{
                    fontSize: designSystem.typography.sizes.sm,
                    color: themes.textSecondary,
                    margin: 0
                  }}>{stats.newestRelease.artist} • {stats.newestRelease.year}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NEW: Value Distribution */}
        {stats.withPrice > 0 && (
          <div style={{ marginBottom: designSystem.spacing.xl }}>
            <h3 style={{
              fontSize: designSystem.typography.sizes.lg,
              fontWeight: designSystem.typography.weights.semibold,
              color: themes.text,
              marginBottom: designSystem.spacing.md
            }}>
              Value Distribution
            </h3>
            <div style={{
              backgroundColor: themes.surface,
              padding: designSystem.spacing.lg,
              borderRadius: designSystem.borderRadius.md,
              border: `1px solid ${themes.border}`
            }}>
              {Object.entries(stats.priceRanges).map(([range, count]) => {
                const percentage = stats.withPrice > 0 ? (count / stats.withPrice) * 100 : 0;
                return (
                  <div key={range} style={{ marginBottom: designSystem.spacing.md }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: designSystem.spacing.xs
                    }}>
                      <span style={{
                        fontSize: designSystem.typography.sizes.sm,
                        color: themes.text
                      }}>{stats.currency} {range}</span>
                      <span style={{
                        fontSize: designSystem.typography.sizes.sm,
                        fontWeight: designSystem.typography.weights.medium,
                        color: themes.primary
                      }}>{count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div style={{
                      height: '8px',
                      backgroundColor: withOpacity(themes.border, 0.3),
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${percentage}%`,
                        backgroundColor: themes.primary,
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* NEW: Price Losers (if any) */}
        {stats.priceLosers.length > 0 && (
          <div style={{ marginBottom: designSystem.spacing.xl }}>
            <h3 style={{
              fontSize: designSystem.typography.sizes.lg,
              fontWeight: designSystem.typography.weights.semibold,
              color: themes.text,
              marginBottom: designSystem.spacing.md
            }}>
              Price Decliners
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: designSystem.spacing.sm }}>
              {stats.priceLosers.map(item => {
                const change = getPriceChange(item);
                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: themes.surface,
                      padding: designSystem.spacing.md,
                      borderRadius: designSystem.borderRadius.md,
                      border: `1px solid ${themes.border}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <p style={{
                        fontSize: designSystem.typography.sizes.base,
                        fontWeight: designSystem.typography.weights.medium,
                        color: themes.text,
                        margin: `0 0 ${designSystem.spacing.xs} 0`
                      }}>{item.title}</p>
                      <p style={{
                        fontSize: designSystem.typography.sizes.sm,
                        color: themes.textSecondary,
                        margin: 0
                      }}>{item.artist}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{
                        fontSize: designSystem.typography.sizes.lg,
                        fontWeight: designSystem.typography.weights.bold,
                        color: '#ef4444',
                        margin: 0
                      }}>{change?.value.toFixed(1)}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* NEW: Valuable Items (Rarest/Most Expensive) */}
        {stats.rarestItems.length > 0 && (
          <div style={{ marginBottom: designSystem.spacing.xl }}>
            <h3 style={{
              fontSize: designSystem.typography.sizes.lg,
              fontWeight: designSystem.typography.weights.semibold,
              color: themes.text,
              marginBottom: designSystem.spacing.md
            }}>
              Most Valuable Items (€100+)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: designSystem.spacing.sm }}>
              {stats.rarestItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: themes.surface,
                    padding: designSystem.spacing.md,
                    borderRadius: designSystem.borderRadius.md,
                    border: `1px solid ${themes.border}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <p style={{
                      fontSize: designSystem.typography.sizes.base,
                      fontWeight: designSystem.typography.weights.medium,
                      color: themes.text,
                      margin: `0 0 ${designSystem.spacing.xs} 0`
                    }}>{item.title}</p>
                    <p style={{
                      fontSize: designSystem.typography.sizes.sm,
                      color: themes.textSecondary,
                      margin: 0
                    }}>{item.artist} • {item.year}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{
                      fontSize: designSystem.typography.sizes.xl,
                      fontWeight: designSystem.typography.weights.bold,
                      color: '#f59e0b',
                      margin: 0
                    }}>{stats.currency} {item.lowestPrice.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NEW: Collection Growth Indicator */}
        {stats.avgValueGrowth !== 0 && (
          <div style={{
            backgroundColor: withOpacity(stats.avgValueGrowth > 0 ? '#10b981' : '#ef4444', 0.1),
            padding: designSystem.spacing.lg,
            borderRadius: designSystem.borderRadius.md,
            border: `1px solid ${withOpacity(stats.avgValueGrowth > 0 ? '#10b981' : '#ef4444', 0.3)}`,
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: designSystem.typography.sizes.sm,
              color: themes.textSecondary,
              margin: `0 0 ${designSystem.spacing.sm} 0`
            }}>Average Collection Value Growth</p>
            <p style={{
              fontSize: designSystem.typography.sizes.xxl,
              fontWeight: designSystem.typography.weights.bold,
              color: stats.avgValueGrowth > 0 ? '#10b981' : '#ef4444',
              margin: 0
            }}>
              {stats.avgValueGrowth > 0 ? '+' : ''}{stats.currency} {Math.abs(stats.avgValueGrowth).toFixed(2)}
            </p>
            <p style={{
              fontSize: designSystem.typography.sizes.xs,
              color: themes.textSecondary,
              marginTop: designSystem.spacing.xs
            }}>per album since tracking began</p>
          </div>
        )}
      </div>
    );
  };

  const renderSettingsView = () => (
    <div style={{
      width: '100%',
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      padding: designSystem.spacing.md,
      paddingTop: '72px',
      paddingBottom: `calc(${designSystem.spacing.nav} + ${designSystem.spacing.md})`
    }}>
      <h2 style={{
        fontSize: designSystem.typography.sizes.xl,
        fontWeight: designSystem.typography.weights.bold,
        color: themes.text,
        marginBottom: designSystem.spacing.lg
      }}>
        Settings
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: designSystem.spacing.lg }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: designSystem.typography.sizes.sm,
            fontWeight: designSystem.typography.weights.medium,
            color: themes.text,
            marginBottom: designSystem.spacing.sm
          }}>
            Discogs Token
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showDiscogsToken ? 'text' : 'password'}
              value={discogsToken}
              onChange={(e) => {
                setDiscogsToken(e.target.value);
                localStorage.setItem('discogsToken', e.target.value);
              }}
              placeholder="Enter your Discogs token"
              style={{
                width: '100%',
                padding: designSystem.spacing.md,
                paddingRight: designSystem.spacing.xxl,
                fontSize: designSystem.typography.sizes.xs,
                fontFamily: 'monospace',
                backgroundColor: themes.surface,
                color: themes.text,
                border: `1px solid ${themes.border}`,
                borderRadius: designSystem.borderRadius.md,
                outline: 'none'
              }}
            />
            <button
              onClick={() => setShowDiscogsToken(!showDiscogsToken)}
              style={{
                position: 'absolute',
                right: designSystem.spacing.sm,
                top: '50%',
                transform: 'translateY(-50%)',
                padding: designSystem.spacing.sm,
                minWidth: designSystem.touchTarget.min,
                minHeight: designSystem.touchTarget.min,
                backgroundColor: 'transparent',
                border: 'none',
                color: themes.textSecondary,
                cursor: 'pointer'
              }}
            >
              {showDiscogsToken ? <EyeOff size={designSystem.iconSize.sm} /> : <Eye size={designSystem.iconSize.sm} />}
            </button>
          </div>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: designSystem.typography.sizes.sm,
            fontWeight: designSystem.typography.weights.medium,
            color: themes.text,
            marginBottom: designSystem.spacing.sm
          }}>
            Anthropic API Key
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showAnthropicToken ? 'text' : 'password'}
              value={anthropicToken}
              onChange={(e) => {
                setAnthropicToken(e.target.value);
                localStorage.setItem('anthropicToken', e.target.value);
              }}
              placeholder="Enter your Anthropic API key"
              style={{
                width: '100%',
                padding: designSystem.spacing.md,
                paddingRight: designSystem.spacing.xxl,
                fontSize: designSystem.typography.sizes.xs,
                fontFamily: 'monospace',
                backgroundColor: themes.surface,
                color: themes.text,
                border: `1px solid ${themes.border}`,
                borderRadius: designSystem.borderRadius.md,
                outline: 'none'
              }}
            />
            <button
              onClick={() => setShowAnthropicToken(!showAnthropicToken)}
              style={{
                position: 'absolute',
                right: designSystem.spacing.sm,
                top: '50%',
                transform: 'translateY(-50%)',
                padding: designSystem.spacing.sm,
                minWidth: designSystem.touchTarget.min,
                minHeight: designSystem.touchTarget.min,
                backgroundColor: 'transparent',
                border: 'none',
                color: themes.textSecondary,
                cursor: 'pointer'
              }}
            >
              {showAnthropicToken ? <EyeOff size={designSystem.iconSize.sm} /> : <Eye size={designSystem.iconSize.sm} />}
            </button>
          </div>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: designSystem.typography.sizes.sm,
            fontWeight: designSystem.typography.weights.medium,
            color: themes.text,
            marginBottom: designSystem.spacing.sm
          }}>
            Theme
          </label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            style={{
              width: '100%',
              padding: designSystem.spacing.md,
              fontSize: designSystem.typography.sizes.base,
              backgroundColor: themes.surface,
              color: themes.text,
              border: `1px solid ${themes.border}`,
              borderRadius: designSystem.borderRadius.md,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="classic">Classic</option>
            <option value="dark">Dark</option>
            <option value="neon">Neon</option>
            <option value="forest">Forest</option>
            <option value="sunset">Sunset</option>
            <option value="midnight">Midnight</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {theme === 'custom' && (
          <div style={{
            padding: designSystem.spacing.lg,
            backgroundColor: themes.surface,
            border: `1px solid ${themes.border}`,
            borderRadius: designSystem.borderRadius.md
          }}>
            <h4 style={{
              fontSize: designSystem.typography.sizes.base,
              fontWeight: designSystem.typography.weights.semibold,
              color: themes.text,
              marginTop: 0,
              marginBottom: designSystem.spacing.md
            }}>
              Custom Theme Colors
            </h4>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: designSystem.spacing.md
            }}>
              {[
                { key: 'primary', label: 'Primary Color', desc: 'Buttons, links, active states' },
                { key: 'background', label: 'Background Color', desc: 'Main app background' },
                { key: 'accent', label: 'Accent Color', desc: 'Highlights and secondary actions' },
                { key: 'text', label: 'Text Color', desc: 'Main text and icon colors' }
              ].map(({ key, label, desc }) => (
                <div key={key}>
                  <label style={{
                    display: 'block',
                    fontSize: designSystem.typography.sizes.sm,
                    fontWeight: designSystem.typography.weights.medium,
                    color: themes.text,
                    marginBottom: designSystem.spacing.xs
                  }}>
                    {label}
                  </label>
                  <p style={{
                    fontSize: designSystem.typography.sizes.xs,
                    color: themes.textSecondary,
                    margin: `0 0 ${designSystem.spacing.xs} 0`
                  }}>
                    {desc}
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: designSystem.spacing.sm
                  }}>
                    <input
                      type="color"
                      value={customColors[key]}
                      onChange={(e) => setCustomColors({
                        ...customColors,
                        [key]: e.target.value
                      })}
                      style={{
                        width: '60px',
                        height: '44px',
                        border: `1px solid ${themes.border}`,
                        borderRadius: designSystem.borderRadius.sm,
                        cursor: 'pointer'
                      }}
                    />
                    <input
                      type="text"
                      value={customColors[key]}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                          setCustomColors({
                            ...customColors,
                            [key]: value
                          });
                        }
                      }}
                      placeholder="#000000"
                      style={{
                        flex: 1,
                        padding: designSystem.spacing.md,
                        fontSize: designSystem.typography.sizes.sm,
                        fontFamily: 'monospace',
                        backgroundColor: themes.surface,
                        color: themes.text,
                        border: `1px solid ${themes.border}`,
                        borderRadius: designSystem.borderRadius.sm,
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label style={{
            display: 'block',
            fontSize: designSystem.typography.sizes.sm,
            fontWeight: designSystem.typography.weights.medium,
            color: themes.text,
            marginBottom: designSystem.spacing.sm
          }}>
            Price Sources
          </label>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: designSystem.spacing.sm,
            padding: designSystem.spacing.md,
            backgroundColor: themes.surface,
            border: `1px solid ${themes.border}`,
            borderRadius: designSystem.borderRadius.md
          }}>
            {[
              { id: 'discogs', label: 'Discogs Marketplace', icon: Music },
              { id: 'hhv', label: 'HHV Records', icon: ExternalLink },
              { id: 'ebay', label: 'eBay', icon: ExternalLink }
            ].map(({ id, label, icon: Icon }) => (
              <label
                key={id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: designSystem.spacing.sm,
                  padding: designSystem.spacing.sm,
                  cursor: 'pointer',
                  borderRadius: designSystem.borderRadius.sm,
                  backgroundColor: selectedShops.includes(id) ? withOpacity(themes.primary, 0.1) : 'transparent',
                  transition: designSystem.transitions.base
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedShops.includes(id)}
                  onChange={() => toggleShop(id)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: themes.primary
                  }}
                />
                <Icon size={16} color={themes.textSecondary} />
                <span style={{
                  fontSize: designSystem.typography.sizes.sm,
                  color: themes.text,
                  flex: 1
                }}>
                  {label}
                </span>
              </label>
            ))}
          </div>
          <p style={{
            fontSize: designSystem.typography.sizes.xs,
            color: themes.textSecondary,
            margin: `${designSystem.spacing.xs} 0 0 0`,
            fontStyle: 'italic'
          }}>
            Note: Currently only Discogs integration is active
          </p>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: designSystem.typography.sizes.sm,
            fontWeight: designSystem.typography.weights.medium,
            color: themes.text,
            marginBottom: designSystem.spacing.sm
          }}>
            Backup & Data
          </label>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: designSystem.spacing.sm
          }}>
            <button
              onClick={exportCollection}
              disabled={collection.length === 0}
              style={{
                padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
                minHeight: designSystem.touchTarget.min,
                backgroundColor: collection.length === 0 ? themes.border : themes.primary,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: designSystem.borderRadius.md,
                cursor: collection.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: designSystem.typography.sizes.base,
                fontWeight: designSystem.typography.weights.medium,
                transition: designSystem.transitions.base,
                opacity: collection.length === 0 ? 0.5 : 1
              }}
            >
              Export Collection ({collection.length} records)
            </button>

            <label style={{
              display: 'block',
              padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
              minHeight: designSystem.touchTarget.min,
              backgroundColor: 'transparent',
              color: themes.text,
              border: `1px solid ${themes.border}`,
              borderRadius: designSystem.borderRadius.md,
              cursor: 'pointer',
              fontSize: designSystem.typography.sizes.base,
              fontWeight: designSystem.typography.weights.medium,
              textAlign: 'center',
              transition: designSystem.transitions.base
            }}>
              Import Collection
              <input
                type="file"
                accept=".json"
                onChange={importCollection}
                style={{ display: 'none' }}
              />
            </label>

            <p style={{
              fontSize: designSystem.typography.sizes.xs,
              color: themes.textSecondary,
              margin: `${designSystem.spacing.xs} 0 0 0`,
              fontStyle: 'italic'
            }}>
              Export your collection as JSON backup. Import to restore from backup.
            </p>
          </div>
        </div>

        <div style={{
          padding: designSystem.spacing.md,
          backgroundColor: themes.surface,
          border: `1px solid ${themes.border}`,
          borderRadius: designSystem.borderRadius.md,
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: designSystem.typography.sizes.sm,
            color: themes.textSecondary,
            margin: 0
          }}>
            VinylScout <span style={{ fontWeight: designSystem.typography.weights.semibold, color: themes.text }}>v{APP_VERSION}</span>
          </p>
          <p style={{
            fontSize: designSystem.typography.sizes.xs,
            color: themes.textTertiary,
            margin: `${designSystem.spacing.xs} 0 0 0`
          }}>
            Stable Release • {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );

  const renderDetailModal = () => {
    if (!selectedResult) return null;

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: withOpacity('#000000', 0.8),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: designSystem.spacing.md,
          zIndex: 1000
        }}
        onClick={() => setSelectedResult(null)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: themes.surface,
            borderRadius: designSystem.borderRadius.md,
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}
        >
          <button
            data-modal-button
            onClick={() => setSelectedResult(null)}
            style={{
              position: 'absolute',
              top: designSystem.spacing.sm,
              right: designSystem.spacing.sm,
              padding: designSystem.spacing.sm,
              minWidth: designSystem.touchTarget.min,
              minHeight: designSystem.touchTarget.min,
              backgroundColor: withOpacity(themes.background, 0.9),
              border: 'none',
              borderRadius: designSystem.borderRadius.circle,
              color: themes.text,
              cursor: 'pointer',
              zIndex: 1
            }}
          >
            <X size={designSystem.iconSize.md} />
          </button>

          <img
            src={selectedResult.cover_image || selectedResult.thumb}
            alt={selectedResult.title}
            style={{
              width: '100%',
              aspectRatio: '1',
              objectFit: 'cover',
              backgroundColor: themes.border
            }}
          />

          <div style={{ padding: designSystem.spacing.lg }}>
            <h2 style={{
              fontSize: designSystem.typography.sizes.xl,
              fontWeight: designSystem.typography.weights.bold,
              color: themes.text,
              margin: `0 0 ${designSystem.spacing.sm} 0`
            }}>
              {selectedResult.title}
            </h2>
            <p style={{
              fontSize: designSystem.typography.sizes.base,
              color: themes.textSecondary,
              margin: `0 0 ${designSystem.spacing.lg} 0`
            }}>
              {selectedResult.year || 'Year unknown'}
            </p>

            {selectedResult.genre && selectedResult.genre.length > 0 && (
              <div style={{ marginBottom: designSystem.spacing.md }}>
                <h3 style={{
                  fontSize: designSystem.typography.sizes.sm,
                  fontWeight: designSystem.typography.weights.semibold,
                  color: themes.text,
                  margin: `0 0 ${designSystem.spacing.xs} 0`
                }}>
                  Genres
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: designSystem.spacing.xs }}>
                  {selectedResult.genre.map(g => (
                    <span
                      key={g}
                      style={{
                        padding: `${designSystem.spacing.xs} ${designSystem.spacing.sm}`,
                        backgroundColor: withOpacity(themes.primary, 0.1),
                        color: themes.primary,
                        borderRadius: designSystem.borderRadius.sm,
                        fontSize: designSystem.typography.sizes.xs
                      }}
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: designSystem.spacing.sm,
              marginTop: designSystem.spacing.lg
            }}>
              <button
                data-modal-button
                onClick={() => {
                  const inCollection = collection.some(v => v.id === selectedResult.id);
                  if (inCollection) {
                    removeFromCollection(selectedResult.id);
                  } else {
                    addToCollection(selectedResult);
                  }
                  setSelectedResult(null);
                }}
                style={{
                  flex: 1,
                  padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
                  minHeight: designSystem.touchTarget.min,
                  backgroundColor: collection.some(v => v.id === selectedResult.id) ? themes.error : themes.primary,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: designSystem.borderRadius.md,
                  cursor: 'pointer',
                  fontSize: designSystem.typography.sizes.base,
                  fontWeight: designSystem.typography.weights.medium
                }}
              >
                {collection.some(v => v.id === selectedResult.id) ? 'Remove from Collection' : 'Add to Collection'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderValueModal = () => {
    if (!showValueModal || !selectedResult) return null;

    const maxPrice = Math.max(...valueHistory.map(h => h.price), 1);
    const minPrice = Math.min(...valueHistory.map(h => h.price), 0);
    const priceRange = maxPrice - minPrice;
    const paddedMax = maxPrice + (priceRange * 0.1);
    const paddedMin = Math.max(0, minPrice - (priceRange * 0.1));
    const paddedRange = paddedMax - paddedMin;

    // Calculate Y-axis labels (5 steps)
    const yAxisSteps = 5;
    const yAxisLabels = Array.from({ length: yAxisSteps }, (_, i) => {
      const value = paddedMin + (paddedRange * (i / (yAxisSteps - 1)));
      return value;
    }).reverse();

    // Format date for X-axis
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: withOpacity('#000000', 0.8),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: designSystem.spacing.md,
          zIndex: 1001
        }}
        onClick={() => {
          setShowValueModal(false);
          setValueHistory([]);
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: themes.surface,
            borderRadius: designSystem.borderRadius.md,
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: designSystem.spacing.lg,
            position: 'relative'
          }}
        >
          <button
            data-modal-button
            onClick={() => {
              setShowValueModal(false);
              setValueHistory([]);
            }}
            style={{
              position: 'absolute',
              top: designSystem.spacing.sm,
              right: designSystem.spacing.sm,
              padding: designSystem.spacing.sm,
              minWidth: designSystem.touchTarget.min,
              minHeight: designSystem.touchTarget.min,
              backgroundColor: withOpacity(themes.background, 0.9),
              border: 'none',
              borderRadius: designSystem.borderRadius.circle,
              color: themes.text,
              cursor: 'pointer'
            }}
          >
            <X size={designSystem.iconSize.md} />
          </button>

          <h2 style={{
            fontSize: designSystem.typography.sizes.lg,
            fontWeight: designSystem.typography.weights.bold,
            color: themes.text,
            margin: `0 0 ${designSystem.spacing.md} 0`
          }}>
            Price History
          </h2>

          {valueHistory.length === 0 ? (
            <p style={{
              fontSize: designSystem.typography.sizes.base,
              color: themes.textSecondary
            }}>
              No price history available
            </p>
          ) : (
            <>
              {/* Chart Container */}
              <div style={{
                display: 'flex',
                marginBottom: designSystem.spacing.xl
              }}>
                {/* Y-axis labels */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  paddingRight: designSystem.spacing.sm,
                  height: '280px',
                  paddingTop: '10px',
                  paddingBottom: '30px'
                }}>
                  {yAxisLabels.map((label, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: designSystem.typography.sizes.xs,
                        color: themes.textSecondary,
                        textAlign: 'right',
                        minWidth: '40px'
                      }}
                    >
                      {label.toFixed(0)}
                    </span>
                  ))}
                </div>

                {/* Chart area */}
                <div style={{ flex: 1 }}>
                  {/* Main chart */}
                  <div style={{
                    height: '250px',
                    position: 'relative',
                    backgroundColor: withOpacity(themes.border, 0.1),
                    borderRadius: designSystem.borderRadius.sm,
                    padding: '10px 10px 20px 10px'
                  }}>
                    {/* Horizontal grid lines */}
                    <svg
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        right: '10px',
                        bottom: '20px',
                        width: 'calc(100% - 20px)',
                        height: 'calc(100% - 30px)',
                        pointerEvents: 'none'
                      }}
                    >
                      {/* Grid lines */}
                      {yAxisLabels.map((_, i) => (
                        <line
                          key={i}
                          x1="0%"
                          y1={`${(i / (yAxisSteps - 1)) * 100}%`}
                          x2="100%"
                          y2={`${(i / (yAxisSteps - 1)) * 100}%`}
                          stroke={withOpacity(themes.border, 0.3)}
                          strokeWidth="1"
                        />
                      ))}

                      {/* Price line */}
                      <polyline
                        points={valueHistory
                          .map((point, index) => {
                            const x = (index / (valueHistory.length - 1 || 1)) * 100;
                            const normalizedPrice = (point.price - paddedMin) / paddedRange;
                            const y = 100 - (normalizedPrice * 100);
                            return `${x}%,${y}%`;
                          })
                          .join(' ')}
                        fill="none"
                        stroke={themes.primary}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Area fill under line */}
                      <polygon
                        points={[
                          '0%,100%',
                          ...valueHistory.map((point, index) => {
                            const x = (index / (valueHistory.length - 1 || 1)) * 100;
                            const normalizedPrice = (point.price - paddedMin) / paddedRange;
                            const y = 100 - (normalizedPrice * 100);
                            return `${x}%,${y}%`;
                          }),
                          '100%,100%'
                        ].join(' ')}
                        fill={withOpacity(themes.primary, 0.1)}
                      />
                    </svg>

                    {/* Data points with hover */}
                    {valueHistory.map((point, index) => {
                      const normalizedPrice = (point.price - paddedMin) / paddedRange;
                      return (
                        <div
                          key={index}
                          title={`${formatDate(point.date)}: ${point.currency} ${point.price.toFixed(2)}`}
                          style={{
                            position: 'absolute',
                            left: `calc(10px + ${(index / (valueHistory.length - 1 || 1)) * 100}% * (100% - 20px) / 100)`,
                            bottom: `calc(20px + ${normalizedPrice * 100}% * (100% - 30px) / 100)`,
                            width: '10px',
                            height: '10px',
                            backgroundColor: themes.primary,
                            border: `2px solid ${themes.surface}`,
                            borderRadius: '50%',
                            transform: 'translate(-50%, 50%)',
                            cursor: 'pointer',
                            zIndex: 10,
                            transition: 'all 150ms ease',
                            boxShadow: designSystem.shadows.sm
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = 'translate(-50%, 50%) scale(1.3)';
                            e.target.style.boxShadow = designSystem.shadows.md;
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = 'translate(-50%, 50%) scale(1)';
                            e.target.style.boxShadow = designSystem.shadows.sm;
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* X-axis labels */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: designSystem.spacing.xs,
                    paddingLeft: '10px',
                    paddingRight: '10px'
                  }}>
                    {valueHistory.length > 1 && (
                      <>
                        <span style={{
                          fontSize: designSystem.typography.sizes.xs,
                          color: themes.textSecondary
                        }}>
                          {formatDate(valueHistory[0].date)}
                        </span>
                        <span style={{
                          fontSize: designSystem.typography.sizes.xs,
                          color: themes.textSecondary
                        }}>
                          {formatDate(valueHistory[valueHistory.length - 1].date)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Price statistics */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: designSystem.spacing.md,
                marginBottom: designSystem.spacing.lg,
                padding: designSystem.spacing.md,
                backgroundColor: withOpacity(themes.primary, 0.05),
                borderRadius: designSystem.borderRadius.md
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: designSystem.typography.sizes.xs,
                    color: themes.textSecondary,
                    marginBottom: designSystem.spacing.xs
                  }}>Current</div>
                  <div style={{
                    fontSize: designSystem.typography.sizes.lg,
                    fontWeight: designSystem.typography.weights.bold,
                    color: themes.primary
                  }}>
                    {valueHistory[valueHistory.length - 1].currency} {valueHistory[valueHistory.length - 1].price.toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: designSystem.typography.sizes.xs,
                    color: themes.textSecondary,
                    marginBottom: designSystem.spacing.xs
                  }}>Highest</div>
                  <div style={{
                    fontSize: designSystem.typography.sizes.lg,
                    fontWeight: designSystem.typography.weights.bold,
                    color: themes.text
                  }}>
                    {valueHistory[0].currency} {maxPrice.toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: designSystem.typography.sizes.xs,
                    color: themes.textSecondary,
                    marginBottom: designSystem.spacing.xs
                  }}>Lowest</div>
                  <div style={{
                    fontSize: designSystem.typography.sizes.lg,
                    fontWeight: designSystem.typography.weights.bold,
                    color: themes.text
                  }}>
                    {valueHistory[0].currency} {minPrice.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Price history list */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: designSystem.spacing.sm
              }}>
                <h3 style={{
                  fontSize: designSystem.typography.sizes.base,
                  fontWeight: designSystem.typography.weights.semibold,
                  color: themes.text,
                  margin: `0 0 ${designSystem.spacing.sm} 0`
                }}>
                  Price Records
                </h3>
                {valueHistory.slice().reverse().map((point, index) => {
                  const isLatest = index === 0;
                  const priceChange = index < valueHistory.length - 1
                    ? point.price - valueHistory[valueHistory.length - 1 - index - 1].price
                    : 0;

                  return (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: designSystem.spacing.sm,
                        backgroundColor: isLatest
                          ? withOpacity(themes.primary, 0.1)
                          : withOpacity(themes.primary, 0.05),
                        borderRadius: designSystem.borderRadius.sm,
                        borderLeft: isLatest ? `3px solid ${themes.primary}` : 'none'
                      }}
                    >
                      <span style={{
                        fontSize: designSystem.typography.sizes.sm,
                        color: themes.textSecondary
                      }}>
                        {new Date(point.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: designSystem.spacing.sm }}>
                        {index < valueHistory.length - 1 && priceChange !== 0 && (
                          <span style={{
                            fontSize: designSystem.typography.sizes.xs,
                            color: priceChange > 0 ? '#10b981' : '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}>
                            {priceChange > 0 ? '↑' : '↓'} {Math.abs(priceChange).toFixed(2)}
                          </span>
                        )}
                        <span style={{
                          fontSize: designSystem.typography.sizes.sm,
                          fontWeight: isLatest ? designSystem.typography.weights.bold : designSystem.typography.weights.medium,
                          color: isLatest ? themes.primary : themes.text
                        }}>
                          {point.currency} {point.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderVinylDetail = () => {
    if (!selectedVinyl) return null;

    const renderTracklist = (tracklist) => {
      if (!tracklist || tracklist.length === 0) return null;

      const groupedBySide = tracklist.reduce((acc, track) => {
        const side = track.position?.match(/^[A-Za-z]+/)?.[0] || 'Other';
        if (!acc[side]) acc[side] = [];
        acc[side].push(track);
        return acc;
      }, {});

      return (
        <div style={{ marginTop: designSystem.spacing.lg }}>
          <h3 style={{
            fontSize: designSystem.typography.sizes.base,
            fontWeight: designSystem.typography.weights.semibold,
            color: themes.text,
            marginBottom: designSystem.spacing.md
          }}>
            Tracklist
          </h3>
          {Object.entries(groupedBySide).map(([side, tracks]) => (
            <div key={side} style={{ marginBottom: designSystem.spacing.md }}>
              <h4 style={{
                fontSize: designSystem.typography.sizes.sm,
                fontWeight: designSystem.typography.weights.medium,
                color: themes.textSecondary,
                marginBottom: designSystem.spacing.sm
              }}>
                Side {side} ({tracks.length} tracks)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: designSystem.spacing.xs }}>
                {tracks.map((track, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: designSystem.spacing.sm,
                      backgroundColor: idx % 2 === 0 ? withOpacity(themes.primary, 0.03) : 'transparent',
                      borderRadius: designSystem.borderRadius.sm,
                      display: 'flex',
                      gap: designSystem.spacing.sm
                    }}
                  >
                    <span style={{
                      fontSize: designSystem.typography.sizes.xs,
                      color: themes.textSecondary,
                      minWidth: '24px'
                    }}>
                      {track.position}
                    </span>
                    <span style={{
                      fontSize: designSystem.typography.sizes.xs,
                      color: themes.text,
                      flex: 1
                    }}>
                      {track.title}
                    </span>
                    {track.duration && (
                      <span style={{
                        fontSize: designSystem.typography.sizes.xs,
                        color: themes.textSecondary
                      }}>
                        {track.duration}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    };

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: withOpacity('#000000', 0.8),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: designSystem.spacing.md,
          zIndex: 1000,
          overflow: 'auto'
        }}
        onClick={() => setSelectedVinyl(null)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: themes.surface,
            borderRadius: designSystem.borderRadius.md,
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}
        >
          <button
            data-modal-button
            onClick={() => setSelectedVinyl(null)}
            style={{
              position: 'absolute',
              top: designSystem.spacing.sm,
              right: designSystem.spacing.sm,
              padding: designSystem.spacing.sm,
              minWidth: designSystem.touchTarget.min,
              minHeight: designSystem.touchTarget.min,
              backgroundColor: withOpacity(themes.background, 0.9),
              border: 'none',
              borderRadius: designSystem.borderRadius.circle,
              color: themes.text,
              cursor: 'pointer',
              zIndex: 1
            }}
          >
            <X size={designSystem.iconSize.md} />
          </button>

          <img
            src={selectedVinyl.cover_image || selectedVinyl.thumb}
            alt={selectedVinyl.title}
            style={{
              width: '100%',
              aspectRatio: '1',
              objectFit: 'cover',
              backgroundColor: themes.border
            }}
          />

          <div style={{ padding: designSystem.spacing.lg }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: designSystem.spacing.md
            }}>
              <div style={{ flex: 1 }}>
                <h2 style={{
                  fontSize: designSystem.typography.sizes.xl,
                  fontWeight: designSystem.typography.weights.bold,
                  color: themes.text,
                  margin: `0 0 ${designSystem.spacing.xs} 0`
                }}>
                  {selectedVinyl.title}
                </h2>
                <p style={{
                  fontSize: designSystem.typography.sizes.base,
                  color: themes.textSecondary,
                  margin: 0
                }}>
                  {selectedVinyl.artist} • {selectedVinyl.year}
                </p>
              </div>
              <button
                data-modal-button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(selectedVinyl.id);
                }}
                style={{
                  padding: designSystem.spacing.sm,
                  minWidth: designSystem.touchTarget.min,
                  minHeight: designSystem.touchTarget.min,
                  backgroundColor: 'transparent',
                  border: `1px solid ${themes.border}`,
                  borderRadius: designSystem.borderRadius.circle,
                  color: selectedVinyl.isFavorite ? themes.warning : themes.textSecondary,
                  cursor: 'pointer'
                }}
              >
                <Heart
                  size={designSystem.iconSize.md}
                  fill={selectedVinyl.isFavorite ? themes.warning : 'none'}
                />
              </button>
            </div>

            {selectedVinyl.lowestPrice !== null && (
              <div
                onClick={() => openValueModal(selectedVinyl)}
                style={{
                  padding: designSystem.spacing.md,
                  backgroundColor: withOpacity(themes.primary, 0.1),
                  borderRadius: designSystem.borderRadius.md,
                  marginBottom: designSystem.spacing.md,
                  cursor: 'pointer'
                }}
              >
                <p style={{
                  fontSize: designSystem.typography.sizes.xs,
                  color: themes.textSecondary,
                  margin: `0 0 ${designSystem.spacing.xs} 0`
                }}>
                  Current Value
                </p>
                <p style={{
                  fontSize: designSystem.typography.sizes.xl,
                  fontWeight: designSystem.typography.weights.bold,
                  color: themes.primary,
                  margin: 0
                }}>
                  ${selectedVinyl.lowestPrice.toFixed(2)}
                </p>
              </div>
            )}

            <div style={{ marginBottom: designSystem.spacing.md }}>
              <p style={{
                fontSize: designSystem.typography.sizes.xs,
                color: themes.textSecondary,
                margin: `0 0 ${designSystem.spacing.xs} 0`
              }}>
                Label
              </p>
              <p style={{
                fontSize: designSystem.typography.sizes.base,
                color: themes.text,
                margin: 0
              }}>
                {selectedVinyl.label}
              </p>
            </div>

            {selectedVinyl.genres && selectedVinyl.genres.length > 0 && (
              <div style={{ marginBottom: designSystem.spacing.md }}>
                <p style={{
                  fontSize: designSystem.typography.sizes.xs,
                  color: themes.textSecondary,
                  margin: `0 0 ${designSystem.spacing.xs} 0`
                }}>
                  Genres
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: designSystem.spacing.xs }}>
                  {selectedVinyl.genres.map(genre => (
                    <span
                      key={genre}
                      style={{
                        padding: `${designSystem.spacing.xs} ${designSystem.spacing.sm}`,
                        backgroundColor: withOpacity(themes.primary, 0.1),
                        color: themes.primary,
                        borderRadius: designSystem.borderRadius.sm,
                        fontSize: designSystem.typography.sizes.xs
                      }}
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedVinyl.styles && selectedVinyl.styles.length > 0 && (
              <div style={{ marginBottom: designSystem.spacing.md }}>
                <p style={{
                  fontSize: designSystem.typography.sizes.xs,
                  color: themes.textSecondary,
                  margin: `0 0 ${designSystem.spacing.xs} 0`
                }}>
                  Styles
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: designSystem.spacing.xs }}>
                  {selectedVinyl.styles.map(style => (
                    <span
                      key={style}
                      style={{
                        padding: `${designSystem.spacing.xs} ${designSystem.spacing.sm}`,
                        backgroundColor: withOpacity(themes.textSecondary, 0.1),
                        color: themes.textSecondary,
                        borderRadius: designSystem.borderRadius.sm,
                        fontSize: designSystem.typography.sizes.xs
                      }}
                    >
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {renderTracklist(selectedVinyl.tracklist)}

            <div style={{
              display: 'flex',
              gap: designSystem.spacing.sm,
              marginTop: designSystem.spacing.lg
            }}>
              <button
                data-modal-button
                onClick={async () => {
                  await updatePrice(selectedVinyl.id);
                }}
                style={{
                  flex: 1,
                  padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
                  minHeight: designSystem.touchTarget.min,
                  backgroundColor: themes.primary,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: designSystem.borderRadius.md,
                  cursor: 'pointer',
                  fontSize: designSystem.typography.sizes.base,
                  fontWeight: designSystem.typography.weights.medium
                }}
              >
                Update Price
              </button>
              <button
                data-modal-button
                onClick={() => setConfirmDelete(selectedVinyl.id)}
                style={{
                  flex: 1,
                  padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
                  minHeight: designSystem.touchTarget.min,
                  backgroundColor: themes.error,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: designSystem.borderRadius.md,
                  cursor: 'pointer',
                  fontSize: designSystem.typography.sizes.base,
                  fontWeight: designSystem.typography.weights.medium
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
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
      {renderHeader()}

      {/* View Container with Cross-fade Transition */}
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* Previous view fading out */}
        {previousView && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0,
            transform: 'scale(0.98)',
            transition: 'opacity 300ms cubic-bezier(0.4, 0.0, 0.2, 1), transform 300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
            pointerEvents: 'none',
            zIndex: 1
          }}>
            {previousView === 'search' && renderSearchView()}
            {previousView === 'camera' && renderCameraView()}
            {previousView === 'collection' && renderCollectionView()}
            {previousView === 'stats' && renderStatsView()}
            {previousView === 'settings' && renderSettingsView()}
          </div>
        )}

        {/* Current view fading in */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 1,
          transform: 'scale(1)',
          transition: 'opacity 300ms cubic-bezier(0.4, 0.0, 0.2, 1), transform 300ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          zIndex: 2
        }}>
          {view === 'search' && renderSearchView()}
          {view === 'camera' && renderCameraView()}
          {view === 'collection' && renderCollectionView()}
          {view === 'stats' && renderStatsView()}
          {view === 'settings' && renderSettingsView()}
        </div>
      </div>

      {renderNavigation()}
      {renderDetailModal()}
      {renderValueModal()}
      {renderVinylDetail()}

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 9999,
          backgroundColor: toast.type === 'error' ? themes.error : themes.success,
          color: '#FFFFFF',
          padding: '16px 24px',
          borderRadius: designSystem.borderRadius.md,
          boxShadow: designSystem.shadows.lg,
          display: 'flex',
          alignItems: 'center',
          gap: designSystem.spacing.sm,
          maxWidth: '400px',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <span style={{ flex: 1, fontSize: designSystem.typography.sizes.sm }}>{toast.message}</span>
          <X
            size={18}
            onClick={() => setToast(null)}
            style={{ cursor: 'pointer', flexShrink: 0 }}
          />
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: withOpacity('#000000', 0.8),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: designSystem.spacing.md,
            zIndex: 2000
          }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: themes.surface,
              padding: designSystem.spacing.xl,
              borderRadius: designSystem.borderRadius.lg,
              maxWidth: '400px',
              width: '100%'
            }}
          >
            <h3 style={{
              fontSize: designSystem.typography.sizes.xl,
              fontWeight: designSystem.typography.weights.bold,
              color: themes.text,
              margin: `0 0 ${designSystem.spacing.sm} 0`
            }}>
              Remove from Collection?
            </h3>
            <p style={{
              fontSize: designSystem.typography.sizes.base,
              color: themes.textSecondary,
              margin: `0 0 ${designSystem.spacing.lg} 0`
            }}>
              This vinyl will be permanently removed from your collection. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: designSystem.spacing.sm }}>
              <button
                onClick={() => {
                  removeFromCollection(confirmDelete);
                  setConfirmDelete(null);
                  setSelectedVinyl(null);
                  showToast('Removed from collection', 'success');
                }}
                style={{
                  flex: 1,
                  padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
                  minHeight: designSystem.touchTarget.min,
                  backgroundColor: themes.error,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: designSystem.borderRadius.md,
                  cursor: 'pointer',
                  fontSize: designSystem.typography.sizes.base,
                  fontWeight: designSystem.typography.weights.medium
                }}
              >
                Remove
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  flex: 1,
                  padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
                  minHeight: designSystem.touchTarget.min,
                  backgroundColor: 'transparent',
                  color: themes.text,
                  border: `1px solid ${themes.border}`,
                  borderRadius: designSystem.borderRadius.md,
                  cursor: 'pointer',
                  fontSize: designSystem.typography.sizes.base,
                  fontWeight: designSystem.typography.weights.medium
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demo Panel - Shows Zustand in action! */}
      <DemoPanel />
    </div>
  );
}