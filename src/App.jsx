import React, { useState, useEffect, useRef } from 'react';
import { Search, Camera, Music, User, Settings, X, RefreshCw, Heart, Grid, List, DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const VinylScout = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [collection, setCollection] = useState([]);
  const [sortBy, setSortBy] = useState('artist');
  const [collectionView, setCollectionView] = useState('gallery');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);
  const [rescanProgress, setRescanProgress] = useState({ current: 0, total: 0 });
  const [refreshingPrices, setRefreshingPrices] = useState({});
  const [priceChanges, setPriceChanges] = useState({});
  
  const [advancedFilters, setAdvancedFilters] = useState({
    artist: '',
    album: '',
    year: '',
    label: '',
    catno: '',
    barcode: ''
  });
  
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [discogsToken, setDiscogsToken] = useState('');
  const [anthropicToken, setAnthropicToken] = useState('');
  const [selectedShops, setSelectedShops] = useState(['discogs', 'hhv', 'ebay']);
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [secondaryColor, setSecondaryColor] = useState('#1a1a1a');
  const [accentColor, setAccentColor] = useState('#ffb700');
  const [showValueModal, setShowValueModal] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('classic');

  // Pre-defined themes (static - don't reference state)
  const themes = {
    classic: {
      name: 'Classic Vinyl',
      primary: '#000000',
      secondary: '#1a1a1a',
      accent: '#ffb700'
    },
    blue: {
      name: 'Blue Note',
      primary: '#0a1929',
      secondary: '#1e3a5f',
      accent: '#4fc3f7'
    },
    purple: {
      name: 'Purple Rain',
      primary: '#1a0033',
      secondary: '#2d1b4e',
      accent: '#b794f6'
    },
    green: {
      name: 'Mint Condition',
      primary: '#0d1f1a',
      secondary: '#1a3a2e',
      accent: '#4ade80'
    },
    red: {
      name: 'Red Hot',
      primary: '#1a0505',
      secondary: '#330a0a',
      accent: '#ef4444'
    },
    custom: {
      name: 'Custom',
      primary: '#000000',
      secondary: '#1a1a1a',
      accent: '#ffb700'
    }
  };

  // Load saved data
  useEffect(() => {
    console.log('=== VinylScout Loading ===');
    try {
      // Check what's in localStorage
      const storageKeys = Object.keys(localStorage);
      console.log('LocalStorage keys:', storageKeys);
      
      const savedSettings = localStorage.getItem('vinylScoutSettings');
      console.log('Saved settings:', savedSettings ? 'Found' : 'Not found');
      
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setDiscogsToken(settings.discogsToken || '');
        setAnthropicToken(settings.anthropicToken || '');
        setSelectedShops(settings.selectedShops || ['discogs', 'hhv', 'ebay']);
        
        // Load theme
        const themeName = settings.selectedTheme || 'classic';
        console.log('Loading theme:', themeName);
        setSelectedTheme(themeName);
        
        if (themeName !== 'custom') {
          // Apply pre-defined theme
          setPrimaryColor(themes[themeName].primary);
          setSecondaryColor(themes[themeName].secondary);
          setAccentColor(themes[themeName].accent);
        } else {
          // Apply custom colors
          setPrimaryColor(settings.primaryColor || '#000000');
          setSecondaryColor(settings.secondaryColor || '#1a1a1a');
          setAccentColor(settings.accentColor || '#ffb700');
        }
      } else {
        // No saved settings - apply default classic theme
        console.log('No settings found, using classic theme');
        setPrimaryColor(themes.classic.primary);
        setSecondaryColor(themes.classic.secondary);
        setAccentColor(themes.classic.accent);
      }

      const savedCollection = localStorage.getItem('vinylCollection');
      console.log('Saved collection:', savedCollection ? 'Found' : 'Not found');
      
      if (savedCollection) {
        try {
          const parsedCollection = JSON.parse(savedCollection);
          console.log('Collection parsed:', parsedCollection.length, 'albums');
          
          // Ensure all albums have proper price format
          const collectionWithPrices = parsedCollection.map(album => ({
            ...album,
            price: album.price || 'Price unavailable',
            priceNumeric: album.priceNumeric !== undefined ? album.priceNumeric : null,
            lastUpdated: album.lastUpdated || new Date().toISOString(),
            isFavorite: album.isFavorite || false
          }));
          
          setCollection(collectionWithPrices);
          console.log('✅ Collection loaded successfully:', collectionWithPrices.length, 'albums');
        } catch (parseError) {
          console.error('❌ Failed to parse collection:', parseError);
          alert('Collection data corrupted. Please import a backup.');
        }
      } else {
        console.log('⚠️ No saved collection found in localStorage');
      }

      const savedPriceChanges = localStorage.getItem('vinylPriceChanges');
      if (savedPriceChanges) {
        setPriceChanges(JSON.parse(savedPriceChanges));
      }
      
      console.log('=== Loading Complete ===');
    } catch (error) {
      console.error('❌ Error loading data:', error);
      alert('Error loading data: ' + error.message);
    }
  }, []); // Run only once on mount

  // Save collection
  useEffect(() => {
    if (collection.length > 0) {
      localStorage.setItem('vinylCollection', JSON.stringify(collection));
    }
  }, [collection]);

  // Save price changes
  useEffect(() => {
    if (Object.keys(priceChanges).length > 0) {
      localStorage.setItem('vinylPriceChanges', JSON.stringify(priceChanges));
    }
  }, [priceChanges]);

  // Save settings
  const saveSettings = () => {
    const settings = {
      discogsToken,
      anthropicToken,
      selectedShops,
      primaryColor,
      secondaryColor,
      accentColor,
      selectedTheme
    };
    localStorage.setItem('vinylScoutSettings', JSON.stringify(settings));
    alert('Settings saved!');
  };

  // Apply theme
  const applyTheme = (themeName) => {
    setSelectedTheme(themeName);
    if (themeName !== 'custom') {
      setPrimaryColor(themes[themeName].primary);
      setSecondaryColor(themes[themeName].secondary);
      setAccentColor(themes[themeName].accent);
    }
  };

  // Search Discogs
  const searchDiscogs = async (page = 1) => {
    if (!discogsToken) {
      alert('Please add your Discogs token in Settings');
      return;
    }

    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.discogs.com/database/search?q=${encodeURIComponent(searchQuery)}&type=release&per_page=20&page=${page}`,
        {
          headers: {
            'Authorization': `Discogs token=${discogsToken}`,
            'User-Agent': 'VinylScout/1.0'
          }
        }
      );

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setSearchResults(data.results || []);
      setCurrentPage(data.pagination?.page || 1);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Check your token and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Advanced Search
  const advancedSearch = async () => {
    if (!discogsToken) {
      alert('Please add your Discogs token in Settings');
      return;
    }

    const params = new URLSearchParams();
    if (advancedFilters.artist) params.append('artist', advancedFilters.artist);
    if (advancedFilters.album) params.append('release_title', advancedFilters.album);
    if (advancedFilters.year) params.append('year', advancedFilters.year);
    if (advancedFilters.label) params.append('label', advancedFilters.label);
    if (advancedFilters.catno) params.append('catno', advancedFilters.catno);
    if (advancedFilters.barcode) params.append('barcode', advancedFilters.barcode);
    
    params.append('type', 'release');
    params.append('per_page', '20');

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.discogs.com/database/search?${params.toString()}`,
        {
          headers: {
            'Authorization': `Discogs token=${discogsToken}`,
            'User-Agent': 'VinylScout/1.0'
          }
        }
      );

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setSearchResults(data.results || []);
      setCurrentPage(data.pagination?.page || 1);
      setTotalPages(data.pagination?.pages || 1);
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Check your token and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get album details with price
  const getAlbumDetails = async (id) => {
    if (!discogsToken) return null;

    try {
      // Get release details
      const releaseResponse = await fetch(
        `https://api.discogs.com/releases/${id}`,
        {
          headers: {
            'Authorization': `Discogs token=${discogsToken}`,
            'User-Agent': 'VinylScout/1.0'
          }
        }
      );

      if (!releaseResponse.ok) throw new Error('Failed to fetch details');
      const releaseData = await releaseResponse.json();

      // Get lowest price
      const priceResponse = await fetch(
        `https://api.discogs.com/marketplace/stats/${id}`,
        {
          headers: {
            'Authorization': `Discogs token=${discogsToken}`,
            'User-Agent': 'VinylScout/1.0'
          }
        }
      );

      let price = 'Price unavailable';
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        if (priceData.lowest_price) {
          price = `EUR ${priceData.lowest_price.value.toFixed(2)}`;
        }
      }

      return {
        id: releaseData.id,
        title: releaseData.title,
        artists: releaseData.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
        year: releaseData.year || 'Unknown',
        genres: releaseData.genres || [],
        styles: releaseData.styles || [],
        label: releaseData.labels?.[0]?.name || 'Unknown Label',
        catno: releaseData.labels?.[0]?.catno || '',
        image: releaseData.images?.[0]?.uri || releaseData.thumb || '',
        tracklist: releaseData.tracklist || [],
        price: price,
        priceNumeric: price !== 'Price unavailable' ? parseFloat(price.replace('EUR ', '')) : null,
        lastUpdated: new Date().toISOString(),
        isFavorite: false
      };
    } catch (error) {
      console.error('Error fetching album details:', error);
      return null;
    }
  };

  // Refresh single album price
  const refreshAlbumPrice = async (album) => {
    if (!discogsToken) return;

    setRefreshingPrices(prev => ({ ...prev, [album.id]: true }));

    try {
      const priceResponse = await fetch(
        `https://api.discogs.com/marketplace/stats/${album.id}`,
        {
          headers: {
            'Authorization': `Discogs token=${discogsToken}`,
            'User-Agent': 'VinylScout/1.0'
          }
        }
      );

      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        if (priceData.lowest_price) {
          const newPrice = `EUR ${priceData.lowest_price.value.toFixed(2)}`;
          const oldPriceNumeric = album.priceNumeric;
          const newPriceNumeric = priceData.lowest_price.value;

          // Calculate price change
          let change = 'same';
          if (oldPriceNumeric !== null && oldPriceNumeric !== newPriceNumeric) {
            change = newPriceNumeric > oldPriceNumeric ? 'up' : 'down';
          }

          // Update price changes
          setPriceChanges(prev => ({
            ...prev,
            [album.id]: {
              change,
              oldPrice: album.price,
              newPrice: newPrice,
              timestamp: new Date().toISOString()
            }
          }));

          // Update collection
          setCollection(prev => prev.map(item =>
            item.id === album.id
              ? { ...item, price: newPrice, priceNumeric: newPriceNumeric, lastUpdated: new Date().toISOString() }
              : item
          ));
        }
      }
    } catch (error) {
      console.error('Error refreshing price:', error);
    } finally {
      setRefreshingPrices(prev => ({ ...prev, [album.id]: false }));
    }
  };

  // Rescan all prices
  const rescanAllPrices = async () => {
    if (!discogsToken) {
      alert('Please add your Discogs token in Settings');
      return;
    }

    if (collection.length === 0) {
      alert('No albums in collection to rescan');
      return;
    }

    setIsRescanning(true);
    setRescanProgress({ current: 0, total: collection.length });

    for (let i = 0; i < collection.length; i++) {
      await refreshAlbumPrice(collection[i]);
      setRescanProgress({ current: i + 1, total: collection.length });
      
      // Rate limiting: wait 1 second between requests
      if (i < collection.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsRescanning(false);
    alert('Price rescan complete!');
  };

  // Add to collection
  const addToCollection = async (result) => {
    const details = await getAlbumDetails(result.id);
    if (details) {
      setCollection(prev => [...prev, details]);
      alert('Added to collection!');
    }
  };

  // Remove from collection
  const removeFromCollection = (id) => {
    setCollection(prev => prev.filter(item => item.id !== id));
  };

  // Toggle favorite
  const toggleFavorite = (id) => {
    setCollection(prev => prev.map(item =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  };

  // Calculate statistics
  const calculateStats = () => {
    if (collection.length === 0) return null;

    const withPrices = collection.filter(item => item.priceNumeric !== null);
    const totalValue = withPrices.reduce((sum, item) => sum + item.priceNumeric, 0);
    
    const mostExpensive = withPrices.length > 0
      ? withPrices.reduce((max, item) => item.priceNumeric > max.priceNumeric ? item : max)
      : null;
    
    const leastExpensive = withPrices.length > 0
      ? withPrices.reduce((min, item) => item.priceNumeric < min.priceNumeric ? item : min)
      : null;
    
    return {
      totalAlbums: collection.length,
      totalValue: totalValue.toFixed(2),
      withPrices: withPrices.length,
      favorites: collection.filter(item => item.isFavorite).length,
      mostExpensive,
      leastExpensive
    };
  };

  // Get sorted collection
  const getSortedCollection = () => {
    let filtered = showFavoritesOnly 
      ? collection.filter(item => item.isFavorite)
      : collection;

    let sorted = [...filtered];
    
    switch (sortBy) {
      case 'artist':
        sorted.sort((a, b) => {
          const artistA = a.artists || '';
          const artistB = b.artists || '';
          return artistA.localeCompare(artistB);
        });
        break;
      case 'title':
        sorted.sort((a, b) => {
          const titleA = a.title || '';
          const titleB = b.title || '';
          return titleA.localeCompare(titleB);
        });
        break;
      case 'year':
        sorted.sort((a, b) => {
          const yearA = parseInt(a.year) || 0;
          const yearB = parseInt(b.year) || 0;
          return yearB - yearA;
        });
        break;
      case 'price':
        sorted.sort((a, b) => {
          const priceA = a.priceNumeric || 0;
          const priceB = b.priceNumeric || 0;
          return priceB - priceA;
        });
        break;
      case 'dateAdded':
        sorted.sort((a, b) => {
          const dateA = new Date(a.lastUpdated || 0);
          const dateB = new Date(b.lastUpdated || 0);
          return dateB - dateA;
        });
        break;
    }
    
    return sorted;
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Camera error:', error);
      alert('Could not access camera');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      await analyzeVinylImage(blob);
    }, 'image/jpeg', 0.95);
  };

  const analyzeVinylImage = async (imageBlob) => {
    if (!anthropicToken) {
      alert('Please add your Anthropic API key in Settings');
      stopCamera();
      return;
    }

    setIsLoading(true);
    stopCamera();

    try {
      const base64Image = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(imageBlob);
      });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicToken,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image
                }
              },
              {
                type: 'text',
                text: 'Analyze this vinyl record image. Extract: artist name, album title, year (if visible), label, catalog number. Format as JSON: {"artist":"","album":"","year":"","label":"","catno":""}'
              }
            ]
          }]
        })
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      const analysisText = data.content[0].text;
      
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const vinylData = JSON.parse(jsonMatch[0]);
        
        setAdvancedFilters({
          artist: vinylData.artist || '',
          album: vinylData.album || '',
          year: vinylData.year || '',
          label: vinylData.label || '',
          catno: vinylData.catno || '',
          barcode: ''
        });
        
        setShowAdvancedSearch(true);
        setActiveTab('search');
        
        advancedSearch();
      }
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze image');
    } finally {
      setIsLoading(false);
    }
  };

  // Price change indicator
  const PriceChangeIndicator = ({ albumId }) => {
    const change = priceChanges[albumId];
    if (!change || change.change === 'same') return null;

    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '12px',
        backgroundColor: change.change === 'up' ? '#fee' : '#efe',
        color: change.change === 'up' ? '#c00' : '#0a0',
        marginLeft: '8px'
      }}>
        {change.change === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {change.change === 'up' ? '↑' : '↓'}
      </div>
    );
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'search':
        return (
          <div style={{ minHeight: '100%', backgroundColor: primaryColor }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Search for vinyl records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchDiscogs()}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${secondaryColor}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: secondaryColor,
                    color: '#fff'
                  }}
                />
                <button 
                  onClick={() => searchDiscogs()} 
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: accentColor,
                    color: '#000'
                  }}
                >
                  <Search size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  style={{
                    padding: '8px 16px',
                    border: `1px solid ${accentColor}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    color: accentColor
                  }}
                >
                  Advanced Search
                </button>
              </div>

              {showAdvancedSearch && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  backgroundColor: secondaryColor,
                  borderRadius: '8px'
                }}>
                  <h3 style={{ marginBottom: '12px' }}>Advanced Search</h3>
                  <input
                    type="text"
                    placeholder="Artist"
                    value={advancedFilters.artist}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, artist: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: `1px solid ${secondaryColor}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: primaryColor,
                      color: '#fff',
                      marginBottom: '12px'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Album"
                    value={advancedFilters.album}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, album: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: `1px solid ${secondaryColor}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: primaryColor,
                      color: '#fff',
                      marginBottom: '12px'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Year"
                    value={advancedFilters.year}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, year: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: `1px solid ${secondaryColor}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: primaryColor,
                      color: '#fff',
                      marginBottom: '12px'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Label"
                    value={advancedFilters.label}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, label: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: `1px solid ${secondaryColor}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: primaryColor,
                      color: '#fff',
                      marginBottom: '12px'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Catalog Number"
                    value={advancedFilters.catno}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, catno: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: `1px solid ${secondaryColor}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: primaryColor,
                      color: '#fff',
                      marginBottom: '12px'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Barcode"
                    value={advancedFilters.barcode}
                    onChange={(e) => setAdvancedFilters({ ...advancedFilters, barcode: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: `1px solid ${secondaryColor}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      backgroundColor: primaryColor,
                      color: '#fff',
                      marginBottom: '12px'
                    }}
                  />
                  <button 
                    onClick={advancedSearch} 
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      backgroundColor: accentColor,
                      color: '#000'
                    }}
                  >
                    Search
                  </button>
                </div>
              )}
            </div>

            {isLoading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>}

            {searchResults.length > 0 && (
              <>
                <div style={{ marginBottom: '16px' }}>
                  {searchResults.map(result => (
                    <div
                      key={result.id}
                      style={{
                        backgroundColor: secondaryColor,
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '12px',
                        display: 'flex',
                        gap: '12px',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedResult(result)}
                    >
                      <img
                        src={result.thumb || result.cover_image}
                        alt={result.title}
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '4px',
                          objectFit: 'cover',
                          backgroundColor: '#333'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          {result.title}
                        </div>
                        <div style={{ fontSize: '14px', color: '#999' }}>
                          {result.year || 'Year unknown'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                          {result.label?.join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
                    <button
                      onClick={() => searchDiscogs(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{
                        padding: '8px 16px',
                        border: `1px solid ${accentColor}`,
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        backgroundColor: 'transparent',
                        color: accentColor,
                        opacity: currentPage === 1 ? 0.5 : 1
                      }}
                    >
                      Previous
                    </button>
                    <span style={{ padding: '8px 16px' }}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => searchDiscogs(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '8px 16px',
                        border: `1px solid ${accentColor}`,
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        backgroundColor: 'transparent',
                        color: accentColor,
                        opacity: currentPage === totalPages ? 0.5 : 1
                      }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}

            {selectedResult && (
              <div 
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.9)',
                  zIndex: 1000,
                  overflow: 'auto',
                  padding: '20px'
                }} 
                onClick={() => setSelectedResult(null)}
              >
                <div 
                  style={{
                    maxWidth: '600px',
                    margin: '0 auto',
                    backgroundColor: secondaryColor,
                    borderRadius: '12px',
                    padding: '24px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h2>Album Details</h2>
                    <button
                      onClick={() => setSelectedResult(null)}
                      style={{
                        padding: '4px 8px',
                        border: `1px solid ${accentColor}`,
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        backgroundColor: 'transparent',
                        color: accentColor
                      }}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <img
                    src={selectedResult.thumb || selectedResult.cover_image}
                    alt={selectedResult.title}
                    style={{ width: '100%', borderRadius: '8px', marginBottom: '16px' }}
                  />
                  
                  <h3 style={{ marginBottom: '8px' }}>{selectedResult.title}</h3>
                  <p style={{ color: '#999', marginBottom: '16px' }}>
                    {selectedResult.year || 'Year unknown'}
                  </p>
                  
                  <button
                    onClick={() => {
                      addToCollection(selectedResult);
                      setSelectedResult(null);
                    }}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      backgroundColor: accentColor,
                      color: '#000',
                      width: '100%'
                    }}
                  >
                    Add to Collection
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'camera':
        return (
          <div style={{ textAlign: 'center', minHeight: '100%', backgroundColor: primaryColor }}>
            {!showCamera ? (
              <div>
                <div style={{
                  width: '200px',
                  height: '200px',
                  margin: '40px auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px dashed ${accentColor}`,
                  borderRadius: '12px'
                }}>
                  <Camera size={64} color={accentColor} />
                </div>
                <h2 style={{ marginBottom: '16px' }}>AI Vinyl Recognition</h2>
                <p style={{ color: '#999', marginBottom: '24px' }}>
                  Take a photo of your vinyl record and let AI identify it
                </p>
                <button 
                  onClick={startCamera}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: accentColor,
                    color: '#000'
                  }}
                >
                  Start Camera
                </button>
              </div>
            ) : (
              <div>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    maxWidth: '500px',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button 
                    onClick={captureImage}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      backgroundColor: accentColor,
                      color: '#000'
                    }}
                  >
                    Capture & Analyze
                  </button>
                  <button 
                    onClick={stopCamera}
                    style={{
                      padding: '8px 16px',
                      border: `1px solid ${accentColor}`,
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      backgroundColor: 'transparent',
                      color: accentColor
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'collection':
        const sortedCollection = getSortedCollection();
        
        return (
          <div style={{ minHeight: '100%', backgroundColor: primaryColor }}>
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '16px',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: 'auto',
                  padding: '10px',
                  border: `1px solid ${secondaryColor}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: primaryColor,
                  color: '#fff',
                  marginBottom: 0
                }}
              >
                <option value="artist">Sort by Artist</option>
                <option value="title">Sort by Title</option>
                <option value="year">Sort by Year</option>
                <option value="price">Sort by Price</option>
                <option value="dateAdded">Sort by Date Added</option>
              </select>

              <button
                onClick={() => setCollectionView(collectionView === 'gallery' ? 'list' : 'gallery')}
                style={{
                  padding: '8px 16px',
                  border: `1px solid ${accentColor}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  color: accentColor
                }}
              >
                {collectionView === 'gallery' ? <List size={16} /> : <Grid size={16} />}
              </button>

              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                style={{
                  padding: '8px 16px',
                  border: `1px solid ${accentColor}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  backgroundColor: showFavoritesOnly ? accentColor : 'transparent',
                  color: showFavoritesOnly ? '#000' : accentColor
                }}
              >
                <Heart size={16} fill={showFavoritesOnly ? '#000' : 'none'} />
              </button>

              <button
                onClick={rescanAllPrices}
                disabled={isRescanning}
                style={{
                  padding: '8px 16px',
                  border: `1px solid ${accentColor}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  color: accentColor,
                  opacity: isRescanning ? 0.5 : 1
                }}
              >
                <RefreshCw size={16} className={isRescanning ? 'spin' : ''} />
                {isRescanning ? ` ${rescanProgress.current}/${rescanProgress.total}` : ' Rescan All'}
              </button>
            </div>

            {sortedCollection.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                {showFavoritesOnly ? 'No favorites yet' : 'No albums in collection'}
              </div>
            ) : collectionView === 'gallery' ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '16px'
              }}>
                {sortedCollection.map(album => (
                  <div
                    key={album.id}
                    style={{
                      backgroundColor: secondaryColor,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    onClick={() => setSelectedResult(album)}
                  >
                    <img
                      src={album.image}
                      alt={album.title}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        objectFit: 'cover',
                        backgroundColor: '#333'
                      }}
                    />
                    {album.isFavorite && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        borderRadius: '50%',
                        padding: '4px'
                      }}>
                        <Heart size={16} fill={accentColor} color={accentColor} />
                      </div>
                    )}
                    <div style={{ padding: '8px' }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        marginBottom: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {album.artists}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#999',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {album.title}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: accentColor,
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        {album.price}
                        <PriceChangeIndicator albumId={album.id} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {sortedCollection.map(album => (
                  <div 
                    key={album.id}
                    style={{
                      backgroundColor: secondaryColor,
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '12px',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center'
                    }}
                  >
                    <img
                      src={album.image}
                      alt={album.title}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '4px',
                        objectFit: 'cover',
                        backgroundColor: '#333'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                        {album.artists}
                      </div>
                      <div style={{ fontSize: '14px', color: '#999', marginBottom: '4px' }}>
                        {album.title}
                      </div>
                      <div style={{ fontSize: '14px', color: accentColor, display: 'flex', alignItems: 'center' }}>
                        {album.price}
                        <PriceChangeIndicator albumId={album.id} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(album.id);
                        }}
                        style={{
                          padding: '8px',
                          border: `1px solid ${accentColor}`,
                          borderRadius: '8px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          backgroundColor: 'transparent',
                          color: accentColor
                        }}
                      >
                        <Heart
                          size={16}
                          fill={album.isFavorite ? accentColor : 'none'}
                          color={accentColor}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          refreshAlbumPrice(album);
                        }}
                        disabled={refreshingPrices[album.id]}
                        style={{
                          padding: '8px',
                          border: `1px solid ${accentColor}`,
                          borderRadius: '8px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          backgroundColor: 'transparent',
                          color: accentColor
                        }}
                      >
                        <RefreshCw
                          size={16}
                          className={refreshingPrices[album.id] ? 'spin' : ''}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedResult(album);
                        }}
                        style={{
                          padding: '8px',
                          border: `1px solid ${accentColor}`,
                          borderRadius: '8px',
                          fontSize: '14px',
                          cursor: 'pointer',
                          backgroundColor: 'transparent',
                          color: accentColor
                        }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'profile':
        const stats = calculateStats();
        
        return (
          <div style={{ minHeight: '100%', backgroundColor: primaryColor }}>
            <h2 style={{ marginBottom: '24px' }}>Collection Statistics</h2>
            
            {stats ? (
              <div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  <div style={{
                    backgroundColor: secondaryColor,
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: accentColor }}>
                      {stats.totalAlbums}
                    </div>
                    <div style={{ color: '#999', marginTop: '8px' }}>Total Albums</div>
                  </div>

                  <div style={{
                    backgroundColor: secondaryColor,
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: accentColor }}>
                      €{stats.totalValue}
                    </div>
                    <div style={{ color: '#999', marginTop: '8px' }}>Total Value</div>
                  </div>

                  <div style={{
                    backgroundColor: secondaryColor,
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: accentColor }}>
                      {stats.favorites}
                    </div>
                    <div style={{ color: '#999', marginTop: '8px' }}>Favorites</div>
                  </div>

                  <div style={{
                    backgroundColor: secondaryColor,
                    padding: '20px',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: accentColor }}>
                      {stats.withPrices}
                    </div>
                    <div style={{ color: '#999', marginTop: '8px' }}>Priced Items</div>
                  </div>
                </div>

                {stats.mostExpensive && (
                  <div style={{
                    backgroundColor: secondaryColor,
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <h3 style={{ marginBottom: '12px' }}>Most Expensive</h3>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <img
                        src={stats.mostExpensive.image}
                        alt={stats.mostExpensive.title}
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '4px',
                          objectFit: 'cover'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          {stats.mostExpensive.artists}
                        </div>
                        <div style={{ color: '#999', fontSize: '14px', marginBottom: '4px' }}>
                          {stats.mostExpensive.title}
                        </div>
                        <div style={{ color: accentColor, fontSize: '18px', fontWeight: 'bold' }}>
                          {stats.mostExpensive.price}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {stats.leastExpensive && (
                  <div style={{
                    backgroundColor: secondaryColor,
                    padding: '20px',
                    borderRadius: '8px'
                  }}>
                    <h3 style={{ marginBottom: '12px' }}>Least Expensive</h3>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <img
                        src={stats.leastExpensive.image}
                        alt={stats.leastExpensive.title}
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '4px',
                          objectFit: 'cover'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                          {stats.leastExpensive.artists}
                        </div>
                        <div style={{ color: '#999', fontSize: '14px', marginBottom: '4px' }}>
                          {stats.leastExpensive.title}
                        </div>
                        <div style={{ color: accentColor, fontSize: '18px', fontWeight: 'bold' }}>
                          {stats.leastExpensive.price}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                No albums in collection yet
              </div>
            )}
          </div>
        );

      case 'settings':
        return (
          <div style={{ minHeight: '100%', backgroundColor: primaryColor }}>
            <h2 style={{ marginBottom: '24px' }}>Settings</h2>
            
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '12px' }}>API Tokens</h3>
              <input
                type="password"
                placeholder="Discogs Token"
                value={discogsToken}
                onChange={(e) => setDiscogsToken(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${secondaryColor}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: primaryColor,
                  color: '#fff',
                  marginBottom: '12px'
                }}
              />
              <input
                type="password"
                placeholder="Anthropic API Key"
                value={anthropicToken}
                onChange={(e) => setAnthropicToken(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: `1px solid ${secondaryColor}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: primaryColor,
                  color: '#fff',
                  marginBottom: '12px'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '12px' }}>Collection Data</h3>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    const data = localStorage.getItem('vinylCollection');
                    if (data) {
                      const parsed = JSON.parse(data);
                      alert(`Found ${parsed.length} albums in storage. Reloading...`);
                      setCollection(parsed);
                      window.location.reload();
                    } else {
                      alert('No collection data found in storage');
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    border: `1px solid ${accentColor}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    color: accentColor
                  }}
                >
                  Check Storage
                </button>
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(collection, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'vinylscout-backup.json';
                    link.click();
                  }}
                  style={{
                    padding: '8px 16px',
                    border: `1px solid ${accentColor}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    color: accentColor
                  }}
                >
                  Export Collection
                </button>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const imported = JSON.parse(event.target.result);
                          setCollection(imported);
                          localStorage.setItem('vinylCollection', JSON.stringify(imported));
                          alert(`Imported ${imported.length} albums!`);
                          window.location.reload();
                        } catch (error) {
                          alert('Failed to import: ' + error.message);
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                  style={{ display: 'none' }}
                  id="importFile"
                />
                <button
                  onClick={() => document.getElementById('importFile').click()}
                  style={{
                    padding: '8px 16px',
                    border: `1px solid ${accentColor}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    color: accentColor
                  }}
                >
                  Import Collection
                </button>
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                Current collection: {collection.length} albums
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '12px' }}>Theme</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px',
                marginBottom: '16px'
              }}>
                {Object.entries(themes).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => applyTheme(key)}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      border: selectedTheme === key ? `2px solid ${accentColor}` : '1px solid #333',
                      backgroundColor: theme.secondary,
                      color: '#fff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      position: 'relative'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                      {theme.name}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: theme.primary,
                        border: '1px solid #666'
                      }} />
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: theme.secondary,
                        border: '1px solid #666'
                      }} />
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: theme.accent,
                        border: '1px solid #666'
                      }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedTheme === 'custom' && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '12px' }}>Custom Colors</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                      Primary Color
                    </label>
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      style={{ width: '100%', height: '40px', border: 'none', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                      Secondary Color
                    </label>
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      style={{ width: '100%', height: '40px', border: 'none', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>
                      Accent Color
                    </label>
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      style={{ width: '100%', height: '40px', border: 'none', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={saveSettings}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                backgroundColor: accentColor,
                color: '#000',
                width: '100%'
              }}
            >
              Save Settings
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: primaryColor,
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          position: fixed;
          width: 100%;
          height: 100%;
        }
        * {
          -webkit-tap-highlight-color: transparent;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        input, textarea {
          -webkit-user-select: text;
          user-select: text;
        }
      `}</style>

      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${secondaryColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: primaryColor
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: accentColor,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Music size={28} />
          VinylScout
        </div>
        {collection.length === 0 && (
          <button
            onClick={() => {
              console.log('=== EMERGENCY RESTORE ===');
              
              // Check all possible localStorage keys
              const allKeys = Object.keys(localStorage);
              console.log('All localStorage keys:', allKeys);
              
              // Try multiple possible keys
              const possibleKeys = ['vinylCollection', 'collection', 'albums', 'records'];
              let restored = false;
              
              for (const key of possibleKeys) {
                const data = localStorage.getItem(key);
                if (data) {
                  console.log(`Found data in key "${key}":`, data.substring(0, 100));
                  try {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      console.log(`✅ Valid array found: ${parsed.length} items`);
                      setCollection(parsed);
                      localStorage.setItem('vinylCollection', JSON.stringify(parsed));
                      alert(`✅ Restored ${parsed.length} albums from "${key}"!`);
                      restored = true;
                      window.location.reload(); // Force reload to update UI
                      break;
                    }
                  } catch (e) {
                    console.error(`Failed to parse ${key}:`, e);
                  }
                }
              }
              
              if (!restored) {
                // Dump all localStorage for debugging
                console.log('=== Full localStorage dump ===');
                allKeys.forEach(key => {
                  const value = localStorage.getItem(key);
                  console.log(`${key}:`, value ? value.substring(0, 200) : 'null');
                });
                alert('❌ No collection data found anywhere in localStorage.\n\nPlease import a backup file from Settings tab.');
              }
            }}
            style={{
              padding: '8px 12px',
              backgroundColor: '#ff4444',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            RESTORE
          </button>
        )}
      </div>

      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px',
        backgroundColor: primaryColor,
        WebkitOverflowScrolling: 'touch',
        position: 'relative'
      }}>
        {renderContent()}
      </div>

      <div style={{
        display: 'flex',
        borderTop: `1px solid ${secondaryColor}`,
        backgroundColor: secondaryColor
      }}>
        <button
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'search' ? accentColor : '#999',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px'
          }}
          onClick={() => setActiveTab('search')}
        >
          <Search size={24} />
          <span>Search</span>
        </button>
        <button
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'camera' ? accentColor : '#999',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px'
          }}
          onClick={() => setActiveTab('camera')}
        >
          <Camera size={24} />
          <span>Camera</span>
        </button>
        <button
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'collection' ? accentColor : '#999',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px'
          }}
          onClick={() => setActiveTab('collection')}
        >
          <Music size={24} />
          <span>Collection</span>
        </button>
        <button
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'profile' ? accentColor : '#999',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px'
          }}
          onClick={() => setActiveTab('profile')}
        >
          <DollarSign size={24} />
          <span>Stats</span>
        </button>
        <button
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            background: 'transparent',
            color: activeTab === 'settings' ? accentColor : '#999',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px'
          }}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={24} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default VinylScout;