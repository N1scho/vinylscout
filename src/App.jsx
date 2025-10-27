import React, { useState, useEffect, useRef } from 'react';
import { Search, Camera, Music, User, Settings, X, ExternalLink, Grid, List, Heart, ChevronDown, BarChart3, Palette } from 'lucide-react';

const VinylPriceFinder = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showRGBEditor, setShowRGBEditor] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [collection, setCollection] = useState([]);
  const [sortBy, setSortBy] = useState('artist');
  const [collectionView, setCollectionView] = useState('gallery');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [resultsPage, setResultsPage] = useState(1);
  
  const [advancedFilters, setAdvancedFilters] = useState({
    artist: '', album: '', year: '', label: '', catno: '', barcode: ''
  });
  
  const [rgbColors, setRgbColors] = useState({
    primary: { r: 0, g: 0, b: 0 },
    accent: { r: 255, g: 183, b: 0 },
    text: { r: 255, g: 255, b: 255 }
  });
  
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [discogsToken, setDiscogsToken] = useState('');
  const [selectedShops, setSelectedShops] = useState(['discogs', 'hhv', 'ebay']);
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [accentColor, setAccentColor] = useState('#ffb700');
  const [textColor, setTextColor] = useState('#ffffff');

  const themes = [
    { name: 'Dark Orange', primary: '#000000', accent: '#ffb700', text: '#ffffff' },
    { name: 'Spotify', primary: '#121212', accent: '#1DB954', text: '#ffffff' },
    { name: 'Vintage Vinyl', primary: '#2c1810', accent: '#d4af37', text: '#f5f5dc' },
    { name: 'Minimal Light', primary: '#f5f5f5', accent: '#333333', text: '#000000' },
    { name: 'Sunset', primary: '#1a0b2e', accent: '#ff6b35', text: '#ffeaa7' },
    { name: 'Forest', primary: '#1b4332', accent: '#52b788', text: '#d8f3dc' },
    { name: 'Ocean Blue', primary: '#03045e', accent: '#00b4d8', text: '#caf0f8' },
    { name: 'Neon Nights', primary: '#0a0e27', accent: '#ff006e', text: '#06ffa5' },
    { name: 'Gold Luxe', primary: '#1c1917', accent: '#fbbf24', text: '#fef3c7' },
    { name: 'Cherry Pop', primary: '#450920', accent: '#ff1654', text: '#ffd6e0' },
    { name: 'Purple Haze', primary: '#2b124c', accent: '#a84fdb', text: '#e4c1f9' }
  ];

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('vinylScoutSettings');
      if (savedSettings) {
        const s = JSON.parse(savedSettings);
        setDiscogsToken(s.discogsToken || '');
        setSelectedShops(s.selectedShops || ['discogs', 'hhv', 'ebay']);
        setPrimaryColor(s.primaryColor || '#000000');
        setAccentColor(s.accentColor || '#ffb700');
        setTextColor(s.textColor || '#ffffff');
      }
      
      const savedCollection = localStorage.getItem('vinylScoutCollection');
      if (savedCollection) {
        const c = JSON.parse(savedCollection);
        if (Array.isArray(c)) {
          setCollection(c.map(item => ({ ...item, isFavorite: item.isFavorite || false })));
          console.log('✅ Loaded:', c.length, 'items');
        }
      }
      
      const savedView = localStorage.getItem('vinylScoutCollectionView');
      if (savedView) setCollectionView(savedView);
    } catch (e) {
      console.error('Load error:', e);
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('vinylScoutSettings', JSON.stringify({ 
      discogsToken, selectedShops, primaryColor, accentColor, textColor
    }));
    setShowSettings(false);
    alert('Settings saved!');
  };

  const applyTheme = (theme) => {
    setPrimaryColor(theme.primary);
    setAccentColor(theme.accent);
    setTextColor(theme.text);
    setShowThemes(false);
  };

  const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, x)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const applyRGBTheme = () => {
    setPrimaryColor(rgbToHex(rgbColors.primary.r, rgbColors.primary.g, rgbColors.primary.b));
    setAccentColor(rgbToHex(rgbColors.accent.r, rgbColors.accent.g, rgbColors.accent.b));
    setTextColor(rgbToHex(rgbColors.text.r, rgbColors.text.g, rgbColors.text.b));
    setShowRGBEditor(false);
  };

  const getStatistics = () => {
    if (collection.length === 0) return null;
    
    const withPrices = collection.filter(item => item.price);
    const prices = withPrices.map(item => item.price);
    
    const mostExpensive = withPrices.length > 0 
      ? withPrices.reduce((max, item) => item.price > max.price ? item : max)
      : null;
    
    const cheapest = withPrices.length > 0
      ? withPrices.reduce((min, item) => item.price < min.price ? item : min)
      : null;
    
    const avgPrice = prices.length > 0
      ? (prices.reduce((sum, p) => sum + p, 0) / prices.length).toFixed(2)
      : 0;
    
    const artists = {};
    collection.forEach(item => {
      const artist = item.title?.split(' - ')[0] || 'Unknown';
      artists[artist] = (artists[artist] || 0) + 1;
    });
    const topArtist = Object.entries(artists).sort((a, b) => b[1] - a[1])[0];
    
    const genres = {};
    collection.forEach(item => {
      if (item.genre && Array.isArray(item.genre)) {
        item.genre.forEach(g => {
          genres[g] = (genres[g] || 0) + 1;
        });
      }
    });
    const topGenres = Object.entries(genres).sort((a, b) => b[1] - a[1]).slice(0, 5);
    
    const decades = {};
    collection.forEach(item => {
      if (item.year) {
        const decade = Math.floor(item.year / 10) * 10;
        decades[decade] = (decades[decade] || 0) + 1;
      }
    });
    const decadesList = Object.entries(decades).sort((a, b) => a[0] - b[0]);
    
    return { mostExpensive, cheapest, avgPrice, topArtist, topGenres, decadesList };
  };

  const toggleShop = (shopId) => {
    setSelectedShops(prev =>
      prev.includes(shopId) ? prev.filter(id => id !== shopId) : [...prev, shopId]
    );
  };

  const searchDiscogs = async (page = 1) => {
    if (!discogsToken) {
      alert('Please add Discogs token in settings');
      return;
    }

    let query = searchQuery.trim();
    
    if (showAdvancedSearch) {
      const parts = [];
      if (advancedFilters.artist) parts.push(`artist:"${advancedFilters.artist}"`);
      if (advancedFilters.album) parts.push(`release_title:"${advancedFilters.album}"`);
      if (advancedFilters.year) parts.push(`year:${advancedFilters.year}`);
      if (advancedFilters.label) parts.push(`label:"${advancedFilters.label}"`);
      if (advancedFilters.catno) parts.push(`catno:${advancedFilters.catno}`);
      if (advancedFilters.barcode) parts.push(`barcode:${advancedFilters.barcode}`);
      query = parts.join(' ');
    }

    if (!query) {
      alert('Please enter search query');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release&per_page=10&page=${page}`,
        { headers: { 'Authorization': `Discogs token=${discogsToken}`, 'User-Agent': 'VinylScout/1.0' }}
      );

      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      
      const resultsWithPrices = await Promise.all(
        data.results.map(async (result) => {
          try {
            const priceRes = await fetch(
              `https://api.discogs.com/marketplace/stats/${result.id}`,
              { headers: { 'Authorization': `Discogs token=${discogsToken}`, 'User-Agent': 'VinylScout/1.0' }}
            );
            
            if (priceRes.ok) {
              const priceData = await priceRes.json();
              return {
                ...result,
                price: priceData.lowest_price?.value || null,
                currency: priceData.lowest_price?.currency || 'EUR',
                num_for_sale: priceData.num_for_sale || 0
              };
            }
          } catch (e) {}
          return result;
        })
      );

      if (page === 1) {
        setSearchResults(resultsWithPrices);
      } else {
        setSearchResults(prev => [...prev, ...resultsWithPrices]);
      }
      setResultsPage(page);
    } catch (e) {
      alert('Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }});
      setCameraStream(stream);
      setShowCamera(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch (e) {
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
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      alert('Photo captured! Use search for best results.');
      stopCamera();
    }
  };

  const addToCollection = (item) => {
    if (!collection.find(c => c.id === item.id)) {
      const newCol = [...collection, { ...item, isFavorite: false }];
      setCollection(newCol);
      localStorage.setItem('vinylScoutCollection', JSON.stringify(newCol));
      alert('Added to collection!');
    }
  };

  const removeFromCollection = (id) => {
    const newCol = collection.filter(i => i.id !== id);
    setCollection(newCol);
    localStorage.setItem('vinylScoutCollection', JSON.stringify(newCol));
  };

  const toggleFavorite = (id) => {
    const newCol = collection.map(i => i.id === id ? { ...i, isFavorite: !i.isFavorite } : i);
    setCollection(newCol);
    localStorage.setItem('vinylScoutCollection', JSON.stringify(newCol));
  };

  const toggleCollectionView = () => {
    const newView = collectionView === 'gallery' ? 'list' : 'gallery';
    setCollectionView(newView);
    localStorage.setItem('vinylScoutCollectionView', newView);
  };

  const getSortedCollection = () => {
    let filtered = showFavoritesOnly ? collection.filter(i => i.isFavorite) : collection;
    return [...filtered].sort((a, b) => {
      if (sortBy === 'artist') return (a.title?.split(' - ')[0] || '').localeCompare(b.title?.split(' - ')[0] || '');
      if (sortBy === 'title') return (a.title?.split(' - ')[1] || a.title || '').localeCompare(b.title?.split(' - ')[1] || b.title || '');
      if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
      return 0;
    });
  };

  const stats = getStatistics();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#1a1a1a', color: textColor, fontFamily: 'system-ui' }}>
      {/* Header */}
      <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: primaryColor, borderBottom: '1px solid #333' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: accentColor, margin: 0 }}>VinylScout</h1>
        <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <Settings size={24} style={{ color: accentColor }} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '100px' }}>
        {/* SEARCH TAB */}
        {activeTab === 'search' && (
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchDiscogs(1)}
              placeholder="Search artist or album..."
              style={{ width: '100%', padding: '12px', marginBottom: '8px', borderRadius: '8px', backgroundColor: primaryColor, color: textColor, border: `2px solid ${accentColor}` }}
            />
            
            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '8px', backgroundColor: primaryColor, color: accentColor, border: `1px solid ${accentColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              Advanced Search <ChevronDown size={16} style={{ transform: showAdvancedSearch ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {showAdvancedSearch && (
              <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: primaryColor, borderRadius: '8px' }}>
                <input type="text" placeholder="Artist" value={advancedFilters.artist} onChange={(e) => setAdvancedFilters({...advancedFilters, artist: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', backgroundColor: '#1f2937', color: textColor, border: 'none' }} />
                <input type="text" placeholder="Album" value={advancedFilters.album} onChange={(e) => setAdvancedFilters({...advancedFilters, album: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', backgroundColor: '#1f2937', color: textColor, border: 'none' }} />
                <input type="text" placeholder="Year" value={advancedFilters.year} onChange={(e) => setAdvancedFilters({...advancedFilters, year: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', backgroundColor: '#1f2937', color: textColor, border: 'none' }} />
                <input type="text" placeholder="Label" value={advancedFilters.label} onChange={(e) => setAdvancedFilters({...advancedFilters, label: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', backgroundColor: '#1f2937', color: textColor, border: 'none' }} />
                <input type="text" placeholder="Catalog #" value={advancedFilters.catno} onChange={(e) => setAdvancedFilters({...advancedFilters, catno: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', backgroundColor: '#1f2937', color: textColor, border: 'none' }} />
                <input type="text" placeholder="Barcode" value={advancedFilters.barcode} onChange={(e) => setAdvancedFilters({...advancedFilters, barcode: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#1f2937', color: textColor, border: 'none' }} />
              </div>
            )}

            <button onClick={() => searchDiscogs(1)} disabled={isLoading} style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: accentColor, color: primaryColor, border: 'none', fontWeight: '600', cursor: 'pointer', marginBottom: '16px' }}>
              {isLoading ? 'Searching...' : 'Search'}
            </button>

            <div>
              {searchResults.map((r) => (
                <div key={r.id} onClick={() => setSelectedResult(r)} style={{ display: 'flex', gap: '12px', padding: '12px', marginBottom: '8px', backgroundColor: primaryColor, borderRadius: '8px', cursor: 'pointer' }}>
                  <img src={r.cover_image || r.thumb || '/api/placeholder/80/80'} style={{ width: '80px', height: '80px', borderRadius: '4px', objectFit: 'cover' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{r.title?.split(' - ')[0] || 'Unknown'}</p>
                    <p style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>{r.title?.split(' - ')[1] || r.title}</p>
                    {r.year && <p style={{ fontSize: '11px', color: '#666' }}>{r.year}</p>}
                    {r.label && r.label[0] && <p style={{ fontSize: '11px', color: '#666' }}>Label: {r.label[0]}</p>}
                    {r.catno && <p style={{ fontSize: '11px', color: '#666' }}>Cat#: {r.catno}</p>}
                    {r.price && <p style={{ fontSize: '14px', fontWeight: 'bold', color: accentColor, marginTop: '4px' }}>EUR {r.price.toFixed(2)}</p>}
                  </div>
                </div>
              ))}
              
              {searchResults.length > 0 && searchResults.length % 10 === 0 && (
                <button
                  onClick={() => searchDiscogs(resultsPage + 1)}
                  disabled={isLoading}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: primaryColor, color: accentColor, border: `1px solid ${accentColor}`, fontWeight: '600', cursor: 'pointer' }}
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* CAMERA TAB */}
        {activeTab === 'camera' && (
          <div>
            {!showCamera ? (
              <div style={{ textAlign: 'center', paddingTop: '60px' }}>
                <Camera size={64} style={{ color: accentColor, marginBottom: '16px' }} />
                <p style={{ color: '#999', marginBottom: '24px' }}>Take a photo of the album cover</p>
                <button onClick={startCamera} style={{ padding: '12px 24px', borderRadius: '8px', backgroundColor: accentColor, color: primaryColor, border: 'none', fontWeight: '600', cursor: 'pointer' }}>
                  Start Camera
                </button>
              </div>
            ) : (
              <div>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: '8px', marginBottom: '12px' }} />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={capturePhoto} style={{ flex: 1, padding: '12px', borderRadius: '8px', backgroundColor: accentColor, color: primaryColor, border: 'none', fontWeight: '600' }}>Capture</button>
                  <button onClick={stopCamera} style={{ flex: 1, padding: '12px', borderRadius: '8px', backgroundColor: primaryColor, color: accentColor, border: `2px solid ${accentColor}`, fontWeight: '600' }}>Cancel</button>
                </div>
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>
            )}
          </div>
        )}

        {/* COLLECTION TAB */}
        {activeTab === 'collection' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '8px', backgroundColor: primaryColor, color: textColor, border: `1px solid ${accentColor}`, fontSize: '13px' }}>
                <option value="artist">Artist A-Z</option>
                <option value="title">Title A-Z</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
              
              <button onClick={toggleCollectionView} style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: primaryColor, color: accentColor, border: `1px solid ${accentColor}`, cursor: 'pointer' }}>
                {collectionView === 'gallery' ? <List size={18} /> : <Grid size={18} />}
              </button>

              <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: showFavoritesOnly ? accentColor : primaryColor, color: showFavoritesOnly ? primaryColor : accentColor, border: `1px solid ${accentColor}`, cursor: 'pointer' }}>
                <Heart size={18} fill={showFavoritesOnly ? primaryColor : 'none'} />
              </button>
            </div>

            {collection.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: '60px', color: '#666' }}>
                <Music size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>No records in collection yet</p>
              </div>
            ) : collectionView === 'gallery' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {getSortedCollection().map((item) => (
                  <div key={item.id} onClick={() => setSelectedResult(item)} style={{ backgroundColor: primaryColor, borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', backgroundColor: '#1f2937' }}>
                      <img src={item.cover_image || item.thumb || '/api/placeholder/300/300'} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }} style={{ position: 'absolute', top: '8px', right: '8px', padding: '6px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.7)', border: 'none' }}>
                        <Heart size={16} fill={item.isFavorite ? accentColor : 'none'} stroke={item.isFavorite ? accentColor : 'white'} />
                      </button>
                    </div>
                    <div style={{ padding: '8px' }}>
                      <p style={{ fontWeight: '600', fontSize: '12px', marginBottom: '2px' }}>{item.title?.split(' - ')[0] || 'Unknown'}</p>
                      <p style={{ fontSize: '11px', color: '#999' }}>{item.title?.split(' - ')[1] || item.title}</p>
                      {item.price && <p style={{ fontSize: '12px', fontWeight: 'bold', color: accentColor, marginTop: '4px' }}>EUR {item.price.toFixed(2)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {getSortedCollection().map((item) => (
                  <div key={item.id} onClick={() => setSelectedResult(item)} style={{ backgroundColor: primaryColor, borderRadius: '8px', display: 'flex', cursor: 'pointer' }}>
                    <img src={item.cover_image || item.thumb || '/api/placeholder/80/80'} style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, padding: '12px', minWidth: 0 }}>
                      <p style={{ fontWeight: '600', fontSize: '13px' }}>{item.title?.split(' - ')[0] || 'Unknown'}</p>
                      <p style={{ fontSize: '11px', color: '#999' }}>{item.title?.split(' - ')[1] || item.title}</p>
                      {item.price && <p style={{ fontSize: '13px', fontWeight: 'bold', color: accentColor, marginTop: '4px' }}>EUR {item.price.toFixed(2)}</p>}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }} style={{ padding: '16px', background: 'none', border: 'none' }}>
                      <Heart size={20} fill={item.isFavorite ? accentColor : 'none'} stroke={item.isFavorite ? accentColor : 'white'} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div style={{ textAlign: 'center', paddingTop: '32px' }}>
            <div style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: accentColor, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={48} style={{ color: primaryColor }} />
            </div>
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>VinylScout User</h2>
            <p style={{ color: '#999', marginBottom: '16px' }}>Vinyl collector</p>
            
            {collection.length > 0 && (
              <button
                onClick={() => setShowStats(true)}
                style={{ padding: '10px 20px', marginBottom: '24px', borderRadius: '8px', backgroundColor: accentColor, color: primaryColor, border: 'none', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <BarChart3 size={20} />
                View Statistics
              </button>
            )}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '300px', margin: '0 auto' }}>
              <div style={{ padding: '16px', backgroundColor: primaryColor, borderRadius: '8px' }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: accentColor }}>{collection.length}</p>
                <p style={{ fontSize: '12px', color: '#999' }}>Collection</p>
              </div>
              <div style={{ padding: '16px', backgroundColor: primaryColor, borderRadius: '8px' }}>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: accentColor }}>{collection.filter(i => i.isFavorite).length}</p>
                <p style={{ fontSize: '12px', color: '#999' }}>Favorites</p>
              </div>
              {stats && stats.mostExpensive && (
                <div style={{ padding: '16px', backgroundColor: primaryColor, borderRadius: '8px' }}>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: accentColor }}>€{stats.mostExpensive.price.toFixed(0)}</p>
                  <p style={{ fontSize: '12px', color: '#999' }}>Most Expensive</p>
                </div>
              )}
              {stats && stats.avgPrice > 0 && (
                <div style={{ padding: '16px', backgroundColor: primaryColor, borderRadius: '8px' }}>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: accentColor }}>€{stats.avgPrice}</p>
                  <p style={{ fontSize: '12px', color: '#999' }}>Avg Price</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '70px', backgroundColor: primaryColor, borderTop: '1px solid #333', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0 8px', zIndex: 1000 }}>
        <button onClick={() => setActiveTab('search')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', padding: '8px', color: activeTab === 'search' ? accentColor : '#666', cursor: 'pointer' }}>
          <Search size={20} />
          <span style={{ fontSize: '10px' }}>Search</span>
        </button>
        <button onClick={() => setActiveTab('camera')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', padding: '8px', color: activeTab === 'camera' ? accentColor : '#666', cursor: 'pointer' }}>
          <Camera size={20} />
          <span style={{ fontSize: '10px' }}>Camera</span>
        </button>
        <button onClick={() => setActiveTab('collection')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', padding: '8px', color: activeTab === 'collection' ? accentColor : '#666', cursor: 'pointer' }}>
          <Music size={20} />
          <span style={{ fontSize: '10px' }}>Collection</span>
        </button>
        <button onClick={() => setActiveTab('profile')} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', padding: '8px', color: activeTab === 'profile' ? accentColor : '#666', cursor: 'pointer' }}>
          <User size={20} />
          <span style={{ fontSize: '10px' }}>Profile</span>
        </button>
      </nav>

      {/* STATISTICS MODAL */}
      {showStats && stats && (
        <div onClick={() => setShowStats(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: primaryColor, borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: primaryColor, zIndex: 10 }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={24} style={{ color: accentColor }} />
                Collection Statistics
              </h3>
              <button onClick={() => setShowStats(false)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <X size={24} style={{ color: accentColor }} />
              </button>
            </div>
            
            <div style={{ padding: '16px' }}>
              {stats.mostExpensive && (
                <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#1f2937', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '14px', color: '#999', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Most Expensive</h4>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <img src={stats.mostExpensive.cover_image || stats.mostExpensive.thumb || '/api/placeholder/80/80'} style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{stats.mostExpensive.title?.split(' - ')[0]}</p>
                      <p style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>{stats.mostExpensive.title?.split(' - ')[1]}</p>
                      <p style={{ fontSize: '20px', fontWeight: 'bold', color: accentColor }}>EUR {stats.mostExpensive.price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {stats.cheapest && (
                <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#1f2937', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '14px', color: '#999', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Cheapest</h4>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <img src={stats.cheapest.cover_image || stats.cheapest.thumb || '/api/placeholder/80/80'} style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{stats.cheapest.title?.split(' - ')[0]}</p>
                      <p style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>{stats.cheapest.title?.split(' - ')[1]}</p>
                      <p style={{ fontSize: '20px', fontWeight: 'bold', color: accentColor }}>EUR {stats.cheapest.price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {stats.avgPrice > 0 && (
                <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#1f2937', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '14px', color: '#999', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Average Price</h4>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', color: accentColor }}>EUR {stats.avgPrice}</p>
                </div>
              )}

              {stats.topArtist && (
                <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#1f2937', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '14px', color: '#999', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Top Artist</h4>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>{stats.topArtist[0]}</p>
                  <p style={{ fontSize: '14px', color: '#999' }}>{stats.topArtist[1]} albums</p>
                </div>
              )}

              {stats.topGenres && stats.topGenres.length > 0 && (
                <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#1f2937', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '14px', color: '#999', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Top Genres</h4>
                  {stats.topGenres.map(([genre, count], idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px' }}>{genre}</span>
                      <span style={{ fontSize: '14px', color: accentColor, fontWeight: '600' }}>{count}</span>
                    </div>
                  ))}
                </div>
              )}

              {stats.decadesList && stats.decadesList.length > 0 && (
                <div style={{ padding: '16px', backgroundColor: '#1f2937', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '14px', color: '#999', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Records by Decade</h4>
                  {stats.decadesList.map(([decade, count]) => (
                    <div key={decade} style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px' }}>{decade}s</span>
                        <span style={{ fontSize: '14px', color: accentColor, fontWeight: '600' }}>{count}</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: '#333', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', backgroundColor: accentColor, width: `${(count / collection.length) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div onClick={() => setShowSettings(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: primaryColor, borderRadius: '12px', width: '100%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Settings</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <X size={24} style={{ color: accentColor }} />
              </button>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px' }}>Discogs Token</label>
                <input type="password" value={discogsToken} onChange={(e) => setDiscogsToken(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#1f2937', color: textColor, border: 'none' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px' }}>Price Sources</label>
                {[{id: 'discogs', name: 'Discogs'}, {id: 'hhv', name: 'HHV'}, {id: 'ebay', name: 'eBay'}].map(shop => (
                  <label key={shop.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input type="checkbox" checked={selectedShops.includes(shop.id)} onChange={() => toggleShop(shop.id)} style={{ width: '18px', height: '18px' }} />
                    <span>{shop.name}</span>
                  </label>
                ))}
              </div>
              
              <button onClick={() => setShowThemes(true)} style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', backgroundColor: accentColor, color: primaryColor, border: 'none', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Palette size={20} />
                Choose Theme
              </button>
              
              <button onClick={saveSettings} style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: accentColor, color: primaryColor, border: 'none', fontWeight: '600', cursor: 'pointer' }}>
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THEMES MODAL */}
      {showThemes && (
        <div onClick={() => setShowThemes(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: primaryColor, borderRadius: '12px', width: '100%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Themes</h3>
              <button onClick={() => setShowThemes(false)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <X size={24} style={{ color: accentColor }} />
              </button>
            </div>
            <div style={{ padding: '16px' }}>
              <button onClick={() => { setShowRGBEditor(true); setShowThemes(false); }} style={{ width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '8px', backgroundColor: accentColor, color: primaryColor, border: 'none', fontWeight: '600', cursor: 'pointer' }}>
                Custom RGB Editor
              </button>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {themes.map((theme, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyTheme(theme)}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      border: `2px solid ${theme.accent}`,
                      backgroundColor: theme.primary,
                      color: theme.text,
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontWeight: '600',
                      fontSize: '13px'
                    }}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RGB EDITOR MODAL */}
      {showRGBEditor && (
        <div onClick={() => setShowRGBEditor(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: primaryColor, borderRadius: '12px', width: '100%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>RGB Editor</h3>
              <button onClick={() => setShowRGBEditor(false)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <X size={24} style={{ color: accentColor }} />
              </button>
            </div>
            <div style={{ padding: '16px' }}>
              {['primary', 'accent', 'text'].map((colorType) => (
                <div key={colorType} style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '14px', marginBottom: '12px', textTransform: 'capitalize' }}>{colorType} Color</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ width: '60px', fontSize: '12px' }}>Red:</span>
                    <input type="range" min="0" max="255" value={rgbColors[colorType].r} onChange={(e) => setRgbColors({...rgbColors, [colorType]: {...rgbColors[colorType], r: parseInt(e.target.value)}})} style={{ flex: 1 }} />
                    <span style={{ width: '40px', fontSize: '12px', textAlign: 'right' }}>{rgbColors[colorType].r}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ width: '60px', fontSize: '12px' }}>Green:</span>
                    <input type="range" min="0" max="255" value={rgbColors[colorType].g} onChange={(e) => setRgbColors({...rgbColors, [colorType]: {...rgbColors[colorType], g: parseInt(e.target.value)}})} style={{ flex: 1 }} />
                    <span style={{ width: '40px', fontSize: '12px', textAlign: 'right' }}>{rgbColors[colorType].g}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ width: '60px', fontSize: '12px' }}>Blue:</span>
                    <input type="range" min="0" max="255" value={rgbColors[colorType].b} onChange={(e) => setRgbColors({...rgbColors, [colorType]: {...rgbColors[colorType], b: parseInt(e.target.value)}})} style={{ flex: 1 }} />
                    <span style={{ width: '40px', fontSize: '12px', textAlign: 'right' }}>{rgbColors[colorType].b}</span>
                  </div>
                  <div style={{ height: '40px', borderRadius: '8px', backgroundColor: rgbToHex(rgbColors[colorType].r, rgbColors[colorType].g, rgbColors[colorType].b), border: '2px solid #333' }} />
                </div>
              ))}
              <button onClick={applyRGBTheme} style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: accentColor, color: primaryColor, border: 'none', fontWeight: '600', cursor: 'pointer' }}>
                Apply Custom Theme
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedResult && (
        <div onClick={() => setSelectedResult(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: primaryColor, borderRadius: '12px', width: '100%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Album Details</h3>
              <button onClick={() => setSelectedResult(null)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <X size={24} style={{ color: accentColor }} />
              </button>
            </div>
            <div style={{ padding: '16px' }}>
              <img src={selectedResult.cover_image || selectedResult.thumb || '/api/placeholder/400/400'} style={{ width: '100%', borderRadius: '8px', marginBottom: '16px' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>{selectedResult.title?.split(' - ')[0] || 'Unknown'}</h2>
              <p style={{ color: '#999', marginBottom: '16px' }}>{selectedResult.title?.split(' - ')[1] || selectedResult.title}</p>
              {selectedResult.year && <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Year: {selectedResult.year}</p>}
              {selectedResult.label && selectedResult.label[0] && <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Label: {selectedResult.label[0]}</p>}
              {selectedResult.catno && <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Catalog: {selectedResult.catno}</p>}
              {selectedResult.barcode && selectedResult.barcode[0] && <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Barcode: {selectedResult.barcode[0]}</p>}
              {selectedResult.genre && selectedResult.genre.length > 0 && (
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                  Genres: {selectedResult.genre.join(', ')}
                </p>
              )}
              {selectedResult.price && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: accentColor }}>EUR {selectedResult.price.toFixed(2)}</p>
                  {selectedResult.num_for_sale > 0 && <p style={{ fontSize: '12px', color: '#999' }}>{selectedResult.num_for_sale} available</p>}
                </div>
              )}
              {collection.find(c => c.id === selectedResult.id) && (
                <button onClick={() => toggleFavorite(selectedResult.id)} style={{ width: '100%', marginBottom: '8px', padding: '12px', borderRadius: '8px', backgroundColor: collection.find(c => c.id === selectedResult.id)?.isFavorite ? accentColor : primaryColor, color: collection.find(c => c.id === selectedResult.id)?.isFavorite ? primaryColor : accentColor, border: `2px solid ${accentColor}`, fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Heart size={20} fill={collection.find(c => c.id === selectedResult.id)?.isFavorite ? primaryColor : 'none'} />
                  {collection.find(c => c.id === selectedResult.id)?.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </button>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                {!collection.find(c => c.id === selectedResult.id) ? (
                  <button onClick={() => addToCollection(selectedResult)} style={{ flex: 1, padding: '12px', borderRadius: '8px', backgroundColor: accentColor, color: primaryColor, border: 'none', fontWeight: '600' }}>
                    Add to Collection
                  </button>
                ) : (
                  <button onClick={() => removeFromCollection(selectedResult.id)} style={{ flex: 1, padding: '12px', borderRadius: '8px', backgroundColor: primaryColor, color: accentColor, border: `2px solid ${accentColor}`, fontWeight: '600' }}>
                    Remove
                  </button>
                )}
                {selectedResult.uri && (
                  <a href={`https://www.discogs.com${selectedResult.uri}`} target="_blank" rel="noopener noreferrer" style={{ padding: '12px 16px', borderRadius: '8px', border: `2px solid ${accentColor}`, color: accentColor, display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
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