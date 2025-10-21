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
  
  const [apiKey, setApiKey] = useState('');
  const [recognitionMode, setRecognitionMode] = useState('manual');
  const [selectedShops, setSelectedShops] = useState(['discogs', 'hhv', 'ebay']);
  const [primaryColor] = useState('#000000');
  const [accentColor] = useState('#ffb700');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
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

  const handleManualSearch = () => {
    let query = '';
    
    if (showAdvanced) {
      const artist = artistInputRef.current?.value || '';
      const album = albumInputRef.current?.value || '';
      const year = yearInputRef.current?.value || '';
      const label = labelInputRef.current?.value || '';
      const catalog = catalogInputRef.current?.value || '';
      const barcode = barcodeInputRef.current?.value || '';
      
      query = `${artist} - ${album}`;
      
      setSearchResults({
        artist: artist || 'Unknown',
        album: album || 'Unknown',
        year: year || 2024,
        genre: 'Rock',
        label: label,
        catalog: catalog,
        barcode: barcode,
        cover: 'https://images.unsplash.com/photo-1619983081563-430f63602796?w=300&h=300&fit=crop',
        prices: [
          { shop: 'discogs', price: 15.99, condition: 'Mint' },
          { shop: 'hhv', price: 12.50, condition: 'Near Mint' },
          { shop: 'ebay', price: 18.00, condition: 'Very Good' }
        ]
      });
    } else {
      query = searchInputRef.current ? searchInputRef.current.value : '';
      if (!query.trim()) return;
      
      const parts = query.split('-').map(p => p.trim());
      setSearchResults({
        artist: parts[0] || 'Unknown',
        album: parts[1] || 'Unknown',
        year: 2024,
        genre: 'Rock',
        cover: 'https://images.unsplash.com/photo-1619983081563-430f63602796?w=300&h=300&fit=crop',
        prices: [
          { shop: 'discogs', price: 15.99, condition: 'Mint' },
          { shop: 'hhv', price: 12.50, condition: 'Near Mint' },
          { shop: 'ebay', price: 18.00, condition: 'Very Good' }
        ]
      });
    }
  };

  return (
    <div style={{ backgroundColor: '#000', color: '#fff', minHeight: '100vh', paddingBottom: '80px', fontFamily: 'system-ui' }}>
      <header style={{ padding: '16px 20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>VinylScout</h1>
        <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'transparent', border: 'none', color: '#ffb700', cursor: 'pointer' }}>
          <Settings size={24} />
        </button>
      </header>

      {showSettings && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1000, padding: '20px' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Einstellungen</h2>
              <button onClick={() => setShowSettings(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={28} />
              </button>
            </div>
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: '#ffb700' }}>Modus</label>
              <select value={recognitionMode} onChange={(e) => setRecognitionMode(e.target.value)} style={{ width: '100%', padding: '12px', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #ffb700', borderRadius: '8px' }}>
                <option value="manual">Manuell</option>
                <option value="ai">KI-Bilderkennung</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 999, display: 'flex', flexDirection: 'column' }}>
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
              <button onClick={capturePhoto} style={{ padding: '12px 32px', backgroundColor: '#ffb700', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>📸 Foto</button>
            ) : (
              <>
                <button onClick={() => setCapturedImage(null)} style={{ padding: '12px 24px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Neu</button>
                <button onClick={() => { stopCamera(); setActiveTab('search'); }} style={{ padding: '12px 32px', backgroundColor: '#ffb700', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>✓ OK</button>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: '20px' }}>
        {activeTab === 'scan' && (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 200px)' }}>
            <h2 style={{ fontSize: '28px', marginBottom: '24px' }}>Cover scannen</h2>
            <div style={{ backgroundColor: '#1a1a1a', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #ffb700' }}>
              <div style={{ fontSize: '13px', color: '#ffb700', marginBottom: '8px' }}>MODUS</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{recognitionMode === 'ai' ? '🤖 KI' : '✍️ Manuell'}</div>
            </div>
            <div style={{ flex: 1 }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button onClick={startCamera} style={{ padding: '20px', backgroundColor: '#ffb700', color: '#000', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
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
                    border: '1px solid #ffb700', 
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
                    border: '1px solid #ffb700', 
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
                    border: '1px solid #ffb700', 
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
                    border: '1px solid #ffb700', 
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
                    border: '1px solid #ffb700', 
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
                    border: '1px solid #ffb700', 
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
                    border: '1px solid #ffb700', 
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
                color: '#ffb700',
                border: '1px solid #ffb700',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '16px'
              }}
            >
              {showAdvanced ? '▲ Einfache Suche' : '▼ Erweiterte Suche'}
            </button>
            
            {searchResults && (
              <div style={{ backgroundColor: '#1a1a1a', borderRadius: '12px', padding: '20px', border: '1px solid #ffb700', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                  <img src={searchResults.cover} alt={searchResults.album} style={{ width: '120px', height: '120px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div>
                    <h3 style={{ fontSize: '20px', marginBottom: '4px' }}>{searchResults.album}</h3>
                    <p style={{ color: '#888', marginBottom: '8px' }}>{searchResults.artist}</p>
                    <p style={{ fontSize: '14px', color: '#666' }}>{searchResults.year} • {searchResults.genre}</p>
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '16px', marginBottom: '12px', color: '#ffb700' }}>Preise</h4>
                  {searchResults.prices.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#0a0a0a', borderRadius: '8px', marginBottom: '8px' }}>
                      <span>{p.shop}</span>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#ffb700' }}>€{p.price}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{p.condition}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ flex: 1 }}></div>
            <button onClick={handleManualSearch} style={{ width: '100%', padding: '16px', backgroundColor: '#ffb700', color: '#000', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>Suchen</button>
          </div>
        )}

        {activeTab === 'wishlist' && (
          <div>
            <h2 style={{ fontSize: '28px', marginBottom: '24px' }}>Wishlist</h2>
            <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>Leer</p>
          </div>
        )}

        {activeTab === 'collection' && (
          <div>
            <h2 style={{ fontSize: '28px', marginBottom: '24px' }}>Collection</h2>
            <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>Leer</p>
          </div>
        )}
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#000', borderTop: '1px solid #333', display: 'flex', justifyContent: 'space-around', padding: '12px 0' }}>
        {[
          { id: 'search', icon: Search, label: 'Search' },
          { id: 'wishlist', icon: Heart, label: 'Wishlist' },
          { id: 'scan', icon: Camera, label: 'Scan' },
          { id: 'collection', icon: Grid, label: 'Collection' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: 'transparent', border: 'none', color: activeTab === tab.id ? '#ffb700' : '#666', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '8px' }}>
            <tab.icon size={24} />
            {tab.label}
          </button>
        ))}
      </nav>

      {loading && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', color: '#ffb700' }} />
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}