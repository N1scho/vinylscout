import React, { useState, useEffect, useRef } from 'react';
import { Search, Camera, Music, Heart, User, Settings, X, ChevronRight, ExternalLink, Grid, List } from 'lucide-react';

const VinylPriceFinder = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [collection, setCollection] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [sortBy, setSortBy] = useState('artist');
  const [collectionView, setCollectionView] = useState('gallery');
  
  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Settings state
  const [discogsToken, setDiscogsToken] = useState('');
  const [selectedShops, setSelectedShops] = useState(['discogs', 'hhv', 'ebay']);
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [accentColor, setAccentColor] = useState('#ffb700');

  // Load saved data
  useEffect(() => {
    const savedSettings = localStorage.getItem('vinylScoutSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setDiscogsToken(settings.discogsToken || '');
      setSelectedShops(settings.selectedShops || ['discogs', 'hhv', 'ebay']);
      setPrimaryColor(settings.primaryColor || '#000000');
      setAccentColor(settings.accentColor || '#ffb700');
    }
    
    const savedCollection = localStorage.getItem('vinylScoutCollection');
    if (savedCollection) setCollection(JSON.parse(savedCollection));
    
    const savedFavorites = localStorage.getItem('vinylScoutFavorites');
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    
    const savedView = localStorage.getItem('vinylScoutCollectionView');
    if (savedView) setCollectionView(savedView);
  }, []);

  // Save settings
  const saveSettings = () => {
    const settings = {
      discogsToken,
      selectedShops,
      primaryColor,
      accentColor
    };
    localStorage.setItem('vinylScoutSettings', JSON.stringify(settings));
    setShowSettings(false);
    alert('Settings saved!');
  };

  // Toggle shop selection
  const toggleShop = (shopId) => {
    setSelectedShops(prev =>
      prev.includes(shopId)
        ? prev.filter(id => id !== shopId)
        : [...prev, shopId]
    );
  };

  // Search Discogs
  const searchDiscogs = async () => {
    if (!searchQuery.trim() || !discogsToken) {
      alert('Please enter a search query and add your Discogs token in settings');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.discogs.com/database/search?q=${encodeURIComponent(searchQuery)}&type=release&per_page=10`,
        {
          headers: {
            'Authorization': `Discogs token=${discogsToken}`,
            'User-Agent': 'VinylScout/1.0'
          }
        }
      );

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      
      // Fetch prices for each result
      const resultsWithPrices = await Promise.all(
        data.results.slice(0, 10).map(async (result) => {
          try {
            const priceResponse = await fetch(
              `https://api.discogs.com/marketplace/stats/${result.id}`,
              {
                headers: {
                  'Authorization': `Discogs token=${discogsToken}`,
                  'User-Agent': 'VinylScout/1.0'
                }
              }
            );
            
            if (priceResponse.ok) {
              const priceData = await priceResponse.json();
              return {
                ...result,
                price: priceData.lowest_price?.value || null,
                currency: priceData.lowest_price?.currency || 'EUR',
                num_for_sale: priceData.num_for_sale || 0
              };
            }
          } catch (error) {
            console.error('Price fetch error:', error);
          }
          return result;
        })
      );

      setSearchResults(resultsWithPrices);
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please check your Discogs token.');
    } finally {
      setIsLoading(false);
    }
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setCameraStream(stream);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      alert('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      alert('Photo captured! Manual search recommended for best results.');
      stopCamera();
    }
  };

  // Collection management
  const addToCollection = (item) => {
    if (!collection.find(c => c.id === item.id)) {
      const newCollection = [...collection, item];
      setCollection(newCollection);
      localStorage.setItem('vinylScoutCollection', JSON.stringify(newCollection));
      alert('Added to collection!');
    }
  };

  const removeFromCollection = (id) => {
    const newCollection = collection.filter(item => item.id !== id);
    setCollection(newCollection);
    localStorage.setItem('vinylScoutCollection', JSON.stringify(newCollection));
  };

  const toggleFavorite = (item) => {
    const isFavorite = favorites.find(f => f.id === item.id);
    let newFavorites;
    
    if (isFavorite) {
      newFavorites = favorites.filter(f => f.id !== item.id);
    } else {
      newFavorites = [...favorites, item];
    }
    
    setFavorites(newFavorites);
    localStorage.setItem('vinylScoutFavorites', JSON.stringify(newFavorites));
  };

  const toggleCollectionView = () => {
    const newView = collectionView === 'gallery' ? 'list' : 'gallery';
    setCollectionView(newView);
    localStorage.setItem('vinylScoutCollectionView', newView);
  };

  // Render functions
  const renderSearchTab = () => (
    <div className="pb-4">
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchDiscogs()}
          placeholder="Search artist or album..."
          className="w-full px-4 py-3 rounded-lg text-white border-2"
          style={{ 
            backgroundColor: primaryColor,
            borderColor: accentColor 
          }}
        />
        <button
          onClick={searchDiscogs}
          disabled={isLoading}
          className="w-full mt-3 py-3 rounded-lg font-semibold transition-colors"
          style={{ 
            backgroundColor: accentColor,
            color: primaryColor 
          }}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-3">
          {searchResults.map((result) => (
            <div
              key={result.id}
              className="rounded-lg overflow-hidden cursor-pointer"
              style={{ backgroundColor: primaryColor }}
              onClick={() => setSelectedResult(result)}
            >
              <div className="flex">
                <div className="w-24 h-24 flex-shrink-0 bg-gray-800">
                  <img
                    src={result.cover_image || result.thumb || '/api/placeholder/96/96'}
                    alt={result.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-3 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {result.title?.split(' - ')[0] || 'Unknown Artist'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {result.title?.split(' - ')[1] || result.title}
                  </p>
                  {result.year && (
                    <p className="text-xs text-gray-500 mt-1">{result.year}</p>
                  )}
                  {result.price && (
                    <p className="text-sm font-bold mt-1" style={{ color: accentColor }}>
                      EUR {result.price.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {searchResults.length === 0 && !isLoading && (
        <div className="text-center py-12 text-gray-400">
          <Search size={48} className="mx-auto mb-4 opacity-50" />
          <p>Search for vinyl records</p>
        </div>
      )}
    </div>
  );

  const renderCameraTab = () => (
    <div className="pb-4">
      {!showCamera ? (
        <div className="text-center py-12">
          <Camera size={48} className="mx-auto mb-4" style={{ color: accentColor }} />
          <p className="text-gray-400 mb-6">Take a photo of the album cover</p>
          <button
            onClick={startCamera}
            className="px-6 py-3 rounded-lg font-semibold"
            style={{ 
              backgroundColor: accentColor,
              color: primaryColor 
            }}
          >
            Start Camera
          </button>
        </div>
      ) : (
        <div>
          <div className="relative rounded-lg overflow-hidden mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={capturePhoto}
              className="flex-1 py-3 rounded-lg font-semibold"
              style={{ 
                backgroundColor: accentColor,
                color: primaryColor 
              }}
            >
              Capture
            </button>
            <button
              onClick={stopCamera}
              className="flex-1 py-3 rounded-lg font-semibold border-2"
              style={{ 
                backgroundColor: primaryColor,
                borderColor: accentColor,
                color: accentColor
              }}
            >
              Cancel
            </button>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );

  const renderCollectionTab = () => {
    const sortedCollection = [...collection].sort((a, b) => {
      if (sortBy === 'artist') {
        const artistA = a.title?.split(' - ')[0] || '';
        const artistB = b.title?.split(' - ')[0] || '';
        return artistA.localeCompare(artistB);
      }
      if (sortBy === 'title') {
        const titleA = a.title?.split(' - ')[1] || a.title || '';
        const titleB = b.title?.split(' - ')[1] || b.title || '';
        return titleA.localeCompare(titleB);
      }
      if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
      return 0;
    });

    return (
      <div className="pb-4">
        <div className="flex items-center justify-between mb-4 gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-white px-3 py-2 rounded-lg flex-1"
            style={{ backgroundColor: primaryColor, borderColor: accentColor, border: '1px solid' }}
          >
            <option value="artist">Artist A-Z</option>
            <option value="title">Title A-Z</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
          
          <button
            onClick={toggleCollectionView}
            className="px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            style={{ 
              backgroundColor: primaryColor,
              color: accentColor,
              border: `1px solid ${accentColor}`
            }}
          >
            {collectionView === 'gallery' ? (
              <>
                <List size={18} />
                List
              </>
            ) : (
              <>
                <Grid size={18} />
                Grid
              </>
            )}
          </button>
        </div>

        {collection.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Music size={48} className="mx-auto mb-4 opacity-50" />
            <p>No records in collection yet</p>
          </div>
        ) : collectionView === 'gallery' ? (
          <div className="grid grid-cols-2 gap-3">
            {sortedCollection.map((item) => (
              <div
                key={item.id}
                className="rounded-lg overflow-hidden cursor-pointer"
                style={{ backgroundColor: primaryColor }}
                onClick={() => setSelectedResult(item)}
              >
                <div className="aspect-square w-full bg-gray-800 relative">
                  <img
                    src={item.cover_image || item.thumb || '/api/placeholder/300/300'}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm truncate">
                    {item.title?.split(' - ')[0] || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {item.title?.split(' - ')[1] || item.title}
                  </p>
                  {item.price && (
                    <p className="text-sm font-bold mt-1" style={{ color: accentColor }}>
                      EUR {item.price.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedCollection.map((item) => (
              <div
                key={item.id}
                className="rounded-lg overflow-hidden cursor-pointer flex"
                style={{ backgroundColor: primaryColor }}
                onClick={() => setSelectedResult(item)}
              >
                <div className="w-20 h-20 flex-shrink-0 bg-gray-800">
                  <img
                    src={item.cover_image || item.thumb || '/api/placeholder/80/80'}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-3 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {item.title?.split(' - ')[0] || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {item.title?.split(' - ')[1] || item.title}
                  </p>
                  {item.price && (
                    <p className="text-sm font-bold mt-1" style={{ color: accentColor }}>
                      EUR {item.price.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderFavoritesTab = () => (
    <div className="pb-4">
      {favorites.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Heart size={48} className="mx-auto mb-4 opacity-50" />
          <p>No favorites yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {favorites.map((item) => (
            <div
              key={item.id}
              className="rounded-lg overflow-hidden cursor-pointer"
              style={{ backgroundColor: primaryColor }}
              onClick={() => setSelectedResult(item)}
            >
              <div className="aspect-square w-full bg-gray-800">
                <img
                  src={item.cover_image || item.thumb || '/api/placeholder/300/300'}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm truncate">
                  {item.title?.split(' - ')[0] || 'Unknown'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {item.title?.split(' - ')[1] || item.title}
                </p>
                {item.price && (
                  <p className="text-sm font-bold mt-1" style={{ color: accentColor }}>
                    EUR {item.price.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProfileTab = () => (
    <div className="pb-4">
      <div className="text-center py-8">
        <div 
          className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: accentColor }}
        >
          <User size={48} style={{ color: primaryColor }} />
        </div>
        <h2 className="text-xl font-bold mb-2">VinylScout User</h2>
        <p className="text-gray-400 text-sm mb-6">Vinyl collector</p>
        
        <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
          <div className="p-4 rounded-lg" style={{ backgroundColor: primaryColor }}>
            <p className="text-2xl font-bold" style={{ color: accentColor }}>
              {collection.length}
            </p>
            <p className="text-xs text-gray-400">Collection</p>
          </div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: primaryColor }}>
            <p className="text-2xl font-bold" style={{ color: accentColor }}>
              {favorites.length}
            </p>
            <p className="text-xs text-gray-400">Favorites</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDetailModal = () => {
    if (!selectedResult) return null;

    const isInCollection = collection.find(c => c.id === selectedResult.id);
    const isFavorite = favorites.find(f => f.id === selectedResult.id);

    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
        onClick={() => setSelectedResult(null)}
      >
        <div 
          className="rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
          style={{ backgroundColor: primaryColor }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 p-4 flex justify-between items-center border-b"
            style={{ 
              backgroundColor: primaryColor,
              borderColor: accentColor 
            }}
          >
            <h3 className="font-bold">Album Details</h3>
            <button onClick={() => setSelectedResult(null)}>
              <X size={24} style={{ color: accentColor }} />
            </button>
          </div>
          
          <div className="p-4">
            <img
              src={selectedResult.cover_image || selectedResult.thumb || '/api/placeholder/400/400'}
              alt={selectedResult.title}
              className="w-full rounded-lg mb-4"
            />
            
            <h2 className="text-xl font-bold mb-2">
              {selectedResult.title?.split(' - ')[0] || 'Unknown Artist'}
            </h2>
            <p className="text-gray-400 mb-4">
              {selectedResult.title?.split(' - ')[1] || selectedResult.title}
            </p>
            
            {selectedResult.year && (
              <p className="text-sm text-gray-500 mb-2">Year: {selectedResult.year}</p>
            )}
            
            {selectedResult.price && (
              <div className="mb-4">
                <p className="text-2xl font-bold" style={{ color: accentColor }}>
                  EUR {selectedResult.price.toFixed(2)}
                </p>
                {selectedResult.num_for_sale > 0 && (
                  <p className="text-xs text-gray-400">
                    {selectedResult.num_for_sale} available on Discogs
                  </p>
                )}
              </div>
            )}
            
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => toggleFavorite(selectedResult)}
                className="flex-1 py-3 rounded-lg font-semibold transition-colors"
                style={{
                  backgroundColor: isFavorite ? accentColor : primaryColor,
                  color: isFavorite ? primaryColor : accentColor,
                  border: `2px solid ${accentColor}`
                }}
              >
                {isFavorite ? '❤️ Favorited' : '🤍 Add to Favorites'}
              </button>
            </div>
            
            <div className="flex gap-2">
              {!isInCollection ? (
                <button
                  onClick={() => addToCollection(selectedResult)}
                  className="flex-1 py-3 rounded-lg font-semibold"
                  style={{
                    backgroundColor: accentColor,
                    color: primaryColor
                  }}
                >
                  Add to Collection
                </button>
              ) : (
                <button
                  onClick={() => removeFromCollection(selectedResult.id)}
                  className="flex-1 py-3 rounded-lg font-semibold border-2"
                  style={{
                    backgroundColor: primaryColor,
                    borderColor: accentColor,
                    color: accentColor
                  }}
                >
                  Remove from Collection
                </button>
              )}
              
              {selectedResult.uri && (
                <a
                  href={`https://www.discogs.com${selectedResult.uri}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-lg border-2 flex items-center justify-center"
                  style={{
                    borderColor: accentColor,
                    color: accentColor
                  }}
                >
                  <ExternalLink size={20} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    if (!showSettings) return null;

    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
        onClick={() => setShowSettings(false)}
      >
        <div 
          className="rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
          style={{ backgroundColor: primaryColor }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 z-10 p-4 flex justify-between items-center border-b"
            style={{ 
              backgroundColor: primaryColor,
              borderColor: accentColor 
            }}
          >
            <h3 className="font-bold text-lg">Settings</h3>
            <button onClick={() => setShowSettings(false)}>
              <X size={24} style={{ color: accentColor }} />
            </button>
          </div>
          
          <div className="p-4 space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Discogs API Token
              </label>
              <input
                type="password"
                value={discogsToken}
                onChange={(e) => setDiscogsToken(e.target.value)}
                placeholder="Enter your token"
                className="w-full px-3 py-2 rounded-lg bg-gray-800 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Get your token at discogs.com/settings/developers
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Price Sources
              </label>
              <div className="space-y-2">
                {[
                  { id: 'discogs', name: 'Discogs' },
                  { id: 'hhv', name: 'HHV' },
                  { id: 'ebay', name: 'eBay' }
                ].map(shop => (
                  <label key={shop.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedShops.includes(shop.id)}
                      onChange={() => toggleShop(shop.id)}
                      className="w-5 h-5"
                    />
                    <span>{shop.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Primary Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-16 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-800 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Accent Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-16 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-gray-800 text-white"
                />
              </div>
            </div>

            <button
              onClick={saveSettings}
              className="w-full py-3 rounded-lg font-semibold"
              style={{
                backgroundColor: accentColor,
                color: primaryColor
              }}
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen text-white" style={{ backgroundColor: '#1a1a1a' }}>
      {/* Header */}
      <div 
        className="flex-shrink-0 px-4 py-4 flex justify-between items-center"
        style={{ backgroundColor: primaryColor }}
      >
        <h1 className="text-2xl font-bold" style={{ color: accentColor }}>
          VinylScout
        </h1>
        <button onClick={() => setShowSettings(true)}>
          <Settings size={24} style={{ color: accentColor }} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: '100px' }}>
        {activeTab === 'search' && renderSearchTab()}
        {activeTab === 'camera' && renderCameraTab()}
        {activeTab === 'collection' && renderCollectionTab()}
        {activeTab === 'favorites' && renderFavoritesTab()}
        {activeTab === 'profile' && renderProfileTab()}
      </div>

      {/* Bottom Navigation */}
      <div 
        className="flex-shrink-0 flex justify-around items-center px-4 py-3 border-t"
        style={{ 
          backgroundColor: primaryColor,
          borderColor: accentColor
        }}
      >
        {[
          { id: 'search', icon: Search, label: 'Search' },
          { id: 'camera', icon: Camera, label: 'Camera' },
          { id: 'collection', icon: Music, label: 'Collection' },
          { id: 'favorites', icon: Heart, label: 'Favorites' },
          { id: 'profile', icon: User, label: 'Profile' }
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex flex-col items-center gap-1 flex-1"
            style={{ 
              color: activeTab === id ? accentColor : '#666'
            }}
          >
            <Icon size={24} />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>

      {/* Modals */}
      {renderSettings()}
      {renderDetailModal()}
    </div>
  );
};

export default VinylPriceFinder;