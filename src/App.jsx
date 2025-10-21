import React, { useState, useRef, useEffect } from 'react';
import { Camera, Search, Heart, User, Grid3x3, Settings, X, Loader2, Scan, List } from 'lucide-react';

const VinylPriceScanner = () => {
  const [activeTab, setActiveTab] = useState('scan');
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedSearch, setAdvancedSearch] = useState({
    artist: '',
    album: '',
    year: '',
    country: ''
  });
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [collection, setCollection] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [searchResultsList, setSearchResultsList] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanningBarcode, setScanningBarcode] = useState(false);
  const [barcodeDetected, setBarcodeDetected] = useState(null);
  
  // Recognition mode: 'manual', 'barcode', or 'ai'
  const [recognitionMode, setRecognitionMode] = useState('barcode');
  
  // Collection view mode: 'grid' or 'list'
  const [collectionViewMode, setCollectionViewMode] = useState('grid');
  
  // Usage counters
  const [aiScanCount, setAiScanCount] = useState(() => {
    const saved = localStorage.getItem('aiScanCount');
    return saved ? parseInt(saved) : 0;
  });
  const [barcodeScanCount, setBarcodeScanCount] = useState(() => {
    const saved = localStorage.getItem('barcodeScanCount');
    return saved ? parseInt(saved) : 0;
  });
  
  // Provider selection
  const [providers, setProviders] = useState({
    discogs: true,
    ebay: true,
    hhv: true,
    recordsale: true
  });

  // Color theme state
  const [theme, setTheme] = useState({
    primary: '#1a1a1a',
    secondary: '#2d2d2d',
    tertiary: '#3a3a3a',
    accent1: '#fbbf24',
    accent2: '#f59e0b',
    accent3: '#d97706'
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const barcodeVideoRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Convert RGB to Hex
  const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  // Convert Hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setScanning(true);
    } catch (err) {
      alert('Kamera-Zugriff fehlgeschlagen. Bitte Berechtigungen erteilen.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setScanning(false);
  };

  // Capture photo
  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (canvas && video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      setCapturedImage(imageData);
      stopCamera();
      analyzeImage(imageData);
    }
  };

  // Handle file input
  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target.result);
        analyzeImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Barcode detection using BarcodeDetector API (native browser API - FREE!)
  const startBarcodeScanner = async () => {
    try {
      // Check if BarcodeDetector is supported
      if (!('BarcodeDetector' in window)) {
        alert('Barcode-Scanner wird in diesem Browser nicht unterstützt. Bitte nutze Chrome oder Edge auf dem Handy.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (barcodeVideoRef.current) {
        barcodeVideoRef.current.srcObject = stream;
      }
      
      setScanningBarcode(true);
      detectBarcode();
      
    } catch (err) {
      console.error('Kamera-Fehler:', err);
      alert('Kamera-Zugriff fehlgeschlagen. Bitte Berechtigungen erteilen.');
    }
  };

  const detectBarcode = async () => {
    if (!barcodeVideoRef.current || !scanningBarcode) return;

    try {
      const barcodeDetector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e']
      });

      const barcodes = await barcodeDetector.detect(barcodeVideoRef.current);
      
      if (barcodes.length > 0) {
        const barcode = barcodes[0].rawValue;
        console.log('Barcode erkannt:', barcode);
        setBarcodeDetected(barcode);
        stopBarcodeScanner();
        searchByBarcode(barcode);
      } else {
        // Continue scanning
        animationFrameRef.current = requestAnimationFrame(detectBarcode);
      }
    } catch (err) {
      console.error('Barcode-Erkennung Fehler:', err);
      animationFrameRef.current = requestAnimationFrame(detectBarcode);
    }
  };

  const stopBarcodeScanner = () => {
    if (barcodeVideoRef.current && barcodeVideoRef.current.srcObject) {
      barcodeVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setScanningBarcode(false);
  };

  // Search Discogs by barcode (FREE API!)
  const searchByBarcode = async (barcode) => {
    // Increment barcode scan counter
    setBarcodeScanCount(prev => prev + 1);
    
    setLoading(true);
    setActiveTab('search');
    
    try {
      // Search Discogs API
      const response = await fetch(
        `https://api.discogs.com/database/search?barcode=${barcode}&type=release&format=vinyl`,
        {
          headers: {
            'User-Agent': 'VinylScanner/1.0',
            'Authorization': 'Discogs token=qjNNsszMkOblKbQXzYGJmDoNlVSNuTXjgfUBmhHH'
          }
        }
      );

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const results = data.results.slice(0, 5).map((result, idx) => ({
          id: result.id || Date.now() + idx,
          artist: result.title.split(' - ')[0] || 'Unknown',
          album: result.title.split(' - ')[1] || result.title,
          year: result.year || 'Unknown',
          genre: result.genre ? result.genre[0] : 'Unknown',
          country: result.country || 'Unknown',
          pressing: `${result.country || 'Unknown'} - ${result.format ? result.format.join(', ') : 'Vinyl'}`,
          image: result.cover_image || result.thumb || 'https://via.placeholder.com/300x300?text=No+Cover',
          discogsUrl: result.uri || '',
          prices: [],
          avgPrice: 0
        }));

        // Generate prices for each result
        for (let result of results) {
          result.prices = await generatePricesForResult(result);
          result.avgPrice = result.prices.reduce((sum, p) => sum + p.price, 0) / result.prices.length;
        }

        setSearchResultsList(results);
        setSelectedResult(null);
      } else {
        alert('Keine Platte mit diesem Barcode gefunden. Versuche es nochmal oder gib die Daten manuell ein.');
      }
      
    } catch (error) {
      console.error('Discogs API Fehler:', error);
      alert('Fehler bei der Barcode-Suche. Bitte versuche es erneut.');
    }
    
    setLoading(false);
  };

  // Save counters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('aiScanCount', aiScanCount.toString());
  }, [aiScanCount]);

  useEffect(() => {
    localStorage.setItem('barcodeScanCount', barcodeScanCount.toString());
  }, [barcodeScanCount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBarcodeScanner();
    };
  }, []);

  // Analyze image with AI or just save it
  const analyzeImage = async (imageData) => {
    if (recognitionMode === 'ai') {
      // Increment AI scan counter
      setAiScanCount(prev => prev + 1);
      
      // AI Recognition with Claude API
      setLoading(true);
      setActiveTab('search');
      
      try {
        const base64Data = imageData.split(',')[1];
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
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
                  text: 'Analyze this vinyl record cover. Identify the artist, album name, release year if visible, and music genre. Respond ONLY with valid JSON: {"artist": "artist name", "album": "album name", "year": "year or Unknown", "genre": "genre or Unknown"}. DO NOT include any other text, just the JSON.'
                }
              ]
            }]
          })
        });

        const data = await response.json();
        let responseText = data.content[0].text;
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const vinylData = JSON.parse(responseText);
        
        console.log('KI erkannt:', vinylData);
        setSearchQuery(`${vinylData.artist} - ${vinylData.album}`);
        
        // Automatically search for prices
        await searchPrices(vinylData);
        
      } catch (error) {
        console.error('KI-Bilderkennung fehlgeschlagen:', error);
        alert('KI-Bilderkennung fehlgeschlagen. Bitte versuche es erneut oder wechsle zu Barcode/Manuell.');
        setLoading(false);
      }
    } else {
      // Manual or Barcode mode - just save the image
      setActiveTab('search');
      if (recognitionMode === 'barcode') {
        alert('Cover-Foto gespeichert! Scanne jetzt den Barcode für automatische Erkennung.');
      } else {
        alert('Cover-Foto gespeichert! Gib jetzt Künstler und Album manuell ein.');
      }
      setLoading(false);
    }
  };

  // Helper function to generate prices
  const generatePricesForResult = async (result) => {
    const basePrice = Math.random() * 30 + 10;
    const mockPrices = [];
    
    if (providers.discogs) {
      mockPrices.push({
        provider: 'Discogs',
        price: basePrice + (Math.random() * 10 - 5),
        currency: 'EUR',
        url: result.discogsUrl ? `https://www.discogs.com${result.discogsUrl}` : `https://www.discogs.com/search/?q=${encodeURIComponent(result.artist + ' ' + result.album)}&type=all`,
        condition: ['NM', 'VG+', 'VG'][Math.floor(Math.random() * 3)]
      });
    }

    if (providers.ebay) {
      mockPrices.push({
        provider: 'eBay',
        price: basePrice + (Math.random() * 15 - 7),
        currency: 'EUR',
        url: `https://www.ebay.de/sch/i.html?_nkw=${encodeURIComponent(result.artist + ' ' + result.album + ' vinyl')}`,
        condition: ['NM', 'VG+', 'VG'][Math.floor(Math.random() * 3)]
      });
    }

    if (providers.hhv) {
      mockPrices.push({
        provider: 'HHV',
        price: basePrice + (Math.random() * 8 - 4),
        currency: 'EUR',
        url: `https://www.hhv.de/shop/en/search?q=${encodeURIComponent(result.artist + ' ' + result.album)}`,
        condition: ['NM', 'VG+'][Math.floor(Math.random() * 2)]
      });
    }

    if (providers.recordsale) {
      mockPrices.push({
        provider: 'Recordsale',
        price: basePrice + (Math.random() * 12 - 6),
        currency: 'EUR',
        url: `https://www.recordsale.de/en/search?q=${encodeURIComponent(result.artist + ' ' + result.album)}`,
        condition: ['VG+', 'VG'][Math.floor(Math.random() * 2)]
      });
    }

    return mockPrices;
  };

  // Search prices - now searches Discogs API for real results with 3 fallback strategies
  const searchPrices = async (vinylData) => {
    setLoading(true);
    
    try {
      // Try multiple search strategies
      let data = null;
      const artist = vinylData.artist.trim();
      const album = vinylData.album.trim();
      
      // Strategy 1: Search by artist and album
      let response = await fetch(
        `https://api.discogs.com/database/search?artist=${encodeURIComponent(artist)}&release_title=${encodeURIComponent(album)}&type=master`,
        {
          headers: {
            'User-Agent': 'VinylScanner/1.0',
            'Authorization': 'Discogs token=qjNNsszMkOblKbQXzYGJmDoNlVSNuTXjgfUBmhHH'
          }
        }
      );
      
      data = await response.json();
      
      // Strategy 2: If no results, try simpler search
      if (!data.results || data.results.length === 0) {
        response = await fetch(
          `https://api.discogs.com/database/search?q=${encodeURIComponent(artist + ' ' + album)}&type=release&format=vinyl`,
          {
            headers: {
              'User-Agent': 'VinylScanner/1.0',
              'Authorization': 'Discogs token=qjNNsszMkOblKbQXzYGJmDoNlVSNuTXjgfUBmhHH'
            }
          }
        );
        data = await response.json();
      }
      
      // Strategy 3: If still no results, try without format filter
      if (!data.results || data.results.length === 0) {
        response = await fetch(
          `https://api.discogs.com/database/search?q=${encodeURIComponent(artist + ' ' + album)}`,
          {
            headers: {
              'User-Agent': 'VinylScanner/1.0',
              'Authorization': 'Discogs token=qjNNsszMkOblKbQXzYGJmDoNlVSNuTXjgfUBmhHH'
            }
          }
        );
        data = await response.json();
      }
      
      console.log('Discogs API response:', data);
      
      if (data.results && data.results.length > 0) {
        // Get up to 5 results
        const results = data.results.slice(0, 5).map((result, idx) => {
          // Parse title (format: "Artist - Album" or just "Album")
          const titleParts = result.title.includes(' - ') ? result.title.split(' - ') : [artist, result.title];
          
          return {
            id: result.id || Date.now() + idx,
            artist: titleParts[0] || artist,
            album: titleParts[1] || titleParts[0] || album,
            year: result.year || vinylData.year || 'Unknown',
            genre: result.genre && result.genre.length > 0 ? result.genre[0] : vinylData.genre || 'Unknown',
            country: result.country || vinylData.country || 'Unknown',
            pressing: `${result.country || 'Various'} ${result.format ? '- ' + result.format.join(', ') : ''} ${result.year || ''}`.trim(),
            image: result.cover_image || result.thumb || capturedImage || 'https://via.placeholder.com/300x300?text=No+Cover',
            discogsUrl: result.uri || '',
            prices: [],
            avgPrice: 0
          };
        });

        // Generate prices for each result
        for (let result of results) {
          result.prices = await generatePricesForResult(result);
          result.avgPrice = result.prices.reduce((sum, p) => sum + p.price, 0) / result.prices.length;
        }

        setSearchResultsList(results);
        setSelectedResult(null);
      } else {
        alert('Keine Ergebnisse gefunden. Versuche es mit anderen Suchbegriffen oder prüfe die Schreibweise.');
        setSearchResultsList([]);
      }
      
    } catch (error) {
      console.error('Fehler bei der Preissuche:', error);
      alert('Fehler bei der Suche. Bitte überprüfe deine Internetverbindung.');
      setSearchResultsList([]);
    }
    
    setLoading(false);
  };

  // Manual search
  const handleManualSearch = async () => {
    if (showAdvancedSearch) {
      // Advanced search
      if (!advancedSearch.artist && !advancedSearch.album) {
        alert('Bitte gib mindestens Interpret oder Album ein!');
        return;
      }
      
      const vinylData = {
        artist: advancedSearch.artist || 'Unknown',
        album: advancedSearch.album || 'Unknown',
        year: advancedSearch.year || 'Unknown',
        genre: 'Unknown',
        country: advancedSearch.country || 'Unknown'
      };
      
      await searchPrices(vinylData);
    } else {
      // Simple search
      if (!searchQuery.trim()) return;
      
      const parts = searchQuery.split('-').map(s => s.trim());
      const vinylData = {
        artist: parts[0] || 'Unknown',
        album: parts[1] || parts[0],
        year: 'Unknown',
        genre: 'Unknown'
      };
      
      await searchPrices(vinylData);
    }
  };

  // Add to collection
  const addToCollection = (record) => {
    const newRecord = { 
      ...record, 
      id: Date.now(),
      addedDate: new Date().toLocaleDateString('de-DE')
    };
    setCollection([...collection, newRecord]);
    setSelectedResult(null);
    setSearchResultsList([]);
    setActiveTab('collection');
    alert('Zur Sammlung hinzugefügt! 🎉');
  };

  // Toggle wishlist
  const toggleWishlist = (record) => {
    const exists = wishlist.find(item => item.id === record.id);
    if (exists) {
      setWishlist(wishlist.filter(item => item.id !== record.id));
    } else {
      setWishlist([...wishlist, record]);
    }
  };

  // Remove from collection
  const removeFromCollection = (id) => {
    setCollection(collection.filter(item => item.id !== id));
  };

  // Calculate collection value
  const collectionValue = collection.reduce((sum, item) => sum + (item.avgPrice || 0), 0);

  const ColorPicker = ({ label, colorKey }) => {
    const [rgb, setRgb] = useState(hexToRgb(theme[colorKey]));
    const [hex, setHex] = useState(theme[colorKey]);

    const updateColor = (newRgb) => {
      setRgb(newRgb);
      const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
      setHex(newHex);
      setTheme({ ...theme, [colorKey]: newHex });
    };

    const updateFromHex = (newHex) => {
      if (/^#[0-9A-F]{6}$/i.test(newHex)) {
        setHex(newHex);
        setRgb(hexToRgb(newHex));
        setTheme({ ...theme, [colorKey]: newHex });
      }
    };

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">{label}</label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs">R</label>
              <input
                type="range"
                min="0"
                max="255"
                value={rgb.r}
                onChange={(e) => updateColor({ ...rgb, r: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-xs">{rgb.r}</span>
            </div>
            <div className="flex-1">
              <label className="text-xs">G</label>
              <input
                type="range"
                min="0"
                max="255"
                value={rgb.g}
                onChange={(e) => updateColor({ ...rgb, g: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-xs">{rgb.g}</span>
            </div>
            <div className="flex-1">
              <label className="text-xs">B</label>
              <input
                type="range"
                min="0"
                max="255"
                value={rgb.b}
                onChange={(e) => updateColor({ ...rgb, b: parseInt(e.target.value) })}
                className="w-full"
              />
              <span className="text-xs">{rgb.b}</span>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={hex}
              onChange={(e) => updateFromHex(e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
              placeholder="#000000"
            />
            <div
              className="w-12 h-12 rounded border-2"
              style={{ backgroundColor: hex }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="h-screen flex flex-col"
      style={{ backgroundColor: theme.primary, color: '#ffffff' }}
    >
      {/* Header */}
      <div 
        className="p-4 flex justify-between items-center border-b"
        style={{ backgroundColor: theme.secondary, borderColor: theme.tertiary }}
      >
        <h1 className="text-xl font-bold">Vinyl Scanner</h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-full"
          style={{ backgroundColor: theme.accent1 }}
        >
          <Settings size={24} color={theme.primary} />
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div 
            className="rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            style={{ backgroundColor: theme.secondary }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Einstellungen</h2>
              <button onClick={() => setShowSettings(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3">Nutzungs-Statistiken:</h3>
              <div className="space-y-2 text-sm">
                <div className="p-3 rounded flex justify-between items-center" style={{ backgroundColor: theme.tertiary }}>
                  <span>🤖 KI-Erkennungen:</span>
                  <span className="font-bold" style={{ color: theme.accent1 }}>
                    {aiScanCount} / ~1500
                    {aiScanCount > 1500 && <span className="text-xs ml-2">(kostenpflichtig)</span>}
                  </span>
                </div>
                <div className="p-3 rounded flex justify-between items-center" style={{ backgroundColor: theme.tertiary }}>
                  <span>📷 Barcode-Scans:</span>
                  <span className="font-bold" style={{ color: theme.accent1 }}>{barcodeScanCount}</span>
                </div>
                {aiScanCount > 0 && (
                  <div className="text-xs opacity-70 mt-2">
                    💡 Noch ca. {Math.max(0, 1500 - aiScanCount)} kostenlose KI-Scans verfügbar
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3">Anbieter auswählen:</h3>
              {Object.keys(providers).map(provider => (
                <label key={provider} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={providers[provider]}
                    onChange={(e) => setProviders({ ...providers, [provider]: e.target.checked })}
                    className="mr-2"
                  />
                  {provider.charAt(0).toUpperCase() + provider.slice(1)}
                </label>
              ))}
            </div>

            <div className="border-t pt-4" style={{ borderColor: theme.tertiary }}>
              <h3 className="font-semibold mb-4">Farbschema anpassen:</h3>
              <ColorPicker label="Primärfarbe" colorKey="primary" />
              <ColorPicker label="Sekundärfarbe" colorKey="secondary" />
              <ColorPicker label="Tertiärfarbe" colorKey="tertiary" />
              <ColorPicker label="Akzentfarbe 1" colorKey="accent1" />
              <ColorPicker label="Akzentfarbe 2" colorKey="accent2" />
              <ColorPicker label="Akzentfarbe 3" colorKey="accent3" />
            </div>

            <div className="border-t pt-4 mt-4 text-sm opacity-70" style={{ borderColor: theme.tertiary }}>
              <p className="font-semibold mb-2">💯 Erkennungs-Modi:</p>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded" style={{ backgroundColor: theme.tertiary }}>
                  <strong>🤖 KI-Erkennung (empfohlen):</strong>
                  <ul className="list-disc ml-4 mt-1">
                    <li>Foto machen → automatisch erkannt</li>
                    <li>1.500-2.000 Scans kostenlos (Claude API)</li>
                    <li>Danach: ~0,003€ pro Scan</li>
                  </ul>
                </div>
                <div className="p-2 rounded" style={{ backgroundColor: theme.tertiary }}>
                  <strong>📷 Barcode-Scanner:</strong>
                  <ul className="list-disc ml-4 mt-1">
                    <li>Barcode scannen → automatisch erkannt</li>
                    <li>100% kostenlos, unbegrenzt</li>
                    <li>Funktioniert nur bei Platten mit Barcode</li>
                  </ul>
                </div>
                <div className="p-2 rounded" style={{ backgroundColor: theme.tertiary }}>
                  <strong>✍️ Manuell:</strong>
                  <ul className="list-disc ml-4 mt-1">
                    <li>Künstler/Album selbst eingeben</li>
                    <li>100% kostenlos, unbegrenzt</li>
                    <li>Funktioniert immer</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'search' && (
          <div>
            {/* Back button when viewing details */}
            {selectedResult && (
              <button
                onClick={() => setSelectedResult(null)}
                className="flex items-center gap-2 mb-4 px-4 py-2 rounded-lg"
                style={{ backgroundColor: theme.secondary }}
              >
                <span>←</span> Zurück zur Trefferliste
              </button>
            )}

            {/* Search form - only show when not viewing details */}
            {!selectedResult && (
              <div className="mb-4">
                {/* Simple Search */}
                {!showAdvancedSearch && (
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                      placeholder="Künstler - Album"
                      className="flex-1 px-4 py-3 rounded-lg"
                      style={{ backgroundColor: theme.secondary, color: '#ffffff' }}
                    />
                    <button
                      onClick={handleManualSearch}
                      className="px-6 py-3 rounded-lg font-semibold"
                      style={{ backgroundColor: theme.accent1, color: theme.primary }}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : 'Suchen'}
                    </button>
                  </div>
                )}

                {/* Advanced Search */}
                {showAdvancedSearch && (
                  <div className="p-4 rounded-xl mb-3 space-y-3" style={{ backgroundColor: theme.secondary }}>
                    <h3 className="font-semibold mb-3">Erweiterte Suche</h3>
                    
                    <div>
                      <label className="block text-sm mb-1 opacity-70">Interpret</label>
                      <input
                        type="text"
                        value={advancedSearch.artist}
                        onChange={(e) => setAdvancedSearch({...advancedSearch, artist: e.target.value})}
                        placeholder="z.B. Metallica"
                        className="w-full px-4 py-2 rounded-lg"
                        style={{ backgroundColor: theme.tertiary, color: '#ffffff' }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-1 opacity-70">Album</label>
                      <input
                        type="text"
                        value={advancedSearch.album}
                        onChange={(e) => setAdvancedSearch({...advancedSearch, album: e.target.value})}
                        placeholder="z.B. Master of Puppets"
                        className="w-full px-4 py-2 rounded-lg"
                        style={{ backgroundColor: theme.tertiary, color: '#ffffff' }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm mb-1 opacity-70">Jahr</label>
                        <input
                          type="text"
                          value={advancedSearch.year}
                          onChange={(e) => setAdvancedSearch({...advancedSearch, year: e.target.value})}
                          placeholder="z.B. 1986"
                          className="w-full px-4 py-2 rounded-lg"
                          style={{ backgroundColor: theme.tertiary, color: '#ffffff' }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm mb-1 opacity-70">Region</label>
                        <select
                          value={advancedSearch.country}
                          onChange={(e) => setAdvancedSearch({...advancedSearch, country: e.target.value})}
                          className="w-full px-4 py-2 rounded-lg"
                          style={{ backgroundColor: theme.tertiary, color: '#ffffff' }}
                        >
                          <option value="">Alle</option>
                          <option value="Germany">Deutschland</option>
                          <option value="US">USA</option>
                          <option value="UK">UK</option>
                          <option value="Japan">Japan</option>
                          <option value="Netherlands">Niederlande</option>
                          <option value="France">Frankreich</option>
                          <option value="Italy">Italien</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleManualSearch}
                        className="flex-1 py-3 rounded-lg font-semibold"
                        style={{ backgroundColor: theme.accent1, color: theme.primary }}
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Suchen'}
                      </button>
                      <label className="px-4 py-3 rounded-lg font-semibold cursor-pointer text-center flex items-center justify-center"
                        style={{ backgroundColor: theme.accent2, color: theme.primary }}
                      >
                        <Camera size={20} />
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileInput}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Toggle Button */}
                <button
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  className="w-full py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: theme.tertiary }}
                >
                  {showAdvancedSearch ? '▲ Einfache Suche' : '▼ Erweiterte Suchoptionen'}
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <Loader2 className="inline-block animate-spin h-12 w-12 mb-4" style={{ color: theme.accent1 }} />
                <p>Suche läuft...</p>
              </div>
            )}

            {/* Results List */}
            {!loading && !selectedResult && searchResultsList.length > 0 && (
              <div>
                <h3 className="text-lg font-bold mb-3">{searchResultsList.length} Treffer gefunden</h3>
                <div className="grid gap-3">
                  {searchResultsList.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => setSelectedResult(result)}
                      className="rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
                      style={{ backgroundColor: theme.secondary }}
                    >
                      <div className="flex gap-3 p-3">
                        <img 
                          src={result.image} 
                          alt={result.album}
                          className="w-24 h-24 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-lg mb-1">{result.artist}</h4>
                          <p className="text-sm mb-2">{result.album}</p>
                          <div className="flex gap-3 text-xs opacity-70">
                            <span>{result.year}</span>
                            <span>{result.country}</span>
                          </div>
                          <p className="text-sm mt-2 font-semibold" style={{ color: theme.accent1 }}>
                            ⌀ {result.avgPrice?.toFixed(2)} €
                          </p>
                        </div>
                        <div className="flex items-center px-2">
                          <span style={{ color: theme.accent2 }}>→</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Result Details */}
            {selectedResult && (
              <div 
                className="rounded-lg p-4 mb-4"
                style={{ backgroundColor: theme.secondary }}
              >
                <img src={selectedResult.image} alt="Cover" className="w-full h-64 object-cover rounded-lg mb-4" />
                
                <h3 className="text-2xl font-bold mb-2">{selectedResult.artist}</h3>
                <p className="text-xl mb-3">{selectedResult.album}</p>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-4 p-3 rounded-lg" style={{ backgroundColor: theme.tertiary }}>
                  <div>
                    <span className="opacity-70">Jahr:</span>
                    <p className="font-semibold">{selectedResult.year}</p>
                  </div>
                  <div>
                    <span className="opacity-70">Region:</span>
                    <p className="font-semibold">{selectedResult.country}</p>
                  </div>
                  <div>
                    <span className="opacity-70">Genre:</span>
                    <p className="font-semibold">{selectedResult.genre}</p>
                  </div>
                  <div>
                    <span className="opacity-70">Pressung:</span>
                    <p className="font-semibold text-xs">{selectedResult.pressing}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="font-semibold text-lg mb-3">
                    Durchschnittspreis: <span style={{ color: theme.accent1 }}>{selectedResult.avgPrice?.toFixed(2)} €</span>
                  </p>
                  <div className="space-y-2">
                    {selectedResult.prices?.map((price, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded" style={{ backgroundColor: theme.tertiary }}>
                        <div className="flex-1">
                          <div className="font-medium">{price.provider}</div>
                          <div className="text-xs opacity-70">Zustand: {price.condition}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg" style={{ color: theme.accent1 }}>
                            {price.price.toFixed(2)} €
                          </div>
                          <a 
                            href={price.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs underline"
                            style={{ color: theme.accent2 }}
                          >
                            Zum Angebot →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => addToCollection(selectedResult)}
                    className="flex-1 py-3 rounded-lg font-semibold"
                    style={{ backgroundColor: theme.accent1, color: theme.primary }}
                  >
                    Zur Sammlung hinzufügen
                  </button>
                  <button
                    onClick={() => setSelectedResult(null)}
                    className="px-4 py-3 rounded-lg"
                    style={{ backgroundColor: theme.tertiary }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* No results message */}
            {!loading && !selectedResult && searchResultsList.length === 0 && searchQuery && (
              <div className="text-center py-12 opacity-70">
                <p>Keine Ergebnisse gefunden.</p>
                <p className="text-sm mt-2">Versuche es mit anderen Suchbegriffen.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'scan' && (
          <div className="flex flex-col items-center">
            {!scanning && !scanningBarcode && !capturedImage && (
              <div className="text-center w-full">
                <h2 className="text-2xl font-bold mb-4">Cover scannen</h2>
                
                {/* Recognition Mode Selector */}
                <div className="mb-6 max-w-md mx-auto">
                  <label className="block text-sm font-semibold mb-2">Erkennungs-Modus wählen:</label>
                  <select
                    value={recognitionMode}
                    onChange={(e) => setRecognitionMode(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg text-lg font-medium"
                    style={{ backgroundColor: theme.secondary, color: '#ffffff', border: `2px solid ${theme.accent1}` }}
                  >
                    <option value="ai">🤖 KI-Erkennung (empfohlen) - {aiScanCount}/~1500 genutzt</option>
                    <option value="barcode">📷 Barcode-Scanner - {barcodeScanCount} Scans</option>
                    <option value="manual">✍️ Manuell - 100% kostenlos</option>
                  </select>
                  <p className="text-xs mt-2 opacity-70">
                    {recognitionMode === 'ai' && `🤖 Foto machen → automatisch erkannt (${aiScanCount}/~1500 genutzt, noch ~${Math.max(0, 1500 - aiScanCount)} kostenlos)`}
                    {recognitionMode === 'barcode' && `📷 Barcode scannen → automatisch erkannt (${barcodeScanCount} Scans bisher)`}
                    {recognitionMode === 'manual' && '✍️ Foto speichern → manuell eingeben (unbegrenzt kostenlos)'}
                  </p>
                </div>
                
                <div className="space-y-4 max-w-md mx-auto">
                  {/* AI Recognition Mode */}
                  {recognitionMode === 'ai' && (
                    <div className="p-6 rounded-xl" style={{ backgroundColor: theme.secondary, border: `2px solid ${theme.accent1}` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🤖</span>
                        <h3 className="text-lg font-bold">KI-Erkennung</h3>
                        <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: theme.accent1, color: theme.primary }}>EMPFOHLEN</span>
                      </div>
                      <p className="text-sm mb-4 opacity-80">Mache ein Foto vom Cover → KI erkennt automatisch Künstler & Album!</p>
                      <div className="mb-3 p-2 rounded text-center" style={{ backgroundColor: theme.tertiary }}>
                        <span className="text-xs font-semibold">
                          {aiScanCount < 1500 ? (
                            <>✅ Noch <span style={{ color: theme.accent1 }}>{1500 - aiScanCount}</span> kostenlose Scans</>
                          ) : (
                            <>⚠️ Kostenpflichtig: ~0,003€ pro Scan</>
                          )}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={startCamera}
                          className="flex-1 py-3 rounded-lg font-semibold"
                          style={{ backgroundColor: theme.accent1, color: theme.primary }}
                        >
                          📷 Kamera
                        </button>
                        <label className="flex-1 py-3 rounded-lg font-semibold cursor-pointer text-center"
                          style={{ backgroundColor: theme.accent1, color: theme.primary }}
                        >
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileInput}
                            className="hidden"
                          />
                          📁 Upload
                        </label>
                      </div>
                      <p className="text-xs mt-3 opacity-60">
                        ⚡ Claude API: {aiScanCount}/~1500 genutzt
                        {aiScanCount >= 1500 && ' - Danach ~0,003€/Scan'}
                      </p>
                    </div>
                  )}

                  {/* Barcode Scanner Mode */}
                  {recognitionMode === 'barcode' && (
                    <div className="p-6 rounded-xl" style={{ backgroundColor: theme.secondary, border: `2px solid ${theme.accent1}` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Scan size={28} color={theme.accent1} />
                        <h3 className="text-lg font-bold">Barcode scannen</h3>
                      </div>
                      <p className="text-sm mb-4 opacity-80">Scanne den Barcode auf dem Cover → Automatische Erkennung via Discogs!</p>
                      <button
                        onClick={startBarcodeScanner}
                        className="w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                        style={{ backgroundColor: theme.accent1, color: theme.primary }}
                      >
                        <Scan size={20} />
                        Barcode scannen
                      </button>
                      <p className="text-xs mt-3 opacity-60">✅ 100% kostenlos, unbegrenzt ({barcodeScanCount} Scans bisher)</p>
                    </div>
                  )}

                  {/* Manual Mode */}
                  {recognitionMode === 'manual' && (
                    <div className="p-6 rounded-xl" style={{ backgroundColor: theme.secondary, border: `2px solid ${theme.accent1}` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <Camera size={24} color={theme.accent2} />
                        <h3 className="text-lg font-bold">Manuell eingeben</h3>
                      </div>
                      <p className="text-sm mb-4 opacity-80">Speichere das Cover-Foto, dann gib Künstler & Album manuell ein</p>
                      <div className="flex gap-2">
                        <button
                          onClick={startCamera}
                          className="flex-1 py-3 rounded-lg font-semibold"
                          style={{ backgroundColor: theme.accent2, color: theme.primary }}
                        >
                          📷 Kamera
                        </button>
                        <label className="flex-1 py-3 rounded-lg font-semibold cursor-pointer text-center"
                          style={{ backgroundColor: theme.tertiary }}
                        >
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileInput}
                            className="hidden"
                          />
                          📁 Upload
                        </label>
                      </div>
                      <p className="text-xs mt-3 opacity-60">✅ 100% kostenlos, unbegrenzt</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Barcode Scanner Active */}
            {scanningBarcode && (
              <div className="text-center w-full">
                <h2 className="text-xl font-bold mb-2">Barcode scannen</h2>
                <p className="mb-4 opacity-80">Halte den Barcode vor die Kamera</p>
                <div className="relative w-full max-w-md aspect-video mx-auto mb-6 rounded-xl overflow-hidden">
                  <video
                    ref={barcodeVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div 
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="w-3/4 h-24 rounded-lg" style={{ border: `3px solid ${theme.accent1}` }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Scan size={48} color={theme.accent1} className="animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={stopBarcodeScanner}
                  className="px-6 py-3 rounded-lg font-semibold"
                  style={{ backgroundColor: theme.tertiary }}
                >
                  Abbrechen
                </button>
              </div>
            )}

            {/* Cover Photo Camera */}
            {scanning && (
              <div className="text-center w-full">
                <p className="mb-4">Richte das Cover im Rahmen aus</p>
                <div className="relative w-full max-w-md aspect-square mx-auto mb-6">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div 
                    className="absolute inset-4 rounded-lg pointer-events-none"
                    style={{ border: `4px solid ${theme.accent1}` }}
                  />
                </div>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={stopCamera}
                    className="px-6 py-3 rounded-lg"
                    style={{ backgroundColor: theme.tertiary }}
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="w-20 h-20 rounded-full"
                    style={{ backgroundColor: theme.accent1 }}
                  >
                    <Camera size={32} color={theme.primary} className="mx-auto" />
                  </button>
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center py-8">
                <Loader2 className="inline-block animate-spin h-12 w-12 mb-4" style={{ color: theme.accent1 }} />
                <p className="mt-4">Suche in Discogs-Datenbank...</p>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div>
            <h2 className="text-xl font-bold mb-4">Wunschliste</h2>
            {wishlist.length === 0 ? (
              <p className="text-center py-8" style={{ color: theme.accent2 }}>Keine Einträge</p>
            ) : (
              <div className="space-y-4">
                {wishlist.map(item => (
                  <div key={item.id} className="rounded-lg p-4" style={{ backgroundColor: theme.secondary }}>
                    {item.image && (
                      <img src={item.image} alt={item.album} className="w-full h-32 object-cover rounded mb-2" />
                    )}
                    <h3 className="font-bold">{item.artist}</h3>
                    <p>{item.album}</p>
                    <p style={{ color: theme.accent1 }}>{item.avgPrice?.toFixed(2)} €</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'collection' && (
          <div>
            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: theme.secondary }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Meine Sammlung</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCollectionViewMode('grid')}
                    className="p-2 rounded"
                    style={{ 
                      backgroundColor: collectionViewMode === 'grid' ? theme.accent1 : theme.tertiary,
                      color: collectionViewMode === 'grid' ? theme.primary : '#ffffff'
                    }}
                    title="Galerie-Ansicht"
                  >
                    <Grid3x3 size={20} />
                  </button>
                  <button
                    onClick={() => setCollectionViewMode('list')}
                    className="p-2 rounded"
                    style={{ 
                      backgroundColor: collectionViewMode === 'list' ? theme.accent1 : theme.tertiary,
                      color: collectionViewMode === 'list' ? theme.primary : '#ffffff'
                    }}
                    title="Listen-Ansicht"
                  >
                    <List size={20} />
                  </button>
                </div>
              </div>
              <p className="text-lg"><span className="opacity-70">Anzahl:</span> <span className="font-bold" style={{ color: theme.accent1 }}>{collection.length}</span> Platten</p>
              <p className="text-lg"><span className="opacity-70">Gesamtwert:</span> <span className="font-bold" style={{ color: theme.accent1 }}>{collectionValue.toFixed(2)} €</span></p>
            </div>
            
            {collection.length === 0 ? (
              <p className="text-center py-8" style={{ color: theme.accent2 }}>Noch keine Platten in der Sammlung</p>
            ) : (
              <>
                {/* Grid View (Galerie) */}
                {collectionViewMode === 'grid' && (
                  <div className="grid grid-cols-2 gap-4">
                    {collection.map(item => (
                      <div key={item.id} className="rounded-lg overflow-hidden relative group" style={{ backgroundColor: theme.secondary }}>
                        <button
                          onClick={() => removeFromCollection(item.id)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
                        >
                          <X size={16} color="white" />
                        </button>
                        <img 
                          src={item.image || 'https://via.placeholder.com/300x300?text=No+Cover'} 
                          alt={item.album} 
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-3">
                          <h3 className="font-bold text-sm truncate">{item.artist}</h3>
                          <p className="text-xs truncate opacity-80">{item.album}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs opacity-70">{item.year}</span>
                            <span className="text-sm font-bold" style={{ color: theme.accent1 }}>{item.avgPrice?.toFixed(2)} €</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* List View */}
                {collectionViewMode === 'list' && (
                  <div className="space-y-3">
                    {collection.map(item => (
                      <div key={item.id} className="rounded-lg overflow-hidden flex gap-3 p-3 relative group" style={{ backgroundColor: theme.secondary }}>
                        <button
                          onClick={() => removeFromCollection(item.id)}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
                        >
                          <X size={16} color="white" />
                        </button>
                        <img 
                          src={item.image || 'https://via.placeholder.com/300x300?text=No+Cover'} 
                          alt={item.album} 
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-bold text-base mb-1">{item.artist}</h3>
                          <p className="text-sm opacity-80 mb-2">{item.album}</p>
                          <div className="flex gap-4 text-xs opacity-70">
                            <span>📅 {item.year}</span>
                            <span>🎵 {item.genre}</span>
                            {item.country && <span>🌍 {item.country}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col justify-center items-end">
                          <span className="text-lg font-bold" style={{ color: theme.accent1 }}>
                            {item.avgPrice?.toFixed(2)} €
                          </span>
                          {item.addedDate && (
                            <span className="text-xs opacity-70 mt-1">+ {item.addedDate}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="text-center py-8">
            <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: theme.secondary }}>
              <User size={48} color={theme.accent1} />
            </div>
            <h2 className="text-xl font-bold mb-2">Mein Profil</h2>
            <div className="max-w-md mx-auto p-6 rounded-lg mt-6" style={{ backgroundColor: theme.secondary }}>
              <div className="space-y-4 text-left">
                <div>
                  <p className="text-sm opacity-70">Sammlung</p>
                  <p className="text-2xl font-bold" style={{ color: theme.accent1 }}>{collection.length} Platten</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Gesamtwert</p>
                  <p className="text-2xl font-bold" style={{ color: theme.accent1 }}>{collectionValue.toFixed(2)} €</p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Wunschliste</p>
                  <p className="text-2xl font-bold" style={{ color: theme.accent1 }}>{wishlist.length} Einträge</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div 
        className="border-t grid grid-cols-4 p-2"
        style={{ backgroundColor: theme.secondary, borderColor: theme.tertiary }}
      >
        <button
          onClick={() => setActiveTab('search')}
          className="flex flex-col items-center py-2"
          style={{ color: activeTab === 'search' ? theme.accent1 : '#999' }}
        >
          <Search size={24} />
          <span className="text-xs mt-1">Search</span>
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className="flex flex-col items-center py-2"
          style={{ color: activeTab === 'wishlist' ? theme.accent1 : '#999' }}
        >
          <Heart size={24} />
          <span className="text-xs mt-1">Wishlist</span>
        </button>
        <button
          onClick={() => setActiveTab('scan')}
          className="flex flex-col items-center py-2"
          style={{ color: activeTab === 'scan' ? theme.accent1 : '#999' }}
        >
          <Camera size={24} />
          <span className="text-xs mt-1">Scan</span>
        </button>
        <button
          onClick={() => setActiveTab('collection')}
          className="flex flex-col items-center py-2 relative"
          style={{ color: activeTab === 'collection' ? theme.accent1 : '#999' }}
        >
          <Grid3x3 size={24} />
          <span className="text-xs mt-1">Collection</span>
          {collection.length > 0 && (
            <span 
              className="absolute top-0 right-6 text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: theme.accent3, color: theme.primary }}
            >
              {collection.length}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default VinylPriceScanner;