import React, { useState, useEffect, useRef } from 'react';
import { Search, Camera, Music, Heart, User, Settings, X, ExternalLink, RefreshCw } from 'lucide-react';

const VinylScout = () => {
  // All state declarations
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedSearch, setAdvancedSearch] = useState({
    artist: '', album: '', year: '', label: '', genre: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [resultPrices, setResultPrices] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [refreshingPrices, setRefreshingPrices] = useState({});
  const [priceChanges, setPriceChanges] = useState({});
  const [selectedResult, setSelectedResult] = useState(null);
  const [collection, setCollection] = useState([]);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsModalType, setStatsModalType] = useState('all');
  const [showValueModal, setShowValueModal] = useState(false);
  const [collectionView, setCollectionView] = useState('grid');
  const [collectionSort, setCollectionSort] = useState('artist-asc');
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [discogsToken, setDiscogsToken] = useState('');
  const [anthropicToken, setAnthropicToken] = useState('');
  const [selectedShops, setSelectedShops] = useState(['discogs', 'hhv', 'ebay']);
  const [selectedTheme, setSelectedTheme] = useState('custom');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [secondaryColor, setSecondaryColor] = useState('#1a1a1a');
  const [accentColor, setAccentColor] = useState('#ffb700');
  const videoRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

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

  useEffect(() => {
    const saved = {
      token: localStorage.getItem('discogsToken'),
      anthropic: localStorage.getItem('anthropicToken'),
      shops: localStorage.getItem('selectedShops'),
      theme: localStorage.getItem('selectedTheme'),
      primary: localStorage.getItem('primaryColor'),
      secondary: localStorage.getItem('secondaryColor'),
      accent: localStorage.getItem('accentColor'),
      collection: localStorage.getItem('collection')
    };
    
    if (saved.token) setDiscogsToken(saved.token);
    
    // Load Anthropic API key from localStorage
    if (saved.anthropic) {
      setAnthropicToken(saved.anthropic);
    }
    
    if (saved.shops) setSelectedShops(JSON.parse(saved.shops));
    if (saved.theme) setSelectedTheme(saved.theme);
    if (saved.primary) setPrimaryColor(saved.primary);
    if (saved.secondary) setSecondaryColor(saved.secondary);
    if (saved.accent) setAccentColor(saved.accent);
    if (saved.collection) setCollection(JSON.parse(saved.collection));
  }, []);

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

  const saveSettings = () => {
    localStorage.setItem('discogsToken', discogsToken);
    localStorage.setItem('anthropicToken', anthropicToken);
    localStorage.setItem('selectedShops', JSON.stringify(selectedShops));
    localStorage.setItem('selectedTheme', selectedTheme);
    localStorage.setItem('primaryColor', primaryColor);
    localStorage.setItem('secondaryColor', secondaryColor);
    localStorage.setItem('accentColor', accentColor);
    alert('Settings saved!');
  };

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
          alert('Please fill in at least one field');
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
        alert(`Search failed: ${response.status}`);
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
        alert('No results found');
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
    setIsLoading(false);
  };

  const fetchPriceInfo = async (releaseId) => {
    if (!discogsToken) return null;
    try {
      const response = await fetch(
        `https://api.discogs.com/marketplace/stats/${releaseId}`,
        {
          headers: {
            'Authorization': `Discogs token=${discogsToken}`,
            'User-Agent': 'VinylScout/1.0'
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
      alert('Please add your Discogs API token in Settings');
      return;
    }
    
    // Get old price before refreshing
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
        // Calculate price change
        if (oldPrice !== null) {
          const change = priceData.value - oldPrice;
          setPriceChanges(prev => ({
            ...prev,
            [itemId]: {
              amount: change,
              currency: priceData.currency
            }
          }));
          
          // Clear price change after 5 seconds
          setTimeout(() => {
            setPriceChanges(prev => {
              const newChanges = { ...prev };
              delete newChanges[itemId];
              return newChanges;
            });
          }, 5000);
        }
        
        // Update search results prices
        setResultPrices(prev => ({
          ...prev,
          [itemId]: priceData
        }));
        
        // Update collection item price if it's a collection item
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
          localStorage.setItem('collection', JSON.stringify(newCollection));
        }
        
        // Update selected result if it's open
        if (selectedResult && selectedResult.id === itemId) {
          setResultPrices(prev => ({
            ...prev,
            [itemId]: priceData
          }));
        }
      } else {
        alert('No price data available');
      }
    } catch (error) {
      alert(`Error refreshing price: ${error.message}`);
    }
    
    setRefreshingPrices(prev => ({ ...prev, [itemId]: false }));
  };

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
    if (!videoRef.current) {
      alert('Camera not ready. Please wait a moment.');
      return;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    if (canvas.width === 0 || canvas.height === 0) {
      alert('Camera not ready. Please wait for the video to load.');
      return;
    }
    
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    if (anthropicToken) {
      identifyAlbumWithAI(imageData);
    } else {
      alert('Please add Anthropic API token in Settings to use AI camera search');
    }
    
    stopCamera();
  };

  const identifyAlbumWithAI = async (imageBase64) => {
    if (!anthropicToken) {
      alert('Anthropic API token not configured. Please add it in Settings.');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Starting AI identification...');
      console.log('Using API key:', anthropicToken.substring(0, 20) + '...');
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicToken,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
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
                text: 'This is a vinyl record album cover. Identify the artist and album title. Respond ONLY with: "Artist - Album Title". Be precise and accurate.'
              }
            ]
          }]
        })
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `API Error ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Anthropic API error:', errorData);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          console.error('Could not parse error response');
        }
        alert(`AI identification failed: ${errorMessage}\n\nPlease check your API key in Settings.`);
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log('AI Response:', data);
      
      if (data.content && data.content[0] && data.content[0].text) {
        const albumInfo = data.content[0].text.trim();
        console.log('AI identified:', albumInfo);
        setSearchQuery(albumInfo);
        await searchDiscogs(false, albumInfo);
        setActiveTab('search');
      } else {
        alert('Could not identify album from image. Please try again with a clearer photo.');
      }
    } catch (error) {
      console.error('Error identifying album:', error);
      if (error.message.includes('Failed to fetch')) {
        alert('Network error: Could not connect to AI service. Please check your internet connection.');
      } else {
        alert(`Error identifying album: ${error.message}`);
      }
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

  const addToCollection = (item) => {
    const priceData = resultPrices[item.id];
    const itemWithPrice = {
      ...item,
      price: priceData ? { value: priceData.value, currency: priceData.currency } : null,
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

  const toggleShop = (shop) => {
    setSelectedShops(prev => 
      prev.includes(shop) ? prev.filter(s => s !== shop) : [...prev, shop]
    );
  };

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
        return sorted.sort((a, b) => (a.price?.value || 0) - (b.price?.value || 0));
      case 'price-desc':
        return sorted.sort((a, b) => (b.price?.value || 0) - (a.price?.value || 0));
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
      if (item.price && item.price.value && typeof item.price.value === 'number') {
        total += item.price.value;
        count++;
        if (item.price.currency) currency = item.price.currency;
      }
    });
    return { value: total.toFixed(2), currency, count };
  };

  return (
    <div 
      style={{ 
        backgroundColor: primaryColor,
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div className="px-4 py-4" style={{ backgroundColor: primaryColor, flexShrink: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: accentColor }}>VinylScout</h1>
      </div>

      {/* Content */}
      <div className="px-4" style={{ flex: 1, overflowY: 'auto', paddingBottom: '100px' }}>
        
        {/* SEARCH TAB */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchDiscogs(false)}
              placeholder="Quick search..."
              className="rounded-lg text-white placeholder-white/50 border-2 border-white/20"
              style={{ backgroundColor: secondaryColor, width: '100%', height: '48px', padding: '0 16px' }}
            />
            
            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className="w-full py-2 text-sm"
              style={{ color: accentColor }}
            >
              {showAdvancedSearch ? '▲' : '▼'} Advanced Search
            </button>

            {showAdvancedSearch && (
              <div className="space-y-3 rounded-lg p-4 border border-white/10" style={{ backgroundColor: secondaryColor }}>
                {['artist', 'album', 'year', 'label', 'genre'].map(field => (
                  <input
                    key={field}
                    type="text"
                    value={advancedSearch[field]}
                    onChange={(e) => setAdvancedSearch({...advancedSearch, [field]: e.target.value})}
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    className="w-full rounded-lg text-white placeholder-white/40 border border-white/20"
                    style={{ backgroundColor: primaryColor, height: '48px', padding: '0 16px' }}
                  />
                ))}
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-white font-semibold">Results ({searchResults.length})</h3>
                {searchResults.map((result) => {
                  const priceData = resultPrices[result.id];
                  return (
                    <div
                      key={result.id}
                      onClick={() => setSelectedResult(result)}
                      className="rounded-lg p-3 cursor-pointer border border-white/10"
                      style={{ backgroundColor: secondaryColor }}
                    >
                      <div className="flex gap-3">
                        <div style={{ position: 'relative', width: '100%', flexShrink: 0 }}>
                          <div style={{ paddingTop: '100%', position: 'relative' }}>
                            {result.cover_image ? (
                              <img src={result.cover_image} alt={result.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                            ) : (
                              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: primaryColor, borderRadius: '8px' }}>
                                <Music size={32} style={{ color: accentColor, opacity: 0.5 }} />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-bold text-sm mb-1">
                            {result.title?.split(' - ')[0]?.replace(/\s*\(\d+\)\s*$/, '') || 'Unknown Artist'}
                          </h3>
                          <p className="text-white/80 text-xs mb-2">
                            {result.title?.split(' - ')[1] || result.title || 'Unknown Album'}
                          </p>
                          
                          {priceData && priceData.value ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-sm" style={{ color: accentColor }}>
                                {priceData.currency} {priceData.value.toFixed(2)}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  refreshPrice(result.id, false);
                                }}
                                disabled={refreshingPrices[result.id]}
                                className="flex items-center justify-center rounded"
                                style={{
                                  backgroundColor: primaryColor,
                                  border: `1px solid ${accentColor}`,
                                  cursor: refreshingPrices[result.id] ? 'wait' : 'pointer',
                                  opacity: refreshingPrices[result.id] ? 0.5 : 1,
                                  color: accentColor,
                                  width: '24px',
                                  height: '24px',
                                  padding: '0'
                                }}
                              >
                                <RefreshCw 
                                  size={12} 
                                  style={{ color: accentColor }}
                                  className={refreshingPrices[result.id] ? 'animate-spin' : ''}
                                />
                              </button>
                              {priceChanges[result.id] && (
                                <div 
                                  className="flex items-center gap-1 px-1.5 py-0.5 rounded font-bold text-xs"
                                  style={{
                                    backgroundColor: priceChanges[result.id].amount > 0 ? '#ef444420' : '#22c55e20',
                                    color: priceChanges[result.id].amount > 0 ? '#ef4444' : '#22c55e',
                                    border: `1px solid ${priceChanges[result.id].amount > 0 ? '#ef4444' : '#22c55e'}`
                                  }}
                                >
                                  {priceChanges[result.id].amount > 0 ? '↑' : '↓'}
                                  <span>
                                    {priceChanges[result.id].amount > 0 ? '+' : ''}
                                    {priceChanges[result.id].amount.toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-white/40">Loading price...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => showAdvancedSearch ? searchDiscogs(true) : searchDiscogs(false)}
              disabled={isLoading}
              className="rounded-lg font-semibold"
              style={{ 
                backgroundColor: accentColor, 
                color: primaryColor,
                width: '100%',
                height: '48px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        )}

        {/* CAMERA TAB */}
        {activeTab === 'camera' && (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black" style={{ height: '60vh', position: 'relative' }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                style={{ 
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }} 
              />
              {!isCameraActive && (
                <div style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  backgroundColor: 'black',
                  zIndex: 5
                }}>
                  <p className="text-white/60">Starting camera...</p>
                </div>
              )}
              {isCameraActive && (
                <button
                  onClick={capturePhoto}
                  style={{ 
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    border: `4px solid ${accentColor}`,
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    zIndex: 10
                  }}
                >
                  <Camera size={36} style={{ color: primaryColor }} />
                </button>
              )}
            </div>
            
            <div className="rounded-lg p-4 border border-white/10" style={{ backgroundColor: secondaryColor }}>
              <h3 className="text-white font-semibold mb-2">📸 AI Camera Search</h3>
              <p className="text-white/60 text-sm mb-2">Tap the button at bottom to capture album cover</p>
              {anthropicToken ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22c55e' }}></div>
                  <p className="text-xs" style={{ color: '#22c55e' }}>AI Ready - Camera enabled</p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
                  <p className="text-xs" style={{ color: '#ef4444' }}>Add Anthropic token in Settings</p>
                </div>
              )}
            </div>
            
            {isLoading && (
              <div className="rounded-lg p-4 border border-white/10 text-center" style={{ backgroundColor: secondaryColor }}>
                <p className="text-white font-semibold mb-2">🔍 Identifying album...</p>
                <p className="text-white/60 text-sm">Please wait while AI analyzes the cover</p>
              </div>
            )}
          </div>
        )}

        {/* COLLECTION TAB */}
        {activeTab === 'collection' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Collection</h2>
              <div className="flex gap-2">
                <select
                  value={collectionFilter}
                  onChange={(e) => setCollectionFilter(e.target.value)}
                  className="px-3 py-2 rounded text-white text-xs"
                  style={{ backgroundColor: secondaryColor }}
                >
                  <option value="all">All ({collection.length})</option>
                  <option value="favorites">Favorites ({collection.filter(i => i.isFavorite).length})</option>
                </select>
                <select
                  value={collectionSort}
                  onChange={(e) => setCollectionSort(e.target.value)}
                  className="px-3 py-2 rounded text-white text-xs"
                  style={{ backgroundColor: secondaryColor }}
                >
                  <option value="artist-asc">Artist A-Z</option>
                  <option value="artist-desc">Artist Z-A</option>
                  <option value="album-asc">Album A-Z</option>
                  <option value="album-desc">Album Z-A</option>
                  <option value="price-asc">Price ↑</option>
                  <option value="price-desc">Price ↓</option>
                </select>
                <select
                  value={collectionView}
                  onChange={(e) => setCollectionView(e.target.value)}
                  className="px-3 py-2 rounded text-white text-xs"
                  style={{ backgroundColor: secondaryColor }}
                >
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                </select>
              </div>
            </div>

            {collection.length === 0 ? (
              <p className="text-white/60 text-center py-8">No records yet</p>
            ) : (
              <div className={collectionView === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
                {sortCollection(filterCollection(collection, collectionFilter), collectionSort).map((item, idx) => (
                  <div key={idx} className="rounded-lg p-2 border border-white/10" style={{ backgroundColor: secondaryColor }}>
                    <div style={{ position: 'relative', width: '100%', paddingTop: '100%', borderRadius: '8px', overflow: 'hidden', backgroundColor: primaryColor, marginBottom: '12px', cursor: 'pointer' }} onClick={() => setSelectedResult(item)}>
                      {item.cover_image ? (
                        <img src={item.cover_image} alt={item.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Music size={32} style={{ color: accentColor, opacity: 0.5 }} />
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavoriteInCollection(item.id); }}
                        style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', borderRadius: '50%', padding: '8px', border: 'none', cursor: 'pointer' }}
                      >
                        <Heart size={18} style={{ color: accentColor }} fill={item.isFavorite ? accentColor : 'none'} />
                      </button>
                    </div>
                    
                    {/* Artist and Album - inline format */}
                    <p className="text-white text-xs mb-1">
                      <span className="text-white/60">Artist: </span>
                      {item.title?.split(' - ')[0] || 'Unknown'}
                    </p>
                    <p className="text-white text-xs mb-3">
                      <span className="text-white/60">Album: </span>
                      {item.title?.split(' - ')[1] || item.title}
                    </p>
                    
                    {/* First row - 3 columns */}
                    <div className="grid grid-cols-3 gap-x-2 mb-2 text-xs">
                      <p className="text-white">
                        <span className="text-white/60">Year: </span>
                        {item.year || '-'}
                      </p>
                      <p className="text-white">
                        <span className="text-white/60">Format: </span>
                        {item.format?.[0] || '-'}
                      </p>
                      <p className="text-white">
                        <span className="text-white/60">Country: </span>
                        {item.country || '-'}
                      </p>
                    </div>
                    
                    {/* Second row - 3 columns */}
                    <div className="grid grid-cols-3 gap-x-2 mb-2 text-xs">
                      <p className="text-white">
                        <span className="text-white/60">Label: </span>
                        {item.label?.[0] || '-'}
                      </p>
                      <p className="text-white">
                        <span className="text-white/60">Genre: </span>
                        {item.genre?.[0] || '-'}
                      </p>
                      <p className="text-white">
                        <span className="text-white/60">Catalog: </span>
                        {item.catno || '-'}
                      </p>
                    </div>
                    
                    {item.price && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <p className="text-sm font-bold" style={{ color: accentColor }}>
                          {item.price.currency} {Number(item.price.value).toFixed(2)}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            refreshPrice(item.id, true);
                          }}
                          disabled={refreshingPrices[item.id]}
                          className="flex items-center justify-center rounded"
                          style={{
                            backgroundColor: primaryColor,
                            border: `1px solid ${accentColor}`,
                            cursor: refreshingPrices[item.id] ? 'wait' : 'pointer',
                            opacity: refreshingPrices[item.id] ? 0.5 : 1,
                            color: accentColor,
                            width: '28px',
                            height: '28px',
                            padding: '0'
                          }}
                        >
                          <RefreshCw 
                            size={14} 
                            style={{ color: accentColor }}
                            className={refreshingPrices[item.id] ? 'animate-spin' : ''}
                          />
                        </button>
                        {priceChanges[item.id] && (
                          <div 
                            className="flex items-center gap-0.5 px-1 py-0.5 rounded font-bold"
                            style={{
                              backgroundColor: priceChanges[item.id].amount > 0 ? '#ef444420' : '#22c55e20',
                              color: priceChanges[item.id].amount > 0 ? '#ef4444' : '#22c55e',
                              border: `1px solid ${priceChanges[item.id].amount > 0 ? '#ef4444' : '#22c55e'}`,
                              fontSize: '9px'
                            }}
                          >
                            {priceChanges[item.id].amount > 0 ? '↑' : '↓'}
                            <span>
                              {priceChanges[item.id].amount > 0 ? '+' : ''}
                              {priceChanges[item.id].amount.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Profile</h2>
            
            <div className="rounded-lg p-4 border border-white/10" style={{ backgroundColor: secondaryColor }}>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                  <User size={32} style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Vinyl Collector</h3>
                  <p className="text-white/60 text-sm">{collection.length} records</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg p-4 border border-white/10 cursor-pointer" style={{ backgroundColor: secondaryColor }} onClick={() => setShowValueModal(true)}>
              <h3 className="text-white font-semibold mb-3">Collection Value</h3>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Total:</span>
                <span className="text-2xl font-bold" style={{ color: accentColor }}>
                  {calculateCollectionValue().currency} {calculateCollectionValue().value}
                </span>
              </div>
              <p className="text-white/40 text-xs mt-2">
                Based on {calculateCollectionValue().count} of {collection.length} records
              </p>
              <p className="text-white/60 text-xs mt-2 text-center">👆 Tap for details</p>
            </div>

            <div className="rounded-lg p-4 border border-white/10" style={{ backgroundColor: secondaryColor }}>
              <h3 className="text-white font-semibold mb-3">Statistics</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Total Records</span>
                  <span className="text-white font-semibold">{collection.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Favorites</span>
                  <span className="text-white font-semibold">{collection.filter(i => i.isFavorite).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">With Prices</span>
                  <span className="text-white font-semibold">{collection.filter(i => i.price).length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Settings</h2>

            <div className="rounded-lg p-4 border border-white/10" style={{ backgroundColor: secondaryColor }}>
              <label className="block text-white/80 text-sm mb-3 font-semibold">Theme</label>
              <div className="grid grid-cols-2 gap-2">
                {themePresets.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => applyTheme(theme.id)}
                    className="px-3 py-2 rounded text-sm border-2"
                    style={{
                      backgroundColor: theme.id === selectedTheme ? `${accentColor}20` : primaryColor,
                      borderColor: theme.id === selectedTheme ? accentColor : 'rgba(255,255,255,0.2)',
                      color: theme.id === selectedTheme ? accentColor : 'white'
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: theme.accent, border: '2px solid rgba(255,255,255,0.3)' }} />
                      {theme.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedTheme === 'custom' && (
              <div className="rounded-lg p-4 border border-white/10 space-y-4" style={{ backgroundColor: secondaryColor }}>
                <h3 className="text-white font-semibold">Custom Colors</h3>
                {[
                  { label: 'Primary', value: primaryColor, setter: setPrimaryColor },
                  { label: 'Secondary', value: secondaryColor, setter: setSecondaryColor },
                  { label: 'Accent', value: accentColor, setter: setAccentColor }
                ].map(({ label, value, setter }) => (
                  <div key={label}>
                    <label className="block text-white/80 text-sm mb-2">{label} Color</label>
                    <div className="flex gap-2">
                      <input type="color" value={value} onChange={(e) => setter(e.target.value)} className="w-12 h-10 rounded" />
                      <input type="text" value={value} onChange={(e) => setter(e.target.value)} className="flex-1 px-4 py-2 rounded text-white border border-white/20" style={{ backgroundColor: primaryColor }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-lg p-4 border border-white/10" style={{ backgroundColor: secondaryColor }}>
              <label className="block text-white/80 text-sm mb-2">Discogs API Token</label>
              <input
                type="text"
                value={discogsToken}
                onChange={(e) => setDiscogsToken(e.target.value)}
                placeholder="Enter token"
                className="w-full px-4 py-2 rounded text-white border border-white/20"
                style={{ backgroundColor: primaryColor }}
              />
              <a href="https://www.discogs.com/settings/developers" target="_blank" rel="noopener noreferrer" className="text-xs mt-2 flex items-center gap-1" style={{ color: accentColor }}>
                Get token <ExternalLink size={12} />
              </a>
            </div>

            <div className="rounded-lg p-4 border border-white/10" style={{ backgroundColor: secondaryColor }}>
              <label className="block text-white/80 text-sm mb-2">Anthropic API Token</label>
              <input
                type="password"
                value={anthropicToken}
                onChange={(e) => setAnthropicToken(e.target.value)}
                placeholder="Enter key"
                className="w-full px-4 py-2 rounded text-white border border-white/20"
                style={{ backgroundColor: primaryColor }}
              />
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-xs mt-2 flex items-center gap-1" style={{ color: accentColor }}>
                Get key <ExternalLink size={12} />
              </a>
            </div>

            <div className="rounded-lg p-4 border border-white/10" style={{ backgroundColor: secondaryColor }}>
              <label className="block text-white/80 text-sm mb-2">Price Sources</label>
              <div className="space-y-2">
                {[
                  { id: 'discogs', name: 'Discogs', note: 'API available' },
                  { id: 'hhv', name: 'HHV Store', note: 'Manual' },
                  { id: 'ebay', name: 'eBay', note: 'Manual' }
                ].map(shop => (
                  <label key={shop.id} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={selectedShops.includes(shop.id)} onChange={() => toggleShop(shop.id)} className="w-5 h-5" style={{ accentColor }} />
                    <span className="text-white flex-1">{shop.name}</span>
                    <span className="text-white/40 text-xs">{shop.note}</span>
                  </label>
                ))}
              </div>
            </div>

            <button onClick={saveSettings} className="w-full py-3 rounded-lg font-semibold" style={{ backgroundColor: accentColor, color: primaryColor }}>
              Save Settings
            </button>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: primaryColor, borderTop: '1px solid rgba(255, 255, 255, 0.1)', zIndex: 1000, display: 'flex', justifyContent: 'space-around', padding: '12px 8px' }}>
        {[
          { id: 'search', icon: Search, label: 'Search' },
          { id: 'camera', icon: Camera, label: 'Camera' },
          { id: 'collection', icon: Music, label: 'Collection' },
          { id: 'profile', icon: User, label: 'Profile' },
          { id: 'settings', icon: Settings, label: 'Settings' }
        ].map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1, border: 'none', background: 'none', cursor: 'pointer' }}>
            <Icon size={22} style={{ color: activeTab === id ? accentColor : 'rgba(255,255,255,0.5)' }} />
            <span style={{ fontSize: '10px', color: activeTab === id ? accentColor : 'rgba(255,255,255,0.5)' }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Result Modal */}
      {selectedResult && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 2000, overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '448px', backgroundColor: primaryColor, border: `1px solid ${accentColor}`, borderRadius: '8px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-white" style={{ lineHeight: '1.3', maxWidth: '85%' }}>
                {(selectedResult.title?.split(' - ')[0]?.replace(/\s*\(\d+\)\s*$/, '') || 'Unknown Artist')} - {selectedResult.title?.split(' - ')[1] || selectedResult.title || 'Unknown Album'}
              </h2>
              <button onClick={() => setSelectedResult(null)}>
                <X size={24} style={{ color: accentColor }} />
              </button>
            </div>
            
            {/* Album Cover */}
            <div className="flex justify-center mb-4">
              {selectedResult.cover_image ? (
                <img 
                  src={selectedResult.cover_image} 
                  alt={selectedResult.title} 
                  style={{ 
                    width: '200px', 
                    height: '200px', 
                    borderRadius: '8px', 
                    objectFit: 'cover' 
                  }} 
                />
              ) : (
                <div style={{ width: '200px', height: '200px', borderRadius: '8px', backgroundColor: secondaryColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Music size={80} style={{ color: accentColor, opacity: 0.5 }} />
                </div>
              )}
            </div>
            
            {/* Artist and Album - inline format */}
            <div className="mb-4 rounded-lg p-4 border border-white/10" style={{ backgroundColor: secondaryColor }}>
              <p className="text-white text-sm mb-2">
                <span className="text-white/60">Artist: </span>
                {selectedResult.title?.split(' - ')[0] || 'Unknown'}
              </p>
              <p className="text-white text-sm">
                <span className="text-white/60">Album: </span>
                {selectedResult.title?.split(' - ')[1] || selectedResult.title}
              </p>
            </div>
            
            {/* Details in 2 rows x 3 columns */}
            <div className="rounded-lg p-4 border border-white/10 mb-4" style={{ backgroundColor: secondaryColor }}>
              <h3 className="text-white font-semibold mb-3">Details</h3>
              
              {/* First row */}
              <div className="grid grid-cols-3 gap-x-3 mb-3 text-xs">
                <p className="text-white">
                  <span className="text-white/60">Year: </span>
                  {selectedResult.year || '-'}
                </p>
                <p className="text-white">
                  <span className="text-white/60">Format: </span>
                  {selectedResult.format?.[0] || '-'}
                </p>
                <p className="text-white">
                  <span className="text-white/60">Country: </span>
                  {selectedResult.country || '-'}
                </p>
              </div>
              
              {/* Second row */}
              <div className="grid grid-cols-3 gap-x-3 text-xs">
                <p className="text-white">
                  <span className="text-white/60">Label: </span>
                  {selectedResult.label?.[0] || '-'}
                </p>
                <p className="text-white">
                  <span className="text-white/60">Genre: </span>
                  {selectedResult.genre?.[0] || '-'}
                </p>
                <p className="text-white">
                  <span className="text-white/60">Catalog: </span>
                  {selectedResult.catno || '-'}
                </p>
              </div>
            </div>
            
            {/* PRICE WITH REFRESH BUTTON */}
            {resultPrices[selectedResult.id] && (
              <div className="rounded-lg p-4 border border-white/10 mb-4" style={{ backgroundColor: secondaryColor }}>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-white font-semibold">Price Information</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      refreshPrice(selectedResult.id, collection.some(item => item.id === selectedResult.id));
                    }}
                    disabled={refreshingPrices[selectedResult.id]}
                    className="flex items-center justify-center rounded"
                    style={{
                      backgroundColor: primaryColor,
                      border: `1px solid ${accentColor}`,
                      cursor: refreshingPrices[selectedResult.id] ? 'wait' : 'pointer',
                      opacity: refreshingPrices[selectedResult.id] ? 0.5 : 1,
                      color: accentColor,
                      width: '32px',
                      height: '32px',
                      padding: '0'
                    }}
                  >
                    <RefreshCw 
                      size={16} 
                      style={{ color: accentColor }}
                      className={refreshingPrices[selectedResult.id] ? 'animate-spin' : ''}
                    />
                  </button>
                </div>
                
                <div className="mb-3">
                  <p className="text-white/60 text-xs mb-1">Lowest Price (Discogs)</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-4xl font-bold" style={{ color: accentColor }}>
                      {resultPrices[selectedResult.id].currency} {resultPrices[selectedResult.id].value.toFixed(2)}
                    </p>
                    {priceChanges[selectedResult.id] && (
                      <div 
                        className="flex items-center gap-2 px-3 py-2 rounded text-sm font-bold"
                        style={{
                          backgroundColor: priceChanges[selectedResult.id].amount > 0 ? '#ef444420' : '#22c55e20',
                          color: priceChanges[selectedResult.id].amount > 0 ? '#ef4444' : '#22c55e',
                          border: `1px solid ${priceChanges[selectedResult.id].amount > 0 ? '#ef4444' : '#22c55e'}`
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>
                          {priceChanges[selectedResult.id].amount > 0 ? '↑' : '↓'}
                        </span>
                        <span>
                          {priceChanges[selectedResult.id].amount > 0 ? '+' : ''}
                          {priceChanges[selectedResult.id].amount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-white/60 text-xs mb-1">Available Listings</p>
                    <p className="text-white font-semibold">{resultPrices[selectedResult.id].num_for_sale}</p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs mb-1">Source</p>
                    <p className="text-white font-semibold">Discogs</p>
                  </div>
                </div>
              </div>
            )}
            
            <button onClick={() => { addToCollection(selectedResult); setSelectedResult(null); }} className="w-full py-3 rounded-lg font-semibold" style={{ backgroundColor: accentColor, color: primaryColor }}>
              Add to Collection
            </button>
          </div>
        </div>
      )}

      {/* Value Modal */}
      {showValueModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 2000, overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '448px', backgroundColor: primaryColor, border: `1px solid ${accentColor}`, borderRadius: '8px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Collection Value</h2>
              <button onClick={() => setShowValueModal(false)}>
                <X size={24} style={{ color: accentColor }} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg p-4 border-2 text-center" style={{ backgroundColor: secondaryColor, borderColor: accentColor }}>
                <p className="text-white/60 text-sm mb-2">Total Value</p>
                <p className="text-4xl font-bold mb-2" style={{ color: accentColor }}>
                  {calculateCollectionValue().currency} {calculateCollectionValue().value}
                </p>
                <p className="text-white/60 text-xs">Based on {calculateCollectionValue().count} of {collection.length} records</p>
              </div>
              
              {collection.filter(item => item.price && item.price.value).length > 0 && (
                <>
                  <div className="rounded-lg p-4 border border-white/10" style={{ backgroundColor: secondaryColor }}>
                    <h3 className="text-white font-semibold mb-3">💎 Most Expensive</h3>
                    {(() => {
                      const mostExpensive = collection.filter(item => item.price && item.price.value).sort((a, b) => b.price.value - a.price.value)[0];
                      return (
                        <div className="flex gap-3 items-start">
                          <img 
                            src={mostExpensive.cover_image} 
                            alt="" 
                            style={{
                              width: '80px',
                              height: '80px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              flexShrink: 0
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm mb-1">{mostExpensive.title?.split(' - ')[1] || mostExpensive.title}</p>
                            <p className="text-white/60 text-xs mb-2">{mostExpensive.title?.split(' - ')[0]}</p>
                            <p className="text-xl font-bold" style={{ color: accentColor }}>{mostExpensive.price.currency} {mostExpensive.price.value.toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="rounded-lg p-4 border border-white/10" style={{ backgroundColor: secondaryColor }}>
                    <h3 className="text-white font-semibold mb-3">💰 Cheapest</h3>
                    {(() => {
                      const cheapest = collection.filter(item => item.price && item.price.value).sort((a, b) => a.price.value - b.price.value)[0];
                      return (
                        <div className="flex gap-3 items-start">
                          <img 
                            src={cheapest.cover_image} 
                            alt="" 
                            style={{
                              width: '80px',
                              height: '80px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              flexShrink: 0
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm mb-1">{cheapest.title?.split(' - ')[1] || cheapest.title}</p>
                            <p className="text-white/60 text-xs mb-2">{cheapest.title?.split(' - ')[0]}</p>
                            <p className="text-xl font-bold" style={{ color: accentColor }}>{cheapest.price.currency} {cheapest.price.value.toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  
                  <div className="rounded-lg p-4 border border-white/10" style={{ backgroundColor: secondaryColor }}>
                    <h3 className="text-white font-semibold mb-3">📊 Statistics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-white/60">Average:</span>
                        <span className="text-white font-bold">
                          {(() => {
                            const withPrices = collection.filter(item => item.price && item.price.value);
                            const avg = withPrices.reduce((sum, item) => sum + item.price.value, 0) / withPrices.length;
                            return `${withPrices[0].price.currency} ${avg.toFixed(2)}`;
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Range:</span>
                        <span className="text-white font-bold">
                          {(() => {
                            const withPrices = collection.filter(item => item.price && item.price.value);
                            const min = Math.min(...withPrices.map(item => item.price.value));
                            const max = Math.max(...withPrices.map(item => item.price.value));
                            return `${withPrices[0].price.currency} ${min.toFixed(2)} - ${max.toFixed(2)}`;
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default VinylScout;