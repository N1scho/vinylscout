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
  const [discogsToken, setDiscogsToken] = useState(localStorage.getItem('discogsToken') || '');
  const [recognitionMode, setRecognitionMode] = useState('manual');
  const [selectedShops, setSelectedShops] = useState(['discogs', 'hhv', 'ebay']);
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [accentColor, setAccentColor] = useState('#ffb700');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const artistInputRef = useRef(null);
  const albumInputRef = useRef(null);
  const yearInputRef = useRef(null);
  const labelInputRef = useRef(null);
  const catalogInputRef = useRef(null);
  const barcodeInputRef = useRef(null);
  
  const [showAdvanced, setShowAdvanced] = useState(false);

  const shops = [
    { id: 'discogs', name: 'Discogs' },
    { id: 'hhv', name: 'HHV' },
    { id: 'ebay', name: 'eBay' }
  ];

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setShowCamera(true);
    } catch (error) {
      alert('Kamera-Zugriff fehlgeschlagen');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
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
      canvas.getContext('2d').drawImage(video, 0, 0);
      setCapturedImage(canvas.toDataURL('image/jpeg'));
    }
  };

  const handleManualSearch = async () => {
    let query = '';
    
    if (showAdvanced) {
      const artist = artistInputRef.current?.value || '';
      const album = albumInputRef.current?.value || '';
      const year = yearInputRef.current?.value || '';
      
      if (!artist && !album && !year) return;
      
      setLoading(true);
      
      try {
        const searchParams = new URLSearchParams();
        if (artist) searchParams.append('artist', artist);
        if (album) searchParams.append('release_title', album);
        if (year) searchParams.append('year', year);
        searchParams.append('type', 'release');
        searchParams.append('format', 'vinyl');
        
        const headers = discogsToken 
          ? { 'Authorization': `Discogs token=${discogsToken}` }
          : { 'User-Agent': 'VinylScout/1.0' };
        
        const response = await fetch(
          `https://api.discogs.com/database/search?${searchParams.toString()}`,
          { headers }
        );
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const results = data.results.slice(0, 5).map(item => ({
            id: item.id,
            artist: item.title.split(' - ')[0] || 'Unknown',
            album: item.title.split(' - ')[1] || item.title,
            year: item.year || 'N/A',
            genre: item.genre ? item.genre[0] : 'Unknown',
            label: item.label ? item.label[0] : '',
            catalog: item.catno || '',
            cover: item.cover_image || item.thumb || 'https://images.unsplash.com/photo-1619983081563-430f63602796?w=300&h=300&fit=crop',
            prices: [
              { shop: 'discogs', price: (Math.random() * 30 + 10).toFixed(2), condition: 'Mint' },
              { shop: 'hhv', price: (Math.random() * 30 + 10).toFixed(2), condition: 'Near Mint' },
              { shop: 'ebay', price: (Math.random() * 30 + 10).toFixed(2), condition: 'Very Good' }
            ]
          }));
          
          setSearchResults(results);
        } else {
          alert('Keine Ergebnisse gefunden');
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        alert('Suche fehlgeschlagen: ' + error.message);
      }
      
      setLoading(false);
      
    } else {
      query = searchInputRef.current ? searchInputRef.current.value : '';
      if (!query.trim()) return;
      
      setLoading(true);
      
      try {
        const headers = discogsToken 
          ? { 'Authorization': `Discogs token=${discogsToken}` }
          : { 'User-Agent': 'VinylScout/1.0' };
        
        const response = await fetch(
          `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release&format=vinyl`,
          { headers }
        );
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const results = data.results.slice(0, 5).map(item => ({
            id: item.id,
            artist: item.title.split(' - ')[0] || 'Unknown',
            album: item.title.split(' - ')[1] || item.title,
            year: item.year || 'N/A',
            genre: item.genre ? item.genre[0] : 'Unknown',
            cover: item.cover_image || item.thumb || 'https://images.unsplash.com/photo-1619983081563-430f63602796?w=300&h=300&fit=crop',
            prices: [
              { shop: 'discogs', price: (Math.random() * 30 + 10).toFixed(2), condition: 'Mint' },
              { shop: 'hhv', price: (Math.random() * 30 + 10).toFixed(2), condition: 'Near Mint' },
              { shop: 'ebay', price: (Math.random() * 30 + 10).toFixed(2), condition: 'Very Good' }
            ]
          }));
          
          setSearchResults(results);
        } else {
          alert('Keine Ergebnisse gefunden');
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        alert('Suche fehlgeschlagen: ' + error.message);
      }
      
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      backgroundColor: primaryColor, 
      color: '#fff', 
      minHeight: '100vh',
      width: '100vw',
      maxWidth: '100vw',
      overflowX: 'hidden',
      paddingBottom: '80px', 
      fontFamily: 'system-ui',
      position: 'relative',
      boxSizing: 'border-box'
    }}>
      <header style={{ 
        padding: '16px 20px', 
        borderBottom: '1px solid #333', 
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
            cursor: 'pointer' 
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
          backgroundColor: 'rgba(0,0,0,0.95)', 
          zIndex: 1000,
          overflowY: 'auto',
          padding: '20px' 
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', alignItems: 'center' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Einstellungen</h2>
              <button 
                onClick={() => setShowSettings(false)} 
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: '#fff', 
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <X size={28} />
              </button>
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: accentColor, fontSize: '14px', fontWeight: '600' }}>
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
                  border: `1px solid ${accentColor}`, 
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
                <label style={{ display: 'block', marginBottom: '10px', color: accentColor, fontSize: '14px', fontWeight: '600' }}>
                  Claude API-Key
                  {apiKey && <span style={{ marginLeft: '10px', color: '#4ade80', fontSize: '12px' }}>✓ Aktiv</span>}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    localStorage.setItem('claudeApiKey', e.target.value);
                  }}
                  placeholder="sk-ant-api03-..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1a1a1a',
                    color: '#fff',
                    border: `1px solid ${accentColor}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                  Hole dir einen API-Key bei console.anthropic.com
                </p>
              </div>
            )}
            
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: accentColor, fontSize: '14px', fontWeight: '600' }}>
                Discogs Token (für echte Album-Cover)
                {discogsToken && <span style={{ marginLeft: '10px', color: '#4ade80', fontSize: '12px' }}>✓ Aktiv</span>}
              </label>
              <input
                type="password"
                value={discogsToken}
                onChange={(e) => {
                  setDiscogsToken(e.target.value);
                  localStorage.setItem('discogsToken', e.target.value);
                }}
                placeholder="Dein Discogs Token"
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  border: `1px solid ${accentColor}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                Optional: Hole dir einen Token bei discogs.com/settings/developers
              </p>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: accentColor, fontSize: '14px', fontWeight: '600' }}>
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
              <label style={{ display: 'block', marginBottom: '10px', color: accentColor, fontSize: '14px', fontWeight: '600' }}>
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
                  readOnly
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#1a1a1a',
                    color: '#fff',
                    border: `1px solid ${accentColor}`,
                    borderRadius: '8px'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: accentColor, fontSize: '14px', fontWeight: '600' }}>
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
                  readOnly
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#1a1a1a',
                    color: '#fff',
                    border: `1px solid ${accentColor}`,
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
          <div style={{ flex: 1 }}>
            {!capturedImage ? (
              <>
                <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </>
            ) : (
              <img src={capturedImage} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            )}
          </div>
          <div style={{ padding: '20px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={stopCamera} style={{ padding: '12px 24px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Abbrechen</button>
            {!capturedImage ? (
              <button onClick={capturePhoto} style={{ padding: '12px 32px', backgroundColor: accentColor, color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📸 Foto</button>
            ) : (
              <>
                <button onClick={() => setCapturedImage(null)} style={{ padding: '12px 24px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Neu</button>
                <button onClick={() => { stopCamera(); setActiveTab('search'); }} style={{ padding: '12px 32px', backgroundColor: accentColor, color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>✓ OK</button>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: '20px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        {activeTab === 'scan' && (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 200px)' }}>
            <h2 style={{ fontSize: '28px', marginBottom: '24px' }}>Cover scannen</h2>
            <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: `1px solid ${accentColor}` }}>
              <div style={{ fontSize: '13px', color: accentColor, marginBottom: '8px' }}>MODUS</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{recognitionMode === 'ai' ? '🤖 KI' : '✍️ Manuell'}</div>
            </div>
            <div style={{ flex: 1 }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button onClick={startCamera} style={{ padding: '20px', backgroundColor: accentColor, color: '#000', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <Camera size={24} />
                Kamera öffnen
              </button>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 200px)' }}>
            <h2 style={{ fontSize: '28px', marginBottom: '24px' }}>Suche</h2>
            
            {!showAdvanced ? (
              <div style={{ marginBottom: '16px' }}>
                <input 
                  ref={searchInputRef}
                  type="text" 
                  defaultValue=""
                  placeholder="Künstler - Album" 
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                  autoComplete="off"
                  style={{ 
                    width: '100%', 
                    padding: '16px', 
                    backgroundColor: '#1a1a1a', 
                    color: '#ffffff',
                    border: `1px solid ${accentColor}`, 
                    borderRadius: '12px', 
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    WebkitTextFillColor: '#ffffff'
                  }} 
                />
              </div>
            ) : (
              <div style={{ marginBottom: '16px' }}>
                <input 
                  ref={artistInputRef}
                  type="text" 
                  placeholder="Interpret / Künstler"
                  autoComplete="off"
                  style={{ 
                    width: '100%', 
                    padding: '14px', 
                    backgroundColor: '#1a1a1a', 
                    color: '#ffffff',
                    border: `1px solid ${accentColor}`, 
                    borderRadius: '8px', 
                    fontSize: '15px',
                    boxSizing: 'border-box',
                    marginBottom: '12px',
                    WebkitTextFillColor: '#ffffff'
                  }} 
                />
                <input 
                  ref={albumInputRef}
                  type="text" 
                  placeholder="Album"
                  autoComplete="off"
                  style={{ 
                    width: '100%', 
                    padding: '14px', 
                    backgroundColor: '#1a1a1a', 
                    color: '#ffffff',
                    border: `1px solid ${accentColor}`, 
                    borderRadius: '8px', 
                    fontSize: '15px',
                    boxSizing: 'border-box',
                    marginBottom: '12px',
                    WebkitTextFillColor: '#ffffff'
                  }} 
                />
                <input 
                  ref={yearInputRef}
                  type="text" 
                  placeholder="Jahr (z.B. 1979)"
                  autoComplete="off"
                  style={{ 
                    width: '100%', 
                    padding: '14px', 
                    backgroundColor: '#1a1a1a', 
                    color: '#ffffff',
                    border: `1px solid ${accentColor}`, 
                    borderRadius: '8px', 
                    fontSize: '15px',
                    boxSizing: 'border-box',
                    marginBottom: '12px',
                    WebkitTextFillColor: '#ffffff'
                  }} 
                />
                <input 
                  ref={labelInputRef}
                  type="text" 
                  placeholder="Label (z.B. Atlantic Records)"
                  autoComplete="off"
                  style={{ 
                    width: '100%', 
                    padding: '14px', 
                    backgroundColor: '#1a1a1a', 
                    color: '#ffffff',
                    border: `1px solid ${accentColor}`, 
                    borderRadius: '8px', 
                    fontSize: '15px',
                    boxSizing: 'border-box',
                    marginBottom: '12px',
                    WebkitTextFillColor: '#ffffff'
                  }} 
                />
                <input 
                  ref={catalogInputRef}
                  type="text" 
                  placeholder="Katalognummer (z.B. SD 16029)"
                  autoComplete="off"
                  style={{ 
                    width: '100%', 
                    padding: '14px', 
                    backgroundColor: '#1a1a1a', 
                    color: '#ffffff',
                    border: `1px solid ${accentColor}`, 
                    borderRadius: '8px', 
                    fontSize: '15px',
                    boxSizing: 'border-box',
                    marginBottom: '12px',
                    WebkitTextFillColor: '#ffffff'
                  }} 
                />
                <input 
                  ref={barcodeInputRef}
                  type="text" 
                  placeholder="Barcode (z.B. 075992762526)"
                  autoComplete="off"
                  style={{ 
                    width: '100%', 
                    padding: '14px', 
                    backgroundColor: '#1a1a1a', 
                    color: '#ffffff',
                    border: `1px solid ${accentColor}`, 
                    borderRadius: '8px', 
                    fontSize: '15px',
                    boxSizing: 'border-box',
                    WebkitTextFillColor: '#ffffff'
                  }} 
                />
              </div>
            )}

            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                padding: '12px',
                backgroundColor: '#1a1a1a',
                color: accentColor,
                border: `1px solid ${accentColor}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '16px'
              }}
            >
              {showAdvanced ? '▲ Einfache Suche' : '▼ Erweiterte Suche'}
            </button>

            {searchResults && searchResults.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '16px', color: accentColor }}>
                  {searchResults.length} Ergebnis{searchResults.length > 1 ? 'se' : ''} gefunden
                </h3>
                
                {searchResults.map((result, idx) => (
                  <div 
                    key={result.id || idx}
                    style={{ 
                      backgroundColor: '#1a1a1a', 
                      borderRadius: '12px', 
                      padding: '20px', 
                      border: `1px solid ${accentColor}`, 
                      marginBottom: '16px' 
                    }}
                  >
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                      <img 
                        src={result.cover} 
                        alt={result.album} 
                        style={{ width: '120px', height: '120px', borderRadius: '8px', objectFit: 'cover' }} 
                      />
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '18px', marginBottom: '4px', fontWeight: 'bold' }}>{result.album}</h3>
                        <p style={{ color: '#888', marginBottom: '8px' }}>{result.artist}</p>
                        <p style={{ fontSize: '14px', color: '#666' }}>
                          {result.year} • {result.genre}
                          {result.label && ` • ${result.label}`}
                          {result.catalog && ` • ${result.catalog}`}
                        </p>
                      </div>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '16px', marginBottom: '12px', color: accentColor }}>Preise</h4>
                      {result.prices.map((p, i) => (
                        <div 
                          key={i} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            padding: '12px', 
                            backgroundColor: '#0a0a0a', 
                            borderRadius: '8px', 
                            marginBottom: '8px' 
                          }}
                        >
                          <span style={{ textTransform: 'capitalize' }}>{p.shop}</span>
                          <div>
                            <div style={{ fontWeight: 'bold', color: accentColor }}>€{p.price}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>{p.condition}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        onClick={() => setCollection([...collection, { ...result, id: Date.now() }])}
                        style={{ 
                          flex: 1, 
                          padding: '12px', 
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
                        onClick={() => setWishlist([...wishlist, { ...result, id: Date.now() }])}
                        style={{ 
                          flex: 1, 
                          padding: '12px', 
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
                ))}
              </div>
            )}

            <div style={{ flex: 1 }}></div>
            <button onClick={handleManualSearch} style={{ width: '100%', padding: '16px', backgroundColor: accentColor, color: '#000', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>Suchen</button>
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div>
            <h2 style={{ fontSize: '28px', marginBottom: '24px' }}>Wishlist</h2>
            {wishlist.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>Leer</p>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {wishlist.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: '16px', backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '12px', border: `1px solid ${accentColor}` }}>
                    <img src={item.cover} alt={item.album} style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>{item.album}</h3>
                      <p style={{ fontSize: '14px', color: '#888' }}>{item.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'collection' && (
          <div>
            <h2 style={{ fontSize: '28px', marginBottom: '24px' }}>Collection</h2>
            {collection.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>Leer</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                {collection.map(item => (
                  <div key={item.id} style={{ backgroundColor: '#1a1a1a', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${accentColor}` }}>
                    <img src={item.cover} alt={item.album} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
                    <div style={{ padding: '12px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.album}</h3>
                      <p style={{ fontSize: '12px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.artist}</p>
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
        width: '100%',
        backgroundColor: primaryColor,
        borderTop: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '12px 0',
        boxSizing: 'border-box',
        zIndex: 100
      }}>
        {[
          { id: 'search', icon: Search, label: 'Search' },
          { id: 'wishlist', icon: Heart, label: 'Wishlist' },
          { id: 'scan', icon: Camera, label: 'Scan' },
          { id: 'collection', icon: Grid, label: 'Collection' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: 'transparent', border: 'none', color: activeTab === tab.id ? accentColor : '#666', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '8px' }}>
            <tab.icon size={24} />
            {tab.label}
          </button>
        ))}
      </nav>

      {loading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', color: accentColor }} />
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}