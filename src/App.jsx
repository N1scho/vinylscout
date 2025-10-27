import React, { useState, useEffect, useRef } from 'react';
import { Search, Camera, Music, User, Settings, X, ExternalLink, Grid, List, Heart } from 'lucide-react';

const VinylPriceFinder = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [collection, setCollection] = useState([]);
  const [sortBy, setSortBy] = useState('artist');
  const [collectionView, setCollectionView] = useState('gallery');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [discogsToken, setDiscogsToken] = useState('');
  const [selectedShops, setSelectedShops] = useState(['discogs', 'hhv', 'ebay']);
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [accentColor, setAccentColor] = useState('#ffb700');

  useEffect(() => {
    const savedSettings = localStorage.getItem('vinylScoutSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setDiscogsToken(settings.discogsToken || '');
      setSelectedShops(settings.selectedShops || ['discogs', 'hhv', 'ebay']);
      setPrimaryColor(settings.primaryColor || '#000000');
      setAccentColor(settings.accentColor || '#ffb700');
    }
    
    // Try to load collection from multiple possible storage keys
    let loadedCollection = null;
    const possibleKeys = ['vinylScoutCollection', 'vinylCollection', 'collection'];
    
    for (const key of possibleKeys) {
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedCollection = parsed.map(item => ({
              ...item,
              isFavorite: item.isFavorite || false
            }));
            // Migrate to standard key
            localStorage.setItem('vinylScoutCollection', JSON.stringify(loadedCollection));
            break;
          }
        } catch (e) {
          console.error('Failed to load from', key);
        }
      }
    }
    
    if (loadedCollection) {
      setCollection(loadedCollection);
      console.log('Loaded', loadedCollection.length, 'items from collection');
    }
    
    const savedView = localStorage.getItem('vinylScoutCollectionView');
    if (savedView) setCollectionView(savedView);
  }, []);

  const saveSettings = () => {
    const settings = { discogsToken, selectedShops, primaryColor, accentColor };
    localStorage.setItem('vinylScoutSettings', JSON.stringify(settings));
    setShowSettings(false);
    alert('Settings saved!');
  };

  const toggleShop = (shopId) => {
    setSelectedShops(prev =>
      prev.includes(shopId) ? prev.filter(id => id !== shopId) : [...prev, shopId]
    );
  };

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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setCameraStream(stream);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
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

  const addToCollection = (item) => {
    if (!collection.find(c => c.id === item.id)) {
      const newCollection = [...collection, { ...item, isFavorite: false }];
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

  const toggleFavorite = (id) => {
    const newCollection = collection.map(item =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );
    setCollection(newCollection);
    localStorage.setItem('vinylScoutCollection', JSON.stringify(newCollection));
  };

  const toggleCollectionView = () => {
    const newView = collectionView === 'gallery' ? 'list' : 'gallery';
    setCollectionView(newView);
    localStorage.setItem('vinylScoutCollectionView', newView);
  };

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
          style={{ backgroundColor: primaryColor, borderColor: accentColor }}
        />
        <button
          onClick={searchDiscogs}
          disabled={isLoading}
          className="w-full mt-3 py-3 rounded-lg font-semibold transition-colors"
          style={{ backgroundColor: accentColor, color: primaryColor }}
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
            style={{ backgroundColor: accentColor, color: primaryColor }}
          >
            Start Camera
          </button>
        </div>
      ) : (
        <div>
          <div className="relative rounded-lg overflow-hidden mb-4">
            <video ref={videoRef} autoPlay playsInline className="w-full" />
          </div>
          <div className="flex gap-3">
            <button
              onClick={capturePhoto}
              className="flex-1 py-3 rounded-lg font-semibold"
              style={{ backgroundColor: accentColor, color: primaryColor }}
            >
              Capture
            </button>
            <button
              onClick={stopCamera}
              className="flex-1 py-3 rounded-lg font-semibold border-2"
              style={{ backgroundColor: primaryColor, borderColor: accentColor, color: accentColor }}
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
    // Safety check - ensure collection is an array
    if (!Array.isArray(collection)) {
      return (
        <div className="pb-4">
          <div className="text-center py-12 text-gray-400">
            <Music size={48} className="mx-auto mb-4 opacity-50" />
            <p>No records in collection yet</p>
          </div>
        </div>
      );
    }

    let displayCollection = showFavoritesOnly 
      ? collection.filter(item => item && item.isFavorite)
      : collection.filter(item => item);

    displayCollection = [...displayCollection].sort((a, b) => {
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
        <div className="flex items-center justify-between mb-3 gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-white px-3 py-2 rounded-lg flex-1 text-sm"
            style={{ backgroundColor: primaryColor, borderColor: accentColor, border: '1px solid' }}
          >
            <option value="artist">Artist A-Z</option>
            <option value="title">Title A-Z</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
          
          <button
            onClick={toggleCollectionView}
            className="px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            style={{ backgroundColor: primaryColor, color: accentColor, border: `1px solid ${accentColor}` }}
          >
            {collectionView === 'gallery' ? <List size={18} /> : <Grid size={18} />}
          </button>

          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className="px-3 py-2 rounded-lg font-medium transition-colors"
            style={{ 
              backgroundColor: showFavoritesOnly ? accentColor : primaryColor, 
              color: showFavoritesOnly ? primaryColor : accentColor,
              border: `1px solid ${accentColor}`
            }}
          >
            <Heart size={18} fill={showFavoritesOnly ? primaryColor : 'none'} />
          </button>
        </div>

        {displayCollection.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Music size={48} className="mx-auto mb-4 opacity-50" />
            <p>{showFavoritesOnly ? 'No favorites yet' : 'No records in collection yet'}</p>
          </div>
        ) : collectionView === 'gallery' ? (
          <div className="grid grid-cols-2 gap-3">
            {displayCollection.map((item) => (
              <div
                key={item.id}
                className="rounded-lg overflow-hidden"
                style={{ backgroundColor: primaryColor }}
              >
                <div 
                  className="aspect-square w-full bg-gray-800 relative cursor-pointer"
                  onClick={() => setSelectedResult(item)}
                >
                  <img
                    src={item.cover_image || item.thumb || '/api/placeholder/300/300'}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.id);
                    }}
                    className="absolute top-2 right-2 p-2 rounded-full"
                    style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
                  >
                    <Heart 
                      size={20} 
                      fill={item.isFavorite ? accentColor : 'none'}
                      stroke={item.isFavorite ? accentColor : 'white'}
                    />
                  </button>
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
            {displayCollection.map((item) => (
              <div
                key={item.id}
                className="rounded-lg overflow-hidden flex"
                style={{ backgroundColor: primaryColor }}
              >
                <div 
                  className="w-20 h-20 flex-shrink-0 bg-gray-800 cursor-pointer"
                  onClick={() => setSelectedResult(item)}
                >
                  <img
                    src={item.cover_image || item.thumb || '/api/placeholder/80/80'}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div 
                  className="flex-1 p-3 min-w-0 cursor-pointer"
                  onClick={() => setSelectedResult(item)}
                >
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(item.id);
                  }}
                  className="px-4 flex items-center"
                >
                  <Heart 
                    size={24} 
                    fill={item.isFavorite ? accentColor : 'none'}
                    stroke={item.isFavorite ? accentColor : 'white'}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

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
              {collection.filter(item => item.isFavorite).length}
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
    const isFavorite = isInCollection?.isFavorite;

    return (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.95)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
        onClick={() => setSelectedResult(null)}
      >
        <div 
          style={{
            backgroundColor: primaryColor,
            borderRadius: '12px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            position: 'sticky',
            top: 0,
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${accentColor}`,
            backgroundColor: primaryColor,
            zIndex: 10
          }}>
            <h3 style={{ fontWeight: 'bold' }}>Album Details</h3>
            <button onClick={() => setSelectedResult(null)}>
              <X size={24} style={{ color: accentColor }} />
            </button>
          </div>
          
          <div style={{ padding: '16px' }}>
            <img
              src={selectedResult.cover_image || selectedResult.thumb || '/api/placeholder/400/400'}
              alt={selectedResult.title}
              style={{ width: '100%', borderRadius: '8px', marginBottom: '16px' }}
            />
            
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
              {selectedResult.title?.split(' - ')[0] || 'Unknown Artist'}
            </h2>
            <p style={{ color: '#9ca3af', marginBottom: '16px' }}>
              {selectedResult.title?.split(' - ')[1] || selectedResult.title}
            </p>
            
            {selectedResult.year && (
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                Year: {selectedResult.year}
              </p>
            )}
            
            {selectedResult.price && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: accentColor }}>
                  EUR {selectedResult.price.toFixed(2)}
                </p>
                {selectedResult.num_for_sale > 0 && (
                  <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                    {selectedResult.num_for_sale} available on Discogs
                  </p>
                )}
              </div>
            )}
            
            {isInCollection && (
              <button
                onClick={() => toggleFavorite(selectedResult.id)}
                style={{
                  width: '100%',
                  marginBottom: '8px',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: isFavorite ? accentColor : primaryColor,
                  color: isFavorite ? primaryColor : accentColor,
                  border: `2px solid ${accentColor}`,
                  cursor: 'pointer'
                }}
              >
                <Heart fill={isFavorite ? primaryColor : 'none'} size={20} />
                {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </button>
            )}
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {!isInCollection ? (
                <button
                  onClick={() => addToCollection(selectedResult)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    backgroundColor: accentColor,
                    color: primaryColor,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Add to Collection
                </button>
              ) : (
                <button
                  onClick={() => removeFromCollection(selectedResult.id)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    backgroundColor: primaryColor,
                    border: `2px solid ${accentColor}`,
                    color: accentColor,
                    cursor: 'pointer'
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
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: `2px solid ${accentColor}`,
                    color: accentColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none'
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
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.95)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
        onClick={() => setShowSettings(false)}
      >
        <div 
          style={{
            backgroundColor: primaryColor,
            borderRadius: '12px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            position: 'sticky',
            top: 0,
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${accentColor}`,
            backgroundColor: primaryColor,
            zIndex: 10
          }}>
            <h3 style={{ fontWeight: 'bold', fontSize: '18px' }}>Settings</h3>
            <button onClick={() => setShowSettings(false)}>
              <X size={24} style={{ color: accentColor }} />
            </button>
          </div>
          
          <div style={{ padding: '16px' }}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Discogs API Token
              </label>
              <input
                type="password"
                value={discogsToken}
                onChange={(e) => setDiscogsToken(e.target.value)}
                placeholder="Enter your token"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  border: 'none'
                }}
              />
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                Get your token at discogs.com/settings/developers
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Price Sources
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { id: 'discogs', name: 'Discogs' },
                  { id: 'hhv', name: 'HHV' },
                  { id: 'ebay', name: 'eBay' }
                ].map(shop => (
                  <label key={shop.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      checked={selectedShops.includes(shop.id)}
                      onChange={() => toggleShop(shop.id)}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span>{shop.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Primary Color
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{ width: '64px', height: '40px', borderRadius: '8px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#1f2937',
                    color: 'white',
                    border: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Accent Color
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  style={{ width: '64px', height: '40px', borderRadius: '8px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#1f2937',
                    color: 'white',
                    border: 'none'
                  }}
                />
              </div>
            </div>

            <button
              onClick={saveSettings}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: '600',
                backgroundColor: accentColor,
                color: primaryColor,
                border: 'none',
                cursor: 'pointer'
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#1a1a1a',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0,
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: primaryColor
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: accentColor }}>VinylScout</h1>
        <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <Settings size={24} style={{ color: accentColor }} />
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        paddingBottom: '100px'
      }}>
        {activeTab === 'search' && renderSearchTab()}
        {activeTab === 'camera' && renderCameraTab()}
        {activeTab === 'collection' && renderCollectionTab()}
        {activeTab === 'profile' && renderProfileTab()}
      </div>

      {/* Bottom Navigation - ABSOLUTELY FIXED */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        backgroundColor: primaryColor,
        borderTop: `1px solid ${accentColor}`,
        zIndex: 1000
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 0,
          width: '100%',
          padding: '8px 0'
        }}>
          {[
            { id: 'search', icon: Search, label: 'Search' },
            { id: 'camera', icon: Camera, label: 'Camera' },
            { id: 'collection', icon: Music, label: 'Collection' },
            { id: 'profile', icon: User, label: 'Profile' }
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                color: activeTab === id ? accentColor : '#666'
              }}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              <span style={{ 
                fontSize: '9px', 
                textAlign: 'center',
                lineHeight: '1.2'
              }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {renderSettings()}
      {renderDetailModal()}
    </div>
  );
};

export default VinylPriceFinder;