import React, { useState, useEffect, useRef } from 'react';
import { Search, Camera, Music, Heart, User, Settings, X, ChevronRight, ExternalLink } from 'lucide-react';

const VinylPriceFinder = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedSearch, setAdvancedSearch] = useState({
    artist: '',
    album: '',
    year: '',
    label: '',
    genre: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [resultPrices, setResultPrices] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [priceInfo, setPriceInfo] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [collection, setCollection] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [collectionView, setCollectionView] = useState('grid');
  const [collectionSort, setCollectionSort] = useState('artist-asc');
  const [collectionFilter, setCollectionFilter] = useState('all'); // 'all' or 'favorites'
  
  // Settings state
  const [discogsToken, setDiscogsToken] = useState('');
  const [anthropicToken, setAnthropicToken] = useState('');
  const [selectedShops, setSelectedShops] = useState(['discogs', 'hhv', 'ebay']);
  const [selectedTheme, setSelectedTheme] = useState('custom');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [secondaryColor, setSecondaryColor] = useState('#1a1a1a');
  const [accentColor, setAccentColor] = useState('#ffb700');
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Theme presets with 3 colors
  const themePresets = [
    { id: 'custom', name: 'Custom', primary: primaryColor, secondary: secondaryColor, accent: accentColor },
    { id: 'dark', name: 'Dark Mode', primary: '#000000', secondary: '#1a1a1a', accent: '#ffb700' },
    { id: 'midnight', name: 'Midnight Blue', primary: '#0a1929', secondary: '#1e3a5f', accent: '#00d4ff' },
    { id: 'forest', name: 'Forest Green', primary: '#0d1f15', secondary: '#1a3a25', accent: '#4ade80' },
    { id: 'sunset', name: 'Sunset Orange', primary: '#1a0f0a', secondary: '#2d1a10', accent: '#ff6b35' },
    { id: 'purple', name: 'Purple Haze', primary: '#1a0a2e', secondary: '#2d1a4d', accent: '#c77dff' },
    { id: 'retro', name: 'Retro Cream', primary: '#2d1b00', secondary: '#4a3000', accent: '#ffd700' },
    { id: 'ocean', name: 'Deep Ocean', primary: '#001a33', secondary: '#003366', accent: '#00d9ff' },
    { id: 'berry', name: 'Berry Pink', primary: '#1a0614', secondary: '#2d0f23', accent: '#ff006e' }
  ];

  // Load settings from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('discogsToken');
    const savedAnthropicToken = localStorage.getItem('anthropicToken');
    const savedShops = localStorage.getItem('selectedShops');
    const savedTheme = localStorage.getItem('selectedTheme');
    const savedPrimaryColor = localStorage.getItem('primaryColor');
    const savedSecondaryColor = localStorage.getItem('secondaryColor');
    const savedAccentColor = localStorage.getItem('accentColor');
    const savedCollection = localStorage.getItem('collection');
    const savedFavorites = localStorage.getItem('favorites');
    
    if (savedToken) setDiscogsToken(savedToken);
    if (savedAnthropicToken) setAnthropicToken(savedAnthropicToken);
    if (savedShops) setSelectedShops(JSON.parse(savedShops));
    if (savedTheme) setSelectedTheme(savedTheme);
    if (savedPrimaryColor) setPrimaryColor(savedPrimaryColor);
    if (savedSecondaryColor) setSecondaryColor(savedSecondaryColor);
    if (savedAccentColor) setAccentColor(savedAccentColor);
    if (savedCollection) setCollection(JSON.parse(savedCollection));
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
  }, []);

  // Apply theme
  const applyTheme = (themeId) => {
    setSelectedTheme(themeId);
    if (themeId !== 'custom') {
      const theme = themePresets.find(t => t.id === themeId);
      if (theme) {
        setPrimaryColor(theme.primary);
        setSecondaryColor(theme.secondary);
        setAccentColor(theme.accent);
      }
    }
  };

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem('discogsToken', discogsToken);
    localStorage.setItem('anthropicToken', anthropicToken);
    localStorage.setItem('selectedShops', JSON.stringify(selectedShops));
    localStorage.setItem('selectedTheme', selectedTheme);
    localStorage.setItem('primaryColor', primaryColor);
    localStorage.setItem('secondaryColor', secondaryColor);
    localStorage.setItem('accentColor', accentColor);
    setShowSettings(false);
  };

  // Search Discogs API
  const searchDiscogs = async (isAdvanced = false, queryOverride = null) => {
    if (!discogsToken) {
      alert('Please add your Discogs API token in Settings');
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
          alert('Please fill in at least one search field');
          setIsLoading(false);
          return;
        }
        
        searchUrl += params.join('&') + '&per_page=10&type=release';
      } else {
        const query = queryOverride || searchQuery;
        if (!query.trim()) {
          setIsLoading(false);
          return;
        }
        searchUrl += `q=${encodeURIComponent(query)}&per_page=10&type=release`;
      }
      
      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Discogs token=${discogsToken}`,
          'User-Agent': 'VinylScout/1.0'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        alert(`Search failed: ${response.status} - Please check your API token`);
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
        fetchAllPrices(data.results);
      } else {
        setSearchResults([]);
        setResultPrices({});
        alert('No results found. Try different search terms.');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert(`Error searching: ${error.message}`);
    }
    setIsLoading(false);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchDiscogs(false);
    }
  };

  const handleAdvancedSearch = () => {
    searchDiscogs(true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Camera functionality
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      alert('Could not access camera');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    if (anthropicToken) {
      identifyAlbumWithAI(imageData);
    } else {
      alert('Please add your Anthropic API token in Settings to use AI image recognition');
    }
    
    stopCamera();
  };

  // AI Image Recognition
  const identifyAlbumWithAI = async (imageBase64) => {
    setIsLoading(true);
    try {
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
                  data: imageBase64.split(',')[1]
                }
              },
              {
                type: 'text',
                text: 'This is a vinyl record album cover. Please identify the artist name and album title. Respond ONLY with the format: "Artist - Album Title". If you cannot identify it, respond with "Unknown - Unknown".'
              }
            ]
          }]
        })
      });

      const data = await response.json();
      
      if (data.content && data.content[0] && data.content[0].text) {
        const albumInfo = data.content[0].text.trim();
        setSearchQuery(albumInfo);
        searchDiscogs(false, albumInfo);
        setActiveTab('search');
      } else {
        alert('Could not identify the album. Please try again or use manual search.');
      }
    } catch (error) {
      console.error('AI identification error:', error);
      alert('Error identifying album. Please check your API token or try manual search.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'camera' && !isCameraActive) {
      startCamera();
    } else if (activeTab !== 'camera' && isCameraActive) {
      stopCamera();
    }
    
    return () => stopCamera();
  }, [activeTab]);

  // Collection & Favorites
  const addToCollection = (item) => {
    const priceData = resultPrices[item.id];
    const itemWithPrice = {
      ...item,
      price: priceData ? {
        value: priceData.value,
        currency: priceData.currency
      } : null,
      addedAt: new Date().toISOString(),
      isFavorite: false
    };
    const newCollection = [...collection, itemWithPrice];
    setCollection(newCollection);
    localStorage.setItem('collection', JSON.stringify(newCollection));
  };

  const toggleFavoriteInCollection = (itemId) => {
    const newCollection = collection.map(item => 
      item.id === itemId ? { ...item, isFavorite: !item.isFavorite } : item
    );
    setCollection(newCollection);
    localStorage.setItem('collection', JSON.stringify(newCollection));
  };

  const isFavorited = (item) => {
    const collectionItem = collection.find(c => c.id === item.id);
    return collectionItem?.isFavorite || false;
  };

  // Fetch price information
  const fetchPriceInfo = async (releaseId) => {
    if (!discogsToken) return null;
    
    try {
      const statsResponse = await fetch(
        `https://api.discogs.com/marketplace/stats/${releaseId}`,
        {
          headers: {
            'Authorization': `Discogs token=${discogsToken}`,
            'User-Agent': 'VinylScout/1.0'
          }
        }
      );
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        
        let displayPrice = null;
        
        if (statsData.lowest_price) {
          if (statsData.lowest_price && statsData.num_for_sale > 0) {
            displayPrice = {
              value: statsData.lowest_price.value,
              currency: statsData.lowest_price.currency,
              num_for_sale: statsData.num_for_sale,
              stats: statsData
            };
          }
        }
        
        return displayPrice;
      }
    } catch (error) {
      console.error('Price fetch error:', error);
    }
    return null;
  };

  // Fetch prices for all results
  const fetchAllPrices = async (results) => {
    const prices = {};
    for (const result of results.slice(0, 10)) {
      const priceData = await fetchPriceInfo(result.id);
      if (priceData) {
        prices[result.id] = priceData;
      }
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    setResultPrices(prices);
  };

  // Calculate display price
  const calculateDisplayPrice = (priceData) => {
    if (!priceData) return null;
    
    if (selectedShops.includes('discogs') && priceData.value) {
      return {
        value: priceData.value.toFixed(2),
        currency: priceData.currency,
        type: 'discogs',
        label: 'from'
      };
    }
    
    return null;
  };

  // Shop toggle
  const toggleShop = (shop) => {
    setSelectedShops(prev => 
      prev.includes(shop) 
        ? prev.filter(s => s !== shop)
        : [...prev, shop]
    );
  };

  // Sort collection
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
        return sorted.sort((a, b) => {
          const aPrice = a.price?.value || 0;
          const bPrice = b.price?.value || 0;
          return aPrice - bPrice;
        });
      case 'price-desc':
        return sorted.sort((a, b) => {
          const aPrice = a.price?.value || 0;
          const bPrice = b.price?.value || 0;
          return bPrice - aPrice;
        });
      default:
        return sorted;
    }
  };

  // Filter collection
  const filterCollection = (items, filter) => {
    if (filter === 'favorites') {
      return items.filter(item => item.isFavorite);
    }
    return items;
  };

  // Calculate collection value
  const calculateCollectionValue = () => {
    let total = 0;
    let count = 0;
    let currency = 'EUR';
    
    collection.forEach(item => {
      if (item.price && item.price.value && typeof item.price.value === 'number') {
        total += item.price.value;
        count++;
        if (item.price.currency) {
          currency = item.price.currency;
        }
      }
    });
    
    return { 
      value: total.toFixed(2), 
      currency: currency,
      count: count
    };
  };

  return (
    <div 
      className="w-full h-full"
      style={{ 
        backgroundColor: primaryColor,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Fixed Header */}
      <div 
        className="px-4 py-4 text-white flex justify-between items-center"
        style={{ 
          backgroundColor: primaryColor,
          flexShrink: 0
        }}
      >
        <h1 className="text-2xl font-bold" style={{ color: accentColor }}>
          VinylScout
        </h1>
        <button 
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg hover:bg-white/10"
        >
          <Settings size={24} style={{ color: accentColor }} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div 
        className="px-4"
        style={{ 
          flex: 1,
          overflowY: 'auto',
          paddingBottom: '100px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-4" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1 }}>
              {/* Simple Search Bar */}
              <div className="space-y-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Quick search..."
                  className="w-full px-4 py-3 rounded-lg text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/40"
                  style={{ backgroundColor: secondaryColor }}
                />
              </div>

              {/* Advanced Search Toggle */}
              <button
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="w-full py-2 text-sm flex items-center justify-center gap-2 mt-3"
                style={{ color: accentColor }}
              >
                {showAdvancedSearch ? '▲' : '▼'} Advanced Search
              </button>

              {/* Advanced Search Fields */}
              {showAdvancedSearch && (
                <div className="space-y-3 rounded-lg p-4 border border-white/10 mt-3" style={{ backgroundColor: secondaryColor }}>
                  <div>
                    <label className="block text-white/60 text-xs mb-1">Artist</label>
                    <input
                      type="text"
                      value={advancedSearch.artist}
                      onChange={(e) => setAdvancedSearch({...advancedSearch, artist: e.target.value})}
                      placeholder="e.g. Pink Floyd"
                      className="w-full px-4 py-2 rounded-lg text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-white/40 text-sm"
                      style={{ backgroundColor: primaryColor }}
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 text-xs mb-1">Album</label>
                    <input
                      type="text"
                      value={advancedSearch.album}
                      onChange={(e) => setAdvancedSearch({...advancedSearch, album: e.target.value})}
                      placeholder="e.g. Dark Side of the Moon"
                      className="w-full px-4 py-2 rounded-lg text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-white/40 text-sm"
                      style={{ backgroundColor: primaryColor }}
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 text-xs mb-1">Year of Release</label>
                    <input
                      type="text"
                      value={advancedSearch.year}
                      onChange={(e) => setAdvancedSearch({...advancedSearch, year: e.target.value})}
                      placeholder="e.g. 1973"
                      className="w-full px-4 py-2 rounded-lg text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-white/40 text-sm"
                      style={{ backgroundColor: primaryColor }}
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 text-xs mb-1">Publisher/Label</label>
                    <input
                      type="text"
                      value={advancedSearch.label}
                      onChange={(e) => setAdvancedSearch({...advancedSearch, label: e.target.value})}
                      placeholder="e.g. Columbia Records"
                      className="w-full px-4 py-2 rounded-lg text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-white/40 text-sm"
                      style={{ backgroundColor: primaryColor }}
                    />
                  </div>

                  <div>
                    <label className="block text-white/60 text-xs mb-1">Genre</label>
                    <input
                      type="text"
                      value={advancedSearch.genre}
                      onChange={(e) => setAdvancedSearch({...advancedSearch, genre: e.target.value})}
                      placeholder="e.g. Rock, Jazz, Electronic"
                      className="w-full px-4 py-2 rounded-lg text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-white/40 text-sm"
                      style={{ backgroundColor: primaryColor }}
                    />
                  </div>
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-3 mt-4">
                  <h3 className="text-white font-semibold">Results ({searchResults.length})</h3>
                  {searchResults.map((result) => {
                    const price = calculateDisplayPrice(resultPrices[result.id]);
                    return (
                      <div
                        key={result.id}
                        onClick={() => setSelectedResult(result)}
                        className="rounded-lg p-3 cursor-pointer transition-all border border-white/10"
                        style={{ backgroundColor: secondaryColor }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${secondaryColor}dd`}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = secondaryColor}
                      >
                        <div className="flex gap-3">
                          {result.cover_image && result.cover_image !== '' ? (
                            <img
                              src={result.cover_image}
                              alt={result.title}
                              className="w-24 h-24 rounded object-cover flex-shrink-0"
                              style={{ objectFit: 'cover', width: '96px', height: '96px' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-24 h-24 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                              <Music size={40} style={{ color: accentColor, opacity: 0.5 }} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <h3 className="text-white font-bold text-base mb-1" style={{ lineHeight: '1.2' }}>
                                {result.title ? result.title.split(' - ')[0] : 'Unknown Artist'}
                              </h3>
                              <p className="text-white/80 text-sm mb-2" style={{ lineHeight: '1.2' }}>
                                {result.title ? (result.title.split(' - ')[1] || result.title) : 'Unknown Album'}
                              </p>
                            </div>
                            <div>
                              {price ? (
                                <div>
                                  <p className="text-xs text-white/60 mb-1">{price.label} Discogs</p>
                                  <p className="text-lg font-bold" style={{ color: accentColor }}>
                                    {price.currency} {price.value}
                                  </p>
                                </div>
                              ) : resultPrices[result.id] === undefined ? (
                                <p className="text-sm" style={{ color: accentColor }}>Loading price...</p>
                              ) : (
                                <p className="text-sm text-white/60">Price unavailable</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!isLoading && searchResults.length === 0 && searchQuery && (
                <div className="text-center py-8">
                  <p className="text-white/60">No results found</p>
                  <p className="text-white/40 text-sm mt-2">Try different search terms</p>
                </div>
              )}
            </div>

            {/* Search Button - Fixed at bottom of search content */}
            <div style={{ paddingTop: '16px', paddingBottom: '8px' }}>
              <button
                onClick={showAdvancedSearch ? handleAdvancedSearch : handleSearch}
                disabled={isLoading}
                className="w-full py-3 rounded-lg font-semibold transition-all"
                style={{ backgroundColor: accentColor, color: primaryColor }}
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        )}

        {/* Camera Tab */}
        {activeTab === 'camera' && (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto"
              />
              {isCameraActive && (
                <button
                  onClick={capturePhoto}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 flex items-center justify-center"
                  style={{ borderColor: accentColor, backgroundColor: accentColor }}
                >
                  <Camera size={28} style={{ color: primaryColor }} />
                </button>
              )}
            </div>
            <div className="rounded-lg p-4 border border-white/10" style={{ backgroundColor: secondaryColor }}>
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span>📸</span> AI Camera Search
              </h3>
              <p className="text-white/60 text-sm mb-2">
                Point camera at vinyl cover and tap the button to capture
              </p>
              {anthropicToken ? (
                <p className="text-xs" style={{ color: accentColor }}>
                  ✓ AI recognition enabled
                </p>
              ) : (
                <p className="text-white/60 text-xs">
                  ⚠️ Add Anthropic API token in Settings to enable AI identification
                </p>
              )}
            </div>
          </div>
        )}

        {/* Collection Tab */}
        {activeTab === 'collection' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">My Collection</h2>
              <div className="flex gap-2">
                <select
                  value={collectionFilter}
                  onChange={(e) => setCollectionFilter(e.target.value)}
                  className="px-3 py-2 rounded text-white border border-white/20 text-xs"
                  style={{ 
                    backgroundColor: secondaryColor,
                    appearance: 'none', 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, 
                    backgroundRepeat: 'no-repeat', 
                    backgroundPosition: 'right 0.5rem center', 
                    backgroundSize: '1em 1em', 
                    paddingRight: '1.75rem' 
                  }}
                >
                  <option value="all" style={{ backgroundColor: primaryColor }}>All ({collection.length})</option>
                  <option value="favorites" style={{ backgroundColor: primaryColor }}>Favorites ({collection.filter(i => i.isFavorite).length})</option>
                </select>
                <select
                  value={collectionSort}
                  onChange={(e) => setCollectionSort(e.target.value)}
                  className="px-3 py-2 rounded text-white border border-white/20 text-xs"
                  style={{ 
                    backgroundColor: secondaryColor,
                    appearance: 'none', 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, 
                    backgroundRepeat: 'no-repeat', 
                    backgroundPosition: 'right 0.5rem center', 
                    backgroundSize: '1em 1em', 
                    paddingRight: '1.75rem' 
                  }}
                >
                  <option value="artist-asc" style={{ backgroundColor: primaryColor }}>Artist A-Z</option>
                  <option value="artist-desc" style={{ backgroundColor: primaryColor }}>Artist Z-A</option>
                  <option value="album-asc" style={{ backgroundColor: primaryColor }}>Album A-Z</option>
                  <option value="album-desc" style={{ backgroundColor: primaryColor }}>Album Z-A</option>
                  <option value="price-asc" style={{ backgroundColor: primaryColor }}>Price ↑</option>
                  <option value="price-desc" style={{ backgroundColor: primaryColor }}>Price ↓</option>
                </select>
                <select
                  value={collectionView}
                  onChange={(e) => setCollectionView(e.target.value)}
                  className="px-3 py-2 rounded text-white border border-white/20 text-xs"
                  style={{ 
                    backgroundColor: secondaryColor,
                    appearance: 'none', 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, 
                    backgroundRepeat: 'no-repeat', 
                    backgroundPosition: 'right 0.5rem center', 
                    backgroundSize: '1em 1em', 
                    paddingRight: '1.75rem' 
                  }}
                >
                  <option value="grid" style={{ backgroundColor: primaryColor }}>Grid</option>
                  <option value="list" style={{ backgroundColor: primaryColor }}>List</option>
                </select>
              </div>
            </div>

            {collection.length === 0 ? (
              <p className="text-white/60 text-center py-8">
                No records in collection yet
              </p>
            ) : (
              <div className={collectionView === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
                {sortCollection(filterCollection(collection, collectionFilter), collectionSort).map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg p-2 cursor-pointer transition-all border border-white/10"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    {collectionView === 'grid' ? (
                      // Grid View - Fixed size tiles
                      <div className="flex flex-col">
                        <div style={{
                          position: 'relative',
                          width: '100%',
                          paddingTop: '100%',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          backgroundColor: primaryColor,
                          marginBottom: '8px'
                        }}>
                          {item.cover_image ? (
                            <img
                              src={item.cover_image}
                              alt={item.title}
                              onClick={() => setSelectedResult(item)}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <div 
                              onClick={() => setSelectedResult(item)}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Music size={32} style={{ color: accentColor, opacity: 0.5 }} />
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavoriteInCollection(item.id);
                            }}
                            style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              background: 'rgba(0,0,0,0.6)',
                              borderRadius: '50%',
                              padding: '6px',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            <Heart
                              size={16}
                              style={{ color: accentColor }}
                              fill={item.isFavorite ? accentColor : 'none'}
                            />
                          </button>
                        </div>
                        <h3 className="text-white font-bold text-xs mb-1" style={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.title?.split(' - ')[0] || 'Unknown'}
                        </h3>
                        <p className="text-white/70 text-xs mb-2" style={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.title?.split(' - ')[1] || item.title || 'Unknown'}
                        </p>
                        {item.price && item.price.value ? (
                          <p className="text-sm font-bold" style={{ color: accentColor }}>
                            {item.price.currency} {Number(item.price.value).toFixed(2)}
                          </p>
                        ) : (
                          <p className="text-xs text-white/40">No price</p>
                        )}
                      </div>
                    ) : (
                      // List View - Detailed
                      <div className="flex gap-3 p-1">
                        {item.cover_image ? (
                          <img
                            src={item.cover_image}
                            alt={item.title}
                            onClick={() => setSelectedResult(item)}
                            style={{
                              width: '80px',
                              height: '80px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              flexShrink: 0,
                              cursor: 'pointer'
                            }}
                          />
                        ) : (
                          <div 
                            onClick={() => setSelectedResult(item)}
                            style={{
                              width: '80px',
                              height: '80px',
                              borderRadius: '8px',
                              backgroundColor: primaryColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              cursor: 'pointer'
                            }}
                          >
                            <Music size={32} style={{ color: accentColor, opacity: 0.5 }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div onClick={() => setSelectedResult(item)} style={{ cursor: 'pointer' }}>
                            <h3 className="text-white font-bold text-sm mb-1" style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {item.title?.split(' - ')[0] || 'Unknown Artist'}
                            </h3>
                            <p className="text-white/70 text-sm mb-1" style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {item.title?.split(' - ')[1] || item.title || 'Unknown Album'}
                            </p>
                          </div>
                          {item.price && item.price.value ? (
                            <p className="text-base font-bold" style={{ color: accentColor }}>
                              {item.price.currency} {Number(item.price.value).toFixed(2)}
                            </p>
                          ) : (
                            <p className="text-sm text-white/40">No price</p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteInCollection(item.id);
                          }}
                          className="p-2 flex-shrink-0 self-center"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <Heart
                            size={20}
                            style={{ color: accentColor }}
                            fill={item.isFavorite ? accentColor : 'none'}
                          />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Profile</h2>
            
            <div className="rounded-lg p-4 space-y-3 border border-white/10" style={{ backgroundColor: secondaryColor }}>
              <div className="flex items-center gap-3">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: accentColor }}
                >
                  <User size={32} style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Vinyl Collector</h3>
                  <p className="text-white/60 text-sm">
                    {collection.length} records in collection
                  </p>
                </div>
              </div>
            </div>
            
            {/* Collection Value */}
            <div className="rounded-lg p-4 border border-white/10" style={{ backgroundColor: secondaryColor }}>
              <h3 className="text-white font-semibold mb-3">Collection Value</h3>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Total Value:</span>
                <span className="text-2xl font-bold" style={{ color: accentColor }}>
                  {calculateCollectionValue().currency} {calculateCollectionValue().value}
                </span>
              </div>
              <p className="text-white/40 text-xs mt-2">
                Based on {calculateCollectionValue().count} of {collection.length} records with price data
              </p>
            </div>

            {/* Statistics */}
            <div className="rounded-lg p-4 space-y-2 border border-white/10" style={{ backgroundColor: secondaryColor }}>
              <h3 className="text-white font-semibold mb-2">Statistics</h3>
              <div className="flex justify-between" style={{ gap: '16px' }}>
                <span className="text-white/60">Total Records</span>
                <span className="text-white font-semibold">{collection.length}</span>
              </div>
              <div className="flex justify-between" style={{ gap: '16px' }}>
                <span className="text-white/60">Favorites</span>
                <span className="text-white font-semibold">{collection.filter(item => item.isFavorite).length}</span>
              </div>
              <div className="flex justify-between" style={{ gap: '16px' }}>
                <span className="text-white/60">With Prices</span>
                <span className="text-white font-semibold">
                  {collection.filter(item => item.price).length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Navigation - 4 BUTTONS */}
      <div 
        style={{ 
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: primaryColor,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '12px 8px',
          flexShrink: 0
        }}
      >
        <button
          onClick={() => setActiveTab('search')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            minWidth: 0,
            flex: '1 1 0',
            border: 'none',
            background: 'none',
            padding: 0,
            cursor: 'pointer'
          }}
        >
          <Search 
            size={22} 
            style={{ color: activeTab === 'search' ? accentColor : 'rgba(255,255,255,0.5)' }}
          />
          <span 
            style={{ 
              fontSize: '10px',
              color: activeTab === 'search' ? accentColor : 'rgba(255,255,255,0.5)',
              whiteSpace: 'nowrap'
            }}
          >
            Search
          </span>
        </button>

        <button
          onClick={() => setActiveTab('camera')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            minWidth: 0,
            flex: '1 1 0',
            border: 'none',
            background: 'none',
            padding: 0,
            cursor: 'pointer'
          }}
        >
          <Camera 
            size={22} 
            style={{ color: activeTab === 'camera' ? accentColor : 'rgba(255,255,255,0.5)' }}
          />
          <span 
            style={{ 
              fontSize: '10px',
              color: activeTab === 'camera' ? accentColor : 'rgba(255,255,255,0.5)',
              whiteSpace: 'nowrap'
            }}
          >
            Camera
          </span>
        </button>

        <button
          onClick={() => setActiveTab('collection')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            minWidth: 0,
            flex: '1 1 0',
            border: 'none',
            background: 'none',
            padding: 0,
            cursor: 'pointer'
          }}
        >
          <Music 
            size={22} 
            style={{ color: activeTab === 'collection' ? accentColor : 'rgba(255,255,255,0.5)' }}
          />
          <span 
            style={{ 
              fontSize: '10px',
              color: activeTab === 'collection' ? accentColor : 'rgba(255,255,255,0.5)',
              whiteSpace: 'nowrap'
            }}
          >
            Collection
          </span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            minWidth: 0,
            flex: '1 1 0',
            border: 'none',
            background: 'none',
            padding: 0,
            cursor: 'pointer'
          }}
        >
          <User 
            size={22} 
            style={{ color: activeTab === 'profile' ? accentColor : 'rgba(255,255,255,0.5)' }}
          />
          <span 
            style={{ 
              fontSize: '10px',
              color: activeTab === 'profile' ? accentColor : 'rgba(255,255,255,0.5)',
              whiteSpace: 'nowrap'
            }}
          >
            Profile
          </span>
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 2000,
            overflowY: 'auto'
          }}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '448px',
              backgroundColor: primaryColor,
              border: `1px solid ${accentColor}`,
              borderRadius: '8px',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              margin: 'auto'
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Settings</h2>
              <button onClick={() => setShowSettings(false)}>
                <X size={24} style={{ color: accentColor }} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Theme Selection */}
              <div>
                <label className="block text-white/80 text-sm mb-3 font-semibold">
                  Theme
                </label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {themePresets.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => applyTheme(theme.id)}
                      className="px-3 py-2 rounded text-sm font-medium border-2 transition-all"
                      style={{
                        backgroundColor: theme.id === selectedTheme ? `${accentColor}20` : secondaryColor,
                        borderColor: theme.id === selectedTheme ? accentColor : 'rgba(255,255,255,0.2)',
                        color: theme.id === selectedTheme ? accentColor : 'white'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: theme.accent,
                            border: '2px solid rgba(255,255,255,0.3)'
                          }}
                        />
                        {theme.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors - Only show when Custom theme selected */}
              {selectedTheme === 'custom' && (
                <>
                  {/* Primary Color */}
                  <div>
                    <label className="block text-white/80 text-sm mb-2">
                      Primary Color (Background)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1 px-4 py-2 rounded text-white border border-white/20 focus:outline-none"
                        style={{ backgroundColor: secondaryColor }}
                      />
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div>
                    <label className="block text-white/80 text-sm mb-2">
                      Secondary Color (Cards/Inputs)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="flex-1 px-4 py-2 rounded text-white border border-white/20 focus:outline-none"
                        style={{ backgroundColor: secondaryColor }}
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <label className="block text-white/80 text-sm mb-2">
                      Accent Color (Highlights)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-12 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="flex-1 px-4 py-2 rounded text-white border border-white/20 focus:outline-none"
                        style={{ backgroundColor: secondaryColor }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Discogs Token */}
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Discogs API Token
                </label>
                <input
                  type="text"
                  value={discogsToken}
                  onChange={(e) => setDiscogsToken(e.target.value)}
                  placeholder="Enter your Discogs token"
                  className="w-full px-4 py-2 rounded text-white border border-white/20 focus:outline-none focus:border-white/40"
                  style={{ backgroundColor: secondaryColor }}
                />
                <a 
                  href="https://www.discogs.com/settings/developers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs mt-1 flex items-center gap-1"
                  style={{ color: accentColor }}
                >
                  Get token <ExternalLink size={12} />
                </a>
              </div>

              {/* Anthropic Token */}
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Anthropic API Token (for AI Camera Search)
                </label>
                <input
                  type="password"
                  value={anthropicToken}
                  onChange={(e) => setAnthropicToken(e.target.value)}
                  placeholder="Enter your Anthropic API key"
                  className="w-full px-4 py-2 rounded text-white border border-white/20 focus:outline-none focus:border-white/40"
                  style={{ backgroundColor: secondaryColor }}
                />
                <div className="mt-2 space-y-1">
                  <a 
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs flex items-center gap-1"
                    style={{ color: accentColor }}
                  >
                    Get API key <ExternalLink size={12} />
                  </a>
                  <p className="text-white/60 text-xs">
                    Required for AI-powered album identification from camera photos
                  </p>
                </div>
              </div>

              {/* Shop Selection */}
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Price Sources
                </label>
                <p className="text-white/60 text-xs mb-3">
                  Note: Only Discogs has real-time API pricing. HHV and eBay require manual checking via links.
                </p>
                <div className="space-y-2">
                  {[
                    { id: 'discogs', name: 'Discogs', note: 'API available' },
                    { id: 'hhv', name: 'HHV Store', note: 'Manual check' },
                    { id: 'ebay', name: 'eBay', note: 'Manual check' }
                  ].map(shop => (
                    <label key={shop.id} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedShops.includes(shop.id)}
                        onChange={() => toggleShop(shop.id)}
                        className="w-5 h-5"
                        style={{ accentColor: accentColor }}
                      />
                      <span className="text-white flex-1">{shop.name}</span>
                      <span className="text-white/40 text-xs">{shop.note}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={saveSettings}
                className="w-full py-3 rounded-lg font-semibold transition-all"
                style={{ backgroundColor: accentColor, color: primaryColor }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Detail Modal */}
      {selectedResult && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 2000,
            overflowY: 'auto'
          }}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '448px',
              backgroundColor: primaryColor,
              border: `1px solid ${accentColor}`,
              borderRadius: '8px',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              margin: 'auto'
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="pr-4 flex-1">
                <h2 className="text-xl font-bold text-white mb-1">
                  {selectedResult.title ? selectedResult.title.split(' - ')[0] : 'Unknown Artist'}
                </h2>
                <p className="text-white/80 text-lg">
                  {selectedResult.title ? (selectedResult.title.split(' - ')[1] || selectedResult.title) : 'Unknown Album'}
                </p>
              </div>
              <button onClick={() => setSelectedResult(null)}>
                <X size={24} style={{ color: accentColor }} />
              </button>
            </div>

            {selectedResult.cover_image && (
              <img
                src={selectedResult.cover_image}
                alt={selectedResult.title}
                style={{ 
                  width: '100%', 
                  maxHeight: '400px',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  backgroundColor: secondaryColor
                }}
              />
            )}

            <div className="space-y-3 mb-6">
              {/* Price Information */}
              <div className="rounded-lg p-4 border border-white/10" style={{ backgroundColor: secondaryColor }}>
                <h3 className="text-white font-semibold mb-3">Price Information</h3>
                {resultPrices[selectedResult.id] ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-white/60 text-sm mb-1">Discogs Marketplace:</p>
                      <div className="flex justify-between items-center">
                        <span className="text-white/60">Lowest Price:</span>
                        <span className="text-2xl font-bold" style={{ color: accentColor }}>
                          {resultPrices[selectedResult.id].currency} {resultPrices[selectedResult.id].value.toFixed(2)}
                        </span>
                      </div>
                      {resultPrices[selectedResult.id].num_for_sale && (
                        <p className="text-white/60 text-sm mt-2">
                          {resultPrices[selectedResult.id].num_for_sale} listings available
                        </p>
                      )}
                    </div>
                    
                    {/* Additional price context */}
                    {resultPrices[selectedResult.id].stats && (
                      <div className="border-t border-white/10 pt-3 space-y-1 text-sm">
                        <p className="text-white/80">
                          <span className="text-white/60">Note:</span> Prices vary by condition (Mint, VG+, etc.)
                        </p>
                        <p className="text-white/60 text-xs">
                          Click "View on Discogs" below to see all available copies and conditions
                        </p>
                      </div>
                    )}
                    
                    {/* Note about other sources */}
                    {(selectedShops.includes('hhv') || selectedShops.includes('ebay')) && (
                      <div className="rounded p-3 mt-3" style={{ backgroundColor: primaryColor }}>
                        <p className="text-white/80 text-sm mb-2">
                          <strong>Note:</strong> HHV and eBay prices require manual checking
                        </p>
                        <p className="text-white/60 text-xs">
                          Use the links below to compare prices on these platforms
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-white/60">Loading price data...</p>
                )}
                
                {/* Links to shops */}
                <div className="mt-4 space-y-2">
                  <p className="text-white/60 text-sm font-semibold mb-2">Compare prices on:</p>
                  {selectedShops.includes('discogs') && (
                    <a
                      href={`https://www.discogs.com${selectedResult.uri}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-3 rounded text-sm font-semibold text-center border"
                      style={{ borderColor: accentColor, color: accentColor, backgroundColor: `${accentColor}20` }}
                    >
                      View All Listings on Discogs <ExternalLink size={14} style={{ display: 'inline', marginLeft: '4px' }} />
                    </a>
                  )}
                  {selectedShops.includes('hhv') && (
                    <a
                      href={`https://www.hhv.de/search?term=${encodeURIComponent(selectedResult.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-3 rounded text-sm font-semibold text-center border"
                      style={{ borderColor: 'rgba(255, 183, 0, 0.5)', color: accentColor, backgroundColor: 'transparent' }}
                    >
                      Search on HHV Store <ExternalLink size={14} style={{ display: 'inline', marginLeft: '4px' }} />
                    </a>
                  )}
                  {selectedShops.includes('ebay') && (
                    <a
                      href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(selectedResult.title + ' vinyl')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-3 rounded text-sm font-semibold text-center border"
                      style={{ borderColor: 'rgba(255, 183, 0, 0.5)', color: accentColor, backgroundColor: 'transparent' }}
                    >
                      Search on eBay <ExternalLink size={14} style={{ display: 'inline', marginLeft: '4px' }} />
                    </a>
                  )}
                </div>
              </div>

              {/* Additional Details */}
              <div className="border-t border-white/10 pt-3">
                <h3 className="text-white font-semibold mb-2">Details</h3>
              </div>
              
              {selectedResult.year && (
                <div className="flex justify-between">
                  <span className="text-white/60">Year:</span>
                  <span className="text-white">{selectedResult.year}</span>
                </div>
              )}
              {selectedResult.label && selectedResult.label[0] && (
                <div className="flex justify-between">
                  <span className="text-white/60">Label:</span>
                  <span className="text-white">{selectedResult.label[0]}</span>
                </div>
              )}
              {selectedResult.genre && selectedResult.genre[0] && (
                <div className="flex justify-between">
                  <span className="text-white/60">Genre:</span>
                  <span className="text-white">{selectedResult.genre[0]}</span>
                </div>
              )}
              {selectedResult.format && selectedResult.format[0] && (
                <div className="flex justify-between">
                  <span className="text-white/60">Format:</span>
                  <span className="text-white">{selectedResult.format[0]}</span>
                </div>
              )}
              {selectedResult.country && (
                <div className="flex justify-between">
                  <span className="text-white/60">Country:</span>
                  <span className="text-white">{selectedResult.country}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  addToCollection(selectedResult);
                  setSelectedResult(null);
                }}
                className="w-full py-3 rounded-lg font-semibold transition-all"
                style={{ backgroundColor: accentColor, color: primaryColor }}
              >
                Add to Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VinylPriceFinder;