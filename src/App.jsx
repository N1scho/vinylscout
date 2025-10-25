import React, { useState, useEffect, useRef } from 'react';
import { Search, Camera, Music, Heart, User, Settings, X, ChevronRight, ExternalLink, Trash2, Edit2, Palette } from 'lucide-react';

const VinylPriceFinder = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedSearch, setAdvancedSearch] = useState({
    artist: '',
    album: '',
    year: '',
    label: '',
    genre: '',
    format: '',
    excludeFormat: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [resultPrices, setResultPrices] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [collection, setCollection] = useState([]);
  const [collectionView, setCollectionView] = useState('grid');
  const [collectionSort, setCollectionSort] = useState('artist-asc');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [cameraMode, setCameraMode] = useState('photo');
  
  const [userProfile, setUserProfile] = useState({
    name: '',
    nickname: '',
    email: '',
    address: '',
    city: '',
    country: ''
  });
  
  const [discogsToken, setDiscogsToken] = useState('');
  const [anthropicToken, setAnthropicToken] = useState('');
  const [selectedShops, setSelectedShops] = useState(['discogs']);
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [accentColor, setAccentColor] = useState('#FFB700');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [currentTheme, setCurrentTheme] = useState('dark-orange');
  
  const themes = {
    'dark-orange': {
      name: 'Dark Orange (Default)',
      primary: '#000000',
      accent: '#FFB700',
      text: '#FFFFFF'
    },
    'spotify': {
      name: 'Spotify Style',
      primary: '#121212',
      accent: '#1DB954',
      text: '#FFFFFF'
    },
    'vintage': {
      name: 'Vintage Vinyl',
      primary: '#2C1810',
      accent: '#D4A574',
      text: '#F5E6D3'
    },
    'minimal-light': {
      name: 'Minimal Light',
      primary: '#FFFFFF',
      accent: '#0066FF',
      text: '#1A1A1A'
    },
    'sunset': {
      name: 'Sunset Vibes',
      primary: '#1A0B2E',
      accent: '#FF6B9D',
      text: '#FFF1E6'
    },
    'forest': {
      name: 'Forest Green',
      primary: '#0D1F2D',
      accent: '#4CAF50',
      text: '#E8F5E9'
    }
  };
  
  const applyTheme = (themeKey) => {
    const theme = themes[themeKey];
    setPrimaryColor(theme.primary);
    setAccentColor(theme.accent);
    setTextColor(theme.text);
    setCurrentTheme(themeKey);
    localStorage.setItem('currentTheme', themeKey);
  };
  
  const videoRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('discogsToken');
    const savedAnthropicToken = localStorage.getItem('anthropicToken');
    const savedShops = localStorage.getItem('selectedShops');
    const savedTheme = localStorage.getItem('currentTheme');
    const savedCollection = localStorage.getItem('collection');
    const savedProfile = localStorage.getItem('userProfile');
    
    if (savedToken) setDiscogsToken(savedToken);
    if (savedAnthropicToken) setAnthropicToken(savedAnthropicToken);
    if (savedShops) setSelectedShops(JSON.parse(savedShops));
    if (savedCollection) setCollection(JSON.parse(savedCollection));
    if (savedProfile) setUserProfile(JSON.parse(savedProfile));
    
    if (savedTheme && themes[savedTheme]) {
      applyTheme(savedTheme);
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('discogsToken', discogsToken);
    localStorage.setItem('anthropicToken', anthropicToken);
    localStorage.setItem('selectedShops', JSON.stringify(selectedShops));
    setShowSettings(false);
  };

  const saveProfile = () => {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    setShowEditProfile(false);
  };

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

  const searchDiscogs = async (isAdvanced = false, queryOverride = null, page = 1) => {
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
        if (advancedSearch.format) params.push(`format=${encodeURIComponent(advancedSearch.format)}`);
        
        if (params.length === 0) {
          alert('Please fill in at least one search field');
          setIsLoading(false);
          return;
        }
        
        searchUrl += params.join('&') + `&per_page=10&page=${page}&type=release`;
      } else {
        const query = queryOverride || searchQuery;
        if (!query.trim()) {
          setIsLoading(false);
          return;
        }
        searchUrl += `q=${encodeURIComponent(query)}&per_page=10&page=${page}&type=release`;
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
        let filteredResults = data.results;
        if (isAdvanced && advancedSearch.excludeFormat) {
          const excludeFormatLower = advancedSearch.excludeFormat.toLowerCase();
          filteredResults = data.results.filter(result => {
            if (!result.format) return true;
            return !result.format.some(format => 
              format.toLowerCase().includes(excludeFormatLower)
            );
          });
        }
        
        if (filteredResults.length === 0) {
          setSearchResults([]);
          alert('No results found after filtering');
          setIsLoading(false);
          return;
        }
        
        setSearchResults(filteredResults);
        setCurrentPage(page);
        
        const totalResults = data.pagination?.items || filteredResults.length;
        const perPage = data.pagination?.per_page || 10;
        setTotalPages(Math.ceil(totalResults / perPage));
        
        fetchPricesInBackground(filteredResults);
      } else {
        setSearchResults([]);
        setCurrentPage(1);
        setTotalPages(1);
        alert('No results found');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert(`Error: ${error.message}`);
    }
    setIsLoading(false);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      searchDiscogs(showAdvancedSearch, searchQuery, currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      searchDiscogs(showAdvancedSearch, searchQuery, currentPage - 1);
    }
  };

  const fetchPricesInBackground = async (results) => {
    for (const result of results) {
      const priceData = await fetchPriceInfo(result.id);
      if (priceData) {
        setResultPrices(prev => ({ ...prev, [result.id]: priceData }));
      }
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchDiscogs(false, null, 1);
    }
  };

  const handleAdvancedSearch = () => {
    searchDiscogs(true, null, 1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
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
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    if (cameraMode === 'barcode') {
      alert('Barcode scanning feature coming soon!');
    } else {
      if (anthropicToken) {
        identifyAlbumWithAI(imageData);
      } else {
        alert('Add Anthropic API token in Settings for AI recognition');
      }
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
        searchDiscogs(false, albumInfo, 1);
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

  const checkDuplicate = (newItem) => {
    return collection.some(item => 
      item.id === newItem.id || 
      (item.title?.toLowerCase() === newItem.title?.toLowerCase() && 
       item.year === newItem.year)
    );
  };

  const addToCollection = (item) => {
    if (checkDuplicate(item)) {
      if (!confirm('This record might already be in your collection. Add anyway?')) {
        return;
      }
    }
    
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
      case 'price-asc':
        return sorted.sort((a, b) => (a.price?.value || 0) - (b.price?.value || 0));
      case 'price-desc':
        return sorted.sort((a, b) => (b.price?.value || 0) - (a.price?.value || 0));
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
      <div 
        style={{ 
          padding: '16px',
          backgroundColor: primaryColor,
          flexShrink: 0,
          borderBottom: `1px solid ${textColor}10`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: accentColor, margin: 0 }}>
          VinylScout
        </h1>
        <button 
          onClick={() => setShowSettings(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
        >
          <Settings size={24} style={{ color: accentColor }} />
        </button>
      </div>

      <div 
        style={{ 
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          paddingBottom: '90px'
        }}
      >
        {activeTab === 'search' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search artist or album..."
              style={{ 
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: `2px solid ${textColor}20`,
                backgroundColor: `${textColor}05`,
                color: textColor,
                fontSize: '16px'
              }}
            />

            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              style={{ 
                fontSize: '14px',
                color: accentColor,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                padding: 0
              }}
            >
              {showAdvancedSearch ? '▲' : '▼'} Advanced Search
            </button>

            {showAdvancedSearch && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderRadius: '12px', padding: '16px', backgroundColor: `${textColor}05` }}>
                {[
                  { key: 'artist', label: 'Artist' },
                  { key: 'album', label: 'Album' },
                  { key: 'year', label: 'Year' },
                  { key: 'label', label: 'Label/Publisher' },
                  { key: 'genre', label: 'Genre' },
                  { key: 'format', label: 'Format (e.g. Vinyl, LP, 12")' },
                  { key: 'excludeFormat', label: 'Exclude Format (e.g. CD, Cassette)' }
                ].map(field => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: `${textColor}60` }}>
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={advancedSearch[field.key]}
                      onChange={(e) => setAdvancedSearch({...advancedSearch, [field.key]: e.target.value})}
                      placeholder={field.label}
                      style={{ 
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${textColor}20`,
                        backgroundColor: primaryColor,
                        color: textColor,
                        fontSize: '14px'
                      }}
                    />
                  </div>
                ))}
                <button
                  onClick={handleAdvancedSearch}
                  disabled={isLoading}
                  style={{ 
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: accentColor,
                    color: primaryColor,
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    marginTop: '8px'
                  }}
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            )}

            {!showAdvancedSearch && (
              <button
                onClick={handleSearch}
                disabled={isLoading}
                style={{ 
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: accentColor,
                  color: primaryColor,
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '16px'
                }}
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            )}

            {!isLoading && searchResults.length === 0 && searchQuery && (
              <div style={{ textAlign: 'center', padding: '32px', color: `${textColor}60` }}>
                No results found. Try different search terms.
              </div>
            )}

            {searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {searchResults.map((result) => {
                  const price = resultPrices[result.id];
                  return (
                    <div
                      key={result.id}
                      onClick={() => setSelectedResult(result)}
                      style={{ 
                        backgroundColor: `${textColor}08`,
                        border: `1px solid ${textColor}15`,
                        borderRadius: '12px',
                        padding: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '12px'
                      }}
                    >
                      {result.cover_image ? (
                        <img
                          src={result.cover_image}
                          alt={result.title}
                          style={{ 
                            width: '80px', 
                            height: '80px', 
                            objectFit: 'cover', 
                            borderRadius: '8px'
                          }}
                        />
                      ) : (
                        <div style={{ 
                          width: '80px', 
                          height: '80px', 
                          borderRadius: '8px', 
                          backgroundColor: `${textColor}10`, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}>
                          <Music size={32} style={{ color: accentColor, opacity: 0.4 }} />
                        </div>
                      )}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px', color: textColor }}>
                            {result.title?.split(' - ')[0] || 'Unknown Artist'}
                          </div>
                          <div style={{ fontSize: '12px', marginBottom: '4px', color: `${textColor}70` }}>
                            {result.title?.split(' - ')[1] || result.title || 'Unknown Album'}
                          </div>
                        </div>
                        {price ? (
                          <div>
                            <div style={{ fontSize: '12px', marginBottom: '4px', color: `${textColor}50` }}>from Discogs</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: accentColor }}>
                              {price.currency} {price.value.toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: `${textColor}40` }}>Loading price...</div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${textColor}15` }}>
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      style={{ 
                        padding: '8px 16px',
                        borderRadius: '8px',
                        backgroundColor: currentPage === 1 ? `${textColor}10` : accentColor,
                        color: currentPage === 1 ? `${textColor}40` : primaryColor,
                        border: 'none',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: currentPage === 1 ? 0.5 : 1
                      }}
                    >
                      ← Previous
                    </button>
                    
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: textColor }}>
                      {currentPage} / {totalPages}
                    </span>
                    
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      style={{ 
                        padding: '8px 16px',
                        borderRadius: '8px',
                        backgroundColor: currentPage === totalPages ? `${textColor}10` : accentColor,
                        color: currentPage === totalPages ? `${textColor}40` : primaryColor,
                        border: 'none',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        opacity: currentPage === totalPages ? 0.5 : 1
                      }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'camera' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={() => setCameraMode('photo')}
                style={{ 
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  backgroundColor: cameraMode === 'photo' ? accentColor : `${textColor}10`,
                  color: cameraMode === 'photo' ? primaryColor : textColor
                }}
              >
                📸 AI Photo
              </button>
              <button
                onClick={() => setCameraMode('barcode')}
                style={{ 
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  backgroundColor: cameraMode === 'barcode' ? accentColor : `${textColor}10`,
                  color: cameraMode === 'barcode' ? primaryColor : textColor
                }}
              >
                📊 Barcode
              </button>
            </div>

            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000' }}>
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: 'auto' }} />
              {isCameraActive && (
                <button
                  onClick={capturePhoto}
                  style={{ 
                    position: 'absolute',
                    bottom: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    border: `4px solid ${accentColor}`,
                    backgroundColor: accentColor,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Camera size={28} style={{ color: primaryColor }} />
                </button>
              )}
            </div>
            
            <div style={{ borderRadius: '12px', padding: '16px', backgroundColor: `${textColor}05` }}>
              {cameraMode === 'photo' ? (
                <div>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: textColor }}>📸 AI Photo Recognition</h3>
                  <p style={{ fontSize: '14px', marginBottom: '8px', color: `${textColor}80` }}>
                    Point camera at album cover. AI will identify the record.
                  </p>
                  {anthropicToken ? (
                    <p style={{ fontSize: '12px', color: accentColor }}>✓ AI enabled</p>
                  ) : (
                    <p style={{ fontSize: '12px', color: `${textColor}60` }}>⚠️ Add Anthropic token in Settings</p>
                  )}
                </div>
              ) : (
                <div>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: textColor }}>📊 Barcode Scanner</h3>
                  <p style={{ fontSize: '14px', marginBottom: '8px', color: `${textColor}80` }}>
                    Scan the barcode on the back of the record sleeve.
                  </p>
                  <p style={{ fontSize: '12px', color: `${textColor}60` }}>
                    Works with UPC/EAN barcodes. Most accurate method.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'collection' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: textColor, margin: 0 }}>My Collection</h2>
              <select
                value={collectionSort}
                onChange={(e) => setCollectionSort(e.target.value)}
                style={{ 
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${textColor}20`,
                  backgroundColor: primaryColor,
                  color: textColor,
                  fontSize: '12px'
                }}
              >
                <option value="artist-asc">Artist A-Z</option>
                <option value="artist-desc">Artist Z-A</option>
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
              </select>
            </div>

            {collection.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '32px', color: `${textColor}60` }}>
                No records yet
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {sortCollection(collection, collectionSort).map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedResult(item)}
                    style={{ 
                      borderRadius: '12px',
                      padding: '12px',
                      cursor: 'pointer',
                      backgroundColor: `${textColor}05`,
                      border: `1px solid ${textColor}10`
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {item.cover_image ? (
                        <img
                          src={item.cover_image}
                          alt={item.title}
                          style={{ 
                            width: '100%',
                            aspectRatio: '1',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            marginBottom: '8px'
                          }}
                        />
                      ) : (
                        <div style={{ 
                          width: '100%',
                          aspectRatio: '1',
                          borderRadius: '8px',
                          backgroundColor: `${textColor}10`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '8px'
                        }}>
                          <Music size={32} style={{ color: accentColor, opacity: 0.5 }} />
                        </div>
                      )}
                      <h3 style={{ 
                        fontWeight: 'bold',
                        fontSize: '12px',
                        marginBottom: '4px',
                        color: textColor,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.title?.split(' - ')[0] || 'Unknown'}
                      </h3>
                      <p style={{ 
                        fontSize: '12px',
                        marginBottom: '8px',
                        color: `${textColor}70`,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.title?.split(' - ')[1] || item.title || 'Unknown'}
                      </p>
                      {item.price?.value ? (
                        <p style={{ fontSize: '14px', fontWeight: 'bold', color: accentColor }}>
                          {item.price.currency} {Number(item.price.value).toFixed(2)}
                        </p>
                      ) : (
                        <p style={{ fontSize: '12px', color: `${textColor}40` }}>No price</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: textColor, margin: 0 }}>Profile</h2>
              <button
                onClick={() => setShowEditProfile(true)}
                style={{ 
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: accentColor,
                  color: primaryColor,
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Edit2 size={16} />
                Edit
              </button>
            </div>
            
            <div style={{ borderRadius: '12px', padding: '16px', backgroundColor: `${textColor}05`, border: `1px solid ${textColor}10` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div 
                  style={{ 
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: accentColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <User size={32} style={{ color: primaryColor }} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 'bold', color: textColor, marginBottom: '4px' }}>
                    {userProfile.name || 'Vinyl Collector'}
                  </h3>
                  <p style={{ fontSize: '14px', color: `${textColor}60` }}>
                    {userProfile.nickname || 'Set your nickname'}
                  </p>
                </div>
              </div>
              
              {userProfile.email && (
                <p style={{ fontSize: '14px', marginBottom: '4px', color: `${textColor}80` }}>
                  📧 {userProfile.email}
                </p>
              )}
              {userProfile.address && (
                <p style={{ fontSize: '14px', color: `${textColor}80` }}>
                  📍 {userProfile.address}, {userProfile.city}, {userProfile.country}
                </p>
              )}
            </div>

            <div style={{ borderRadius: '12px', padding: '16px', backgroundColor: `${textColor}05`, border: `1px solid ${textColor}10` }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '12px', color: textColor }}>Collection Value</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: `${textColor}60` }}>Total:</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: accentColor }}>
                  {calculateCollectionValue().currency} {calculateCollectionValue().value}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: `${textColor}40` }}>
                Based on {calculateCollectionValue().count} of {collection.length} records
              </p>
            </div>

            <div style={{ borderRadius: '12px', padding: '16px', backgroundColor: `${textColor}05`, border: `1px solid ${textColor}10` }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: textColor }}>Statistics</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: `${textColor}60` }}>Total Records</span>
                  <span style={{ fontWeight: 'bold', color: textColor }}>{collection.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: `${textColor}60` }}>Favorites</span>
                  <span style={{ fontWeight: 'bold', color: textColor }}>{favorites.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: `${textColor}60` }}>With Prices</span>
                  <span style={{ fontWeight: 'bold', color: textColor }}>
                    {collection.filter(item => item.price?.value).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

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
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '12px 8px',
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
              flex: 1,
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

      {showSettings && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 2000, overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '448px', backgroundColor: primaryColor, borderRadius: '12px', padding: '24px', maxHeight: '90vh', overflowY: 'auto', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: textColor, margin: 0 }}>Settings</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setShowThemes(true)}
                  style={{ 
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: `${accentColor}20`,
                    color: accentColor,
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Palette size={16} />
                  Themes
                </button>
                <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={24} style={{ color: accentColor }} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: `${textColor}80` }}>Discogs API Token</label>
                <input
                  type="text"
                  value={discogsToken}
                  onChange={(e) => setDiscogsToken(e.target.value)}
                  placeholder="Enter token"
                  style={{ 
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${textColor}20`,
                    backgroundColor: primaryColor,
                    color: textColor
                  }}
                />
                <a 
                  href="https://www.discogs.com/settings/developers"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    fontSize: '12px',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: accentColor,
                    textDecoration: 'none'
                  }}
                >
                  Get token <ExternalLink size={12} />
                </a>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: `${textColor}80` }}>Anthropic API Token (AI Camera)</label>
                <input
                  type="password"
                  value={anthropicToken}
                  onChange={(e) => setAnthropicToken(e.target.value)}
                  placeholder="Enter API key"
                  style={{ 
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${textColor}20`,
                    backgroundColor: primaryColor,
                    color: textColor
                  }}
                />
                <a 
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    fontSize: '12px',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: accentColor,
                    textDecoration: 'none'
                  }}
                >
                  Get API key <ExternalLink size={12} />
                </a>
              </div>

              <button
                onClick={saveSettings}
                style={{ 
                  width: '100%',
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: accentColor,
                  color: primaryColor,
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {showThemes && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 2001, overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '500px', backgroundColor: primaryColor, borderRadius: '12px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: textColor, margin: 0 }}>🎨 Choose Theme</h2>
              <button onClick={() => setShowThemes(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} style={{ color: accentColor }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {Object.entries(themes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => {
                    applyTheme(key);
                    setShowThemes(false);
                  }}
                  style={{ 
                    padding: '16px',
                    borderRadius: '12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    backgroundColor: theme.primary,
                    border: `2px solid ${currentTheme === key ? theme.accent : 'transparent'}`,
                    boxShadow: currentTheme === key ? `0 0 0 2px ${theme.accent}40` : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: theme.text }}>
                      {theme.name}
                    </span>
                    {currentTheme === key && (
                      <span style={{ color: theme.accent }}>✓ Active</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div 
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '6px',
                        backgroundColor: theme.primary,
                        border: `1px solid ${theme.text}20`
                      }} 
                    />
                    <div 
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '6px',
                        backgroundColor: theme.accent
                      }} 
                    />
                    <div 
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '6px',
                        backgroundColor: theme.text
                      }} 
                    />
                  </div>
                </button>
              ))}
            </div>

            <div style={{ marginTop: '16px', padding: '12px', borderRadius: '8px', backgroundColor: `${textColor}10` }}>
              <p style={{ fontSize: '12px', color: `${textColor}70`, margin: 0 }}>
                💡 Tip: You can also customize colors manually in Settings
              </p>
            </div>
          </div>
        </div>
      )}

      {showEditProfile && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 2000, overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '448px', backgroundColor: primaryColor, borderRadius: '12px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: textColor, margin: 0 }}>Edit Profile</h2>
              <button onClick={() => setShowEditProfile(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} style={{ color: accentColor }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { key: 'name', label: 'Full Name' },
                { key: 'nickname', label: 'Nickname' },
                { key: 'email', label: 'Email' },
                { key: 'address', label: 'Address' },
                { key: 'city', label: 'City' },
                { key: 'country', label: 'Country' }
              ].map(field => (
                <div key={field.key}>
                  <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: `${textColor}80` }}>{field.label}</label>
                  <input
                    type="text"
                    value={userProfile[field.key]}
                    onChange={(e) => setUserProfile({...userProfile, [field.key]: e.target.value})}
                    style={{ 
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: `1px solid ${textColor}20`,
                      backgroundColor: primaryColor,
                      color: textColor
                    }}
                  />
                </div>
              ))}

              <button
                onClick={saveProfile}
                style={{ 
                  width: '100%',
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: accentColor,
                  color: primaryColor,
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedResult && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 2000 }}>
          <div style={{ width: '100%', maxWidth: '448px', backgroundColor: primaryColor, borderRadius: '12px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <div style={{ paddingRight: '16px', flex: 1 }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px', color: textColor }}>
                  {selectedResult.title?.split(' - ')[0] || 'Unknown Artist'}
                </h2>
                <p style={{ fontSize: '18px', color: `${textColor}80` }}>
                  {selectedResult.title?.split(' - ')[1] || selectedResult.title || 'Unknown Album'}
                </p>
              </div>
              <button onClick={() => setSelectedResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
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
                  backgroundColor: `${textColor}05`
                }}
              />
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {selectedResult.year && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: `${textColor}60` }}>Year:</span>
                  <span style={{ color: textColor }}>{selectedResult.year}</span>
                </div>
              )}
              {selectedResult.label?.[0] && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: `${textColor}60` }}>Label:</span>
                  <span style={{ color: textColor }}>{selectedResult.label[0]}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {collection.find(item => item.id === selectedResult.id) ? (
                <>
                  <button
                    onClick={() => {
                      const idx = collection.findIndex(item => item.id === selectedResult.id);
                      removeFromCollection(idx);
                      setSelectedResult(null);
                    }}
                    style={{ 
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '2px solid #EF4444',
                      backgroundColor: 'transparent',
                      color: '#EF4444',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
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
                    style={{ 
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: `2px solid ${accentColor}`,
                      backgroundColor: 'transparent',
                      color: accentColor,
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
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
                  style={{ 
                    width: '100%',
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: accentColor,
                    color: primaryColor,
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '16px',
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
    </div>
  );
};

export default VinylPriceFinder;