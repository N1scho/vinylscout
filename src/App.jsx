import React, { useState, useEffect, useRef } from 'react';
import { Search, Camera, Grid, BarChart3, Settings, Heart, X, Eye, EyeOff, Star, TrendingUp, TrendingDown, Minus, RefreshCw, Plus, Music, User, ExternalLink, Info, List } from 'lucide-react';
import { designSystem, createTheme, withOpacity, themeDefinitions } from './designsystem';

export default function App() {
  // Logo Configuration
  const LOGO_PATH = "/VinylScoutLogo.png";

  // Navigation & View State
  const [view, setView] = useState('search');

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
    if (!videoRef.current || !canvasRef.current || !anthropicToken) {
      setCameraError('Missing requirements for analysis');
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
        body: JSON.stringify({ image: base64Image })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.artist && data.album) {
        setSearchQuery(`${data.artist} ${data.album}`);
        setView('search');
        await searchDiscogs(false, `${data.artist} ${data.album}`, 1);
      } else {
        setCameraError('Could not identify album');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setCameraError(err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Discogs API Functions
  const searchDiscogs = async (isAdvanced = false, queryOverride = null, page = 1) => {
    if (!discogsToken) {
      showToast('Please set your Discogs API token in Settings', 'error');
      setView('settings');
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

  const fetchPriceInfo = async (releaseId) => {
    if (!discogsToken) return null;
    try {
      const response = await fetch(
        `https://api.discogs.com/marketplace/stats/${releaseId}`,
        {
          headers: {
            'Authorization': `Discogs token=${discogsToken}`,
            'User-Agent': 'VinylScout/2.3'
          }
        }
      );
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
    } catch (error) {
      console.error('Price error:', error);
    }
    return null;
  };

  const fetchAllPrices = async (results) => {
    const prices = {};
    for (const result of results.slice(0, 10)) {
      const priceData = await fetchPriceInfo(result.id);
      if (priceData) prices[result.id] = priceData;
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    setResultPrices(prices);
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
      : 'USD';

    const genreCounts = {};
    collection.forEach(v => {
      v.genres?.forEach(g => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { total, favorites, withPrice, totalValue, avgValue, currency, topGenres };
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

  const filterCollection = (items, filter) => {
    return filter === 'favorites' ? items.filter(item => item.isFavorite) : items;
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

  const sortedCollection = sortCollection(filterCollection(collection, collectionFilter), sortBy);

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
      <div style={{
        position: 'absolute',
        right: designSystem.spacing.md,
        fontSize: designSystem.typography.sizes.xs,
        color: themes.textSecondary,
        fontWeight: designSystem.typography.weights.medium
      }}>
        v2.3
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
          onClick={() => setView(id)}
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
    <div style={{ width: '100%', padding: designSystem.spacing.md, paddingTop: '72px', paddingBottom: `calc(${designSystem.spacing.nav} + ${designSystem.spacing.md})` }}>
      <div style={{
        display: 'flex',
        gap: designSystem.spacing.sm,
        marginBottom: designSystem.spacing.lg
      }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchDiscogs(false, searchQuery, 1)}
          placeholder="Search for vinyl..."
          style={{
            flex: 1,
            padding: designSystem.spacing.md,
            fontSize: designSystem.typography.sizes.base,
            backgroundColor: themes.surface,
            color: themes.text,
            border: `1px solid ${themes.border}`,
            borderRadius: designSystem.borderRadius.md,
            outline: 'none'
          }}
        />
        <button
          onClick={() => searchDiscogs(false, searchQuery, 1)}
          disabled={isLoading}
          style={{
            padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
            minWidth: designSystem.touchTarget.min,
            minHeight: designSystem.touchTarget.min,
            backgroundColor: themes.primary,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: designSystem.borderRadius.md,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            fontSize: designSystem.typography.sizes.base,
            fontWeight: designSystem.typography.weights.medium,
            display: 'flex',
            alignItems: 'center',
            gap: designSystem.spacing.xs,
            justifyContent: 'center'
          }}
        >
          {isLoading ? (
            <>
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Searching...</span>
            </>
          ) : 'Search'}
        </button>
      </div>

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
          marginBottom: designSystem.spacing.md
        }}
      >
        {showAdvancedSearch ? <Minus size={16} /> : <Plus size={16} />}
        Advanced Search
      </button>

      {showAdvancedSearch && (
        <div style={{
          padding: designSystem.spacing.md,
          backgroundColor: themes.surface,
          border: `1px solid ${themes.border}`,
          borderRadius: designSystem.borderRadius.md,
          marginBottom: designSystem.spacing.lg
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: designSystem.spacing.md }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: designSystem.typography.sizes.xs,
                fontWeight: designSystem.typography.weights.medium,
                color: themes.textSecondary,
                marginBottom: designSystem.spacing.xs
              }}>
                Artist
              </label>
              <input
                type="text"
                value={advancedSearch.artist}
                onChange={(e) => setAdvancedSearch({...advancedSearch, artist: e.target.value})}
                placeholder="Artist name"
                style={{
                  width: '100%',
                  padding: designSystem.spacing.sm,
                  fontSize: designSystem.typography.sizes.sm,
                  backgroundColor: themes.background,
                  color: themes.text,
                  border: `1px solid ${themes.border}`,
                  borderRadius: designSystem.borderRadius.sm,
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: designSystem.typography.sizes.xs,
                fontWeight: designSystem.typography.weights.medium,
                color: themes.textSecondary,
                marginBottom: designSystem.spacing.xs
              }}>
                Album
              </label>
              <input
                type="text"
                value={advancedSearch.album}
                onChange={(e) => setAdvancedSearch({...advancedSearch, album: e.target.value})}
                placeholder="Album title"
                style={{
                  width: '100%',
                  padding: designSystem.spacing.sm,
                  fontSize: designSystem.typography.sizes.sm,
                  backgroundColor: themes.background,
                  color: themes.text,
                  border: `1px solid ${themes.border}`,
                  borderRadius: designSystem.borderRadius.sm,
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: designSystem.typography.sizes.xs,
                fontWeight: designSystem.typography.weights.medium,
                color: themes.textSecondary,
                marginBottom: designSystem.spacing.xs
              }}>
                Year
              </label>
              <input
                type="text"
                value={advancedSearch.year}
                onChange={(e) => setAdvancedSearch({...advancedSearch, year: e.target.value})}
                placeholder="Release year"
                style={{
                  width: '100%',
                  padding: designSystem.spacing.sm,
                  fontSize: designSystem.typography.sizes.sm,
                  backgroundColor: themes.background,
                  color: themes.text,
                  border: `1px solid ${themes.border}`,
                  borderRadius: designSystem.borderRadius.sm,
                  outline: 'none'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: designSystem.typography.sizes.xs,
                fontWeight: designSystem.typography.weights.medium,
                color: themes.textSecondary,
                marginBottom: designSystem.spacing.xs
              }}>
                Label
              </label>
              <input
                type="text"
                value={advancedSearch.label}
                onChange={(e) => setAdvancedSearch({...advancedSearch, label: e.target.value})}
                placeholder="Record label"
                style={{
                  width: '100%',
                  padding: designSystem.spacing.sm,
                  fontSize: designSystem.typography.sizes.sm,
                  backgroundColor: themes.background,
                  color: themes.text,
                  border: `1px solid ${themes.border}`,
                  borderRadius: designSystem.borderRadius.sm,
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{
                display: 'block',
                fontSize: designSystem.typography.sizes.xs,
                fontWeight: designSystem.typography.weights.medium,
                color: themes.textSecondary,
                marginBottom: designSystem.spacing.xs
              }}>
                Genre
              </label>
              <input
                type="text"
                value={advancedSearch.genre}
                onChange={(e) => setAdvancedSearch({...advancedSearch, genre: e.target.value})}
                placeholder="Genre"
                style={{
                  width: '100%',
                  padding: designSystem.spacing.sm,
                  fontSize: designSystem.typography.sizes.sm,
                  backgroundColor: themes.background,
                  color: themes.text,
                  border: `1px solid ${themes.border}`,
                  borderRadius: designSystem.borderRadius.sm,
                  outline: 'none'
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: designSystem.spacing.sm, marginTop: designSystem.spacing.md }}>
            <button
              onClick={() => searchDiscogs(true, null, 1)}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
                minHeight: designSystem.touchTarget.min,
                backgroundColor: themes.primary,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: designSystem.borderRadius.md,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.6 : 1,
                fontSize: designSystem.typography.sizes.base,
                fontWeight: designSystem.typography.weights.medium
              }}
            >
              {isLoading ? 'Searching...' : 'Search with Advanced Filters'}
            </button>
            <button
              onClick={() => setAdvancedSearch({ artist: '', album: '', year: '', label: '', genre: '' })}
              style={{
                padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
                minHeight: designSystem.touchTarget.min,
                backgroundColor: 'transparent',
                color: themes.textSecondary,
                border: `1px solid ${themes.border}`,
                borderRadius: designSystem.borderRadius.md,
                cursor: 'pointer',
                fontSize: designSystem.typography.sizes.base,
                fontWeight: designSystem.typography.weights.medium
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <RefreshCw
            size={48}
            color={themes.primary}
            style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }}
          />
          <h3 style={{
            color: themes.text,
            fontSize: designSystem.typography.sizes.lg,
            margin: '0 0 8px 0'
          }}>
            Searching Discogs...
          </h3>
          <p style={{
            color: themes.textSecondary,
            fontSize: designSystem.typography.sizes.sm,
            margin: 0
          }}>
            Fetching prices for results...
          </p>
        </div>
      )}

      {!isLoading && searchResults.length === 0 && (searchQuery || Object.values(advancedSearch).some(v => v)) && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Search size={48} color={themes.textSecondary} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h3 style={{
            color: themes.text,
            fontSize: designSystem.typography.sizes.lg,
            margin: '0 0 8px 0'
          }}>
            No Results Found
          </h3>
          <p style={{
            color: themes.textSecondary,
            fontSize: designSystem.typography.sizes.sm,
            margin: 0
          }}>
            Try a different search term or adjust your filters
          </p>
        </div>
      )}

      {!isLoading && searchResults.length === 0 && !searchQuery && !Object.values(advancedSearch).some(v => v) && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Music size={64} color={themes.primary} style={{ opacity: 0.4, marginBottom: designSystem.spacing.lg }} />
          <h3 style={{
            color: themes.text,
            fontSize: designSystem.typography.sizes.xl,
            fontWeight: designSystem.typography.weights.semibold,
            margin: `0 0 ${designSystem.spacing.sm} 0`
          }}>
            Start Your Search
          </h3>
          <p style={{
            color: themes.textSecondary,
            fontSize: designSystem.typography.sizes.base,
            margin: `0 0 ${designSystem.spacing.lg} 0`,
            maxWidth: '400px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: '1.6'
          }}>
            Search the Discogs database for vinyl records to add to your collection. Use the search bar above or try Advanced Search for more specific results.
          </p>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: designSystem.spacing.sm,
            alignItems: 'center',
            color: themes.textSecondary,
            fontSize: designSystem.typography.sizes.sm
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: designSystem.spacing.xs }}>
              <Info size={16} />
              <span>Try searching for an artist, album, or record label</span>
            </div>
          </div>
        </div>
      )}

      {!isLoading && searchResults.length > 0 && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: designSystem.spacing.md,
            marginBottom: designSystem.spacing.lg
          }}>
            {searchResults.map(result => {
              const inCollection = collection.some(v => v.id === result.id);
              return (
                <div
                  key={result.id}
                  onClick={() => setSelectedResult(result)}
                  style={{
                    backgroundColor: themes.surface,
                    borderRadius: designSystem.borderRadius.md,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: `1px solid ${themes.border}`,
                    transition: designSystem.transitions.base
                  }}
                >
                  <img
                    src={result.thumb || result.cover_image}
                    alt={result.title}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      objectFit: 'cover',
                      backgroundColor: themes.border
                    }}
                  />
                  <div style={{ padding: designSystem.spacing.sm }}>
                    <h3 style={{
                      fontSize: designSystem.typography.sizes.sm,
                      fontWeight: designSystem.typography.weights.medium,
                      color: themes.text,
                      margin: `0 0 ${designSystem.spacing.xs} 0`,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {result.title}
                    </h3>
                    <p style={{
                      fontSize: designSystem.typography.sizes.xs,
                      color: themes.textSecondary,
                      margin: `0 0 ${designSystem.spacing.xs} 0`
                    }}>
                      {result.year || 'Year unknown'}
                    </p>

                    {resultPrices[result.id] && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: designSystem.spacing.xs,
                        padding: `${designSystem.spacing.xs} 0`
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: designSystem.spacing.xs }}>
                          <span style={{
                            fontSize: designSystem.typography.sizes.sm,
                            fontWeight: designSystem.typography.weights.semibold,
                            color: themes.primary
                          }}>
                            {resultPrices[result.id].value} {resultPrices[result.id].currency}
                          </span>
                          {priceChanges[result.id] && (
                            <span style={{
                              fontSize: designSystem.typography.sizes.xs,
                              color: priceChanges[result.id].amount > 0 ? themes.success :
                                     priceChanges[result.id].amount < 0 ? themes.error : themes.textSecondary,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}>
                              {priceChanges[result.id].amount > 0 ? <TrendingUp size={12} /> :
                               priceChanges[result.id].amount < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                              {Math.abs(priceChanges[result.id].amount).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            refreshPrice(result.id, false);
                          }}
                          disabled={refreshingPrices[result.id]}
                          style={{
                            padding: designSystem.spacing.xs,
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: themes.primary,
                            cursor: refreshingPrices[result.id] ? 'not-allowed' : 'pointer',
                            opacity: refreshingPrices[result.id] ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <RefreshCw size={14} style={{
                            animation: refreshingPrices[result.id] ? 'spin 1s linear infinite' : 'none'
                          }} />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (inCollection) {
                          removeFromCollection(result.id);
                        } else {
                          addToCollection(result);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: designSystem.spacing.sm,
                        minHeight: designSystem.touchTarget.min,
                        backgroundColor: inCollection ? themes.error : themes.primary,
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: designSystem.borderRadius.sm,
                        cursor: 'pointer',
                        fontSize: designSystem.typography.sizes.xs,
                        fontWeight: designSystem.typography.weights.medium
                      }}
                    >
                      {inCollection ? 'Remove' : 'Add'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: designSystem.spacing.md,
              marginTop: designSystem.spacing.lg
            }}>
              <button
                onClick={() => searchDiscogs(false, searchQuery, currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: `${designSystem.spacing.sm} ${designSystem.spacing.md}`,
                  minHeight: designSystem.touchTarget.min,
                  backgroundColor: themes.surface,
                  color: themes.text,
                  border: `1px solid ${themes.border}`,
                  borderRadius: designSystem.borderRadius.sm,
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.5 : 1
                }}
              >
                Previous
              </button>
              <span style={{
                fontSize: designSystem.typography.sizes.sm,
                color: themes.text
              }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => searchDiscogs(false, searchQuery, currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  padding: `${designSystem.spacing.sm} ${designSystem.spacing.md}`,
                  minHeight: designSystem.touchTarget.min,
                  backgroundColor: themes.surface,
                  color: themes.text,
                  border: `1px solid ${themes.border}`,
                  borderRadius: designSystem.borderRadius.sm,
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.5 : 1
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
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
    const filteredAndSorted = sortCollection(filterCollection(collection, collectionFilter), sortBy);
    const collectionValue = calculateCollectionValue();

    return (
      <div style={{ width: '100%', padding: designSystem.spacing.md, paddingTop: '72px', paddingBottom: `calc(${designSystem.spacing.nav} + ${designSystem.spacing.md})` }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: designSystem.spacing.lg
        }}>
          <div>
            <h2 style={{
              fontSize: designSystem.typography.sizes.xl,
              fontWeight: designSystem.typography.weights.bold,
              color: themes.text,
              margin: 0
            }}>
              Collection ({collection.length})
            </h2>
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
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Music size={48} color={themes.textSecondary} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <h3 style={{
              color: themes.text,
              fontSize: designSystem.typography.sizes.lg,
              margin: '0 0 8px 0'
            }}>
              {collectionFilter === 'favorites' ? 'No Favorites Yet' : 'Collection is Empty'}
            </h3>
            <p style={{
              color: themes.textSecondary,
              fontSize: designSystem.typography.sizes.sm,
              margin: '0 0 16px 0'
            }}>
              {collectionFilter === 'favorites'
                ? 'Star some vinyls to see them here'
                : 'Search and add vinyls to start your collection'}
            </p>
            {collectionFilter === 'all' && (
              <button
                onClick={() => setView('search')}
                style={{
                  padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
                  backgroundColor: themes.primary,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: designSystem.borderRadius.md,
                  cursor: 'pointer',
                  fontSize: designSystem.typography.sizes.base,
                  fontWeight: designSystem.typography.weights.medium
                }}
              >
                Go to Search
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: collectionView === 'grid' ? 'grid' : 'flex',
            gridTemplateColumns: collectionView === 'grid' ? 'repeat(auto-fill, minmax(160px, 1fr))' : 'unset',
            flexDirection: collectionView === 'list' ? 'column' : 'unset',
            gap: designSystem.spacing.md
          }}>
            {filteredAndSorted.map(item => {
            const priceChange = getPriceChange(item);
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
                  transition: designSystem.transitions.base,
                  position: 'relative'
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
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    objectFit: 'cover',
                    backgroundColor: themes.border
                  }}
                />
                <div style={{ padding: designSystem.spacing.sm }}>
                  <h3 style={{
                    fontSize: designSystem.typography.sizes.sm,
                    fontWeight: designSystem.typography.weights.medium,
                    color: themes.text,
                    margin: `0 0 ${designSystem.spacing.xs} 0`,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.title}
                  </h3>
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
      <div style={{ width: '100%', padding: designSystem.spacing.md, paddingTop: '72px', paddingBottom: `calc(${designSystem.spacing.nav} + ${designSystem.spacing.md})` }}>
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
            { label: 'Total Value', value: formatPrice(stats.totalValue, stats.currency) },
            { label: 'Avg Value', value: formatPrice(stats.avgValue, stats.currency) }
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
          <div>
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
      </div>
    );
  };

  const renderSettingsView = () => (
    <div style={{ width: '100%', padding: designSystem.spacing.md, paddingTop: '72px', paddingBottom: `calc(${designSystem.spacing.nav} + ${designSystem.spacing.md})` }}>
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
            maxWidth: '500px',
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
              <div style={{
                height: '200px',
                position: 'relative',
                marginBottom: designSystem.spacing.lg,
                padding: `${designSystem.spacing.sm} 0`
              }}>
                {valueHistory.map((point, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'absolute',
                      left: `${(index / (valueHistory.length - 1 || 1)) * 100}%`,
                      bottom: `${(point.price / maxPrice) * 100}%`,
                      width: '8px',
                      height: '8px',
                      backgroundColor: themes.primary,
                      borderRadius: '50%',
                      transform: 'translate(-50%, 50%)'
                    }}
                  />
                ))}
                <svg
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none'
                  }}
                >
                  <polyline
                    points={valueHistory
                      .map((point, index) => {
                        const x = (index / (valueHistory.length - 1 || 1)) * 100;
                        const y = 100 - (point.price / maxPrice) * 100;
                        return `${x}%,${y}%`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke={themes.primary}
                    strokeWidth="2"
                  />
                </svg>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: designSystem.spacing.sm
              }}>
                {valueHistory.slice().reverse().map((point, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: designSystem.spacing.sm,
                      backgroundColor: withOpacity(themes.primary, 0.05),
                      borderRadius: designSystem.borderRadius.sm
                    }}
                  >
                    <span style={{
                      fontSize: designSystem.typography.sizes.sm,
                      color: themes.textSecondary
                    }}>
                      {new Date(point.date).toLocaleDateString()}
                    </span>
                    <span style={{
                      fontSize: designSystem.typography.sizes.sm,
                      fontWeight: designSystem.typography.weights.medium,
                      color: themes.text
                    }}>
                      ${point.price.toFixed(2)} {point.currency}
                    </span>
                  </div>
                ))}
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
      {view === 'search' && renderSearchView()}
      {view === 'camera' && renderCameraView()}
      {view === 'collection' && renderCollectionView()}
      {view === 'stats' && renderStatsView()}
      {view === 'settings' && renderSettingsView()}
      
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
    </div>
  );
}