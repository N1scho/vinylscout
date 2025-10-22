import React, { useState, useRef, useEffect } from 'react';
import { Camera, Search, Heart, User, Grid3x3, Settings, X, Loader2 } from 'lucide-react';

export default function VinylScout() {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  
  const [settings, setSettings] = useState({
    recognitionMode: 'manual',
    discogsToken: '',
    shops: {
      discogs: true,
      hhv: true,
      ebay: true
    },
    primaryColor: '#000000',
    accentColor: '#ffb700'
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('vinylscout-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('vinylscout-settings', JSON.stringify(newSettings));
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      alert('Kamera-Zugriff fehlgeschlagen');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setCameraActive(false);
    }
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
      setActiveTab('search');
    }
  };

  // Search function with Discogs API
  const handleSearch = async (query) => {
    if (!query.trim()) return;
    
    const token = settings.discogsToken;
    if (!token) {
      alert('Bitte füge einen Discogs Token in den Einstellungen hinzu!');
      setShowSettings(true);
      return;
    }
    
    setLoading(true);
    try {
      const searchUrl = `https://api.discogs.com/database/search?q=${encodeURIComponent(query)}&type=release&token=${token}`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'VinylScout/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Discogs API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const firstResult = data.results[0];
        
        setSearchResults({
          album: firstResult.title || 'Unknown Album',
          artist: firstResult.title?.split(' - ')[0] || 'Unknown Artist',
          year: firstResult.year || 'Unknown',
          genre: firstResult.genre?.[0] || firstResult.style?.[0] || 'Unknown',
          cover: firstResult.cover_image || firstResult.thumb || 'https://via.placeholder.com/300x300/1a1a1a/ffb700?text=No+Cover',
          allResults: data.results.slice(0, 10)
        });
      } else {
        alert('Keine Ergebnisse gefunden');
        setSearchResults(null);
      }
    } catch (error) {
      console.error('Search error:', error);
      alert(`Fehler bei der Suche: ${error.message}`);
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen pb-20"
      style={{ 
        backgroundColor: settings.primaryColor,
        color: '#ffffff'
      }}
    >
      {/* Header */}
      <div 
        className="p-4 flex justify-between items-center border-b-2"
        style={{ borderColor: settings.accentColor }}
      >
        <h1 className="text-2xl font-bold">VinylScout</h1>
        <button 
          onClick={() => setShowSettings(true)}
          className="p-2 rounded-full hover:bg-gray-800"
        >
          <Settings size={24} style={{ color: settings.accentColor }} />
        </button>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Camera Tab */}
        {activeTab === 'camera' && (
          <div className="space-y-4">
            {!cameraActive ? (
              <button
                onClick={startCamera}
                className="w-full py-4 rounded-lg font-semibold text-lg"
                style={{ 
                  backgroundColor: settings.accentColor,
                  color: settings.primaryColor 
                }}
              >
                <Camera className="inline mr-2" />
                Kamera starten
              </button>
            ) : (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg"
                />
                <div className="flex gap-2">
                  <button
                    onClick={capturePhoto}
                    className="flex-1 py-3 rounded-lg font-semibold"
                    style={{ 
                      backgroundColor: settings.accentColor,
                      color: settings.primaryColor 
                    }}
                  >
                    Foto aufnehmen
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-6 py-3 bg-gray-700 rounded-lg"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            {capturedImage && (
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="w-full rounded-lg border-2"
                style={{ borderColor: settings.accentColor }}
              />
            )}
            
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                placeholder="Album oder Künstler suchen..."
                className="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-white border-2"
                style={{ borderColor: settings.accentColor }}
              />
              <button
                onClick={() => handleSearch(searchQuery)}
                disabled={loading}
                className="px-6 py-3 rounded-lg font-semibold flex items-center"
                style={{ 
                  backgroundColor: settings.accentColor,
                  color: settings.primaryColor 
                }}
              >
                {loading ? <Loader2 className="animate-spin" /> : <Search />}
              </button>
            </div>

            {searchResults && (
              <div className="space-y-6">
                {/* Main Result */}
                <div className="bg-gray-900 rounded-lg overflow-hidden border-2" style={{ borderColor: settings.accentColor }}>
                  <img 
                    src={searchResults.cover} 
                    alt="Album Cover"
                    className="w-full aspect-square object-cover"
                  />
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-xl text-white">{searchResults.artist}</h3>
                    <p style={{ color: settings.accentColor }}>{searchResults.album}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Jahr:</span>
                        <span className="ml-2 text-white">{searchResults.year}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Genre:</span>
                        <span className="ml-2 text-white">{searchResults.genre}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Results */}
                {searchResults.allResults && searchResults.allResults.length > 1 && (
                  <div className="space-y-3">
                    <h4 style={{ color: settings.accentColor }} className="font-semibold">Weitere Ergebnisse:</h4>
                    {searchResults.allResults.slice(1).map((result, idx) => (
                      <div 
                        key={idx}
                        className="bg-gray-900 rounded-lg p-3 flex gap-3 cursor-pointer hover:bg-gray-800 transition-colors"
                        onClick={() => {
                          setSearchResults({
                            album: result.title || 'Unknown Album',
                            artist: result.title?.split(' - ')[0] || 'Unknown Artist',
                            year: result.year || 'Unknown',
                            genre: result.genre?.[0] || result.style?.[0] || 'Unknown',
                            cover: result.cover_image || result.thumb || 'https://via.placeholder.com/150x150/1a1a1a/ffb700?text=No+Cover',
                            allResults: searchResults.allResults
                          });
                        }}
                      >
                        <img 
                          src={result.cover_image || result.thumb || 'https://via.placeholder.com/80x80/1a1a1a/ffb700?text=?'} 
                          alt={result.title}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{result.title}</p>
                          <p className="text-gray-400 text-sm">{result.year || '?'}</p>
                          <p className="text-xs" style={{ color: settings.accentColor }}>{result.format?.[0] || 'Vinyl'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setSearchResults(null)}
                  className="w-full py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Neue Suche
                </button>
              </div>
            )}
          </div>
        )}

        {/* Collection Tab */}
        {activeTab === 'collection' && (
          <div className="text-center py-12">
            <Grid3x3 size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-gray-400">Deine Sammlung ist noch leer</p>
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="text-center py-12">
            <Heart size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-gray-400">Keine Favoriten gespeichert</p>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="text-center py-12">
            <User size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-gray-400">Profil kommt bald</p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 p-4 border-b-2 flex justify-between items-center" style={{ borderColor: settings.accentColor }}>
              <h2 className="text-xl font-bold">Einstellungen</h2>
              <button onClick={() => setShowSettings(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              {/* Recognition Mode */}
              <div>
                <label className="block mb-2" style={{ color: settings.accentColor }}>Erkennungs-Modus</label>
                <select
                  value={settings.recognitionMode}
                  onChange={(e) => saveSettings({...settings, recognitionMode: e.target.value})}
                  className="w-full px-4 py-2 rounded bg-gray-800 text-white border-2"
                  style={{ borderColor: settings.accentColor }}
                >
                  <option value="manual">Manuell (100% kostenlos)</option>
                </select>
              </div>

              {/* Discogs Token */}
              <div>
                <label className="block mb-2" style={{ color: settings.accentColor }}>
                  Discogs Token (für echte Album-Cover) 
                  {settings.discogsToken && <span className="text-green-500 ml-2">✓ Aktiv</span>}
                </label>
                <input
                  type="password"
                  value={settings.discogsToken}
                  onChange={(e) => saveSettings({...settings, discogsToken: e.target.value})}
                  placeholder="Token hier einfügen"
                  className="w-full px-4 py-2 rounded bg-gray-800 text-white border-2"
                  style={{ borderColor: settings.accentColor }}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Optional: Hole dir einen Token bei discogs.com/settings/developers
                </p>
              </div>

              {/* Shop Selection */}
              <div>
                <label className="block mb-2" style={{ color: settings.accentColor }}>Shops für Preisvergleich</label>
                <div className="space-y-2">
                  {Object.entries(settings.shops).map(([shop, enabled]) => (
                    <label key={shop} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => saveSettings({
                          ...settings,
                          shops: {...settings.shops, [shop]: e.target.checked}
                        })}
                        className="w-5 h-5"
                        style={{ accentColor: settings.accentColor }}
                      />
                      <span className="capitalize">{shop}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Primary Color */}
              <div>
                <label className="block mb-2" style={{ color: settings.accentColor }}>Primärfarbe (Hintergrund)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => saveSettings({...settings, primaryColor: e.target.value})}
                    className="w-16 h-10 rounded"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => saveSettings({...settings, primaryColor: e.target.value})}
                    className="flex-1 px-4 py-2 rounded bg-gray-800 text-white border-2"
                    style={{ borderColor: settings.accentColor }}
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block mb-2" style={{ color: settings.accentColor }}>Akzentfarbe</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.accentColor}
                    onChange={(e) => saveSettings({...settings, accentColor: e.target.value})}
                    className="w-16 h-10 rounded"
                  />
                  <input
                    type="text"
                    value={settings.accentColor}
                    onChange={(e) => saveSettings({...settings, accentColor: e.target.value})}
                    className="flex-1 px-4 py-2 rounded bg-gray-800 text-white border-2"
                    style={{ borderColor: settings.accentColor }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t-2 flex" style={{ borderColor: settings.accentColor }}>
        {[
          { id: 'search', icon: Search, label: 'Suchen' },
          { id: 'camera', icon: Camera, label: 'Kamera' },
          { id: 'collection', icon: Grid3x3, label: 'Sammlung' },
          { id: 'favorites', icon: Heart, label: 'Favoriten' },
          { id: 'profile', icon: User, label: 'Profil' }
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex-1 py-3 flex flex-col items-center gap-1"
            style={{ 
              color: activeTab === id ? settings.accentColor : '#6b7280'
            }}
          >
            <Icon size={24} />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}