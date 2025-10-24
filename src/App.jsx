import React, { useState, useEffect, useRef } from 'react';
import { Search, Camera, Music, Heart, User, Settings, X, ChevronRight, ExternalLink, Trash2, Edit2, Plus } from 'lucide-react';

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
  const [collectionView, setCollectionView] = useState('grid');
  const [collectionSort, setCollectionSort] = useState('artist-asc');
  const [showEditProfile, setShowEditProfile] = useState(false);
  
  // User profile
  const [userProfile, setUserProfile] = useState({
    name: '',
    nickname: '',
    email: '',
    address: '',
    city: '',
    country: ''
  });
  
  // Settings state
  const [discogsToken, setDiscogsToken] = useState('');
  const [anthropicToken, setAnthropicToken] = useState('');
  const [selectedShops, setSelectedShops] = useState(['discogs']);
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [accentColor, setAccentColor] = useState('#FFB700');
  const [textColor, setTextColor] = useState('#FFFFFF');
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('discogsToken');
    const savedAnthropicToken = localStorage.getItem('anthropicToken');
    const savedShops = localStorage.getItem('selectedShops');
    const savedPrimaryColor = localStorage.getItem('primaryColor');
    const savedAccentColor = localStorage.getItem('accentColor');
    const savedCollection = localStorage.getItem('collection');
    const savedProfile = localStorage.getItem('userProfile');
    
    if (savedToken) setDiscogsToken(savedToken);
    if (savedAnthropicToken) setAnthropicToken(savedAnthropicToken);
    if (savedShops) setSelectedShops(JSON.parse(savedShops));
    if (savedPrimaryColor) setPrimaryColor(savedPrimaryColor);
    if (savedAccentColor) setAccentColor(savedAccentColor);
    if (savedCollection) setCollection(JSON.parse(savedCollection));
    if (savedProfile) setUserProfile(JSON.parse(savedProfile));
  }, []);

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem('discogsToken', discogsToken);
    localStorage.setItem('anthropicToken', anthropicToken);
    localStorage.setItem('selectedShops', JSON.stringify(selectedShops));
    localStorage.setItem('primaryColor', primaryColor);
    localStorage.setItem('accentColor', accentColor);
    setShowSettings(false);
  };

  // Save profile
  const saveProfile = () => {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    setShowEditProfile(false);
  };

  // Fetch price info for single item
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
        if (statsData.lowest_price) {
          return {
            value: statsData.lowest_price.value,
            currency: statsData.lowest_price.currency,
            num_for_sale: statsData.num_for_sale
          };
        }
      }
    } catch (error) {
      console.error('Price fetch error:', error);
    }
    return null;
  };

  // Search Discogs API
  const searchDiscogs = async (isAdvanced = false, queryOverride = null) => {
    if (!discogsToken) {
      alert('Please add your Discogs API token in Settings');
      return;
    }

    setIsLoading(true);
    setResultPrices({});
    
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
        alert(`Search failed: ${response.status}`);
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
        // Fetch prices in background without blocking UI
        fetchPricesInBackground(data.results);
      } else {
        setSearchResults([]);
        alert('No results found');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert(`Error: ${error.message}`);
    }
    setIsLoading(false);
  };

  // Fetch prices in background
  const fetchPricesInBackground = async (results) => {
    for (const result of results.slice(0, 5)) {
      const priceData = await fetchPriceInfo(result.id);
      if (priceData) {
        setResultPrices(prev => ({ ...prev, [result.id]: priceData }));
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }
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
      alert('Add Anthropic API token in Settings for AI recognition');
    }
    
    stopCamera();
  };

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
                text: 'This is a vinyl record album cover. Identify the artist and album. Respond ONLY with: "Artist - Album Title"'
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
        alert('Could not identify album');
      }
    } catch (error) {
      alert('AI identification error');
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

  // Collection management
  const addToCollection = (item) => {
    const priceData = resultPrices[item.id];
    const itemWithPrice = {
      ...item,
      price: priceData ? {
        value: priceData.value,
        currency: priceData.currency
      } : null,
      favorite: false,
      addedAt: new Date().toISOString()
    };
    const newCollection = [...collection, itemWithPrice];
    setCollection(newCollection);
    localStorage.setItem('collection', JSON.stringify(newCollection));
  };

  const removeFromCollection = (index) => {
    const newCollection = collection.filter((_, idx) => idx !== index);
    setCollection(newCollection);
    localStorage.setItem('collection', JSON.stringify(newCollection));
  };

  const toggleFavorite = (index) => {
    const newCollection = [...collection];
    newCollection[index] = {
      ...newCollection[index],
      favorite: !newCollection[index].favorite
    };
    setCollection(newCollection);
    localStorage.setItem('collection', JSON.stringify(newCollection));
  };

  const isFavorited = (item) => item.favorite === true;

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
          const artistCompare = aArtist.localeCompare(bArtist);
          if (artistCompare !== 0) return artistCompare;
          // If same artist, sort by album name
          const aAlbum = (a.title?.split(' - ')[1] || a.title || '').toLowerCase();
          const bAlbum = (b.title?.split(' - ')[1] || b.title || '').toLowerCase();
          return aAlbum.localeCompare(bAlbum);
        });
      case 'artist-desc':
        return sorted.sort((a, b) => {
          const aArtist = (a.title?.split(' - ')[0] || '').toLowerCase();
          const bArtist = (b.title?.split(' - ')[0] || '').toLowerCase();
          const artistCompare = bArtist.localeCompare(aArtist);
          if (artistCompare !== 0) return artistCompare;
          // If same artist, sort by album name
          const aAlbum = (a.title?.split(' - ')[1] || a.title || '').toLowerCase();
          const bAlbum = (b.title?.split(' - ')[1] || b.title || '').toLowerCase();
          return aAlbum.localeCompare(bAlbum);
        });
      case 'album-asc':
        return sorted.sort((a, b) => {
          const aAlbum = (a.title?.split(' - ')[1] || a.title || '').toLowerCase();
          const bAlbum = (b.title?.split(' - ')[1] || b.title || '').toLowerCase();
          const albumCompare = aAlbum.localeCompare(bAlbum);
          if (albumCompare !== 0) return albumCompare;
          // If same album name, sort by artist
          const aArtist = (a.title?.split(' - ')[0] || '').toLowerCase();
          const bArtist = (b.title?.split(' - ')[0] || '').toLowerCase();
          return aArtist.localeCompare(bArtist);
        });
      case 'album-desc':
        return sorted.sort((a, b) => {
          const aAlbum = (a.title?.split(' - ')[1] || a.title || '').toLowerCase();
          const bAlbum = (b.title?.split(' - ')[1] || b.title || '').toLowerCase();
          const albumCompare = bAlbum.localeCompare(aAlbum);
          if (albumCompare !== 0) return albumCompare;
          // If same album name, sort by artist
          const aArtist = (a.title?.split(' - ')[0] || '').toLowerCase();
          const bArtist = (b.title?.split(' - ')[0] || '').toLowerCase();
          return aArtist.localeCompare(bArtist);
        });
      case 'price-asc':
        return sorted.sort((a, b) => {
          const aPrice = a.price?.value || 0;
          const bPrice = b.price?.value || 0;
          const priceCompare = aPrice - bPrice;
          if (priceCompare !== 0) return priceCompare;
          // If same price, sort by artist then album
          const aArtist = (a.title?.split(' - ')[0] || '').toLowerCase();
          const bArtist = (b.title?.split(' - ')[0] || '').toLowerCase();
          const artistCompare = aArtist.localeCompare(bArtist);
          if (artistCompare !== 0) return artistCompare;
          const aAlbum = (a.title?.split(' - ')[1] || a.title || '').toLowerCase();
          const bAlbum = (b.title?.split(' - ')[1] || b.title || '').toLowerCase();
          return aAlbum.localeCompare(bAlbum);
        });
      case 'price-desc':
        return sorted.sort((a, b) => {
          const aPrice = a.price?.value || 0;
          const bPrice = b.price?.value || 0;
          const priceCompare = bPrice - aPrice;
          if (priceCompare !== 0) return priceCompare;
          // If same price, sort by artist then album
          const aArtist = (a.title?.split(' - ')[0] || '').toLowerCase();
          const bArtist = (b.title?.split(' - ')[0] || '').toLowerCase();
          const artistCompare = aArtist.localeCompare(bArtist);
          if (artistCompare !== 0) return artistCompare;
          const aAlbum = (a.title?.split(' - ')[1] || a.title || '').toLowerCase();
          const bAlbum = (b.title?.split(' - ')[1] || b.title || '').toLowerCase();
          return aAlbum.localeCompare(bAlbum);
        });
      default:
        return sorted;
    }
  };

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

  const favorites = collection.filter(item => item.favorite);

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
        flexDirection: 'column',
        color: textColor
      }}
    >
      {/* Header */}
      <div 
        className="px-4 py-4 flex justify-between items-center shadow-sm"
        style={{ 
          backgroundColor: primaryColor,
          flexShrink: 0,
          borderBottom: `1px solid ${textColor}10`
        }}
      >
        <h1 className="text-2xl font-bold" style={{ color: accentColor }}>
          VinylScout
        </h1>
        <button 
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Settings size={24} style={{ color: accentColor }} />
        </button>
      </div>

      {/* Content */}
      <div 
        className="px-4"
        style={{ 
          flex: 1,
          overflowY: 'auto',
          paddingBottom: '90px'
        }}
      >
        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-4 pt-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search artist or album..."
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none"
              style={{ borderColor: `${textColor}20`, backgroundColor: `${textColor}05` }}
            />

            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className="text-sm"
              style={{ color: accentColor }}
            >
              {showAdvancedSearch ? '▲' : '▼'} Advanced Search
            </button>

            {showAdvancedSearch && (
              <div className="space-y-3 rounded-lg p-4" style={{ backgroundColor: `${textColor}05` }}>
                {['artist', 'album', 'year', 'label', 'genre'].map(field => (
                  <input
                    key={field}
                    type="text"
                    value={advancedSearch[field]}
                    onChange={(e) => setAdvancedSearch({...advancedSearch, [field]: e.target.value})}
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    className="w-full px-4 py-2 rounded-lg border text-sm focus:outline-none"
                    style={{ borderColor: `${textColor}20`, backgroundColor: primaryColor }}
                  />
                ))}
                <button
                  onClick={handleAdvancedSearch}
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg font-semibold"
                  style={{ backgroundColor: accentColor, color: primaryColor }}
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            )}

            {!showAdvancedSearch && (
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="w-full py-3 rounded-lg font-semibold"
                style={{ backgroundColor: accentColor, color: primaryColor }}
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-3 mt-4">
                <h3 className="font-semibold" style={{ color: textColor }}>Results ({searchResults.length})</h3>
                {searchResults.map((result) => {
                  const price = resultPrices[result.id];
                  return (
                    <div
                      key={result.id}
                      onClick={() => setSelectedResult(result)}
                      className="rounded-lg p-3 cursor-pointer transition-all shadow-sm"
                      style={{ backgroundColor: `${textColor}05`, border: `1px solid ${textColor}10` }}
                    >
                      <div className="flex gap-3">
                        {result.cover_image ? (
                          <img
                            src={result.cover_image}
                            alt={result.title}
                            style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '8px' }}
                          />
                        ) : (
                          <div style={{ width: '96px', height: '96px', borderRadius: '8px', backgroundColor: `${textColor}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Music size={40} style={{ color: accentColor, opacity: 0.5 }} />
                          </div>
                        )}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-base mb-1" style={{ color: textColor }}>
                              {result.title?.split(' - ')[0] || 'Unknown Artist'}
                            </h3>
                            <p className="text-sm mb-2" style={{ color: `${textColor}80` }}>
                              {result.title?.split(' - ')[1] || result.title || 'Unknown Album'}
                            </p>
                          </div>
                          {price ? (
                            <div>
                              <p className="text-xs" style={{ color: `${textColor}60` }}>from Discogs</p>
                              <p className="text-lg font-bold" style={{ color: accentColor }}>
                                {price.currency} {price.value.toFixed(2)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm" style={{ color: accentColor }}>Loading...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Camera Tab */}
        {activeTab === 'camera' && (
          <div className="space-y-4 pt-4">
            <div className="relative rounded-lg overflow-hidden bg-black">
              <video ref={videoRef} autoPlay playsInline className="w-full h-auto" />
              {isCameraActive && (
                <button
                  onClick={capturePhoto}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4"
                  style={{ borderColor: accentColor, backgroundColor: accentColor }}
                >
                  <Camera size={28} style={{ color: primaryColor, margin: 'auto' }} />
                </button>
              )}
            </div>
            <div className="rounded-lg p-4" style={{ backgroundColor: `${textColor}05` }}>
              <h3 className="font-semibold mb-2">📸 AI Camera Search</h3>
              <p className="text-sm mb-2" style={{ color: `${textColor}80` }}>
                Point camera at vinyl cover and tap to capture
              </p>
              {anthropicToken ? (
                <p className="text-xs" style={{ color: accentColor }}>✓ AI enabled</p>
              ) : (
                <p className="text-xs" style={{ color: `${textColor}60` }}>⚠️ Add Anthropic token in Settings</p>
              )}
            </div>
          </div>
        )}

        {/* Collection Tab */}
        {activeTab === 'collection' && (
          <div className="space-y-3 pt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold" style={{ color: textColor }}>My Collection</h2>
              <div className="flex gap-2">
                <select
                  value={collectionSort}
                  onChange={(e) => setCollectionSort(e.target.value)}
                  className="px-3 py-2 rounded-lg border text-xs"
                  style={{ borderColor: `${textColor}20`, backgroundColor: primaryColor }}
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
                  className="px-3 py-2 rounded-lg border text-xs"
                  style={{ borderColor: `${textColor}20`, backgroundColor: primaryColor }}
                >
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                </select>
              </div>
            </div>

            {collection.length === 0 ? (
              <p className="text-center py-8" style={{ color: `${textColor}60` }}>
                No records yet
              </p>
            ) : (
              <div className={collectionView === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
                {sortCollection(collection, collectionSort).map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedResult(item)}
                    className="rounded-lg p-3 cursor-pointer shadow-sm"
                    style={{ backgroundColor: `${textColor}05`, border: `1px solid ${textColor}10` }}
                  >
                    {collectionView === 'grid' ? (
                      <div className="flex flex-col">
                        {item.cover_image ? (
                          <img
                            src={item.cover_image}
                            alt={item.title}
                            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }}
                          />
                        ) : (
                          <div style={{ width: '100%', aspectRatio: '1', borderRadius: '8px', backgroundColor: `${textColor}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                            <Music size={32} style={{ color: accentColor, opacity: 0.5 }} />
                          </div>
                        )}
                        <h3 className="font-bold text-xs mb-1" style={{ color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title?.split(' - ')[0] || 'Unknown'}
                        </h3>
                        <p className="text-xs mb-2" style={{ color: `${textColor}70`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.title?.split(' - ')[1] || item.title || 'Unknown'}
                        </p>
                        {item.price?.value ? (
                          <p className="text-sm font-bold" style={{ color: accentColor }}>
                            {item.price.currency} {Number(item.price.value).toFixed(2)}
                          </p>
                        ) : (
                          <p className="text-xs" style={{ color: `${textColor}40` }}>No price</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        {item.cover_image ? (
                          <img
                            src={item.cover_image}
                            alt={item.title}
                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                          />
                        ) : (
                          <div style={{ width: '80px', height: '80px', borderRadius: '8px', backgroundColor: `${textColor}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Music size={32} style={{ color: accentColor, opacity: 0.5 }} />
                          </div>
                        )}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-sm mb-1" style={{ color: textColor }}>
                              {item.title?.split(' - ')[0] || 'Unknown Artist'}
                            </h3>
                            <p className="text-sm mb-1" style={{ color: `${textColor}70` }}>
                              {item.title?.split(' - ')[1] || item.title || 'Unknown Album'}
                            </p>
                          </div>
                          {item.price?.value ? (
                            <p className="text-base font-bold" style={{ color: accentColor }}>
                              {item.price.currency} {Number(item.price.value).toFixed(2)}
                            </p>
                          ) : (
                            <p className="text-sm" style={{ color: `${textColor}40` }}>No price</p>
                          )}
                        </div>
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
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold" style={{ color: textColor }}>Profile</h2>
              <button
                onClick={() => setShowEditProfile(true)}
                className="px-3 py-2 rounded-lg text-sm font-semibold"
                style={{ backgroundColor: accentColor, color: primaryColor }}
              >
                <Edit2 size={16} style={{ display: 'inline', marginRight: '4px' }} />
                Edit
              </button>
            </div>
            
            <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: `${textColor}05`, border: `1px solid ${textColor}10` }}>
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: accentColor }}
                >
                  <User size={32} style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: textColor }}>
                    {userProfile.name || 'Vinyl Collector'}
                  </h3>
                  <p className="text-sm" style={{ color: `${textColor}60` }}>
                    {userProfile.nickname || 'Set your nickname'}
                  </p>
                </div>
              </div>
              
              {userProfile.email && (
                <p className="text-sm mb-1" style={{ color: `${textColor}80` }}>
                  📧 {userProfile.email}
                </p>
              )}
              {userProfile.address && (
                <p className="text-sm" style={{ color: `${textColor}80` }}>
                  📍 {userProfile.address}, {userProfile.city}, {userProfile.country}
                </p>
              )}
            </div>

            <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: `${textColor}05`, border: `1px solid ${textColor}10` }}>
              <h3 className="font-semibold mb-3" style={{ color: textColor }}>Collection Value</h3>
              <div className="flex justify-between items-center mb-2">
                <span style={{ color: `${textColor}60` }}>Total:</span>
                <span className="text-2xl font-bold" style={{ color: accentColor }}>
                  {calculateCollectionValue().currency} {calculateCollectionValue().value}
                </span>
              </div>
              <p className="text-xs" style={{ color: `${textColor}40` }}>
                Based on {calculateCollectionValue().count} of {collection.length} records
              </p>
            </div>

            <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: `${textColor}05`, border: `1px solid ${textColor}10` }}>
              <h3 className="font-semibold mb-2" style={{ color: textColor }}>Statistics</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span style={{ color: `${textColor}60` }}>Total Records</span>
                  <span className="font-semibold" style={{ color: textColor }}>{collection.length}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: `${textColor}60` }}>Favorites</span>
                  <span className="font-semibold" style={{ color: textColor }}>{favorites.length}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: `${textColor}60` }}>With Prices</span>
                  <span className="font-semibold" style={{ color: textColor }}>
                    {collection.filter(item => item.price?.value).length}
                  </span>
                </div>
              </div>
            </div>

            {favorites.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3" style={{ color: textColor }}>
                  ❤️ Favorites ({favorites.length})
                </h3>
                <div className="space-y-3">
                  {favorites.map((item, idx) => {
                    const originalIndex = collection.findIndex(c => c.id === item.id);
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedResult(item)}
                        className="rounded-lg p-3 cursor-pointer shadow-sm"
                        style={{ backgroundColor: `${textColor}05`, border: `1px solid ${textColor}10` }}
                      >
                        <div className="flex gap-3">
                          {item.cover_image ? (
                            <img
                              src={item.cover_image}
                              alt={item.title}
                              style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                            />
                          ) : (
                            <div style={{ width: '60px', height: '60px', borderRadius: '8px', backgroundColor: `${textColor}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Music size={24} style={{ color: accentColor, opacity: 0.5 }} />
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-bold text-sm" style={{ color: textColor }}>
                              {item.title?.split(' - ')[0] || 'Unknown'}
                            </h4>
                            <p className="text-xs" style={{ color: `${textColor}70` }}>
                              {item.title?.split(' - ')[1] || item.title}
                            </p>
                            {item.price?.value && (
                              <p className="text-sm font-bold mt-1" style={{ color: accentColor }}>
                                {item.price.currency} {Number(item.price.value).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div 
        style={{ 
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: primaryColor,
          borderTop: `1px solid ${textColor}10`,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '12px 8px',
          flexShrink: 0,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
        }}
      >
        {[
          { id: 'search', icon: Search, label: 'Search' },
          { id: 'camera', icon: Camera, label: 'Camera' },
          { id: 'collection', icon: Music, label: 'Collection' },
          { id: 'profile', icon: User, label: 'Profile' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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
            <tab.icon 
              size={24} 
              style={{ color: activeTab === tab.id ? accentColor : `${textColor}50` }}
            />
            <span 
              style={{ 
                fontSize: '10px',
                color: activeTab === tab.id ? accentColor : `${textColor}50`,
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 2000, overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '448px', backgroundColor: primaryColor, borderRadius: '12px', padding: '24px', maxHeight: '90vh', overflowY: 'auto', margin: 'auto' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: textColor }}>Settings</h2>
              <button onClick={() => setShowSettings(false)}>
                <X size={24} style={{ color: accentColor }} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm mb-2" style={{ color: `${textColor}80` }}>Discogs API Token</label>
                <input
                  type="text"
                  value={discogsToken}
                  onChange={(e) => setDiscogsToken(e.target.value)}
                  placeholder="Enter token"
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: `${textColor}20`, backgroundColor: primaryColor }}
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

              <div>
                <label className="block text-sm mb-2" style={{ color: `${textColor}80` }}>Anthropic API Token (AI Camera)</label>
                <input
                  type="password"
                  value={anthropicToken}
                  onChange={(e) => setAnthropicToken(e.target.value)}
                  placeholder="Enter API key"
                  className="w-full px-4 py-2 rounded-lg border"
                  style={{ borderColor: `${textColor}20`, backgroundColor: primaryColor }}
                />
                <a 
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs mt-1 flex items-center gap-1"
                  style={{ color: accentColor }}
                >
                  Get API key <ExternalLink size={12} />
                </a>
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: `${textColor}80` }}>Theme Colors</label>
                <div className="space-y-2">
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
                      className="flex-1 px-4 py-2 rounded-lg border text-sm"
                      style={{ borderColor: `${textColor}20` }}
                      placeholder="Background"
                    />
                  </div>
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
                      className="flex-1 px-4 py-2 rounded-lg border text-sm"
                      style={{ borderColor: `${textColor}20` }}
                      placeholder="Accent"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={saveSettings}
                className="w-full py-3 rounded-lg font-semibold"
                style={{ backgroundColor: accentColor, color: primaryColor }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 2000, overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '448px', backgroundColor: primaryColor, borderRadius: '12px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: textColor }}>Edit Profile</h2>
              <button onClick={() => setShowEditProfile(false)}>
                <X size={24} style={{ color: accentColor }} />
              </button>
            </div>

            <div className="space-y-4">
              {[
                { key: 'name', label: 'Full Name' },
                { key: 'nickname', label: 'Nickname' },
                { key: 'email', label: 'Email' },
                { key: 'address', label: 'Address' },
                { key: 'city', label: 'City' },
                { key: 'country', label: 'Country' }
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm mb-1" style={{ color: `${textColor}80` }}>{field.label}</label>
                  <input
                    type="text"
                    value={userProfile[field.key]}
                    onChange={(e) => setUserProfile({...userProfile, [field.key]: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{ borderColor: `${textColor}20`, backgroundColor: primaryColor }}
                  />
                </div>
              ))}

              <button
                onClick={saveProfile}
                className="w-full py-3 rounded-lg font-semibold mt-4"
                style={{ backgroundColor: accentColor, color: primaryColor }}
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedResult && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 2000, overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '448px', backgroundColor: primaryColor, borderRadius: '12px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-start mb-4">
              <div className="pr-4 flex-1">
                <h2 className="text-xl font-bold mb-1" style={{ color: textColor }}>
                  {selectedResult.title?.split(' - ')[0] || 'Unknown Artist'}
                </h2>
                <p className="text-lg" style={{ color: `${textColor}80` }}>
                  {selectedResult.title?.split(' - ')[1] || selectedResult.title || 'Unknown Album'}
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
                style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px', marginBottom: '16px', backgroundColor: `${textColor}05` }}
              />
            )}

            <div className="space-y-3">
              {selectedResult.year && (
                <div className="flex justify-between">
                  <span style={{ color: `${textColor}60` }}>Year:</span>
                  <span style={{ color: textColor }}>{selectedResult.year}</span>
                </div>
              )}
              {selectedResult.label?.[0] && (
                <div className="flex justify-between">
                  <span style={{ color: `${textColor}60` }}>Label:</span>
                  <span style={{ color: textColor }}>{selectedResult.label[0]}</span>
                </div>
              )}
              {selectedResult.genre?.[0] && (
                <div className="flex justify-between">
                  <span style={{ color: `${textColor}60` }}>Genre:</span>
                  <span style={{ color: textColor }}>{selectedResult.genre[0]}</span>
                </div>
              )}
              {selectedResult.format?.[0] && (
                <div className="flex justify-between">
                  <span style={{ color: `${textColor}60` }}>Format:</span>
                  <span style={{ color: textColor }}>{selectedResult.format[0]}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 mt-6">
              {collection.find((_, idx) => collection[idx].id === selectedResult.id) !== undefined ? (
                <>
                  <button
                    onClick={() => {
                      const idx = collection.findIndex(item => item.id === selectedResult.id);
                      removeFromCollection(idx);
                      setSelectedResult(null);
                    }}
                    className="w-full py-3 rounded-lg font-semibold border-2 flex items-center justify-center gap-2"
                    style={{ borderColor: '#EF4444', color: '#EF4444' }}
                  >
                    <Trash2 size={20} />
                    Remove from Collection
                  </button>
                  <button
                    onClick={() => {
                      const idx = collection.findIndex(item => item.id === selectedResult.id);
                      toggleFavorite(idx);
                      setSelectedResult({...selectedResult, favorite: !selectedResult.favorite});
                    }}
                    className="w-full py-3 rounded-lg font-semibold border-2 flex items-center justify-center gap-2"
                    style={{ borderColor: accentColor, color: accentColor }}
                  >
                    <Heart size={20} fill={isFavorited(selectedResult) ? accentColor : 'none'} />
                    {isFavorited(selectedResult) ? 'Remove from' : 'Add to'} Favorites
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    addToCollection(selectedResult);
                    setSelectedResult(null);
                  }}
                  className="w-full py-3 rounded-lg font-semibold"
                  style={{ backgroundColor: accentColor, color: primaryColor }}
                >
                  Add to Collection
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VinylPriceFinder;