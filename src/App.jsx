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
    try {
      const savedSettings = localStorage.getItem('vinylScoutSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setDiscogsToken(settings.discogsToken || '');
        setSelectedShops(settings.selectedShops || ['discogs', 'hhv', 'ebay']);
        setPrimaryColor(settings.primaryColor || '#000000');
        setAccentColor(settings.accentColor || '#ffb700');
      }
      
      const savedCollection = localStorage.getItem('vinylScoutCollection');
      if (savedCollection) {
        const parsed = JSON.parse(savedCollection);
        if (Array.isArray(parsed)) {
          setCollection(parsed.map(item => ({
            ...item,
            isFavorite: item.isFavorite || false
          })));
          console.log('✅ Collection loaded:', parsed.length, 'items');
        }
      }
      
      const savedView = localStorage.getItem('vinylScoutCollectionView');
      if (savedView) setCollectionView(savedView);
    } catch (error) {
      console.error('❌ Error loading:', error);
    }
  }, []);

  const saveSettings = () => {
    try {
      localStorage.setItem('vinylScoutSettings', JSON.stringify({ 
        discogsToken, selectedShops, primaryColor, accentColor 
      }));
      setShowSettings(false);
      alert('Settings saved!');
    } catch (error) {
      alert('Failed to save');
    }
  };

  const toggleShop = (shopId) => {
    setSelectedShops(prev =>
      prev.includes(shopId) ? prev.filter(id => id !== shopId) : [...prev, shopId]
    );
  };

  const searchDiscogs = async () => {
    if (!searchQuery.trim() || !discogsToken) {
      alert('Please enter search query and Discogs token');
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
            console.error('Price error:', error);
          }
          return result;
        })
      );

      setSearchResults(resultsWithPrices);
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed');
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
      alert('Photo captured! Use search for best results.');
      stopCamera();
    }
  };

  const addToCollection = (item) => {
    try {
      if (!collection.find(c => c.id === item.id)) {
        const newCollection = [...collection, { ...item, isFavorite: false }];
        setCollection(newCollection);
        localStorage.setItem('vinylScoutCollection', JSON.stringify(newCollection));
        alert('Added to collection!');
      }
    } catch (error) {
      alert('Failed to add');
    }
  };

  const removeFromCollection = (id) => {
    try {
      const newCollection = collection.filter(item => item.id !== id);
      setCollection(newCollection);
      localStorage.setItem('vinylScoutCollection', JSON.stringify(newCollection));
    } catch (error) {
      alert('Failed to remove');
    }
  };

  const toggleFavorite = (id) => {
    try {
      const newCollection = collection.map(item =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      );
      setCollection(newCollection);
      localStorage.setItem('vinylScoutCollection', JSON.stringify(newCollection));
    } catch (error) {
      alert('Failed to update');
    }
  };

  const toggleCollectionView = () => {
    const newView = collectionView === 'gallery' ? 'list' : 'gallery';
    setCollectionView(newView);
    localStorage.setItem('vinylScoutCollectionView', newView);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#1a1a1a',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden'
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
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: accentColor, margin: 0 }}>VinylScout</h1>
        <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <Settings size={24} style={{ color: accentColor }} />
        </button>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        paddingBottom: '80px'
      }}>
        {/* Search Tab */}
        {activeTab === 'search' && (
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchDiscogs()}
              placeholder="Search artist or album..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: primaryColor,
                color: 'white',
                border: `2px solid ${accentColor}`,
                marginBottom: '12px'
              }}
            />
            <button
              onClick={searchDiscogs}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: accentColor,
                color: primaryColor,
                border: 'none',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>

            {searchResults.length > 0 && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => setSelectedResult(result)}
                    style={{
                      backgroundColor: primaryColor,
                      borderRadius: '8px',
                      display: 'flex',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ width: '80px', height: '80px', flexShrink: 0, backgroundColor: '#1f2937' }}>
                      <img
                        src={result.cover_image || result.thumb || '/api/placeholder/80/80'}
                        alt={result.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ flex: 1, padding: '12px', minWidth: 0 }}>
                      <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                        {result.title?.split(' - ')[0] || 'Unknown'}
                      </p>
                      <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {result.title?.split(' - ')[1] || result.title}
                      </p>
                      {result.price && (
                        <p style={{ fontSize: '14px', fontWeight: 'bold', color: accentColor, marginTop: '4px' }}>
                          EUR {result.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Camera Tab */}
        {activeTab === 'camera' && (
          <div>
            {!showCamera ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <Camera size={48} style={{ margin: '0 auto 16px', color: accentColor }} />
                <p style={{ color: '#9ca3af', marginBottom: '24px' }}>Take a photo of the album cover</p>
                <button
                  onClick={startCamera}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    backgroundColor: accentColor,
                    color: primaryColor,
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Start Camera
                </button>
              </div>
            ) : (
              <div>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '8px', marginBottom: '12px' }} />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={capturePhoto}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: accentColor,
                      color: primaryColor,
                      border: 'none',
                      fontWeight: '600'
                    }}
                  >
                    Capture
                  </button>
                  <button
                    onClick={stopCamera}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: primaryColor,
                      color: accentColor,
                      border: `2px solid ${accentColor}`,
                      fontWeight: '600'
                    }}
                  >
                    Cancel
                  </button>
                </div>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
            )}
          </div>
        )}

        {/* Collection Tab */}
        {activeTab === 'collection' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: primaryColor,
                  color: 'white',
                  border: `1px solid ${accentColor}`
                }}
              >
                <option value="artist">Artist A-Z</option>
                <option value="title">Title A-Z</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              
              <button
                onClick={toggleCollectionView}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: primaryColor,
                  color: accentColor,
                  border: `1px solid ${accentColor}`
                }}
              >
                {collectionView === 'gallery' ? <List size={18} /> : <Grid size={18} />}
              </button>

              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: showFavoritesOnly ? accentColor : primaryColor,
                  color: showFavoritesOnly ? primaryColor : accentColor,
                  border: `1px solid ${accentColor}`
                }}
              >
                <Heart size={18} fill={showFavoritesOnly ? primaryColor : 'none'} />
              </button>
            </div>

            {collection.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b7280' }}>
                <Music size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>No records in collection yet</p>
              </div>
            ) : collectionView === 'gallery' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {collection
                  .filter(item => !showFavoritesOnly || item.isFavorite)
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedResult(item)}
                      style={{
                        backgroundColor: primaryColor,
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', backgroundColor: '#1f2937' }}>
                        <img
                          src={item.cover_image || item.thumb || '/api/placeholder/300/300'}
                          alt={item.title}
                          style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.id);
                          }}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            padding: '6px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            border: 'none'
                          }}
                        >
                          <Heart
                            size={16}
                            fill={item.isFavorite ? accentColor : 'none'}
                            stroke={item.isFavorite ? accentColor : 'white'}
                          />
                        </button>
                      </div>
                      <div style={{ padding: '12px' }}>
                        <p style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>
                          {item.title?.split(' - ')[0] || 'Unknown'}
                        </p>
                        <p style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {item.title?.split(' - ')[1] || item.title}
                        </p>
                        {item.price && (
                          <p style={{ fontSize: '13px', fontWeight: 'bold', color: accentColor, marginTop: '4px' }}>
                            EUR {item.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {collection
                  .filter(item => !showFavoritesOnly || item.isFavorite)
                  .map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedResult(item)}
                      style={{
                        backgroundColor: primaryColor,
                        borderRadius: '8px',
                        display: 'flex',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ width: '80px', height: '80px', flexShrink: 0, backgroundColor: '#1f2937' }}>
                        <img
                          src={item.cover_image || item.thumb || '/api/placeholder/80/80'}
                          alt={item.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ flex: 1, padding: '12px', minWidth: 0 }}>
                        <p style={{ fontWeight: '600', fontSize: '13px' }}>
                          {item.title?.split(' - ')[0] || 'Unknown'}
                        </p>
                        <p style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {item.title?.split(' - ')[1] || item.title}
                        </p>
                        {item.price && (
                          <p style={{ fontSize: '13px', fontWeight: 'bold', color: accentColor, marginTop: '4px' }}>
                            EUR {item.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id);
                        }}
                        style={{ padding: '16px', background: 'none', border: 'none' }}
                      >
                        <Heart
                          size={20}
                          fill={item.isFavorite ? accentColor : 'none'}
                          stroke={item.isFavorite ? accentColor : 'white'}
                        />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div style={{ textAlign: 'center', paddingTop: '32px' }}>
            <div
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                backgroundColor: accentColor,
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <User size={48} style={{ color: primaryColor }} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>VinylScout User</h2>
            <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px' }}>Vinyl collector</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', maxWidth: '300px', margin: '0 auto' }}>
              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: primaryColor }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: accentColor }}>
                  {collection.length}
                </p>
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>Collection</p>
              </div>
              <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: primaryColor }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: accentColor }}>
                  {collection.filter(item => item.isFavorite).length}
                </p>
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>Favorites</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation - WORKING VERSION FROM PREVIOUS CHAT */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: primaryColor,
        borderTop: `1px solid rgba(255, 255, 255, 0.1)`,
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px 0',
        zIndex: 1000
      }}>
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
            <tab.icon size={22} style={{ color: activeTab === tab.id ? accentColor : '#666' }} />
            <span style={{ fontSize: '10px', color: activeTab === tab.id ? accentColor : '#666', whiteSpace: 'nowrap' }}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div
          onClick={() => setShowSettings(false)}
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
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: primaryColor,
              borderRadius: '12px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{
              position: 'sticky',
              top: 0,
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: `1px solid ${accentColor}`,
              backgroundColor: primaryColor
            }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '18px', margin: 0 }}>Settings</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', padding: 0 }}>
                <X size={24} style={{ color: accentColor }} />
              </button>
            </div>

            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  Discogs API Token
                </label>
                <input
                  type="password"
                  value={discogsToken}
                  onChange={(e) => setDiscogsToken(e.target.value)}
                  placeholder="Enter token"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: '#1f2937',
                    color: 'white',
                    border: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  Primary Color
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{ width: '60px', height: '40px', borderRadius: '8px' }}
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: '#1f2937',
                      color: 'white',
                      border: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                  Accent Color
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    style={{ width: '60px', height: '40px', borderRadius: '8px' }}
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px',
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
                  backgroundColor: accentColor,
                  color: primaryColor,
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedResult && (
        <div
          onClick={() => setSelectedResult(null)}
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
            padding: '16px',
            overflowY: 'auto'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: primaryColor,
              borderRadius: '12px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{
              position: 'sticky',
              top: 0,
              padding: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: `1px solid ${accentColor}`,
              backgroundColor: primaryColor
            }}>
              <h3 style={{ fontWeight: 'bold', margin: 0 }}>Album Details</h3>
              <button onClick={() => setSelectedResult(null)} style={{ background: 'none', border: 'none', padding: 0 }}>
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
                {selectedResult.title?.split(' - ')[0] || 'Unknown'}
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
                      {selectedResult.num_for_sale} available
                    </p>
                  )}
                </div>
              )}

              {collection.find(c => c.id === selectedResult.id) && (
                <button
                  onClick={() => toggleFavorite(selectedResult.id)}
                  style={{
                    width: '100%',
                    marginBottom: '8px',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: collection.find(c => c.id === selectedResult.id)?.isFavorite ? accentColor : primaryColor,
                    color: collection.find(c => c.id === selectedResult.id)?.isFavorite ? primaryColor : accentColor,
                    border: `2px solid ${accentColor}`,
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Heart size={20} fill={collection.find(c => c.id === selectedResult.id)?.isFavorite ? primaryColor : 'none'} />
                  {collection.find(c => c.id === selectedResult.id)?.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </button>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                {!collection.find(c => c.id === selectedResult.id) ? (
                  <button
                    onClick={() => addToCollection(selectedResult)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: accentColor,
                      color: primaryColor,
                      border: 'none',
                      fontWeight: '600'
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
                      backgroundColor: primaryColor,
                      color: accentColor,
                      border: `2px solid ${accentColor}`,
                      fontWeight: '600'
                    }}
                  >
                    Remove
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
      )}
    </div>
  );
};

export default VinylPriceFinder;