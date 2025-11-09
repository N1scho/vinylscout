import React, { useState, useEffect, useRef } from 'react';
import { Search, Camera, Music, User, Settings, X, RefreshCw, Heart, Grid, List, DollarSign, TrendingUp, TrendingDown, Minus, Plus, ChevronLeft, ChevronRight, Info, ExternalLink } from 'lucide-react';

const VinylScout = () => {
  // Logo Configuration - Vite serves files from /public at the root
  const LOGO_PATH = "/VinylScoutLogo.png";

  // Add Google Fonts Inter
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  // Core State
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedSearch, setAdvancedSearch] = useState({
    artist: '', album: '', year: '', label: '', genre: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [resultPrices, setResultPrices] = useState({});
  const [refreshingPrices, setRefreshingPrices] = useState({});
  const [priceChanges, setPriceChanges] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [collection, setCollection] = useState([]);
  const [sortBy, setSortBy] = useState('artist-asc');
  const [collectionView, setCollectionView] = useState('grid');
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [isRescanning, setIsRescanning] = useState(false);
  const [rescanProgress, setRescanProgress] = useState({ current: 0, total: 0 });
  const [showValueModal, setShowValueModal] = useState(false);
  
  // Settings & Theme
  const [discogsToken, setDiscogsToken] = useState('');
  const [anthropicToken, setAnthropicToken] = useState('');
  const [currentTheme, setCurrentTheme] = useState('classicVinyl');
  const [selectedShops, setSelectedShops] = useState(['discogs', 'hhv', 'ebay']);
  
  // Camera State
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Custom colors state
  const [customColors, setCustomColors] = useState({
    primary: '#1a1a1a',
    secondary: '#ffffff',
    accent: '#ff6b6b'
  });

  // Theme System
  const getThemes = () => ({
    classicVinyl: {
      name: 'Classic Vinyl',
      primary: '#1a1a1a',
      primaryHover: '#000000',
      secondary: '#8b0000',
      background: '#f5f5dc',
      surface: '#fffaf0',
      surfaceVariant: '#f5e6d3',
      text: '#1a1a1a',
      textSecondary: '#666666',
      border: '#d4c5a9',
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      shadow: '0 2px 4px rgba(0,0,0,0.1)',
      shadowLg: '0 10px 25px rgba(0,0,0,0.15)',
      gradient: 'linear-gradient(135deg, #1a1a1a 0%, #8b0000 100%)',
    },
    neonNights: {
      name: 'Neon Nights',
      primary: '#ff006e',
      primaryHover: '#d90060',
      secondary: '#8338ec',
      background: '#0a0e27',
      surface: '#1a1f3a',
      surfaceVariant: '#2a2f4a',
      text: '#ffffff',
      textSecondary: '#b8b8d1',
      border: '#3a3f5a',
      success: '#06ffa5',
      error: '#ff006e',
      warning: '#ffbe0b',
      shadow: '0 4px 12px rgba(255,0,110,0.3)',
      shadowLg: '0 10px 30px rgba(255,0,110,0.4)',
      gradient: 'linear-gradient(135deg, #ff006e 0%, #8338ec 100%)',
    },
    retroWave: {
      name: 'Retro Wave',
      primary: '#f72585',
      primaryHover: '#d61e6f',
      secondary: '#4cc9f0',
      background: '#7209b7',
      surface: '#560bad',
      surfaceVariant: '#480ca8',
      text: '#ffffff',
      textSecondary: '#f0e6ff',
      border: '#3a0ca3',
      success: '#06ffa5',
      error: '#f72585',
      warning: '#ffbe0b',
      shadow: '0 4px 12px rgba(247,37,133,0.3)',
      shadowLg: '0 10px 30px rgba(247,37,133,0.4)',
      gradient: 'linear-gradient(135deg, #f72585 0%, #4cc9f0 100%)',
    },
    spotifyStyle: {
      name: 'Spotify Style',
      primary: '#1db954',
      primaryHover: '#1ed760',
      secondary: '#191414',
      background: '#121212',
      surface: '#181818',
      surfaceVariant: '#282828',
      text: '#ffffff',
      textSecondary: '#b3b3b3',
      border: '#282828',
      success: '#1db954',
      error: '#ef4444',
      warning: '#f59e0b',
      shadow: '0 2px 8px rgba(0,0,0,0.6)',
      shadowLg: '0 10px 30px rgba(0,0,0,0.7)',
      gradient: 'linear-gradient(135deg, #1db954 0%, #191414 100%)',
    },
    vintageVinyl: {
      name: 'Vintage Vinyl',
      primary: '#8b4513',
      primaryHover: '#654321',
      secondary: '#d2691e',
      background: '#f4e4c1',
      surface: '#fffaf0',
      surfaceVariant: '#faebd7',
      text: '#3e2723',
      textSecondary: '#795548',
      border: '#d4a574',
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      shadow: '0 2px 8px rgba(139,69,19,0.2)',
      shadowLg: '0 10px 25px rgba(139,69,19,0.3)',
      gradient: 'linear-gradient(135deg, #8b4513 0%, #d2691e 100%)',
    },
    minimalLight: {
      name: 'Minimal Light',
      primary: '#2563eb',
      primaryHover: '#1d4ed8',
      secondary: '#7c3aed',
      background: '#f8fafc',
      surface: '#ffffff',
      surfaceVariant: '#f1f5f9',
      text: '#0f172a',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      shadow: '0 1px 3px rgba(0,0,0,0.1)',
      shadowLg: '0 10px 25px rgba(0,0,0,0.1)',
      gradient: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
    },
    sunsetVibes: {
      name: 'Sunset Vibes',
      primary: '#f72585',
      primaryHover: '#d61e6f',
      secondary: '#7209b7',
      background: '#3a0ca3',
      surface: '#4361ee',
      surfaceVariant: '#4cc9f0',
      text: '#ffffff',
      textSecondary: '#f0e6ff',
      border: '#560bad',
      success: '#06ffa5',
      error: '#f72585',
      warning: '#ffbe0b',
      shadow: '0 4px 12px rgba(247,37,133,0.3)',
      shadowLg: '0 10px 30px rgba(247,37,133,0.4)',
      gradient: 'linear-gradient(135deg, #f72585 0%, #7209b7 100%)',
    },
    custom: {
      name: 'Custom',
      primary: customColors.primary,
      primaryHover: customColors.primary,
      secondary: customColors.accent,
      background: customColors.secondary,
      surface: customColors.secondary,
      surfaceVariant: customColors.primary,
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.7)',
      border: customColors.primary,
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      shadow: `0 2px 4px ${customColors.primary}40`,
      shadowLg: `0 10px 25px ${customColors.primary}40`,
      gradient: `linear-gradient(135deg, ${customColors.primary} 0%, ${customColors.accent} 100%)`,
    }
  });

  const themes = getThemes();
  const theme = themes[currentTheme] || themes.classicVinyl;

  // Load data from localStorage with migration
  useEffect(() => {
    // Migration from V1
    const oldCollection = localStorage.getItem('collection');
    if (oldCollection && !localStorage.getItem('vinylCollection')) {
      localStorage.setItem('vinylCollection', oldCollection);
    }
    
    const oldTheme = localStorage.getItem('selectedTheme');
    if (oldTheme && !localStorage.getItem('appTheme')) {
      localStorage.setItem('appTheme', oldTheme);
    }
    
    const oldPrimary = localStorage.getItem('primaryColor');
    const oldSecondary = localStorage.getItem('secondaryColor');
    const oldAccent = localStorage.getItem('accentColor');
    
    if (oldPrimary && oldSecondary && oldAccent && !localStorage.getItem('customColors')) {
      localStorage.setItem('customColors', JSON.stringify({
        primary: oldPrimary,
        secondary: oldSecondary,
        accent: oldAccent
      }));
    }
    
    // Load settings
    const saved = {
      collection: localStorage.getItem('vinylCollection'),
      token: localStorage.getItem('discogsToken'),
      anthropic: localStorage.getItem('anthropicToken'),
      theme: localStorage.getItem('appTheme'),
      colors: localStorage.getItem('customColors'),
      shops: localStorage.getItem('selectedShops')
    };
    
    if (saved.collection) setCollection(JSON.parse(saved.collection));
    if (saved.token) setDiscogsToken(saved.token);
    if (saved.anthropic) setAnthropicToken(saved.anthropic);
    if (saved.theme) setCurrentTheme(saved.theme);
    if (saved.colors) setCustomColors(JSON.parse(saved.colors));
    if (saved.shops) setSelectedShops(JSON.parse(saved.shops));
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (collection.length > 0) {
      localStorage.setItem('vinylCollection', JSON.stringify(collection));
    }
  }, [collection]);

  useEffect(() => {
    localStorage.setItem('appTheme', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    localStorage.setItem('customColors', JSON.stringify(customColors));
  }, [customColors]);

  useEffect(() => {
    localStorage.setItem('selectedShops', JSON.stringify(selectedShops));
  }, [selectedShops]);

  // Discogs API Functions
  const searchDiscogs = async (isAdvanced = false, queryOverride = null) => {
    if (!discogsToken) {
      alert('Please set your Discogs API token in Settings');
      setActiveTab('settings');
      return;
    }

    setIsLoading(true);
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
          alert('Please fill in at least one field');
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

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      const results = data.results || [];
      setSearchResults(results);
      setCurrentPage(data.pagination?.page || 1);
      setTotalPages(data.pagination?.pages || 1);
      
      if (results.length > 0) {
        fetchAllPrices(results);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please check your API token.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPriceInfo = async (releaseId) => {
    if (!discogsToken) return null;
    try {
      const response = await fetch(
        `https://api.discogs.com/marketplace/stats/${releaseId}`,
        {
          headers: {
            'Authorization': `Discogs token=${discogsToken}`,
            'User-Agent': 'VinylScout/1.0'
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.lowest_price && data.num_for_sale > 0) {
          return {
            value: data.lowest_price.value,
            currency: data.lowest_price.currency,
            num_for_sale: data.num_for_sale,
            stats: data
          };
        }
      }
    } catch (error) {
      console.error('Price error:', error);
    }
    return null;
  };

  const fetchAllPrices = async (results) => {
    const prices = {};
    for (const result of results.slice(0, 10)) {
      const priceData = await fetchPriceInfo(result.id);
      if (priceData) prices[result.id] = priceData;
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    setResultPrices(prices);
  };

  const refreshPrice = async (itemId, isCollectionItem = false) => {
    if (!discogsToken) {
      alert('Please add your Discogs API token in Settings');
      return;
    }
    
    let oldPrice = null;
    if (resultPrices[itemId]) {
      oldPrice = resultPrices[itemId].value;
    } else if (isCollectionItem) {
      const item = collection.find(i => i.id === itemId);
      if (item && item.price) {
        oldPrice = item.price.value;
      }
    }
    
    setRefreshingPrices(prev => ({ ...prev, [itemId]: true }));
    
    try {
      const priceData = await fetchPriceInfo(itemId);
      
      if (priceData) {
        if (oldPrice !== null) {
          const change = priceData.value - oldPrice;
          setPriceChanges(prev => ({
            ...prev,
            [itemId]: {
              amount: change,
              currency: priceData.currency
            }
          }));
          
          setTimeout(() => {
            setPriceChanges(prev => {
              const newChanges = { ...prev };
              delete newChanges[itemId];
              return newChanges;
            });
          }, 5000);
        }
        
        setResultPrices(prev => ({
          ...prev,
          [itemId]: priceData
        }));
        
        if (isCollectionItem) {
          const newCollection = collection.map(item => {
            if (item.id === itemId) {
              return {
                ...item,
                price: { value: priceData.value, currency: priceData.currency }
              };
            }
            return item;
          });
          setCollection(newCollection);
          localStorage.setItem('vinylCollection', JSON.stringify(newCollection));
        }
      } else {
        alert('No price data available');
      }
    } catch (error) {
      alert(`Error refreshing price: ${error.message}`);
    }
    
    setRefreshingPrices(prev => ({ ...prev, [itemId]: false }));
  };

  const getDetailedInfo = async (releaseId) => {
    if (!discogsToken) return null;

    try {
      const response = await fetch(
        `https://api.discogs.com/releases/${releaseId}`,
        {
          headers: {
            'Authorization': `Discogs token=${discogsToken}`,
            'User-Agent': 'VinylScout/1.0'
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch details');
      return await response.json();
    } catch (error) {
      console.error('Error fetching details:', error);
      return null;
    }
  };

  const getMarketPrice = async (releaseId) => {
    if (!discogsToken) return null;

    try {
      const response = await fetch(
        `https://api.discogs.com/marketplace/stats/${releaseId}`,
        {
          headers: {
            'Authorization': `Discogs token=${discogsToken}`,
            'User-Agent': 'VinylScout/1.0'
          }
        }
      );

      if (!response.ok) return null;
      const data = await response.json();
      return data.lowest_price || null;
    } catch (error) {
      console.error('Error fetching price:', error);
      return null;
    }
  };

  // Collection Functions
  const addToCollection = async (item) => {
    const priceData = resultPrices[item.id];
    const itemWithPrice = {
      ...item,
      price: priceData ? { value: priceData.value, currency: priceData.currency } : null,
      addedAt: new Date().toISOString(),
      isFavorite: false
    };
    const newCollection = [...collection, itemWithPrice];
    setCollection(newCollection);
    localStorage.setItem('vinylCollection', JSON.stringify(newCollection));
    setSelectedResult(null);
    alert('Added to collection!');
  };

  const toggleFavorite = (itemId) => {
    setCollection(prev => prev.map(item => 
      item.id === itemId ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  };

  const removeFromCollection = (itemId) => {
    if (confirm('Remove this item from your collection?')) {
      setCollection(prev => prev.filter(item => item.id !== itemId));
    }
  };

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
      case 'album-asc':
        return sorted.sort((a, b) => {
          const aAlbum = (a.title?.split(' - ')[1] || a.title || '').toLowerCase();
          const bAlbum = (b.title?.split(' - ')[1] || b.title || '').toLowerCase();
          return aAlbum.localeCompare(bAlbum);
        });
      case 'album-desc':
        return sorted.sort((a, b) => {
          const aAlbum = (a.title?.split(' - ')[1] || a.title || '').toLowerCase();
          const bAlbum = (b.title?.split(' - ')[1] || b.title || '').toLowerCase();
          return bAlbum.localeCompare(aAlbum);
        });
      case 'price-asc':
        return sorted.sort((a, b) => (a.price?.value || 0) - (b.price?.value || 0));
      case 'price-desc':
        return sorted.sort((a, b) => (b.price?.value || 0) - (a.price?.value || 0));
      default:
        return sorted;
    }
  };

  const filterCollection = (items, filter) => {
    return filter === 'favorites' ? items.filter(item => item.isFavorite) : items;
  };

  const calculateCollectionValue = () => {
    let total = 0, count = 0, currency = 'EUR';
    collection.forEach(item => {
      if (item.price && item.price.value && typeof item.price.value === 'number') {
        total += item.price.value;
        count++;
        if (item.price.currency) currency = item.price.currency;
      }
    });
    return { value: total.toFixed(2), currency, count };
  };

  const sortedCollection = sortCollection(filterCollection(collection, collectionFilter), sortBy);

  // Camera Functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraStream(stream);
        setIsCameraActive(true);
      }
    } catch (error) {
      alert('Could not access camera');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setIsCameraActive(false);
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      setCapturedImage(canvas.toDataURL('image/jpeg'));
      stopCamera();
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;

    if (!anthropicToken) {
      alert('Please set your Anthropic API token in Settings');
      setActiveTab('settings');
      return;
    }

    setIsAnalyzing(true);
    try {
      const base64Data = capturedImage.split(',')[1];
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicToken,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Data
                }
              },
              {
                type: 'text',
                text: 'Analyze this vinyl record album cover. Provide the artist name and album title in this exact JSON format: {"artist": "Artist Name", "album": "Album Title"}. ONLY return valid JSON, nothing else.'
              }
            ]
          }]
        })
      });

      const data = await response.json();
      let responseText = data.content[0].text;
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const result = JSON.parse(responseText);
      setSearchQuery(`${result.artist} ${result.album}`);
      setActiveTab('search');
      await searchDiscogs(false, `${result.artist} ${result.album}`);
      
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze image. Please check your Anthropic API token.');
    } finally {
      setIsAnalyzing(false);
      setCapturedImage(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'camera' && !isCameraActive && !capturedImage) {
      startCamera();
    } else if (activeTab !== 'camera') {
      stopCamera();
    }
    
    return () => stopCamera();
  }, [activeTab]);

  const toggleShop = (shop) => {
    setSelectedShops(prev => 
      prev.includes(shop) ? prev.filter(s => s !== shop) : [...prev, shop]
    );
  };

  // Styles with Inter Font
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: theme.background,
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: '80px',
      color: theme.text
    },
    header: {
      background: theme.gradient,
      color: 'white',
      padding: '20px',
      boxShadow: theme.shadowLg,
      position: 'sticky',
      top: 0,
      zIndex: 50,
      position: 'relative',
      overflow: 'hidden'
    },
    headerPattern: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.08,
      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)',
      pointerEvents: 'none'
    },
    headerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    logo: {
      maxWidth: '100%',
      width: 'auto',
      height: '80px',
      objectFit: 'contain',
      filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
    },
    content: {
      padding: '12px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: '16px',
      padding: '16px',
      marginBottom: '12px',
      boxShadow: theme.shadow,
      border: `1px solid ${theme.border}`,
      transition: 'all 0.2s ease'
    },
    button: {
      backgroundColor: theme.primary,
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '12px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      boxShadow: theme.shadow,
      fontFamily: '"Inter", sans-serif'
    },
    buttonSecondary: {
      backgroundColor: theme.surfaceVariant,
      color: theme.text,
      border: `1px solid ${theme.border}`
    },
    input: {
      width: '100%',
      padding: '14px 16px',
      borderRadius: '12px',
      border: `2px solid ${theme.border}`,
      fontSize: '15px',
      backgroundColor: theme.surface,
      color: theme.text,
      transition: 'all 0.2s ease',
      outline: 'none',
      fontFamily: '"Inter", sans-serif'
    },
    bottomNav: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.surface,
      borderTop: `1px solid ${theme.border}`,
      display: 'flex',
      justifyContent: 'space-around',
      padding: '12px 0 8px',
      boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
      zIndex: 100
    },
    navButton: {
      backgroundColor: 'transparent',
      border: 'none',
      padding: '8px 16px',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      color: theme.textSecondary,
      fontSize: '11px',
      fontWeight: '600',
      transition: 'all 0.2s ease',
      borderRadius: '12px',
      fontFamily: '"Inter", sans-serif'
    },
    navButtonActive: {
      color: theme.primary,
      backgroundColor: theme.surfaceVariant
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: theme.textSecondary
    },
    loadingSpinner: {
      border: `3px solid ${theme.border}`,
      borderTop: `3px solid ${theme.primary}`,
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      animation: 'spin 1s linear infinite',
      margin: '20px auto'
    }
  };

  // Render Functions
  const renderSearch = () => (
    <div style={styles.content}>
      <div style={styles.card}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Quick search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchDiscogs(false)}
            style={styles.input}
          />
          <button
            onClick={() => searchDiscogs(false)}
            style={styles.button}
            disabled={isLoading}
          >
            <Search size={20} />
          </button>
        </div>

        <button
          onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
          style={{
            ...styles.button,
            ...styles.buttonSecondary,
            width: '100%',
            marginBottom: showAdvancedSearch ? '16px' : 0,
            justifyContent: 'space-between'
          }}
        >
          <span>Advanced Search</span>
          <span>{showAdvancedSearch ? '▲' : '▼'}</span>
        </button>

        {showAdvancedSearch && (
          <div style={{ ...styles.card, marginBottom: '16px', padding: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'artist', label: 'Artist' },
                { key: 'album', label: 'Album' },
                { key: 'year', label: 'Year' },
                { key: 'label', label: 'Label' },
                { key: 'genre', label: 'Genre' }
              ].map(field => (
                <input
                  key={field.key}
                  type="text"
                  placeholder={field.label}
                  value={advancedSearch[field.key]}
                  onChange={(e) => setAdvancedSearch({
                    ...advancedSearch,
                    [field.key]: e.target.value
                  })}
                  style={styles.input}
                />
              ))}
              <button
                onClick={() => searchDiscogs(true)}
                disabled={isLoading}
                style={styles.button}
              >
                {isLoading ? 'Searching...' : 'Search with Filters'}
              </button>
            </div>
          </div>
        )}

        {isLoading && <div style={styles.loadingSpinner} />}

        {searchResults.length > 0 && (
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {searchResults.map((result) => {
              const priceData = resultPrices[result.id];
              return (
                <div
                  key={result.id}
                  style={{
                    ...styles.card,
                    display: 'flex',
                    gap: '16px',
                    cursor: 'pointer',
                    padding: '16px'
                  }}
                  onClick={() => setSelectedResult(result)}
                >
                  <img
                    src={result.cover_image || '/placeholder.png'}
                    alt={result.title}
                    style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', backgroundColor: theme.surfaceVariant }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: theme.text }}>
                      {result.title?.split(' - ')[0]?.replace(/\s*\(\d+\)\s*$/, '') || 'Unknown Artist'}
                    </h3>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: theme.textSecondary }}>
                      {result.title?.split(' - ')[1] || result.title || 'Unknown Album'}
                    </p>
                    
                    {priceData && priceData.value ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: theme.primary }}>
                          {priceData.currency} {priceData.value.toFixed(2)}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            refreshPrice(result.id, false);
                          }}
                          disabled={refreshingPrices[result.id]}
                          style={{
                            backgroundColor: theme.surfaceVariant,
                            border: `1px solid ${theme.primary}`,
                            borderRadius: '6px',
                            cursor: refreshingPrices[result.id] ? 'wait' : 'pointer',
                            opacity: refreshingPrices[result.id] ? 0.5 : 1,
                            color: theme.primary,
                            width: '24px',
                            height: '24px',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <RefreshCw 
                            size={12} 
                            className={refreshingPrices[result.id] ? 'animate-spin' : ''}
                          />
                        </button>
                        {priceChanges[result.id] && (
                          <div 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor: priceChanges[result.id].amount > 0 ? '#ef444420' : '#22c55e20',
                              color: priceChanges[result.id].amount > 0 ? '#ef4444' : '#22c55e',
                              border: `1px solid ${priceChanges[result.id].amount > 0 ? '#ef4444' : '#22c55e'}`
                            }}
                          >
                            {priceChanges[result.id].amount > 0 ? '↑' : '↓'}
                            <span>
                              {priceChanges[result.id].amount > 0 ? '+' : ''}
                              {priceChanges[result.id].amount.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: '11px', color: theme.textSecondary }}>Loading price...</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCollection(result);
                    }}
                    style={{ ...styles.button, padding: '8px 16px', flexShrink: 0 }}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && searchResults.length === 0 && searchQuery && (
          <div style={styles.emptyState}>
            <Music size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p>No results found</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCamera = () => (
    <div style={styles.content}>
      <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
        {!capturedImage ? (
          <>
            <div style={{ position: 'relative', height: '60vh', backgroundColor: '#000' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {!isCameraActive && (
                <div style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <p>Starting camera...</p>
                </div>
              )}
              {isCameraActive && (
                <button
                  onClick={captureImage}
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    border: `4px solid ${theme.primary}`,
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Camera size={32} style={{ color: theme.primary }} />
                </button>
              )}
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </>
        ) : (
          <>
            <img src={capturedImage} alt="Captured" style={{ width: '100%', display: 'block' }} />
            <div style={{ padding: '20px', display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setCapturedImage(null)}
                style={{ ...styles.button, ...styles.buttonSecondary, flex: 1 }}
              >
                <X size={20} />
                Retake
              </button>
              <button
                onClick={analyzeImage}
                disabled={isAnalyzing}
                style={{ ...styles.button, flex: 1 }}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </>
        )}
      </div>

      <div style={{ ...styles.card, marginTop: '16px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '17px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={20} />
          AI Camera Search
        </h3>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: theme.textSecondary, lineHeight: '1.6' }}>
          Take a photo of any vinyl album cover. Our AI will identify the artist and album, then automatically search for it.
        </p>
        {anthropicToken ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: theme.success }} />
            <p style={{ margin: 0, fontSize: '12px', color: theme.success, fontWeight: '600' }}>AI Ready</p>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: theme.error }} />
            <p style={{ margin: 0, fontSize: '12px', color: theme.error, fontWeight: '600' }}>Add Anthropic token in Settings</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCollection = () => (
    <div style={styles.content}>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            My Collection
            <span style={{ marginLeft: '8px', backgroundColor: theme.primary, color: 'white', borderRadius: '12px', padding: '2px 10px', fontSize: '14px', fontWeight: '600' }}>
              {sortedCollection.length}
            </span>
          </h2>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value)}
              style={{ ...styles.input, width: 'auto', padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="all">All ({collection.length})</option>
              <option value="favorites">Favorites ({collection.filter(i => i.isFavorite).length})</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ ...styles.input, width: 'auto', padding: '8px 12px', fontSize: '13px' }}
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
              style={{ ...styles.input, width: 'auto', padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="grid">Grid</option>
              <option value="list">List</option>
            </select>
          </div>
        </div>

        {collection.length === 0 ? (
          <div style={styles.emptyState}>
            <Music size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p>Your collection is empty</p>
            <p style={{ fontSize: '14px' }}>Start adding vinyl records to track their value!</p>
          </div>
        ) : (
          <div style={collectionView === 'grid' ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' } : { display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sortedCollection.map((item) => (
              <div 
                key={item.id} 
                style={collectionView === 'grid' ? {
                  ...styles.card,
                  padding: '12px',
                  cursor: 'pointer'
                } : {
                  ...styles.card,
                  padding: '16px',
                  display: 'flex',
                  gap: '16px',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedResult(item)}
              >
                {collectionView === 'grid' ? (
                  <>
                    <div style={{ position: 'relative', width: '100%', paddingTop: '100%', marginBottom: '12px' }}>
                      <img 
                        src={item.cover_image || '/placeholder.png'} 
                        alt={item.title} 
                        style={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          backgroundColor: theme.surfaceVariant
                        }} 
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
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: theme.shadow
                        }}
                      >
                        <Heart size={16} fill={item.isFavorite ? theme.error : 'none'} color={item.isFavorite ? theme.error : theme.text} />
                      </button>
                    </div>
                    
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title?.split(' - ')[0] || 'Unknown'}
                    </h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: theme.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title?.split(' - ')[1] || item.title}
                    </p>
                    
                    {item.price && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600', color: theme.primary }}>
                        <span>{item.price.currency} {item.price.value.toFixed(2)}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            refreshPrice(item.id, true);
                          }}
                          disabled={refreshingPrices[item.id]}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: refreshingPrices[item.id] ? 'wait' : 'pointer',
                            opacity: refreshingPrices[item.id] ? 0.5 : 1,
                            padding: '2px',
                            display: 'flex'
                          }}
                        >
                          <RefreshCw 
                            size={12} 
                            color={theme.primary}
                            className={refreshingPrices[item.id] ? 'animate-spin' : ''}
                          />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <img 
                      src={item.cover_image || '/placeholder.png'} 
                      alt={item.title} 
                      style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', backgroundColor: theme.surfaceVariant, flexShrink: 0 }} 
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600' }}>
                        {item.title?.split(' - ')[0] || 'Unknown'}
                      </h4>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: theme.textSecondary }}>
                        {item.title?.split(' - ')[1] || item.title}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: theme.textSecondary }}>
                        {item.year || '-'} • {item.format?.[0] || 'Vinyl'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                      {item.price && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', fontWeight: '600', color: theme.primary }}>
                          <span>{item.price.currency} {item.price.value.toFixed(2)}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              refreshPrice(item.id, true);
                            }}
                            disabled={refreshingPrices[item.id]}
                            style={{
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: refreshingPrices[item.id] ? 'wait' : 'pointer',
                              opacity: refreshingPrices[item.id] ? 0.5 : 1,
                              padding: '4px',
                              display: 'flex'
                            }}
                          >
                            <RefreshCw 
                              size={14} 
                              color={theme.primary}
                              className={refreshingPrices[item.id] ? 'animate-spin' : ''}
                            />
                          </button>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id);
                        }}
                        style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        <Heart size={20} fill={item.isFavorite ? theme.error : 'none'} color={item.isFavorite ? theme.error : theme.textSecondary} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderProfile = () => {
    const { value, currency, count } = calculateCollectionValue();
    const totalItems = collection.length;
    const favoriteItems = collection.filter(i => i.isFavorite).length;
    const avgValue = count > 0 ? (parseFloat(value) / count).toFixed(2) : '0.00';

    return (
      <div style={styles.content}>
        <div style={styles.card}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>Collection Stats</h2>
          
          <div 
            style={{ ...styles.card, marginBottom: '20px', cursor: 'pointer' }}
            onClick={() => setShowValueModal(true)}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>Collection Value</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: theme.textSecondary }}>Total:</span>
              <span style={{ fontSize: '32px', fontWeight: '700', color: theme.primary }}>
                {currency} {value}
              </span>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: theme.textSecondary }}>
              Based on {count} of {totalItems} records
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: theme.primary, textAlign: 'center', fontWeight: '600' }}>
              👆 Tap for details
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ ...styles.card, textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: theme.primary, marginBottom: '8px' }}>
                {totalItems}
              </div>
              <div style={{ fontSize: '14px', color: theme.textSecondary }}>Total Albums</div>
            </div>
            
            <div style={{ ...styles.card, textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: theme.secondary, marginBottom: '8px' }}>
                {currency} {avgValue}
              </div>
              <div style={{ fontSize: '14px', color: theme.textSecondary }}>Avg. Value</div>
            </div>
            
            <div style={{ ...styles.card, textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: theme.error, marginBottom: '8px' }}>
                {favoriteItems}
              </div>
              <div style={{ fontSize: '14px', color: theme.textSecondary }}>Favorites</div>
            </div>
            
            <div style={{ ...styles.card, textAlign: 'center' }}>
              <div style={{ fontSize: '32px', fontWeight: '700', color: theme.success, marginBottom: '8px' }}>
                {count}
              </div>
              <div style={{ fontSize: '14px', color: theme.textSecondary }}>With Prices</div>
            </div>
          </div>

          <h3 style={{ margin: '24px 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Recent Activity</h3>
          
          {collection.slice(0, 5).map((item) => (
            <div key={item.id} style={{ ...styles.card, padding: '12px', marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <img src={item.cover_image || '/placeholder.png'} alt={item.title} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>{item.title?.split(' - ')[0] || 'Unknown'}</div>
                <div style={{ fontSize: '12px', color: theme.textSecondary }}>{item.title?.split(' - ')[1] || item.title}</div>
              </div>
              {item.price && (
                <div style={{ fontSize: '14px', fontWeight: '600', color: theme.primary }}>
                  {item.price.currency} {item.price.value.toFixed(2)}
                </div>
              )}
            </div>
          ))}

          {collection.length === 0 && (
            <div style={styles.emptyState}>
              <Music size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p>No collection data yet</p>
              <p style={{ fontSize: '14px' }}>Start adding vinyl records!</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div style={styles.content}>
      <div style={styles.card}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600' }}>Settings</h2>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: theme.text }}>
            Discogs API Token
          </label>
          <input
            type="text"
            placeholder="Enter your Discogs API token"
            value={discogsToken}
            onChange={(e) => {
              setDiscogsToken(e.target.value);
              localStorage.setItem('discogsToken', e.target.value);
            }}
            style={styles.input}
          />
          <a 
            href="https://www.discogs.com/settings/developers" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '12px', color: theme.primary, textDecoration: 'none' }}
          >
            Get token <ExternalLink size={12} />
          </a>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: theme.text }}>
            Anthropic API Token
          </label>
          <input
            type="password"
            placeholder="Enter your Anthropic API token"
            value={anthropicToken}
            onChange={(e) => {
              setAnthropicToken(e.target.value);
              localStorage.setItem('anthropicToken', e.target.value);
            }}
            style={styles.input}
          />
          <a 
            href="https://console.anthropic.com/settings/keys" 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px', fontSize: '12px', color: theme.primary, textDecoration: 'none' }}
          >
            Get token <ExternalLink size={12} />
          </a>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: theme.text }}>
            App Theme
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {Object.entries(themes).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setCurrentTheme(key)}
                style={{
                  backgroundColor: theme.surface,
                  padding: '16px',
                  cursor: 'pointer',
                  border: currentTheme === key ? `2px solid ${theme.primary}` : `1px solid ${theme.border}`,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  boxShadow: theme.shadow
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: t.gradient, flexShrink: 0 }} />
                <span style={{ fontSize: '14px', fontWeight: '600', color: theme.text, textAlign: 'left' }}>{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {currentTheme === 'custom' && (
          <div style={{ ...styles.card, marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>Custom Colors</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { key: 'primary', label: 'Primary Color' },
                { key: 'secondary', label: 'Background Color' },
                { key: 'accent', label: 'Accent Color' }
              ].map(({ key, label }) => (
                <div key={key}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: theme.text }}>
                    {label}
                  </label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={customColors[key]}
                      onChange={(e) => setCustomColors({ ...customColors, [key]: e.target.value })}
                      style={{ width: '60px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      value={customColors[key]}
                      onChange={(e) => setCustomColors({ ...customColors, [key]: e.target.value })}
                      style={{ ...styles.input, flex: 1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ ...styles.card, marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: theme.text }}>
            Price Sources
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { id: 'discogs', name: 'Discogs', note: 'API available' },
              { id: 'hhv', name: 'HHV Store', note: 'Manual' },
              { id: 'ebay', name: 'eBay', note: 'Manual' }
            ].map(shop => (
              <label key={shop.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={selectedShops.includes(shop.id)} 
                  onChange={() => toggleShop(shop.id)} 
                  style={{ width: '20px', height: '20px', accentColor: theme.primary, cursor: 'pointer' }} 
                />
                <span style={{ flex: 1, fontSize: '14px', color: theme.text, fontWeight: '500' }}>{shop.name}</span>
                <span style={{ fontSize: '12px', color: theme.textSecondary }}>{shop.note}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>About VinylScout</h3>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: theme.textSecondary, lineHeight: '1.6' }}>
            Track your vinyl collection and monitor market values with real-time Discogs pricing data. Use AI-powered camera recognition to identify albums instantly.
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: theme.textSecondary }}>
            Version 2.0 • Progressive Web App
          </p>
        </div>
      </div>
    </div>
  );

  // Detail Modal
  const renderDetailModal = () => {
    if (!selectedResult) return null;

    const item = collection.find(i => i.id === selectedResult.id) || selectedResult;
    const isInCollection = collection.some(i => i.id === selectedResult.id);
    const priceData = resultPrices[selectedResult.id] || item.price;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        overflowY: 'auto'
      }}>
        <div style={{
          backgroundColor: theme.surface,
          borderRadius: '20px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: theme.shadowLg
        }}>
          <div style={{ position: 'relative' }}>
            <img
              src={item.cover_image || item.imageUrl || '/placeholder.png'}
              alt={item.album || item.title}
              style={{ width: '100%', borderRadius: '20px 20px 0 0', display: 'block' }}
            />
            <button
              onClick={() => setSelectedResult(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255,255,255,0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: theme.shadow
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '24px' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700' }}>
              {item.title?.split(' - ')[0]?.replace(/\s*\(\d+\)\s*$/, '') || 'Unknown Artist'}
            </h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '18px', color: theme.textSecondary }}>
              {item.title?.split(' - ')[1] || item.title || 'Unknown Album'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: theme.textSecondary, fontWeight: '600' }}>Year</p>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{item.year || 'Unknown'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: theme.textSecondary, fontWeight: '600' }}>Format</p>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{item.format?.[0] || 'Vinyl'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: theme.textSecondary, fontWeight: '600' }}>Country</p>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{item.country || '-'}</p>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: theme.textSecondary, fontWeight: '600' }}>Label</p>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{item.label?.[0] || '-'}</p>
              </div>
            </div>

            {priceData && (
              <div style={{ ...styles.card, marginBottom: '24px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: theme.textSecondary, fontWeight: '600' }}>Market Price</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: theme.primary }}>
                    {priceData.currency || 'EUR'} {priceData.value ? priceData.value.toFixed(2) : priceData.toFixed(2)}
                  </p>
                  <button
                    onClick={() => refreshPrice(item.id, isInCollection)}
                    disabled={refreshingPrices[item.id]}
                    style={{
                      ...styles.button,
                      padding: '12px',
                      opacity: refreshingPrices[item.id] ? 0.5 : 1
                    }}
                  >
                    <RefreshCw size={18} className={refreshingPrices[item.id] ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>
            )}

            {isInCollection ? (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    removeFromCollection(item.id);
                    setSelectedResult(null);
                  }}
                  style={{ ...styles.button, backgroundColor: theme.error, flex: 1 }}
                >
                  <X size={18} />
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => addToCollection(selectedResult)}
                style={{ ...styles.button, width: '100%' }}
              >
                <Plus size={18} />
                Add to Collection
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Value Modal
  const renderValueModal = () => {
    if (!showValueModal) return null;

    const { value, currency, count } = calculateCollectionValue();
    const withPrices = collection.filter(item => item.price && item.price.value);
    const mostExpensive = withPrices.length > 0 ? withPrices.sort((a, b) => b.price.value - a.price.value)[0] : null;
    const cheapest = withPrices.length > 0 ? withPrices.sort((a, b) => a.price.value - b.price.value)[0] : null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        overflowY: 'auto'
      }}>
        <div style={{
          backgroundColor: theme.surface,
          borderRadius: '20px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '24px',
          boxShadow: theme.shadowLg
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Collection Value</h2>
            <button
              onClick={() => setShowValueModal(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <X size={24} color={theme.text} />
            </button>
          </div>

          <div style={{ ...styles.card, textAlign: 'center', marginBottom: '24px', border: `2px solid ${theme.primary}` }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: theme.textSecondary, fontWeight: '600' }}>Total Value</p>
            <p style={{ margin: '0 0 8px 0', fontSize: '40px', fontWeight: '700', color: theme.primary }}>
              {currency} {value}
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: theme.textSecondary }}>
              Based on {count} of {collection.length} records
            </p>
          </div>

          {mostExpensive && (
            <div style={{ ...styles.card, marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>💎 Most Expensive</h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <img 
                  src={mostExpensive.cover_image || '/placeholder.png'} 
                  alt="" 
                  style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600' }}>
                    {mostExpensive.title?.split(' - ')[1] || mostExpensive.title}
                  </p>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: theme.textSecondary }}>
                    {mostExpensive.title?.split(' - ')[0]}
                  </p>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: theme.primary }}>
                    {mostExpensive.price.currency} {mostExpensive.price.value.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {cheapest && (
            <div style={{ ...styles.card, marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>💰 Cheapest</h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <img 
                  src={cheapest.cover_image || '/placeholder.png'} 
                  alt="" 
                  style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600' }}>
                    {cheapest.title?.split(' - ')[1] || cheapest.title}
                  </p>
                  <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: theme.textSecondary }}>
                    {cheapest.title?.split(' - ')[0]}
                  </p>
                  <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: theme.primary }}>
                    {cheapest.price.currency} {cheapest.price.value.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div style={styles.card}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>📊 Statistics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: theme.textSecondary }}>Total Records:</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{collection.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: theme.textSecondary }}>With Prices:</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{count}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: theme.textSecondary }}>Without Prices:</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{collection.length - count}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: theme.textSecondary }}>Favorites:</span>
                <span style={{ fontSize: '14px', fontWeight: '600' }}>{collection.filter(i => i.isFavorite).length}</span>
              </div>
              {withPrices.length > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: theme.textSecondary }}>Average:</span>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>
                      {currency} {(parseFloat(value) / count).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', color: theme.textSecondary }}>Range:</span>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>
                      {currency} {cheapest?.price.value.toFixed(2)} - {mostExpensive?.price.value.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        input:focus, select:focus {
          border-color: ${theme.primary} !important;
          box-shadow: 0 0 0 3px ${theme.primary}20 !important;
        }
        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: ${theme.shadowLg};
        }
        button:active:not(:disabled) {
          transform: translateY(0);
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      <header style={styles.header}>
        <div style={styles.headerPattern} />
        <div style={styles.headerContent}>
          <img 
            src={LOGO_PATH}
            alt="VinylScout" 
            style={styles.logo}
          />
        </div>
      </header>

      {activeTab === 'search' && renderSearch()}
      {activeTab === 'camera' && renderCamera()}
      {activeTab === 'collection' && renderCollection()}
      {activeTab === 'profile' && renderProfile()}
      {activeTab === 'settings' && renderSettings()}
      
      {renderDetailModal()}
      {renderValueModal()}

      <nav style={styles.bottomNav}>
        {[
          { id: 'search', icon: Search, label: 'Search' },
          { id: 'camera', icon: Camera, label: 'Camera' },
          { id: 'collection', icon: Music, label: 'Collection' },
          { id: 'profile', icon: User, label: 'Profile' },
          { id: 'settings', icon: Settings, label: 'Settings' }
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              ...styles.navButton,
              ...(activeTab === id ? styles.navButtonActive : {})
            }}
          >
            <Icon size={24} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default VinylScout;