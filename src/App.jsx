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
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [collection, setCollection] = useState([]);
  const [favorites, setFavorites] = useState([]);
  
  // Settings state
  const [discogsToken, setDiscogsToken] = useState('');
  const [selectedShops, setSelectedShops] = useState(['discogs', 'hhv', 'ebay']);
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [accentColor, setAccentColor] = useState('#ffb700');
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('discogsToken');
    const savedShops = localStorage.getItem('selectedShops');
    const savedPrimaryColor = localStorage.getItem('primaryColor');
    const savedAccentColor = localStorage.getItem('accentColor');
    const savedCollection = localStorage.getItem('collection');
    const savedFavorites = localStorage.getItem('favorites');
    
    if (savedToken) setDiscogsToken(savedToken);
    if (savedShops) setSelectedShops(JSON.parse(savedShops));
    if (savedPrimaryColor) setPrimaryColor(savedPrimaryColor);
    if (savedAccentColor) setAccentColor(savedAccentColor);
    if (savedCollection) setCollection(JSON.parse(savedCollection));
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
  }, []);

  // Save settings to localStorage
  const saveSettings = () => {
    localStorage.setItem('discogsToken', discogsToken);
    localStorage.setItem('selectedShops', JSON.stringify(selectedShops));
    localStorage.setItem('primaryColor', primaryColor);
    localStorage.setItem('accentColor', accentColor);
    setShowSettings(false);
  };

  // Search Discogs API
  const searchDiscogs = async (isAdvanced = false) => {
    if (!discogsToken) {
      alert('Please add your Discogs API token in Settings');
      return;
    }

    setIsLoading(true);
    try {
      let searchUrl = 'https://api.discogs.com/database/search?';
      
      if (isAdvanced) {
        // Advanced search with individual fields
        const params = [];
        if (advancedSearch.artist) params.push(`artist=${encodeURIComponent(advancedSearch.artist)}`);
        if (advancedSearch.album) params.push(`release_title=${encodeURIComponent(advancedSearch.album)}`);
        if (advancedSearch.year) params.push(`year=${encodeURIComponent(advancedSearch.year)}`);
        if (advancedSearch.label) params.push(`label=${encodeURIComponent(advancedSearch.label)}`);
        if (advancedSearch.genre) params.push(`genre=${encodeURIComponent(advancedSearch.genre)}`);
        
        searchUrl += params.join('&') + '&per_page=10';
      } else {
        // Simple search
        searchUrl += `q=${encodeURIComponent(searchQuery)}&per_page=10`;
      }
      
      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Discogs token=${discogsToken}`,
          'User-Agent': 'VinylScout/1.0'
        }
      });
      
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      alert('Error searching. Please check your API token.');
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
    
    // Here you would normally send to an image recognition API
    alert('Photo captured! In production, this would be sent to image recognition API');
    stopCamera();
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
    const newCollection = [...collection, item];
    setCollection(newCollection);
    localStorage.setItem('collection', JSON.stringify(newCollection));
  };

  const addToFavorites = (item) => {
    const newFavorites = [...favorites, item];
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const toggleFavorite = (item) => {
    const isFav = favorites.some(f => f.id === item.id);
    if (isFav) {
      const newFavorites = favorites.filter(f => f.id !== item.id);
      setFavorites(newFavorites);
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
    } else {
      addToFavorites(item);
    }
  };

  const isFavorited = (item) => favorites.some(f => f.id === item.id);

  // Shop toggle
  const toggleShop = (shop) => {
    setSelectedShops(prev => 
      prev.includes(shop) 
        ? prev.filter(s => s !== shop)
        : [...prev, shop]
    );
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
          paddingBottom: '90px'
        }}
      >
        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            {/* Simple Search Bar */}
            <div className="space-y-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Quick search..."
                className="w-full px-4 py-3 rounded-lg bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/40"
              />
            </div>

            {/* Advanced Search Toggle */}
            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className="w-full py-2 text-sm flex items-center justify-center gap-2"
              style={{ color: accentColor }}
            >
              {showAdvancedSearch ? '▲' : '▼'} Advanced Search
            </button>

            {/* Advanced Search Fields */}
            {showAdvancedSearch && (
              <div className="space-y-3 bg-white/5 rounded-lg p-4 border border-white/10">
                <div>
                  <label className="block text-white/60 text-xs mb-1">Artist</label>
                  <input
                    type="text"
                    value={advancedSearch.artist}
                    onChange={(e) => setAdvancedSearch({...advancedSearch, artist: e.target.value})}
                    placeholder="e.g. Pink Floyd"
                    className="w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-white/40 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-xs mb-1">Album</label>
                  <input
                    type="text"
                    value={advancedSearch.album}
                    onChange={(e) => setAdvancedSearch({...advancedSearch, album: e.target.value})}
                    placeholder="e.g. Dark Side of the Moon"
                    className="w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-white/40 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-xs mb-1">Year of Release</label>
                  <input
                    type="text"
                    value={advancedSearch.year}
                    onChange={(e) => setAdvancedSearch({...advancedSearch, year: e.target.value})}
                    placeholder="e.g. 1973"
                    className="w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-white/40 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-xs mb-1">Publisher/Label</label>
                  <input
                    type="text"
                    value={advancedSearch.label}
                    onChange={(e) => setAdvancedSearch({...advancedSearch, label: e.target.value})}
                    placeholder="e.g. Columbia Records"
                    className="w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-white/40 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-xs mb-1">Genre</label>
                  <input
                    type="text"
                    value={advancedSearch.genre}
                    onChange={(e) => setAdvancedSearch({...advancedSearch, genre: e.target.value})}
                    placeholder="e.g. Rock, Jazz, Electronic"
                    className="w-full px-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-white/40 text-sm"
                  />
                </div>

                <button
                  onClick={handleAdvancedSearch}
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg font-semibold transition-all mt-2"
                  style={{ backgroundColor: accentColor, color: primaryColor }}
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            )}

            {/* Quick Search Button (only show when advanced is closed) */}
            {!showAdvancedSearch && (
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="w-full py-3 rounded-lg font-semibold transition-all"
                style={{ backgroundColor: accentColor, color: primaryColor }}
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => setSelectedResult(result)}
                    className="bg-white/10 rounded-lg p-3 flex gap-3 cursor-pointer hover:bg-white/20 transition-all border border-white/10"
                  >
                    {result.cover_image && (
                      <img
                        src={result.cover_image}
                        alt={result.title}
                        className="w-20 h-20 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm truncate">
                        {result.title}
                      </h3>
                      <p className="text-white/60 text-xs mt-1">
                        {result.year || 'Year unknown'}
                      </p>
                      {result.label && result.label[0] && (
                        <p className="text-white/40 text-xs mt-1">
                          {result.label[0]}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(result);
                      }}
                      className="p-2"
                    >
                      <Heart
                        size={20}
                        style={{ color: accentColor }}
                        fill={isFavorited(result) ? accentColor : 'none'}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
            <p className="text-white/60 text-sm text-center">
              Point camera at vinyl cover and tap to capture
            </p>
          </div>
        )}

        {/* Collection Tab */}
        {activeTab === 'collection' && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white mb-4">My Collection</h2>
            {collection.length === 0 ? (
              <p className="text-white/60 text-center py-8">
                No records in collection yet
              </p>
            ) : (
              collection.map((item, idx) => (
                <div key={idx} className="bg-white/10 rounded-lg p-3 flex gap-3 border border-white/10">
                  {item.cover_image && (
                    <img
                      src={item.cover_image}
                      alt={item.title}
                      className="w-20 h-20 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm">{item.title}</h3>
                    <p className="text-white/60 text-xs mt-1">{item.year}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white mb-4">Favorites</h2>
            {favorites.length === 0 ? (
              <p className="text-white/60 text-center py-8">
                No favorites yet
              </p>
            ) : (
              favorites.map((item, idx) => (
                <div key={idx} className="bg-white/10 rounded-lg p-3 flex gap-3 border border-white/10">
                  {item.cover_image && (
                    <img
                      src={item.cover_image}
                      alt={item.title}
                      className="w-20 h-20 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm">{item.title}</h3>
                    <p className="text-white/60 text-xs mt-1">{item.year}</p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(item)}
                    className="p-2"
                  >
                    <Heart
                      size={20}
                      style={{ color: accentColor }}
                      fill={accentColor}
                    />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Profile</h2>
            <div className="bg-white/10 rounded-lg p-4 space-y-3 border border-white/10">
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
            
            <div className="bg-white/10 rounded-lg p-4 space-y-2 border border-white/10">
              <div className="flex justify-between">
                <span className="text-white/60">Total Records</span>
                <span className="text-white font-semibold">{collection.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Favorites</span>
                <span className="text-white font-semibold">{favorites.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Navigation - EXACTLY 5 BUTTONS IN ONE ROW */}
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
          onClick={() => setActiveTab('favorites')}
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
          <Heart 
            size={22} 
            style={{ color: activeTab === 'favorites' ? accentColor : 'rgba(255,255,255,0.5)' }}
          />
          <span 
            style={{ 
              fontSize: '10px',
              color: activeTab === 'favorites' ? accentColor : 'rgba(255,255,255,0.5)',
              whiteSpace: 'nowrap'
            }}
          >
            Favorites
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
                  className="w-full px-4 py-2 rounded bg-white/10 text-white border border-white/20 focus:outline-none focus:border-white/40"
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

              {/* Shop Selection */}
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Price Sources
                </label>
                <div className="space-y-2">
                  {['discogs', 'hhv', 'ebay'].map(shop => (
                    <label key={shop} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedShops.includes(shop)}
                        onChange={() => toggleShop(shop)}
                        className="w-5 h-5"
                        style={{ accentColor: accentColor }}
                      />
                      <span className="text-white capitalize">{shop}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Primary Color */}
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Background Color
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
                    className="flex-1 px-4 py-2 rounded bg-white/10 text-white border border-white/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-white/80 text-sm mb-2">
                  Accent Color
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
                    className="flex-1 px-4 py-2 rounded bg-white/10 text-white border border-white/20 focus:outline-none"
                  />
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
              <h2 className="text-xl font-bold text-white pr-4">
                {selectedResult.title}
              </h2>
              <button onClick={() => setSelectedResult(null)}>
                <X size={24} style={{ color: accentColor }} />
              </button>
            </div>

            {selectedResult.cover_image && (
              <img
                src={selectedResult.cover_image}
                alt={selectedResult.title}
                className="w-full rounded-lg mb-4"
              />
            )}

            <div className="space-y-3 mb-6">
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
              
              <button
                onClick={() => {
                  addToFavorites(selectedResult);
                  setSelectedResult(null);
                }}
                className="w-full py-3 rounded-lg font-semibold border-2 transition-all text-white"
                style={{ borderColor: accentColor }}
              >
                Add to Favorites
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VinylPriceFinder;