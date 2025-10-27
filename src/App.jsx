import React, { useState, useEffect, useRef } from 'react';
import { Search, Camera, Music, User, Settings, X, ExternalLink, Grid, List, Heart, ChevronDown, BarChart3 } from 'lucide-react';

const VinylPriceFinder = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [collection, setCollection] = useState([]);
  const [sortBy, setSortBy] = useState('artist');
  const [collectionView, setCollectionView] = useState('gallery');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  const [advancedFilters, setAdvancedFilters] = useState({
    artist: '', album: '', year: '', label: '', catno: '', barcode: ''
  });
  
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  
  const [discogsToken, setDiscogsToken] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [accentColor, setAccentColor] = useState('#ffb700');

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('vinylScoutSettings');
      if (savedSettings) {
        const s = JSON.parse(savedSettings);
        setDiscogsToken(s.discogsToken || '');
        setPrimaryColor(s.primaryColor || '#000000');
        setAccentColor(s.accentColor || '#ffb700');
      }
      
      const savedCollection = localStorage.getItem('vinylScoutCollection');
      if (savedCollection) {
        const c = JSON.parse(savedCollection);
        if (Array.isArray(c)) {
          setCollection(c.map(item => ({ ...item, isFavorite: item.isFavorite || false })));
        }
      }
      
      const savedView = localStorage.getItem('vinylScoutCollectionView');
      if (savedView) setCollectionView(savedView);
    } catch (e) {
      console.error('Error:', e);
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('vinylScoutSettings', JSON.stringify({ discogsToken, primaryColor, accentColor }));
    setShowSettings(false);
    alert('Saved!');
  };

  const searchDiscogs = async () => {
    if (!discogsToken || !searchQuery.trim()) {
      alert('Enter search and token');
      return;
    }

    setIsLoading(true);
    try {
      let query = searchQuery.trim();
      if (showAdvancedSearch) {
        const parts = [];
        if (advancedFilters.artist) parts.push(`artist:"${advancedFilters.artist}"`);
        if (advancedFilters.album) parts.push(`release_title:"${advancedFilters.album}"`);
        if (advancedFilters.year) parts.push(`year:${advancedFilters.year}`);
        query = parts.join(' ') || query;
      }

      const res = await fetch(
        `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release&per_page=10`,
        { headers: { 'Authorization': `Discogs token=${discogsToken}`, 'User-Agent': 'VinylScout/1.0' }}
      );

      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      
      const results = await Promise.all(
        data.results.slice(0, 10).map(async (r) => {
          try {
            const pRes = await fetch(
              `https://api.discogs.com/marketplace/stats/${r.id}`,
              { headers: { 'Authorization': `Discogs token=${discogsToken}`, 'User-Agent': 'VinylScout/1.0' }}
            );
            if (pRes.ok) {
              const pData = await pRes.json();
              return { ...r, price: pData.lowest_price?.value || null };
            }
          } catch (e) {}
          return r;
        })
      );

      setSearchResults(results);
    } catch (e) {
      alert('Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const addToCollection = (item) => {
    if (!collection.find(c => c.id === item.id)) {
      const newCol = [...collection, { ...item, isFavorite: false }];
      setCollection(newCol);
      localStorage.setItem('vinylScoutCollection', JSON.stringify(newCol));
      alert('Added!');
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

  const getStats = () => {
    if (collection.length === 0) return null;
    const withPrices = collection.filter(i => i.price);
    const mostExp = withPrices.length > 0 ? withPrices.reduce((max, i) => i.price > max.price ? i : max) : null;
    const cheapest = withPrices.length > 0 ? withPrices.reduce((min, i) => i.price < min.price ? i : min) : null;
    const avgPrice = withPrices.length > 0 ? (withPrices.reduce((sum, i) => sum + i.price, 0) / withPrices.length).toFixed(2) : 0;
    return { mostExp, cheapest, avgPrice };
  };

  const stats = getStats();

  return (
    <div style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1a1a1a',
      color: 'white',
      fontFamily: 'system-ui',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ 
        flexShrink: 0,
        padding: '16px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: primaryColor, 
        borderBottom: '1px solid #333' 
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: accentColor, margin: 0 }}>VinylScout</h1>
        <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <Settings size={24} style={{ color: accentColor }} />
        </button>
      </div>

      {/* Content */}
      <div style={{ 
        flex: 1,
        overflowY: 'auto', 
        padding: '16px',
        paddingBottom: '90px'
      }}>
        {/* SEARCH */}
        {activeTab === 'search' && (
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              style={{ width: '100%', padding: '12px', marginBottom: '8px', borderRadius: '8px', backgroundColor: primaryColor, color: 'white', border: `2px solid ${accentColor}` }}
            />
            
            <button onClick={() => setShowAdvancedSearch(!showAdvancedSearch)} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '8px', backgroundColor: primaryColor, color: accentColor, border: `1px solid ${accentColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
              Advanced <ChevronDown size={16} />
            </button>

            {showAdvancedSearch && (
              <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: primaryColor, borderRadius: '8px' }}>
                {['artist', 'album', 'year', 'label', 'catno', 'barcode'].map(field => (
                  <input key={field} type="text" placeholder={field.charAt(0).toUpperCase() + field.slice(1)} value={advancedFilters[field]} onChange={(e) => setAdvancedFilters({...advancedFilters, [field]: e.target.value})} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '6px', backgroundColor: '#1f2937', color: 'white', border: 'none' }} />
                ))}
              </div>
            )}

            <button onClick={searchDiscogs} disabled={isLoading} style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: accentColor, color: primaryColor, border: 'none', fontWeight: '600', cursor: 'pointer', marginBottom: '16px' }}>
              {isLoading ? 'Searching...' : 'Search'}
            </button>

            {searchResults.map((r) => (
              <div key={r.id} onClick={() => setSelectedResult(r)} style={{ display: 'flex', gap: '12px', padding: '12px', marginBottom: '8px', backgroundColor: primaryColor, borderRadius: '8px', cursor: 'pointer' }}>
                <img src={r.cover_image || r.thumb || '/api/placeholder/80/80'} style={{ width: '80px', height: '80px', borderRadius: '4px', objectFit: 'cover' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</p>
                  {r.year && <p style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>Year: {r.year}</p>}
                  {r.label && r.label[0] && <p style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>Label: {r.label[0]}</p>}
                  {r.catno && <p style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>Cat#: {r.catno}</p>}
                  {r.barcode && r.barcode[0] && <p style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Barcode: {r.barcode[0]}</p>}
                  {r.genre && r.genre.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      {r.genre.slice(0, 2).map((g, idx) => (
                        <span key={idx} style={{ fontSize: '9px', padding: '2px 6px', backgroundColor: accentColor, color: primaryColor, borderRadius: '4px', fontWeight: '600' }}>
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                  {r.price && <p style={{ fontSize: '14px', fontWeight: 'bold', color: accentColor, marginTop: '4px' }}>€{r.price.toFixed(2)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CAMERA */}
        {activeTab === 'camera' && (
          <div style={{ textAlign: 'center', paddingTop: '60px' }}>
            <Camera size={64} style={{ color: accentColor, marginBottom: '16px' }} />
            <p style={{ color: '#999' }}>Camera feature</p>
          </div>
        )}

        {/* COLLECTION */}
        {activeTab === 'collection' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '8px', backgroundColor: primaryColor, color: 'white', border: `1px solid ${accentColor}` }}>
                <option value="artist">Artist A-Z</option>
                <option value="title">Title A-Z</option>
                <option value="price-asc">Price: Low→High</option>
                <option value="price-desc">Price: High→Low</option>
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
                <p>No records yet</p>
              </div>
            ) : collectionView === 'gallery' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {getSortedCollection().map((item) => (
                  <div key={item.id} onClick={() => setSelectedResult(item)} style={{ backgroundColor: primaryColor, borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{ position: 'relative', width: '100%', paddingBottom: '100%', backgroundColor: '#1f2937' }}>
                      <img src={item.thumb || '/api/placeholder/200/200'} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }} style={{ position: 'absolute', top: '8px', right: '8px', padding: '6px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer' }}>
                        <Heart size={16} fill={item.isFavorite ? accentColor : 'none'} stroke={item.isFavorite ? accentColor : 'white'} />
                      </button>
                    </div>
                    <div style={{ padding: '8px' }}>
                      <p style={{ fontWeight: '600', fontSize: '12px' }}>{item.title}</p>
                      {item.price && <p style={{ fontSize: '12px', fontWeight: 'bold', color: accentColor }}>€{item.price.toFixed(2)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {getSortedCollection().map((item) => (
                  <div key={item.id} onClick={() => setSelectedResult(item)} style={{ backgroundColor: primaryColor, borderRadius: '8px', display: 'flex', cursor: 'pointer' }}>
                    <img src={item.thumb || '/api/placeholder/80/80'} style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                    <div style={{ flex: 1, padding: '12px' }}>
                      <p style={{ fontWeight: '600', fontSize: '13px' }}>{item.title}</p>
                      {item.price && <p style={{ fontSize: '13px', fontWeight: 'bold', color: accentColor }}>€{item.price.toFixed(2)}</p>}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }} style={{ padding: '16px', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Heart size={20} fill={item.isFavorite ? accentColor : 'none'} stroke={item.isFavorite ? accentColor : 'white'} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE */}
        {activeTab === 'profile' && (
          <div style={{ textAlign: 'center', paddingTop: '32px' }}>
            <div style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: accentColor, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={48} style={{ color: primaryColor }} />
            </div>
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>VinylScout User</h2>
            <p style={{ color: '#999', marginBottom: '16px' }}>Vinyl collector</p>
            
            {collection.length > 0 && stats && (
              <button onClick={() => setShowStats(true)} style={{ padding: '10px 20px', marginBottom: '24px', borderRadius: '8px', backgroundColor: accentColor, color: primaryColor, border: 'none', fontWeight: '600', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={20} /> Statistics
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
              {stats && stats.mostExp && (
                <>
                  <div style={{ padding: '16px', backgroundColor: primaryColor, borderRadius: '8px' }}>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: accentColor }}>€{stats.mostExp.price.toFixed(0)}</p>
                    <p style={{ fontSize: '12px', color: '#999' }}>Most Expensive</p>
                  </div>
                  <div style={{ padding: '16px', backgroundColor: primaryColor, borderRadius: '8px' }}>
                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: accentColor }}>€{stats.avgPrice}</p>
                    <p style={{ fontSize: '12px', color: '#999' }}>Avg Price</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV - FIXED */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '70px',
        backgroundColor: primaryColor,
        borderTop: `1px solid ${accentColor}`,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 1000
      }}>
        {['search', 'camera', 'collection', 'profile'].map((tab) => {
          const Icon = tab === 'search' ? Search : tab === 'camera' ? Camera : tab === 'collection' ? Music : User;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                padding: '8px',
                color: activeTab === tab ? accentColor : '#666',
                cursor: 'pointer'
              }}
            >
              <Icon size={22} />
              <span style={{ fontSize: '10px', textTransform: 'capitalize' }}>{tab}</span>
            </button>
          );
        })}
      </div>

      {/* STATS MODAL */}
      {showStats && stats && (
        <div onClick={() => setShowStats(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: primaryColor, borderRadius: '12px', width: '100%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', position: 'sticky', top: 0, backgroundColor: primaryColor }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Statistics</h3>
              <button onClick={() => setShowStats(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} style={{ color: accentColor }} />
              </button>
            </div>
            <div style={{ padding: '16px' }}>
              {stats.mostExp && (
                <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#1f2937', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>MOST EXPENSIVE</h4>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <img src={stats.mostExp.thumb || '/api/placeholder/60/60'} style={{ width: '60px', height: '60px', borderRadius: '6px' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '600', fontSize: '13px' }}>{stats.mostExp.title}</p>
                      <p style={{ fontSize: '18px', fontWeight: 'bold', color: accentColor }}>€{stats.mostExp.price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
              {stats.cheapest && (
                <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#1f2937', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>CHEAPEST</h4>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <img src={stats.cheapest.thumb || '/api/placeholder/60/60'} style={{ width: '60px', height: '60px', borderRadius: '6px' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '600', fontSize: '13px' }}>{stats.cheapest.title}</p>
                      <p style={{ fontSize: '18px', fontWeight: 'bold', color: accentColor }}>€{stats.cheapest.price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
              <div style={{ padding: '16px', backgroundColor: '#1f2937', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>AVERAGE PRICE</h4>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: accentColor }}>€{stats.avgPrice}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS */}
      {showSettings && (
        <div onClick={() => setShowSettings(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: primaryColor, borderRadius: '12px', width: '100%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Settings</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} style={{ color: accentColor }} />
              </button>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px' }}>Discogs Token</label>
                <input type="password" value={discogsToken} onChange={(e) => setDiscogsToken(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', backgroundColor: '#1f2937', color: 'white', border: 'none' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px' }}>Colors</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ width: '50px', height: '40px', borderRadius: '8px' }} />
                  <span style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: '#1f2937' }}>Primary</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} style={{ width: '50px', height: '40px', borderRadius: '8px' }} />
                  <span style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: '#1f2937' }}>Accent</span>
                </div>
              </div>
              <button onClick={saveSettings} style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: accentColor, color: primaryColor, border: 'none', fontWeight: '600', cursor: 'pointer' }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedResult && (
        <div onClick={() => setSelectedResult(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: primaryColor, borderRadius: '12px', width: '100%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Details</h3>
              <button onClick={() => setSelectedResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} style={{ color: accentColor }} />
              </button>
            </div>
            <div style={{ padding: '16px' }}>
              <img src={selectedResult.cover_image || selectedResult.thumb || '/api/placeholder/300/300'} style={{ width: '100%', borderRadius: '8px', marginBottom: '16px' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>{selectedResult.title?.split(' - ')[0] || 'Unknown Artist'}</h2>
              <p style={{ fontSize: '16px', color: '#999', marginBottom: '16px' }}>{selectedResult.title?.split(' - ')[1] || selectedResult.title}</p>
              
              {selectedResult.year && <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>📅 Year: {selectedResult.year}</p>}
              {selectedResult.label && selectedResult.label[0] && <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>🏷️ Label: {selectedResult.label[0]}</p>}
              {selectedResult.catno && <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>📋 Catalog: {selectedResult.catno}</p>}
              {selectedResult.barcode && selectedResult.barcode[0] && <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>🔢 Barcode: {selectedResult.barcode[0]}</p>}
              
              {selectedResult.genre && selectedResult.genre.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Genres</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedResult.genre.map((g, idx) => (
                      <span key={idx} style={{ fontSize: '11px', padding: '4px 10px', backgroundColor: accentColor, color: primaryColor, borderRadius: '6px', fontWeight: '600' }}>
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedResult.style && selectedResult.style.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', color: '#999', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Styles</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedResult.style.slice(0, 3).map((s, idx) => (
                      <span key={idx} style={{ fontSize: '10px', padding: '3px 8px', backgroundColor: '#1f2937', color: '#999', borderRadius: '4px' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedResult.price && (
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#1f2937', borderRadius: '8px' }}>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: accentColor }}>€{selectedResult.price.toFixed(2)}</p>
                  {selectedResult.num_for_sale > 0 && <p style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{selectedResult.num_for_sale} available on Discogs</p>}
                </div>
              )}
              {collection.find(c => c.id === selectedResult.id) && (
                <button onClick={() => toggleFavorite(selectedResult.id)} style={{ width: '100%', marginBottom: '8px', padding: '12px', borderRadius: '8px', backgroundColor: collection.find(c => c.id === selectedResult.id)?.isFavorite ? accentColor : primaryColor, color: collection.find(c => c.id === selectedResult.id)?.isFavorite ? primaryColor : accentColor, border: `2px solid ${accentColor}`, fontWeight: '600', cursor: 'pointer' }}>
                  {collection.find(c => c.id === selectedResult.id)?.isFavorite ? '❤️ Favorited' : '🤍 Favorite'}
                </button>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                {!collection.find(c => c.id === selectedResult.id) ? (
                  <button onClick={() => addToCollection(selectedResult)} style={{ flex: 1, padding: '12px', borderRadius: '8px', backgroundColor: accentColor, color: primaryColor, border: 'none', fontWeight: '600', cursor: 'pointer' }}>
                    Add to Collection
                  </button>
                ) : (
                  <button onClick={() => removeFromCollection(selectedResult.id)} style={{ flex: 1, padding: '12px', borderRadius: '8px', backgroundColor: primaryColor, color: accentColor, border: `2px solid ${accentColor}`, fontWeight: '600', cursor: 'pointer' }}>
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