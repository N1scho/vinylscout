import React, { useState, useEffect, useRef } from 'react';
import { Search, Camera, Music, User, Settings, X, ExternalLink, Grid, List, Heart, ChevronDown, RefreshCw, TrendingUp, DollarSign } from 'lucide-react';

const VinylScout = () => {
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [collection, setCollection] = useState([]);
  const [sortBy, setSortBy] = useState('artist');
  const [collectionView, setCollectionView] = useState('gallery');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [isRescanning, setIsRescanning] = useState(false);
  const [rescanProgress, setRescanProgress] = useState({ current: 0, total: 0 });
  
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
  const [selectedShops, setSelectedShops] = useState(['discogs', 'hhv', 'ebay']);
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [accentColor, setAccentColor] = useState('#ffb700');
  const [showValueModal, setShowValueModal] = useState(false);

  // Load saved data
  useEffect(() => {
    try {
      console.log('Loading VinylScout...');
      
      const savedSettings = localStorage.getItem('vinylScoutSettings');
      if (savedSettings) {
        const s = JSON.parse(savedSettings);
        setDiscogsToken(s.discogsToken || '');
        setSelectedShops(s.selectedShops || ['discogs', 'hhv', 'ebay']);
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
      
      console.log('VinylScout loaded successfully');
    } catch (e) {
      console.error('Load error:', e);
      setError(`Failed to load app: ${e.message}`);
    }
  }, []);

  // Save settings
  const saveSettings = () => {
    localStorage.setItem('vinylScoutSettings', JSON.stringify({ 
      discogsToken, selectedShops, primaryColor, accentColor 
    }));
    setShowSettings(false);
    alert('Settings saved!');
  };

  // Search Discogs
  const searchDiscogs = async (query = searchQuery, filters = advancedFilters, page = 1) => {
    if (!query.trim() && !filters.artist && !filters.album) return;
    
    setIsLoading(true);
    setSearchResults([]);
    
    try {
      let searchUrl = `https://api.discogs.com/database/search?`;
      const params = new URLSearchParams();
      
      if (query.trim()) params.append('q', query);
      if (filters.artist) params.append('artist', filters.artist);
      if (filters.album) params.append('release_title', filters.album);
      if (filters.year) params.append('year', filters.year);
      if (filters.label) params.append('label', filters.label);
      if (filters.catno) params.append('catno', filters.catno);
      if (filters.barcode) params.append('barcode', filters.barcode);
      
      params.append('type', 'release');
      params.append('format', 'vinyl');
      params.append('page', page.toString());
      params.append('per_page', '10');
      
      searchUrl += params.toString();
      
      const headers = { 'User-Agent': 'VinylScout/1.0' };
      if (discogsToken) headers['Authorization'] = `Discogs token=${discogsToken}`;
      
      const response = await fetch(searchUrl, { headers });
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setCurrentPage(page);
        setTotalPages(data.pagination?.pages || 1);
        
        const results = data.results.map(r => ({
          id: r.id,
          artist: r.title?.split(' - ')[0] || 'Unknown Artist',
          album: r.title?.split(' - ')[1] || r.title,
          year: r.year || 'N/A',
          label: r.label?.[0] || 'N/A',
          country: r.country || 'N/A',
          format: r.format?.join(', ') || 'Vinyl',
          catno: r.catno || 'N/A',
          genre: r.genre?.[0] || r.style?.[0] || 'N/A',
          cover_image: r.cover_image || r.thumb || '',
          resource_url: r.resource_url,
          price: null // Don't auto-fetch, let user click refresh
        }));
        setSearchResults(results);
      } else {
        alert('No results found');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Check your Discogs token in Settings.');
    }
    
    setIsLoading(false);
  };

  // Get price for an album
  const fetchPrice = async (album) => {
    if (!album.id || !discogsToken) return null;
    
    try {
      const marketUrl = `https://api.discogs.com/marketplace/stats/${album.id}`;
      const response = await fetch(marketUrl, {
        headers: {
          'Authorization': `Discogs token=${discogsToken}`,
          'User-Agent': 'VinylScout/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.lowest_price?.value || null;
      }
    } catch (error) {
      console.error('Price fetch error:', error);
    }
    return null;
  };

  // Refresh price for a single album
  const refreshSinglePrice = async (album) => {
    const price = await fetchPrice(album);
    if (price) {
      const updatedCollection = collection.map(item =>
        item.id === album.id ? { ...item, price: `EUR ${price.toFixed(2)}` } : item
      );
      setCollection(updatedCollection);
      localStorage.setItem('vinylScoutCollection', JSON.stringify(updatedCollection));
      
      // Update selected result if it's open
      if (selectedResult && selectedResult.id === album.id) {
        setSelectedResult({ ...selectedResult, price: `EUR ${price.toFixed(2)}` });
      }
      
      alert(`Price updated: EUR ${price.toFixed(2)}`);
    } else {
      alert('Could not fetch price at this time');
    }
  };

  // Rescan all prices
  const rescanAllPrices = async () => {
    if (!discogsToken) {
      alert('Please set your Discogs token in Settings first');
      return;
    }
    
    if (collection.length === 0) {
      alert('No albums in collection to rescan');
      return;
    }
    
    setIsRescanning(true);
    setRescanProgress({ current: 0, total: collection.length });
    
    const updatedCollection = [...collection];
    let successCount = 0;
    
    for (let i = 0; i < updatedCollection.length; i++) {
      const album = updatedCollection[i];
      setRescanProgress({ current: i + 1, total: collection.length });
      
      const price = await fetchPrice(album);
      if (price) {
        updatedCollection[i].price = `EUR ${price.toFixed(2)}`;
        successCount++;
      }
      
      // Rate limiting: wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setCollection(updatedCollection);
    localStorage.setItem('vinylScoutCollection', JSON.stringify(updatedCollection));
    setIsRescanning(false);
    setRescanProgress({ current: 0, total: 0 });
    
    alert(`Rescanned ${successCount} of ${collection.length} albums`);
  };

  // Add to collection with price
  const addToCollection = async (album) => {
    if (collection.some(item => item.id === album.id)) {
      alert('Album already in collection');
      return;
    }
    
    // Fetch price when adding
    const price = await fetchPrice(album);
    const albumWithPrice = {
      ...album,
      price: price ? `EUR ${price.toFixed(2)}` : 'N/A',
      dateAdded: new Date().toISOString(),
      isFavorite: false
    };
    
    const newCollection = [...collection, albumWithPrice];
    setCollection(newCollection);
    localStorage.setItem('vinylScoutCollection', JSON.stringify(newCollection));
    setSelectedResult(null);
    alert('Added to collection!');
  };

  // Remove from collection
  const removeFromCollection = (id) => {
    if (confirm('Remove this album from your collection?')) {
      const newCollection = collection.filter(item => item.id !== id);
      setCollection(newCollection);
      localStorage.setItem('vinylScoutCollection', JSON.stringify(newCollection));
      setSelectedResult(null);
    }
  };

  // Toggle favorite
  const toggleFavorite = (id) => {
    const newCollection = collection.map(item =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );
    setCollection(newCollection);
    localStorage.setItem('vinylScoutCollection', JSON.stringify(newCollection));
  };

  // Sort collection
  const getSortedCollection = () => {
    let sorted = [...collection];
    
    if (showFavoritesOnly) {
      sorted = sorted.filter(item => item.isFavorite);
    }
    
    switch (sortBy) {
      case 'artist':
        sorted.sort((a, b) => a.artist.localeCompare(b.artist));
        break;
      case 'album':
        sorted.sort((a, b) => a.album.localeCompare(b.album));
        break;
      case 'year':
        sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
      case 'dateAdded':
        sorted.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        break;
      case 'price':
        sorted.sort((a, b) => {
          const priceA = parseFloat(a.price?.replace('EUR ', '') || 0);
          const priceB = parseFloat(b.price?.replace('EUR ', '') || 0);
          return priceB - priceA;
        });
        break;
    }
    
    return sorted;
  };

  // Calculate stats
  const calculateStats = () => {
    const withPrices = collection.filter(item => item.price && item.price !== 'N/A');
    const totalValue = withPrices.reduce((sum, item) => {
      const price = parseFloat(item.price.replace('EUR ', ''));
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
    
    const mostExpensive = withPrices.length > 0
      ? withPrices.reduce((max, item) => {
          const price = parseFloat(item.price.replace('EUR ', ''));
          const maxPrice = parseFloat(max.price.replace('EUR ', ''));
          return price > maxPrice ? item : max;
        })
      : null;
    
    const leastExpensive = withPrices.length > 0
      ? withPrices.reduce((min, item) => {
          const price = parseFloat(item.price.replace('EUR ', ''));
          const minPrice = parseFloat(min.price.replace('EUR ', ''));
          return price < minPrice ? item : min;
        })
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

  // Camera functionality
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setCameraStream(stream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
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

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(blob => {
        analyzeImage(blob);
      }, 'image/jpeg');
    }
  };

  const analyzeImage = async (imageBlob) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64data = reader.result.split(',')[1];
      
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: 'image/jpeg', data: base64data }
                },
                {
                  type: 'text',
                  text: 'Identify this vinyl record. Respond ONLY with valid JSON: {"artist": "Artist Name", "album": "Album Title", "year": "Year"}'
                }
              ]
            }]
          })
        });
        
        const data = await response.json();
        let responseText = data.content[0].text;
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const info = JSON.parse(responseText);
        
        stopCamera();
        setSearchQuery(`${info.artist} ${info.album}`);
        setActiveTab('search');
        searchDiscogs(`${info.artist} ${info.album}`);
      } catch (error) {
        alert('Could not analyze image');
        console.error(error);
      }
    };
    reader.readAsDataURL(imageBlob);
  };

  const stats = calculateStats();

  // Error boundary
  if (error) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        color: '#fff',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <h1 style={{ color: '#ff4444' }}>Error Loading App</h1>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '15px 30px',
              background: '#ffb700',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: primaryColor,
      color: '#fff'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}ee)`,
        borderBottom: `3px solid ${accentColor}`
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '2.5rem', 
          color: accentColor,
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
        }}>vinylscout</h1>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {/* SEARCH TAB */}
        {activeTab === 'search' && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchDiscogs()}
                placeholder="Search for vinyl records..."
                style={{
                  width: '100%',
                  padding: '15px',
                  fontSize: '16px',
                  border: `2px solid ${accentColor}`,
                  borderRadius: '10px',
                  background: '#222',
                  color: '#fff'
                }}
              />
              <button
                onClick={() => searchDiscogs()}
                disabled={isLoading}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '15px',
                  background: accentColor,
                  color: primaryColor,
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'wait' : 'pointer'
                }}
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
              
              <button
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '10px',
                  background: '#333',
                  color: accentColor,
                  border: `1px solid ${accentColor}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {showAdvancedSearch ? 'Hide' : 'Show'} Advanced Search
              </button>
            </div>

            {showAdvancedSearch && (
              <div style={{
                background: '#1a1a1a',
                padding: '15px',
                borderRadius: '10px',
                marginBottom: '20px',
                border: `1px solid ${accentColor}33`
              }}>
                <h3 style={{ color: accentColor, marginTop: 0 }}>Advanced Filters</h3>
                {['artist', 'album', 'year', 'label', 'catno', 'barcode'].map(field => (
                  <input
                    key={field}
                    type="text"
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    value={advancedFilters[field]}
                    onChange={(e) => setAdvancedFilters({...advancedFilters, [field]: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginBottom: '10px',
                      background: '#222',
                      border: '1px solid #444',
                      borderRadius: '5px',
                      color: '#fff'
                    }}
                  />
                ))}
                <button
                  onClick={() => searchDiscogs('', advancedFilters)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: accentColor,
                    color: primaryColor,
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Search with Filters
                </button>
              </div>
            )}

            {searchResults.length === 0 && !isLoading && (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#aaa'
              }}>
                <Search size={60} color={accentColor} style={{ marginBottom: '20px' }} />
                <h2 style={{ color: accentColor }}>Welcome to VinylScout</h2>
                <p>Search for vinyl records to get started!</p>
                <p style={{ fontSize: '12px', marginTop: '20px' }}>
                  💡 Don't forget to add your Discogs token in Settings
                </p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => searchDiscogs(searchQuery, advancedFilters, 1)}
                  disabled={currentPage === 1 || isLoading}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: currentPage === 1 ? '#333' : accentColor,
                    color: currentPage === 1 ? '#666' : primaryColor,
                    border: `2px solid ${accentColor}`,
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: currentPage === 1 || isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ⏮ First
                </button>
                <button
                  onClick={() => searchDiscogs(searchQuery, advancedFilters, currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: currentPage === 1 ? '#333' : accentColor,
                    color: currentPage === 1 ? '#666' : primaryColor,
                    border: `2px solid ${accentColor}`,
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: currentPage === 1 || isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ◀ Prev
                </button>
                <button
                  onClick={() => searchDiscogs(searchQuery, advancedFilters, currentPage + 1)}
                  disabled={currentPage === totalPages || isLoading}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: currentPage === totalPages ? '#333' : accentColor,
                    color: currentPage === totalPages ? '#666' : primaryColor,
                    border: `2px solid ${accentColor}`,
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: currentPage === totalPages || isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Next ▶
                </button>
                <button
                  onClick={() => searchDiscogs(searchQuery, advancedFilters, totalPages)}
                  disabled={currentPage === totalPages || isLoading}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: currentPage === totalPages ? '#333' : accentColor,
                    color: currentPage === totalPages ? '#666' : primaryColor,
                    border: `2px solid ${accentColor}`,
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: currentPage === totalPages || isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Last ⏭
                </button>
              </div>
            )}

            {searchResults.length > 0 && (
              <div style={{
                textAlign: 'center',
                marginBottom: '15px',
                color: accentColor,
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                Results ({searchResults.length}) - Page {currentPage} of {totalPages}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {searchResults.map((result, index) => (
                <div
                  key={result.id}
                  style={{
                    background: '#1a1a1a',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: `2px solid ${accentColor}33`,
                    padding: '15px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                    <img 
                      src={result.cover_image} 
                      alt={result.album}
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', color: accentColor, fontWeight: 'bold', marginBottom: '5px' }}>
                        {result.artist}
                      </div>
                      <div style={{ fontSize: '15px', marginBottom: '10px' }}>
                        {result.album}
                      </div>
                      <div style={{ 
                        fontSize: '18px', 
                        color: accentColor, 
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <DollarSign size={18} />
                        {result.price || 'Click refresh →'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Two-row grid for details */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                    fontSize: '12px',
                    color: '#aaa',
                    marginBottom: '15px'
                  }}>
                    <div><strong>Year:</strong> {result.year}</div>
                    <div><strong>Format:</strong> {result.format}</div>
                    <div><strong>Country:</strong> {result.country}</div>
                    <div><strong>Label:</strong> {result.label}</div>
                    <div><strong>Genre:</strong> {result.genre}</div>
                    <div><strong>Cat#:</strong> {result.catno}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const price = await fetchPrice(result);
                        if (price) {
                          const updatedResults = [...searchResults];
                          updatedResults[index].price = `EUR ${price.toFixed(2)}`;
                          setSearchResults(updatedResults);
                        } else {
                          alert('Could not fetch price');
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#333',
                        color: accentColor,
                        border: `1px solid ${accentColor}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontWeight: 'bold'
                      }}
                    >
                      <RefreshCw size={16} />
                      Refresh Price
                    </button>
                    <button
                      onClick={() => setSelectedResult(result)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: accentColor,
                        color: primaryColor,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CAMERA TAB */}
        {activeTab === 'camera' && (
          <div>
            {!showCamera ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Camera size={80} color={accentColor} style={{ marginBottom: '20px' }} />
                <h2>AI Album Recognition</h2>
                <p style={{ color: '#aaa', marginBottom: '30px' }}>
                  Take a photo of a vinyl record and let AI identify it
                </p>
                <button
                  onClick={startCamera}
                  style={{
                    padding: '15px 30px',
                    background: accentColor,
                    color: primaryColor,
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
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
                  style={{ width: '100%', borderRadius: '10px', marginBottom: '20px' }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={captureImage}
                    style={{
                      flex: 1,
                      padding: '15px',
                      background: accentColor,
                      color: primaryColor,
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Capture & Analyze
                  </button>
                  <button
                    onClick={stopCamera}
                    style={{
                      flex: 1,
                      padding: '15px',
                      background: '#333',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* COLLECTION TAB */}
        {activeTab === 'collection' && (
          <div>
            <div style={{ 
              display: 'flex', 
              gap: '10px', 
              marginBottom: '20px',
              flexWrap: 'wrap'
            }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#222',
                  color: '#fff',
                  border: `1px solid ${accentColor}`,
                  borderRadius: '8px'
                }}
              >
                <option value="artist">Sort by Artist</option>
                <option value="album">Sort by Album</option>
                <option value="year">Sort by Year</option>
                <option value="dateAdded">Sort by Date Added</option>
                <option value="price">Sort by Price</option>
              </select>
              
              <button
                onClick={() => {
                  const newView = collectionView === 'gallery' ? 'list' : 'gallery';
                  setCollectionView(newView);
                  localStorage.setItem('vinylScoutCollectionView', newView);
                }}
                style={{
                  padding: '10px 20px',
                  background: '#222',
                  color: accentColor,
                  border: `1px solid ${accentColor}`,
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                {collectionView === 'gallery' ? <List size={20} /> : <Grid size={20} />}
              </button>
              
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                style={{
                  padding: '10px 20px',
                  background: showFavoritesOnly ? accentColor : '#222',
                  color: showFavoritesOnly ? primaryColor : accentColor,
                  border: `1px solid ${accentColor}`,
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <Heart size={20} fill={showFavoritesOnly ? primaryColor : 'none'} />
              </button>
            </div>

            {collection.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <Music size={60} style={{ marginBottom: '20px' }} />
                <p>No albums in your collection yet</p>
              </div>
            ) : (
              <div style={{
                display: collectionView === 'gallery' ? 'grid' : 'flex',
                gridTemplateColumns: collectionView === 'gallery' ? 'repeat(auto-fill, minmax(150px, 1fr))' : 'none',
                flexDirection: collectionView === 'list' ? 'column' : 'row',
                gap: '15px'
              }}>
                {getSortedCollection().map(album => (
                  <div
                    key={album.id}
                    onClick={() => setSelectedResult(album)}
                    style={{
                      background: '#1a1a1a',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: `2px solid ${album.isFavorite ? accentColor : 'transparent'}`,
                      display: collectionView === 'list' ? 'flex' : 'block',
                      transition: 'all 0.3s'
                    }}
                  >
                    <img 
                      src={album.cover_image} 
                      alt={album.album}
                      style={{
                        width: collectionView === 'list' ? '80px' : '100%',
                        height: collectionView === 'list' ? '80px' : '150px',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ padding: '10px', flex: 1 }}>
                      <div style={{ fontSize: '12px', color: accentColor, fontWeight: 'bold' }}>
                        {album.artist}
                      </div>
                      <div style={{ fontSize: '14px', marginTop: '5px' }}>
                        {album.album}
                      </div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                        {album.year} • {album.price || 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div>
            <h2 style={{ color: accentColor }}>Collection Statistics</h2>
            
            <div style={{
              background: '#1a1a1a',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '20px',
              border: `2px solid ${accentColor}`
            }}>
              <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '5px' }}>
                Collection Value
              </div>
              <div 
                onClick={() => setShowValueModal(true)}
                style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: 'bold', 
                  color: accentColor,
                  cursor: 'pointer'
                }}
              >
                EUR {stats.totalValue}
              </div>
              <div style={{ fontSize: '14px', color: '#aaa', marginTop: '10px' }}>
                {stats.withPrices} of {stats.totalAlbums} records with prices
              </div>
              
              <button
                onClick={rescanAllPrices}
                disabled={isRescanning}
                style={{
                  width: '100%',
                  marginTop: '15px',
                  padding: '12px',
                  background: isRescanning ? '#555' : accentColor,
                  color: isRescanning ? '#aaa' : primaryColor,
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: isRescanning ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                <RefreshCw size={18} style={{
                  animation: isRescanning ? 'spin 1s linear infinite' : 'none'
                }} />
                {isRescanning 
                  ? `Rescanning... (${rescanProgress.current}/${rescanProgress.total})`
                  : 'Rescan All Prices'
                }
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              <div style={{
                background: '#1a1a1a',
                padding: '20px',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <Music size={30} color={accentColor} />
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '10px' }}>
                  {stats.totalAlbums}
                </div>
                <div style={{ fontSize: '14px', color: '#aaa' }}>Total Albums</div>
              </div>
              
              <div style={{
                background: '#1a1a1a',
                padding: '20px',
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <Heart size={30} color={accentColor} fill={accentColor} />
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '10px' }}>
                  {stats.favorites}
                </div>
                <div style={{ fontSize: '14px', color: '#aaa' }}>Favorites</div>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div>
            <h2 style={{ color: accentColor }}>Settings</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: '#aaa' }}>
                Discogs Token (Required)
              </label>
              <input
                type="text"
                value={discogsToken}
                onChange={(e) => setDiscogsToken(e.target.value)}
                placeholder="Enter your Discogs token..."
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#222',
                  border: `1px solid ${accentColor}`,
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: '#aaa' }}>
                Primary Color
              </label>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{ width: '100%', height: '50px', cursor: 'pointer' }}
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: '#aaa' }}>
                Accent Color
              </label>
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                style={{ width: '100%', height: '50px', cursor: 'pointer' }}
              />
            </div>

            <button
              onClick={saveSettings}
              style={{
                width: '100%',
                padding: '15px',
                background: accentColor,
                color: primaryColor,
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Save Settings
            </button>
          </div>
        )}
      </div>

      {/* Album Details Modal */}
      {selectedResult && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '15px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: `3px solid ${accentColor}`
          }}>
            <div style={{ position: 'sticky', top: 0, background: '#1a1a1a', padding: '15px', borderBottom: `2px solid ${accentColor}` }}>
              <button
                onClick={() => setSelectedResult(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: accentColor,
                  cursor: 'pointer',
                  fontSize: '24px'
                }}
              >
                <X size={30} />
              </button>
            </div>
            
            <div style={{ padding: '20px' }}>
              <img 
                src={selectedResult.cover_image}
                alt={selectedResult.album}
                style={{ width: '100%', borderRadius: '10px', marginBottom: '20px' }}
              />
              
              <h2 style={{ color: accentColor, marginBottom: '5px' }}>
                {selectedResult.artist}
              </h2>
              <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
                {selectedResult.album}
              </h3>

              <div style={{
                background: '#0a0a0a',
                padding: '15px',
                borderRadius: '10px',
                marginBottom: '20px'
              }}>
                <h4 style={{ color: accentColor, marginTop: 0 }}>Details</h4>
                <p><strong>Year:</strong> {selectedResult.year}</p>
                <p><strong>Format:</strong> {selectedResult.format}</p>
                <p><strong>Country:</strong> {selectedResult.country}</p>
                <p><strong>Label:</strong> {selectedResult.label}</p>
                <p><strong>Genre:</strong> {selectedResult.genre}</p>
                <p><strong>Catalog:</strong> {selectedResult.catno}</p>
                <p style={{ 
                  fontSize: '1.2rem', 
                  color: accentColor, 
                  fontWeight: 'bold',
                  marginTop: '15px'
                }}>
                  <DollarSign size={20} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                  Price: {selectedResult.price || 'Fetching...'}
                </p>
                
                {collection.some(item => item.id === selectedResult.id) && (
                  <button
                    onClick={() => refreshSinglePrice(selectedResult)}
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      padding: '10px',
                      background: '#333',
                      color: accentColor,
                      border: `1px solid ${accentColor}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <RefreshCw size={16} />
                    Refresh Price
                  </button>
                )}
              </div>

              {collection.some(item => item.id === selectedResult.id) ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => toggleFavorite(selectedResult.id)}
                    style={{
                      flex: 1,
                      padding: '15px',
                      background: collection.find(i => i.id === selectedResult.id)?.isFavorite ? accentColor : '#333',
                      color: collection.find(i => i.id === selectedResult.id)?.isFavorite ? primaryColor : '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Heart 
                      size={20} 
                      fill={collection.find(i => i.id === selectedResult.id)?.isFavorite ? primaryColor : 'none'} 
                    />
                    {collection.find(i => i.id === selectedResult.id)?.isFavorite ? 'Favorited' : 'Add to Favorites'}
                  </button>
                  <button
                    onClick={() => removeFromCollection(selectedResult.id)}
                    style={{
                      flex: 1,
                      padding: '15px',
                      background: '#d32f2f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => addToCollection(selectedResult)}
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: accentColor,
                    color: primaryColor,
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Add to Collection
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Value Details Modal */}
      {showValueModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setShowValueModal(false)}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '15px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            border: `3px solid ${accentColor}`,
            padding: '20px'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: accentColor, marginTop: 0 }}>Collection Value Details</h2>
            
            <div style={{
              background: '#0a0a0a',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '20px'
            }}>
              <p><strong>Total Value:</strong> EUR {stats.totalValue}</p>
              <p><strong>Total Albums:</strong> {stats.totalAlbums}</p>
              <p><strong>With Prices:</strong> {stats.withPrices}</p>
              <p><strong>Favorites:</strong> {stats.favorites}</p>
            </div>

            {stats.mostExpensive && (
              <div style={{
                background: '#0a0a0a',
                padding: '15px',
                borderRadius: '10px',
                marginBottom: '15px'
              }}>
                <h3 style={{ color: accentColor, marginTop: 0 }}>Most Expensive</h3>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <img 
                    src={stats.mostExpensive.cover_image}
                    alt={stats.mostExpensive.album}
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: accentColor }}>
                      {stats.mostExpensive.artist}
                    </div>
                    <div>{stats.mostExpensive.album}</div>
                    <div style={{ color: accentColor, fontWeight: 'bold', marginTop: '5px' }}>
                      {stats.mostExpensive.price}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {stats.leastExpensive && (
              <div style={{
                background: '#0a0a0a',
                padding: '15px',
                borderRadius: '10px',
                marginBottom: '20px'
              }}>
                <h3 style={{ color: accentColor, marginTop: 0 }}>Least Expensive</h3>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <img 
                    src={stats.leastExpensive.cover_image}
                    alt={stats.leastExpensive.album}
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: accentColor }}>
                      {stats.leastExpensive.artist}
                    </div>
                    <div>{stats.leastExpensive.album}</div>
                    <div style={{ color: accentColor, fontWeight: 'bold', marginTop: '5px' }}>
                      {stats.leastExpensive.price}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowValueModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                background: accentColor,
                color: primaryColor,
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '15px',
        background: '#0a0a0a',
        borderTop: `2px solid ${accentColor}`,
        position: 'sticky',
        bottom: 0
      }}>
        {[
          { id: 'search', icon: Search, label: 'Search' },
          { id: 'camera', icon: Camera, label: 'Camera' },
          { id: 'collection', icon: Music, label: 'Collection' },
          { id: 'profile', icon: User, label: 'Profile' },
          { id: 'settings', icon: Settings, label: 'Settings' }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                color: activeTab === tab.id ? accentColor : '#666',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px'
              }}
            >
              <Icon size={24} />
              <span style={{ fontSize: '10px' }}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VinylScout;