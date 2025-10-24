import React, { useState, useEffect, useRef } from 'react';
import { Search, Camera, Music, Heart, User, Settings, X, ChevronRight, ExternalLink, Trash2, Edit2, Plus } from 'lucide-react';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {
      console.log('Service Worker registration failed');
    });
  });
}

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
  const [priceInfo, setPriceInfo] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [collection, setCollection] = useState([]);
  const [collectionView, setCollectionView] = useState('grid');
  const [collectionSort, setCollectionSort] = useState('artist-asc');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [cameraMode, setCameraMode] = useState('photo'); // 'photo' or 'barcode'
  const [barcodeResult, setBarcodeResult] = useState(null);
  
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
  const [currentTheme, setCurrentTheme] = useState('dark-orange');
  
  // Pre-made themes
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
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Load settings from localStorage
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
    
    // Apply saved theme or default
    if (savedTheme && themes[savedTheme]) {
      applyTheme(savedTheme);
    }
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
        if (advancedSearch.format) params.push(`format=${encodeURIComponent(advancedSearch.format)}`);
        
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
        // Filter out excluded formats if specified
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
        // Fetch prices in background without blocking UI
        fetchPricesInBackground(filteredResults);
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
    // Fetch ALL results, not just first 5
    for (const result of results) {
      const priceData = await fetchPriceInfo(result.id);
      if (priceData) {
        setResultPrices(prev => ({ ...prev, [result.id]: priceData }));
      }
      // Smaller delay for faster loading
      await new Promise(resolve => setTimeout(resolve, 150));
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
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    if (cameraMode === 'barcode') {
      // Try to detect barcode in image
      detectBarcode(canvas, imageData);
    } else {
      // AI recognition
      if (anthropicToken) {
        identifyAlbumWithAI(imageData);
      } else {
        alert('Add Anthropic API token in Settings for AI recognition');
      }
    }
    
    stopCamera();
  };

  const detectBarcode = async (canvas, imageData) => {
    setIsLoading(true);
    try {
      // Use BarcodeDetector API if available
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
        const barcodes = await barcodeDetector.detect(canvas);
        
        if (barcodes.length > 0) {
          const barcode = barcodes[0].rawValue;
          setBarcodeResult(barcode);
          // Search by barcode
          searchByBarcode(barcode);
        } else {
          alert('No barcode detected. Try getting closer or better lighting.');
        }
      } else {
        // Fallback: manual barcode entry
        const barcode = prompt('Barcode detection not supported on this device. Enter barcode manually:');
        if (barcode) {
          searchByBarcode(barcode);
        }
      }
    } catch (error) {
      console.error('Barcode detection error:', error);
      alert('Could not detect barcode. Try manual search instead.');
    }
    setIsLoading(false);
  };

  const searchByBarcode = async (barcode) => {
    if (!discogsToken) {
      alert('Please add your Discogs API token in Settings');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.discogs.com/database/search?barcode=${barcode}&type=release`,
        {
          headers: {
            'Authorization': `Discogs token=${discogsToken}`,
            'User-Agent': 'VinylScout/1.0'
          }
        }
      );
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
        setCurrentPage(1);
        setTotalPages(1);
        fetchPricesInBackground(data.results);
        setActiveTab('search');
      } else {
        alert('No results found for this barcode');
      }
    } catch (error) {
      console.error('Barcode search error:', error);
      alert('Error searching by barcode');
    }
    setIsLoading(false);
  };

  // Check for duplicates before adding
  const checkDuplicate = (newItem) => {
    return collection.some(item => 
      item.id === newItem.id || 
      (item.title?.toLowerCase() === newItem.title?.toLowerCase() && 
       item.year === newItem.year)
    );
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
    // Check for duplicates
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

  // Statistics calculations
  const getStatistics = () => {
    if (collection.length === 0) return null;

    const withPrices = collection.filter(item => item.price?.value);
    const prices = withPrices.map(item => item.price.value);
    
    // Most expensive
    const mostExpensive = withPrices.length > 0 
      ? withPrices.reduce((max, item) => item.price.value > max.price.value ? item : max)
      : null;
    
    // Cheapest
    const cheapest = withPrices.length > 0
      ? withPrices.reduce((min, item) => item.price.value < min.price.value ? item : min)
      : null;
    
    // Average
    const avgPrice = prices.length > 0
      ? (prices.reduce((sum, p) => sum + p, 0) / prices.length).toFixed(2)
      : 0;
    
    // Genre breakdown
    const genres = {};
    collection.forEach(item => {
      if (item.genre && item.genre[0]) {
        const genre = item.genre[0];
        genres[genre] = (genres[genre] || 0) + 1;
      }
    });
    const topGenres = Object.entries(genres)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Decade breakdown
    const decades = {};
    collection.forEach(item => {
      if (item.year) {
        const decade = Math.floor(item.year / 10) * 10;
        decades[decade] = (decades[decade] || 0) + 1;
      }
    });
    const decadeList = Object.entries(decades)
      .sort((a, b) => a[0] - b[0]);
    
    // Artist with most records
    const artists = {};
    collection.forEach(item => {
      const artist = item.title?.split(' - ')[0] || 'Unknown';
      artists[artist] = (artists[artist] || 0) + 1;
    });
    const topArtist = Object.entries(artists)
      .sort((a, b) => b[1] - a[1])[0];
    
    return {
      mostExpensive,
      cheapest,
      avgPrice,
      topGenres,
      decadeList,
      topArtist,
      currency: withPrices[0]?.price?.currency || 'EUR'
    };
  };

  // Export functions
  const exportToCSV = () => {
    const headers = ['Artist', 'Album', 'Year', 'Label', 'Genre', 'Format', 'Price', 'Currency', 'Favorite'];
    const rows = collection.map(item => [
      item.title?.split(' - ')[0] || 'Unknown',
      item.title?.split(' - ')[1] || item.title || 'Unknown',
      item.year || '',
      item.label?.[0] || '',
      item.genre?.[0] || '',
      item.format?.[0] || '',
      item.price?.value || '',
      item.price?.currency || '',
      item.favorite ? 'Yes' : 'No'
    ]);
    
    const csv = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vinylscout-collection-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToJSON = () => {
    const json = JSON.stringify(collection, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vinylscout-collection-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const generateShareableText = () => {
    const stats = calculateCollectionValue();
    let text = `🎵 My VinylScout Collection\n\n`;
    text += `📀 Total Records: ${collection.length}\n`;
    text += `💰 Total Value: ${stats.currency} ${stats.value}\n`;
    text += `❤️ Favorites: ${favorites.length}\n\n`;
    text += `Top Albums:\n`;
    collection.slice(0, 5).forEach((item, idx) => {
      const artist = item.title?.split(' - ')[0] || 'Unknown';
      const album = item.title?.split(' - ')[1] || item.title || 'Unknown';
      text += `${idx + 1}. ${artist} - ${album}\n`;
    });
    
    return text;
  };

  const copyShareableText = () => {
    const text = generateShareableText();
    navigator.clipboard.writeText(text).then(() => {
      alert('Collection summary copied to clipboard!');
    });
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
              style={{ 
                borderColor: `${textColor}20`, 
                backgroundColor: `${textColor}05`,
                color: textColor
              }}
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
                    <label className="block text-xs mb-1" style={{ color: `${textColor}60` }}>
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={advancedSearch[field.key]}
                      onChange={(e) => setAdvancedSearch({...advancedSearch, [field.key]: e.target.value})}
                      placeholder={field.label}
                      className="w-full px-4 py-2 rounded-lg border text-sm focus:outline-none"
                      style={{ borderColor: `${textColor}20`, backgroundColor: primaryColor, color: textColor }}
                    />
                  </div>
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

            {isLoading && (
              <div className="text-center py-8">
                <p style={{ color: textColor }}>Searching...</p>
              </div>
            )}

            {!isLoading && searchResults.length === 0 && searchQuery && (
              <div className="text-center py-8">
                <p style={{ color: `${textColor}60` }}>No results found. Try different search terms.</p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-3 mt-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold" style={{ color: textColor }}>
                    Results ({searchResults.length})
                  </h3>
                  <span className="text-sm" style={{ color: `${textColor}60` }}>
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                
                {searchResults.map((result) => {
                  const price = resultPrices[result.id];
                  return (
                    <div
                      key={result.id}
                      onClick={() => setSelectedResult(result)}
                      className="rounded-lg p-3 cursor-pointer transition-all"
                      style={{ 
                        backgroundColor: `${textColor}08`,
                        border: `1px solid ${textColor}15`,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div className="flex gap-3">
                        {result.cover_image ? (
                          <img
                            src={result.cover_image}
                            alt={result.title}
                            style={{ 
                              width: '80px', 
                              height: '80px', 
                              objectFit: 'cover', 
                              borderRadius: '6px',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                          />
                        ) : (
                          <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            borderRadius: '6px', 
                            backgroundColor: `${textColor}10`, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                          }}>
                            <Music size={32} style={{ color: accentColor, opacity: 0.4 }} />
                          </div>
                        )}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-sm mb-1" style={{ color: textColor }}>
                              {result.title?.split(' - ')[0] || 'Unknown Artist'}
                            </h3>
                            <p className="text-xs mb-1" style={{ color: `${textColor}70` }}>
                              {result.title?.split(' - ')[1] || result.title || 'Unknown Album'}
                            </p>
                          </div>
                          {price ? (
                            <div>
                              <p className="text-xs mb-1" style={{ color: `${textColor}50` }}>from Discogs</p>
                              <p className="text-base font-bold" style={{ color: accentColor }}>
                                {price.currency} {price.value.toFixed(2)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs" style={{ color: `${textColor}40` }}>Loading price...</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-4 pt-4" style={{ borderTop: `1px solid ${textColor}15` }}>
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                    style={{ 
                      backgroundColor: currentPage === 1 ? `${textColor}10` : accentColor,
                      color: currentPage === 1 ? `${textColor}40` : primaryColor,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: currentPage === 1 ? 0.5 : 1
                    }}
                  >
                    ← Previous
                  </button>
                  
                  <span className="text-sm font-semibold" style={{ color: textColor }}>
                    {currentPage} / {totalPages}
                  </span>
                  
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                    style={{ 
                      backgroundColor: currentPage === totalPages ? `${textColor}10` : accentColor,
                      color: currentPage === totalPages ? `${textColor}40` : primaryColor,
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      opacity: currentPage === totalPages ? 0.5 : 1
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Camera Tab */}
        {activeTab === 'camera' && (
          <div className="space-y-4 pt-4">
            {/* Camera Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setCameraMode('photo')}
                className="flex-1 py-2 rounded-lg font-semibold text-sm"
                style={{ 
                  backgroundColor: cameraMode === 'photo' ? accentColor : `${textColor}10`,
                  color: cameraMode === 'photo' ? primaryColor : textColor
                }}
              >
                📸 AI Photo
              </button>
              <button
                onClick={() => setCameraMode('barcode')}
                className="flex-1 py-2 rounded-lg font-semibold text-sm"
                style={{ 
                  backgroundColor: cameraMode === 'barcode' ? accentColor : `${textColor}10`,
                  color: cameraMode === 'barcode' ? primaryColor : textColor
                }}
              >
                📊 Barcode
              </button>
            </div>

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
              {cameraMode === 'photo' ? (
                <>
                  <h3 className="font-semibold mb-2">📸 AI Photo Recognition</h3>
                  <p className="text-sm mb-2" style={{ color: `${textColor}80` }}>
                    Point camera at album cover. AI will identify the record.
                  </p>
                  {anthropicToken ? (
                    <p className="text-xs" style={{ color: accentColor }}>✓ AI enabled</p>
                  ) : (
                    <p className="text-xs" style={{ color: `${textColor}60` }}>⚠️ Add Anthropic token in Settings</p>
                  )}
                </>
              ) : (
                <>
                  <h3 className="font-semibold mb-2">📊 Barcode Scanner</h3>
                  <p className="text-sm mb-2" style={{ color: `${textColor}80` }}>
                    Scan the barcode on the back of the record sleeve.
                  </p>
                  <p className="text-xs" style={{ color: `${textColor}60` }}>
                    Works with UPC/EAN barcodes. Most accurate method.
                  </p>
                </>
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
              <div className="flex gap-2">
                <button
                  onClick={() => setShowStats(true)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                  📊 Stats
                </button>
                <button
                  onClick={() => setShowExport(true)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                  📤 Export
                </button>
                <button
                  onClick={() => setShowEditProfile(true)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: accentColor, color: primaryColor }}
                >
                  <Edit2 size={16} style={{ display: 'inline', marginRight: '4px' }} />
                  Edit
                </button>
              </div>
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
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowThemes(true)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                  🎨 Themes
                </button>
                <button onClick={() => setShowSettings(false)}>
                  <X size={24} style={{ color: accentColor }} />
                </button>
              </div>
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
                <label className="block text-sm mb-2" style={{ color: `${textColor}80` }}>Theme Colors (Custom)</label>
                <p className="text-xs mb-2" style={{ color: `${textColor}60` }}>
                  Or use pre-made themes above
                </p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => {
                        setPrimaryColor(e.target.value);
                        setCurrentTheme('custom');
                      }}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => {
                        setPrimaryColor(e.target.value);
                        setCurrentTheme('custom');
                      }}
                      className="flex-1 px-4 py-2 rounded-lg border text-sm"
                      style={{ borderColor: `${textColor}20` }}
                      placeholder="Background"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => {
                        setAccentColor(e.target.value);
                        setCurrentTheme('custom');
                      }}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => {
                        setAccentColor(e.target.value);
                        setCurrentTheme('custom');
                      }}
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

      {/* Themes Modal */}
      {showThemes && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 2001, overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '500px', backgroundColor: primaryColor, borderRadius: '12px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: textColor }}>🎨 Choose Theme</h2>
              <button onClick={() => setShowThemes(false)}>
                <X size={24} style={{ color: accentColor }} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {Object.entries(themes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => {
                    applyTheme(key);
                    setShowThemes(false);
                  }}
                  className="p-4 rounded-lg text-left transition-all"
                  style={{ 
                    backgroundColor: theme.primary,
                    border: `2px solid ${currentTheme === key ? theme.accent : 'transparent'}`,
                    boxShadow: currentTheme === key ? `0 0 0 2px ${theme.accent}40` : 'none'
                  }}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold" style={{ color: theme.text }}>
                      {theme.name}
                    </span>
                    {currentTheme === key && (
                      <span style={{ color: theme.accent }}>✓ Active</span>
                    )}
                  </div>
                  <div className="flex gap-2">
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

            <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: `${textColor}10` }}>
              <p className="text-xs" style={{ color: `${textColor}70` }}>
                💡 Tip: You can also customize colors manually in Settings
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStats && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 2000, overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: '500px', backgroundColor: primaryColor, borderRadius: '12px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: textColor }}>📊 Collection Statistics</h2>
              <button onClick={() => setShowStats(false)}>
                <X size={24} style={{ color: accentColor }} />
              </button>
            </div>

            {collection.length === 0 ? (
              <p style={{ color: `${textColor}60`, textAlign: 'center', padding: '40px 0' }}>
                No records in collection yet
              </p>
            ) : (() => {
              const stats = getStatistics();
              return (
                <div className="space-y-4">
                  {/* Overview */}
                  <div className="rounded-lg p-4" style={{ backgroundColor: `${textColor}08`, border: `1px solid ${textColor}15` }}>
                    <h3 className="font-semibold mb-3" style={{ color: textColor }}>Overview</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: `${textColor}70` }}>Total Records:</span>
                        <span className="font-bold" style={{ color: textColor }}>{collection.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: `${textColor}70` }}>With Prices:</span>
                        <span className="font-bold" style={{ color: textColor }}>{stats.currency && calculateCollectionValue().count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: `${textColor}70` }}>Average Price:</span>
                        <span className="font-bold" style={{ color: accentColor }}>
                          {stats.currency} {stats.avgPrice}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Most Expensive */}
                  {stats.mostExpensive && (
                    <div className="rounded-lg p-4" style={{ backgroundColor: `${textColor}08`, border: `1px solid ${textColor}15` }}>
                      <h3 className="font-semibold mb-3" style={{ color: textColor }}>💎 Most Expensive</h3>
                      <div className="flex gap-3">
                        {stats.mostExpensive.cover_image && (
                          <img
                            src={stats.mostExpensive.cover_image}
                            alt={stats.mostExpensive.title}
                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
                          />
                        )}
                        <div>
                          <p className="font-bold text-sm" style={{ color: textColor }}>
                            {stats.mostExpensive.title?.split(' - ')[0]}
                          </p>
                          <p className="text-xs mb-1" style={{ color: `${textColor}70` }}>
                            {stats.mostExpensive.title?.split(' - ')[1] || stats.mostExpensive.title}
                          </p>
                          <p className="font-bold" style={{ color: accentColor }}>
                            {stats.currency} {stats.mostExpensive.price.value.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cheapest */}
                  {stats.cheapest && (
                    <div className="rounded-lg p-4" style={{ backgroundColor: `${textColor}08`, border: `1px solid ${textColor}15` }}>
                      <h3 className="font-semibold mb-3" style={{ color: textColor }}>💰 Cheapest</h3>
                      <div className="flex gap-3">
                        {stats.cheapest.cover_image && (
                          <img
                            src={stats.cheapest.cover_image}
                            alt={stats.cheapest.title}
                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
                          />
                        )}
                        <div>
                          <p className="font-bold text-sm" style={{ color: textColor }}>
                            {stats.cheapest.title?.split(' - ')[0]}
                          </p>
                          <p className="text-xs mb-1" style={{ color: `${textColor}70` }}>
                            {stats.cheapest.title?.split(' - ')[1] || stats.cheapest.title}
                          </p>
                          <p className="font-bold" style={{ color: accentColor }}>
                            {stats.currency} {stats.cheapest.price.value.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Top Artist */}
                  {stats.topArtist && (
                    <div className="rounded-lg p-4" style={{ backgroundColor: `${textColor}08`, border: `1px solid ${textColor}15` }}>
                      <h3 className="font-semibold mb-2" style={{ color: textColor }}>🎤 Top Artist</h3>
                      <div className="flex justify-between items-center">
                        <span className="font-bold" style={{ color: textColor }}>{stats.topArtist[0]}</span>
                        <span className="text-sm" style={{ color: `${textColor}70` }}>
                          {stats.topArtist[1]} record{stats.topArtist[1] > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Top Genres */}
                  {stats.topGenres.length > 0 && (
                    <div className="rounded-lg p-4" style={{ backgroundColor: `${textColor}08`, border: `1px solid ${textColor}15` }}>
                      <h3 className="font-semibold mb-3" style={{ color: textColor }}>🎵 Top Genres</h3>
                      <div className="space-y-2">
                        {stats.topGenres.map(([genre, count]) => (
                          <div key={genre} className="flex justify-between items-center">
                            <span className="text-sm" style={{ color: textColor }}>{genre}</span>
                            <div className="flex items-center gap-2">
                              <div style={{ 
                                width: `${(count / collection.length) * 100}px`,
                                height: '8px',
                                backgroundColor: accentColor,
                                borderRadius: '4px',
                                maxWidth: '100px'
                              }} />
                              <span className="text-xs" style={{ color: `${textColor}70` }}>{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Decades */}
                  {stats.decadeList.length > 0 && (
                    <div className="rounded-lg p-4" style={{ backgroundColor: `${textColor}08`, border: `1px solid ${textColor}15` }}>
                      <h3 className="font-semibold mb-3" style={{ color: textColor }}>📅 By Decade</h3>
                      <div className="space-y-2">
                        {stats.decadeList.map(([decade, count]) => (
                          <div key={decade} className="flex justify-between items-center">
                            <span className="text-sm" style={{ color: textColor }}>{decade}s</span>
                            <div className="flex items-center gap-2">
                              <div style={{ 
                                width: `${(count / collection.length) * 100}px`,
                                height: '8px',
                                backgroundColor: accentColor,
                                borderRadius: '4px',
                                maxWidth: '100px'
                              }} />
                              <span className="text-xs" style={{ color: `${textColor}70` }}>{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExport && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 2000 }}>
          <div style={{ width: '100%', maxWidth: '400px', backgroundColor: primaryColor, borderRadius: '12px', padding: '24px' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: textColor }}>📤 Export & Share</h2>
              <button onClick={() => setShowExport(false)}>
                <X size={24} style={{ color: accentColor }} />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={exportToCSV}
                className="w-full py-3 rounded-lg font-semibold text-left px-4 flex items-center justify-between"
                style={{ backgroundColor: `${textColor}08`, border: `1px solid ${textColor}15`, color: textColor }}
              >
                <span>Export as CSV</span>
                <span className="text-xs" style={{ color: `${textColor}60` }}>Excel compatible</span>
              </button>

              <button
                onClick={exportToJSON}
                className="w-full py-3 rounded-lg font-semibold text-left px-4 flex items-center justify-between"
                style={{ backgroundColor: `${textColor}08`, border: `1px solid ${textColor}15`, color: textColor }}
              >
                <span>Export as JSON</span>
                <span className="text-xs" style={{ color: `${textColor}60` }}>Backup format</span>
              </button>

              <button
                onClick={copyShareableText}
                className="w-full py-3 rounded-lg font-semibold"
                style={{ backgroundColor: accentColor, color: primaryColor }}
              >
                📋 Copy Collection Summary
              </button>

              <div className="rounded-lg p-4 mt-4" style={{ backgroundColor: `${textColor}08`, border: `1px solid ${textColor}15` }}>
                <p className="text-xs mb-2" style={{ color: `${textColor}70` }}>Preview:</p>
                <pre className="text-xs whitespace-pre-wrap" style={{ color: textColor }}>
                  {generateShareableText()}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
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
