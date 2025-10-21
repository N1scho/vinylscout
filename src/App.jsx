import React, { useState, useRef, useEffect } from 'react';
import { Camera, Search, Heart, Settings, X, Loader2, Plus, Grid } from 'lucide-react';

export default function VinylScout() {
  const [activeTab, setActiveTab] = useState('scan');
  const [showSettings, setShowSettings] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [collection, setCollection] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  
  const [apiKey, setApiKey] = useState(localStorage.getItem('claudeApiKey') || '');
  const [recognitionMode, setRecognitionMode] = useState(localStorage.getItem('recognitionMode') || 'manual');
  const [selectedShops, setSelectedShops] = useState(['discogs', 'hhv', 'ebay']);
  const [primaryColor, setPrimaryColor] = useState(localStorage.getItem('primaryColor') || '#000000');
  const [accentColor, setAccentColor] = useState(localStorage.getItem('accentColor') || '#ffb700');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const shops = [
    { id: 'discogs', name: 'Discogs' },
    { id: 'hhv', name: 'HHV' },
    { id: 'ebay', name: 'eBay' },
    { id: 'recordsale', name: 'Recordsale' },
    { id: 'funrecords', name: 'Fun Records' },
    { id: 'atlas', name: 'Atlas Records' }
  ];

  useEffect(() => {
    localStorage.setItem('claudeApiKey', apiKey);
    localStorage.setItem('recognitionMode', recognitionMode);
    localStorage.setItem('primaryColor', primaryColor);
    localStorage.setItem('accentColor', accentColor);
  }, [apiKey, recognitionMode, primaryColor, accentColor]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setShowCamera(true);
    } catch (error) {
      alert('Kamera-Zugriff fehlgeschlagen: ' + error.message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCapturedImage(null);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      
      if (recognitionMode === 'ai' && apiKey) {
        analyzeWithAI(imageData);
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target.result);
        if (recognitionMode === 'ai' && apiKey) {
          analyzeWithAI(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeWithAI = async (imageData) => {
    setLoading(true);
    try {
      const base64Data = imageData.split(',')[1];
      
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: "image/jpeg",
                    data: base64Data
                  }
                },
                {
                  type: "text",
                  text: "Analyze this vinyl record cover and extract the following information in JSON format: {\"artist\": \"Artist name\", \"album\": \"Album title\", \"year\": \"Release year (number or null)\", \"genre\": \"Music genre\"} Respond ONLY with valid JSON. No other text."
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      let responseText = data.content[0].text;
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const albumData = JSON.parse(responseText);
      
      setSearchResults({
        ...albumData,
        cover: imageData,
        prices: generateMockPrices()
      });
    } catch (error) {
      alert('KI-Analyse fehlgeschlagen: ' + error.message);
    }
    setLoading(false);
  };

  const handleManualSearch = () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setTimeout(() => {
      const parts = searchQuery.split('-').map(p => p.trim());
      setSearchResults({
        artist: parts[0] || 'Unknown Artist',
        album: parts[1] || 'Unknown Album',
        year: 2024,
        genre: 'Rock',
        cover: capturedImage || 'https://via.placeholder.com/300x300/333/fff?text=No+Cover',
        prices: generateMockPrices()
      });
      setLoading(false);
    }, 800);
  };

  const generateMockPrices = () => {
    const basePrice = Math.floor(Math.random() * 40) + 10;
    return selectedShops.map(shop => ({
      shop,
      price: basePrice + Math.floor(Math.random() * 20) - 10,
      condition: ['Mint', 'Near Mint', 'Very Good Plus'][Math.floor(Math.random() * 3)]
    }));
  };

  const addToCollection = (item) => {
    setCollection([...collection, { ...item, id: Date.now() }]);
    alert('Zur Collection hinzugefügt!');
  };

  const addToWishlist = (item) => {
    setWishlist([...wishlist, { ...item, id: Date.now() }]);
    alert('Zur Wishlist hinzugefügt!');
  };

  return (
    <div style={{ 
      backgroundColor: primaryColor, 
      color: '#fff', 
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: '80px'
    }}>
      <header style={{ 
        padding: '16px 20px', 
        borderBottom: '1px solid rgba(255, 183, 0, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>VinylScout</h1>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          style={{
            background: 'transparent',
            border: 'none',
            color: accentColor,
            cursor: 'pointer',
            padding: '8px'
          }}
        >
          <Settings size={24} />
        </button>
      </header>

      {showSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.9)',
          zIndex: 1000,
          overflowY: 'auto',
          padding: '20px'
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Einstellungen</h2>
              <button onClick={() => setShowSettings(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={28} />
              </button>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: accentColor }}>
                Erkennungs-Modus
              </label>
              <select
                value={recognitionMode}
                onChange={(e) => setRecognitionMode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid rgba(255, 183, 0, 0.4)',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              >
                <option value="manual">Manuell (100% kostenlos)</option>
                <option value="ai">KI-Bilderkennung (API-Key erforderlich)</option>
              </select>
            </div>

            {recognitionMode === 'ai' && (
              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: accentColor }}>
                  Claude API-Key
                  {apiKey && <span style={{ marginLeft: '10px', color: '#4ade80', fontSize: '12px' }}>✓ Aktiv</span>}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-api03-..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1a1a1a',
                    color: '#fff',
                    border: '1px solid rgba(255, 183, 0, 0.4)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                  Hole dir einen API-Key bei console.anthropic.com
                </p>
              </div>
            )}

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: accentColor }}>
                Shops für Preisvergleich
              </label>
              {shops.map(shop => (
                <label key={shop.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedShops.includes(shop.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedShops([...selectedShops, shop.id]);
                      } else {
                        setSelectedShops(selectedShops.filter(s => s !== shop.id));
                      }
                    }}
                    style={{ marginRight: '10px', width: '18px', height: '18px' }}
                  />
                  <span>{shop.name}</span>
                </label>
              ))}
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: accentColor }}>
                Primärfarbe (Hintergrund)
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{ width: '60px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#1a1a1a',
                    color: '#fff',
                    border: '1px solid rgba(255, 183, 0, 0.4)',
                    borderRadius: '8px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: accentColor }}>
                Akzentfarbe
              </label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  style={{ width: '60px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#1a1a1a',
                    color: '#fff',
                    border: '1px solid rgba(255, 183, 0, 0.4)',
                    borderRadius: '8px'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#000',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </>
            ) : (
              <img 
                src={capturedImage} 
                alt="Captured" 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            )}
          </div>

          <div style={{
            padding: '20px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.8)'
          }}>
            <button
              onClick={stopCamera}
              style={{
                padding: '12px 24px',
                backgroundColor: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Abbrechen
            </button>
            
            {!capturedImage ? (
              <button
                onClick={capturePhoto}
                style={{
                  padding: '12px 32px',
                  backgroundColor: accentColor,
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                📸 Foto aufnehmen
              </button>
            ) : (
              <>
                <button
                  onClick={() => setCapturedImage(null)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#333',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Neu aufnehmen
                </button>
                <button
                  onClick={() => {
                    stopCamera();
                    if (recognitionMode === 'manual') {
                      setActiveTab('search');
                    }
                  }}
                  style={{
                    padding: '12px 32px',
                    backgroundColor: accentColor,
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  ✓ Verwenden
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: '20px', maxWidth: '100%', overflow: 'hidden' }}>
        {activeTab === 'scan' && (
          <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>Cover scannen</h2>
            
            <div style={{
              backgroundColor: '#1a1a1a',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '1px solid rgba(255, 183, 0, 0.4)'
            }}>
              <div style={{ fontSize: '13px', color: accentColor, fontWeight: '600', marginBottom: '8px' }}>
                AKTIVER MODUS
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {recognitionMode === 'ai' ? '🤖 KI-Bilderkennung' : '✍️ Manuelle Eingabe'}
              </div>
              {recognitionMode === 'ai' && !apiKey && (
                <div style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px' }}>
                  ⚠️ API-Key fehlt - bitte in Einstellungen eintragen
                </div>
              )}
            </div>

            {/* Info Box oben */}
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: '#1a1a1a',
              borderRadius: '12px',
              border: '1px solid #333'
            }}>
              <div style={{ fontSize: '14px', color: '#888', lineHeight: '1.6' }}>
                {recognitionMode === 'ai' ? (
                  <div>
                    <strong style={{ color: accentColor }}>KI-Modus aktiv:</strong><br />
                    Fotografiere das Cover und die KI erkennt automatisch Künstler, Album, Jahr und Genre!
                  </div>
                ) : (
                  <div>
                    <strong style={{ color: accentColor }}>Manueller Modus:</strong><br />
                    Fotografiere das Cover und gib dann die Daten manuell ein.
                  </div>
                )}
              </div>
            </div>

            {/* Spacer um Buttons nach unten zu drücken */}
            <div style={{ flex: 1 }}></div>

            {/* Action Buttons unten über Navigation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={{
                  padding: '20px',
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  border: '2px solid rgba(255, 183, 0, 0.4)',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}
              >
                <Plus size={24} />
                Bild hochladen
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />

              <button
                onClick={startCamera}
                style={{
                  padding: '20px',
                  backgroundColor: accentColor,
                  color: '#000',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}
              >
                <Camera size={24} />
                Kamera öffnen
              </button>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column', width: '100%' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>Suche</h2>
            
            {/* Eingabefeld ganz oben */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Künstler - Album"
              onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
              autoComplete="off"
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#1a1a1a',
                color: '#fff',
                border: '1px solid rgba(255, 183, 0, 0.4)',
                borderRadius: '12px',
                fontSize: '16px',
                marginBottom: '16px',
                boxSizing: 'border-box'
              }}
            />

            {/* Erweiterte Suchoptionen */}
            <details style={{ marginBottom: '16px', width: '100%' }}>
              <summary style={{
                padding: '12px',
                backgroundColor: '#1a1a1a',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                color: accentColor,
                border: '1px solid rgba(255, 183, 0, 0.2)',
                boxSizing: 'border-box',
                width: '100%'
              }}>
                ▶ Erweiterte Suchoptionen
              </summary>
              <div style={{
                padding: '16px',
                backgroundColor: '#1a1a1a',
                borderRadius: '0 0 8px 8px',
                marginTop: '-8px',
                border: '1px solid rgba(255, 183, 0, 0.2)',
                borderTop: 'none',
                boxSizing: 'border-box',
                width: '100%'
              }}>
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '12px', lineHeight: '1.6' }}>
                  <strong style={{ color: accentColor }}>Suchbegriffe:</strong><br />
                  • <strong>Künstler - Album</strong> (z.B. "AC/DC - Highway To Hell")<br />
                  • <strong>Katalognummer</strong> (z.B. "SD 16029")<br />
                  • <strong>Barcode</strong> (z.B. "075992762526")<br />
                  • <strong>Label</strong> (z.B. "Atlantic Records")<br />
                  • <strong>Jahr</strong> (z.B. "1979")
                </p>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '12px', fontStyle: 'italic' }}>
                  Tipp: Je genauer deine Eingabe, desto bessere Ergebnisse!
                </p>
              </div>
            </details>

            {/* Spacer um Button nach unten zu drücken */}
            <div style={{ flex: 1 }}></div>

            {/* Such-Button ganz unten über Navigation */}
            <button
              onClick={handleManualSearch}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: accentColor,
                color: '#000',
                border: 'none',
                borderRadius: '12px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                marginBottom: '20px'
              }}
            >
              {loading ? 'Lädt...' : 'Suchen'}
            </button>

            {searchResults && (
              <div style={{
                backgroundColor: '#1a1a1a',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid rgba(255, 183, 0, 0.4)',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                  <img 
                    src={searchResults.cover} 
                    alt={searchResults.album}
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '8px',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {searchResults.album}
                    </h3>
                    <p style={{ color: '#888', marginBottom: '8px' }}>
                      {searchResults.artist}
                    </p>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                      {searchResults.year} • {searchResults.genre}
                    </p>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: accentColor }}>
                    Preise
                  </h4>
                  {searchResults.prices && searchResults.prices.map((price, idx) => (
                    <div 
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '12px',
                        backgroundColor: '#0a0a0a',
                        borderRadius: '8px',
                        marginBottom: '8px'
                      }}
                    >
                      <span style={{ textTransform: 'capitalize' }}>{price.shop}</span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', color: accentColor }}>
                          €{price.price.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {price.condition}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => addToCollection(searchResults)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      backgroundColor: accentColor,
                      color: '#000',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    + Collection
                  </button>
                  <button
                    onClick={() => addToWishlist(searchResults)}
                    style={{
                      flex: 1,
                      padding: '14px',
                      backgroundColor: '#333',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    + Wishlist
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>Wishlist</h2>
            {wishlist.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '40px 20px' }}>
                Deine Wishlist ist leer
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {wishlist.map(item => (
                  <div 
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: '16px',
                      backgroundColor: '#1a1a1a',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 183, 0, 0.4)'
                    }}
                  >
                    <img 
                      src={item.cover}
                      alt={item.album}
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                        {item.album}
                      </h3>
                      <p style={{ fontSize: '14px', color: '#888' }}>
                        {item.artist}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'collection' && (
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>Collection</h2>
            {collection.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '40px 20px' }}>
                Deine Collection ist leer
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                {collection.map(item => (
                  <div 
                    key={item.id}
                    style={{
                      backgroundColor: '#1a1a1a',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255, 183, 0, 0.4)'
                    }}
                  >
                    <img 
                      src={item.cover}
                      alt={item.album}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ padding: '12px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.album}
                      </h3>
                      <p style={{ fontSize: '12px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.artist}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: primaryColor,
        borderTop: '1px solid rgba(255, 183, 0, 0.2)',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px 0'
      }}>
        {[
          { id: 'search', icon: Search, label: 'Search' },
          { id: 'wishlist', icon: Heart, label: 'Wishlist' },
          { id: 'scan', icon: Camera, label: 'Scan' },
          { id: 'collection', icon: Grid, label: 'Collection' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === tab.id ? accentColor : '#666',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              padding: '8px 16px'
            }}
          >
            <tab.icon size={24} />
            {tab.label}
          </button>
        ))}
      </nav>

      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', color: accentColor }} />
          <p style={{ marginTop: '16px', fontSize: '18px' }}>
            {recognitionMode === 'ai' ? 'KI analysiert...' : 'Suche läuft...'}
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}