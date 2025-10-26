import React, { useState, useEffect, useRef } from 'react';
import { Search, Camera, Music, User, Settings, X, ChevronRight, ExternalLink, Trash2, Edit2, Palette, Heart } from 'lucide-react';

const VinylPriceFinder = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedSearch, setAdvancedSearch] = useState({ artist: '', album: '', year: '', label: '', genre: '', format: '', excludeFormat: '' });
  const [searchResults, setSearchResults] = useState([]);
  const [resultPrices, setResultPrices] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [collection, setCollection] = useState([]);
  const [collectionSort, setCollectionSort] = useState('artist-asc');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [showCustomColors, setShowCustomColors] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [cameraMode, setCameraMode] = useState('photo');
  const [userProfile, setUserProfile] = useState({ name: '', nickname: '', email: '', address: '', city: '', country: '' });
  const [discogsToken, setDiscogsToken] = useState('');
  const [anthropicToken, setAnthropicToken] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [accentColor, setAccentColor] = useState('#FFB700');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [currentTheme, setCurrentTheme] = useState('dark-orange');
  const [customRGB, setCustomRGB] = useState({ primary: { r: 0, g: 0, b: 0 }, accent: { r: 255, g: 183, b: 0 }, text: { r: 255, g: 255, b: 255 } });
  const videoRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const themes = {
    'dark-orange': { name: 'Dark Orange', primary: '#000000', accent: '#FFB700', text: '#FFFFFF' },
    'spotify': { name: 'Spotify', primary: '#121212', accent: '#1DB954', text: '#FFFFFF' },
    'vintage': { name: 'Vintage', primary: '#2C1810', accent: '#D4A574', text: '#F5E6D3' },
    'minimal-light': { name: 'Light', primary: '#FFFFFF', accent: '#0066FF', text: '#1A1A1A' },
    'sunset': { name: 'Sunset', primary: '#1A0B2E', accent: '#FF6B9D', text: '#FFF1E6' },
    'forest': { name: 'Forest', primary: '#0D1F2D', accent: '#4CAF50', text: '#E8F5E9' },
    'ocean': { name: 'Ocean', primary: '#001F3F', accent: '#00D4FF', text: '#E0F7FF' },
    'neon': { name: 'Neon', primary: '#0A0A0A', accent: '#FF10F0', text: '#00FFF0' },
    'gold': { name: 'Gold', primary: '#1C1C1C', accent: '#FFD700', text: '#FFF8DC' },
    'cherry': { name: 'Cherry', primary: '#2D0A0A', accent: '#FF1744', text: '#FFE4E1' },
    'purple': { name: 'Purple', primary: '#1A0033', accent: '#9D4EDD', text: '#E0B0FF' }
  };
  
  const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 };
  };
  
  const applyCustomColors = () => {
    const newPrimary = rgbToHex(customRGB.primary.r, customRGB.primary.g, customRGB.primary.b);
    const newAccent = rgbToHex(customRGB.accent.r, customRGB.accent.g, customRGB.accent.b);
    const newText = rgbToHex(customRGB.text.r, customRGB.text.g, customRGB.text.b);
    setPrimaryColor(newPrimary); setAccentColor(newAccent); setTextColor(newText); setCurrentTheme('custom');
    localStorage.setItem('currentTheme', 'custom');
    localStorage.setItem('customColors', JSON.stringify({ primary: newPrimary, accent: newAccent, text: newText }));
  };
  
  const applyTheme = (themeKey) => {
    const theme = themes[themeKey];
    setPrimaryColor(theme.primary); setAccentColor(theme.accent); setTextColor(theme.text); setCurrentTheme(themeKey);
    localStorage.setItem('currentTheme', themeKey);
    setCustomRGB({ primary: hexToRgb(theme.primary), accent: hexToRgb(theme.accent), text: hexToRgb(theme.text) });
  };

  useEffect(() => {
    const saved = {
      token: localStorage.getItem('discogsToken'),
      anthro: localStorage.getItem('anthropicToken'),
      theme: localStorage.getItem('currentTheme'),
      coll: localStorage.getItem('collection'),
      prof: localStorage.getItem('userProfile'),
      custom: localStorage.getItem('customColors')
    };
    if (saved.token) setDiscogsToken(saved.token);
    if (saved.anthro) setAnthropicToken(saved.anthro);
    if (saved.coll) setCollection(JSON.parse(saved.coll));
    if (saved.prof) setUserProfile(JSON.parse(saved.prof));
    if (saved.theme === 'custom' && saved.custom) {
      const c = JSON.parse(saved.custom);
      setPrimaryColor(c.primary); setAccentColor(c.accent); setTextColor(c.text);
      setCustomRGB({ primary: hexToRgb(c.primary), accent: hexToRgb(c.accent), text: hexToRgb(c.text) });
    } else if (saved.theme && themes[saved.theme]) applyTheme(saved.theme);
  }, []);

  const saveSettings = () => {
    localStorage.setItem('discogsToken', discogsToken);
    localStorage.setItem('anthropicToken', anthropicToken);
    setShowSettings(false);
  };

  const saveProfile = () => {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    setShowEditProfile(false);
  };

  const fetchPriceInfo = async (id) => {
    if (!discogsToken) return null;
    try {
      const res = await fetch(`https://api.discogs.com/marketplace/stats/${id}`, {
        headers: { 'Authorization': `Discogs token=${discogsToken}`, 'User-Agent': 'VinylScout/1.0' }
      });
      if (res.ok) {
        const d = await res.json();
        if (d.lowest_price) return { value: d.lowest_price.value, currency: d.lowest_price.currency };
      }
    } catch (e) { console.error(e); }
    return null;
  };

  const searchDiscogs = async (isAdv = false, qOver = null, pg = 1) => {
    if (!discogsToken) { alert('Add Discogs token in Settings'); return; }
    setIsLoading(true); setResultPrices({});
    try {
      let url = 'https://api.discogs.com/database/search?';
      if (isAdv) {
        const p = [];
        if (advancedSearch.artist) p.push(`artist=${encodeURIComponent(advancedSearch.artist)}`);
        if (advancedSearch.album) p.push(`release_title=${encodeURIComponent(advancedSearch.album)}`);
        if (advancedSearch.year) p.push(`year=${encodeURIComponent(advancedSearch.year)}`);
        if (advancedSearch.label) p.push(`label=${encodeURIComponent(advancedSearch.label)}`);
        if (advancedSearch.genre) p.push(`genre=${encodeURIComponent(advancedSearch.genre)}`);
        if (advancedSearch.format) p.push(`format=${encodeURIComponent(advancedSearch.format)}`);
        if (p.length === 0) { alert('Fill one field'); setIsLoading(false); return; }
        url += p.join('&') + `&per_page=10&page=${pg}&type=release`;
      } else {
        const q = qOver || searchQuery;
        if (!q.trim()) { setIsLoading(false); return; }
        url += `q=${encodeURIComponent(q)}&per_page=10&page=${pg}&type=release`;
      }
      const res = await fetch(url, { headers: { 'Authorization': `Discogs token=${discogsToken}`, 'User-Agent': 'VinylScout/1.0' } });
      if (!res.ok) { alert(`Failed: ${res.status}`); setIsLoading(false); return; }
      const d = await res.json();
      if (d.results?.length > 0) {
        let r = d.results;
        if (isAdv && advancedSearch.excludeFormat) {
          const ex = advancedSearch.excludeFormat.toLowerCase();
          r = r.filter(i => !i.format || !i.format.some(f => f.toLowerCase().includes(ex)));
        }
        if (r.length === 0) { setSearchResults([]); alert('No results'); setIsLoading(false); return; }
        setSearchResults(r); setCurrentPage(pg);
        setTotalPages(Math.ceil((d.pagination?.items || r.length) / 10));
        r.forEach(async i => {
          const pr = await fetchPriceInfo(i.id);
          if (pr) setResultPrices(prev => ({ ...prev, [i.id]: pr }));
          await new Promise(res => setTimeout(res, 150));
        });
      } else { setSearchResults([]); setCurrentPage(1); setTotalPages(1); alert('No results'); }
    } catch (e) { alert(`Error: ${e.message}`); }
    setIsLoading(false);
  };

  const handleSearch = () => { if (searchQuery.trim()) searchDiscogs(false, null, 1); };
  const handleAdvSearch = () => searchDiscogs(true, null, 1);
  const nextPage = () => { if (currentPage < totalPages) searchDiscogs(showAdvancedSearch, searchQuery, currentPage + 1); };
  const prevPage = () => { if (currentPage > 1) searchDiscogs(showAdvancedSearch, searchQuery, currentPage - 1); };

  const startCam = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) { videoRef.current.srcObject = s; setIsCameraActive(true); }
    } catch { alert('Camera error'); }
  };

  const stopCam = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'camera' && !isCameraActive) startCam();
    else if (activeTab !== 'camera' && isCameraActive) stopCam();
    return () => stopCam();
  }, [activeTab]);

  const capture = () => {
    const c = document.createElement('canvas');
    c.width = videoRef.current.videoWidth; c.height = videoRef.current.videoHeight;
    c.getContext('2d').drawImage(videoRef.current, 0, 0);
    const img = c.toDataURL('image/jpeg', 0.8);
    stopCam();
    if (cameraMode === 'barcode') alert('Coming soon!');
    else if (anthropicToken) identifyAI(img);
    else alert('Add Anthropic token');
  };

  const identifyAI = async (img) => {
    setIsLoading(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicToken, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022', max_tokens: 1024,
          messages: [{ role: 'user', content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: img.split(',')[1] } },
            { type: 'text', text: 'Identify vinyl. Respond: "Artist - Album"' }
          ]}]
        })
      });
      const d = await res.json();
      if (d.content?.[0]?.text) { setSearchQuery(d.content[0].text.trim()); searchDiscogs(false, d.content[0].text.trim(), 1); setActiveTab('search'); }
      else alert('Not identified');
    } catch { alert('AI error'); }
    setIsLoading(false);
  };

  const addColl = (i) => {
    if (collection.some(c => c.id === i.id) && !confirm('Duplicate. Add?')) return;
    const n = { ...i, price: resultPrices[i.id] || null, favorite: false, addedAt: new Date().toISOString() };
    const c = [...collection, n];
    setCollection(c); localStorage.setItem('collection', JSON.stringify(c));
  };

  const remColl = (idx) => {
    const c = collection.filter((_, i) => i !== idx);
    setCollection(c); localStorage.setItem('collection', JSON.stringify(c));
  };

  const togFav = (idx) => {
    const c = [...collection];
    c[idx] = { ...c[idx], favorite: !c[idx].favorite };
    setCollection(c); localStorage.setItem('collection', JSON.stringify(c));
  };

  const sortColl = (its, s) => {
    const st = [...its];
    switch(s) {
      case 'artist-asc': return st.sort((a, b) => (a.title?.split(' - ')[0] || '').localeCompare(b.title?.split(' - ')[0] || ''));
      case 'artist-desc': return st.sort((a, b) => (b.title?.split(' - ')[0] || '').localeCompare(a.title?.split(' - ')[0] || ''));
      case 'price-asc': return st.sort((a, b) => (a.price?.value || 0) - (b.price?.value || 0));
      case 'price-desc': return st.sort((a, b) => (b.price?.value || 0) - (a.price?.value || 0));
      default: return st;
    }
  };

  const calcVal = () => {
    let t = 0, c = 0, cu = 'EUR';
    collection.forEach(i => { if (i.price?.value) { t += i.price.value; c++; cu = i.price.currency || cu; } });
    return { value: t.toFixed(2), currency: cu, count: c };
  };

  const getStats = () => {
    if (!collection.length) return null;
    const wp = collection.filter(i => i.price?.value);
    const pr = wp.map(i => i.price.value);
    const mx = wp.length ? wp.reduce((m, i) => i.price.value > m.price.value ? i : m) : null;
    const mn = wp.length ? wp.reduce((m, i) => i.price.value < m.price.value ? i : m) : null;
    const avg = pr.length ? (pr.reduce((s, p) => s + p, 0) / pr.length).toFixed(2) : 0;
    const gen = {};
    collection.forEach(i => { if (i.genre?.[0]) { const g = i.genre[0]; gen[g] = (gen[g] || 0) + 1; } });
    const tg = Object.entries(gen).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const dec = {};
    collection.forEach(i => { if (i.year) { const d = Math.floor(i.year / 10) * 10; dec[d] = (dec[d] || 0) + 1; } });
    const dl = Object.entries(dec).sort((a, b) => a[0] - b[0]);
    const art = {};
    collection.forEach(i => { const a = i.title?.split(' - ')[0] || 'Unknown'; art[a] = (art[a] || 0) + 1; });
    const ta = Object.entries(art).sort((a, b) => b[1] - a[1])[0];
    return { mostExpensive: mx, cheapest: mn, avgPrice: avg, topGenres: tg, decadeList: dl, topArtist: ta, currency: wp[0]?.price?.currency || 'EUR' };
  };

  const expCSV = () => {
    const h = ['Artist', 'Album', 'Year', 'Label', 'Genre', 'Format', 'Price', 'Currency', 'Fav'];
    const r = collection.map(i => [
      i.title?.split(' - ')[0] || 'Unknown', i.title?.split(' - ')[1] || i.title || 'Unknown',
      i.year || '', i.label?.[0] || '', i.genre?.[0] || '', i.format?.[0] || '',
      i.price?.value || '', i.price?.currency || '', i.favorite ? 'Yes' : 'No'
    ]);
    const csv = [h, ...r].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
    const b = new Blob([csv], { type: 'text/csv' });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u; a.download = `vinylscout-${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const expJSON = () => {
    const j = JSON.stringify(collection, null, 2);
    const b = new Blob([j], { type: 'application/json' });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u; a.download = `vinylscout-${new Date().toISOString().split('T')[0]}.json`; a.click();
  };

  const copySh = () => {
    const s = calcVal();
    let t = `🎵 VinylScout\n\n📀 Records: ${collection.length}\n💰 Value: ${s.currency} ${s.value}\n❤️ Favs: ${collection.filter(i => i.favorite).length}\n\nTop:\n`;
    collection.slice(0, 5).forEach((i, x) => {
      const ar = i.title?.split(' - ')[0] || 'Unknown';
      const al = i.title?.split(' - ')[1] || i.title || 'Unknown';
      t += `${x + 1}. ${ar} - ${al}\n`;
    });
    navigator.clipboard.writeText(t).then(() => alert('Copied!'));
  };

  const Modal = ({ show, onClose, title, children, wide }) => show ? (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 2000, overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: wide ? '500px' : '448px', backgroundColor: primaryColor, borderRadius: '12px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: textColor, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} style={{ color: accentColor }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  ) : null;

  return (
    <div style={{ backgroundColor: primaryColor, position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', color: textColor }}>
      <div style={{ padding: '16px', flexShrink: 0, borderBottom: `1px solid ${textColor}10`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: accentColor, margin: 0 }}>VinylScout</h1>
        <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}>
          <Settings size={24} style={{ color: accentColor }} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '90px' }}>
        {activeTab === 'search' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSearch()} placeholder="Search..." style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: `2px solid ${textColor}20`, backgroundColor: `${textColor}05`, color: textColor, fontSize: '16px' }} />
            <button onClick={() => setShowAdvancedSearch(!showAdvancedSearch)} style={{ fontSize: '14px', color: accentColor, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
              {showAdvancedSearch ? '▲' : '▼'} Advanced
            </button>
            {showAdvancedSearch && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderRadius: '12px', padding: '16px', backgroundColor: `${textColor}05` }}>
                {[{ key: 'artist', label: 'Artist' }, { key: 'album', label: 'Album' }, { key: 'year', label: 'Year' }, { key: 'label', label: 'Label' }, { key: 'genre', label: 'Genre' }, { key: 'format', label: 'Format' }, { key: 'excludeFormat', label: 'Exclude' }].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: `${textColor}60` }}>{f.label}</label>
                    <input type="text" value={advancedSearch[f.key]} onChange={e => setAdvancedSearch({...advancedSearch, [f.key]: e.target.value})} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${textColor}20`, backgroundColor: primaryColor, color: textColor }} />
                  </div>
                ))}
                <button onClick={handleAdvSearch} disabled={isLoading} style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: accentColor, color: primaryColor, border: 'none', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            )}
            {!showAdvancedSearch && <button onClick={handleSearch} disabled={isLoading} style={{ width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: accentColor, color: primaryColor, border: 'none', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer' }}>{isLoading ? 'Searching...' : 'Search'}</button>}
            {!isLoading && !searchResults.length && searchQuery && <div style={{ textAlign: 'center', padding: '32px', color: `${textColor}60` }}>No results</div>}
            {searchResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {searchResults.map(r => {
                  const p = resultPrices[r.id];
                  return (
                    <div key={r.id} onClick={() => setSelectedResult(r)} style={{ backgroundColor: `${textColor}08`, border: `1px solid ${textColor}15`, borderRadius: '12px', padding: '12px', cursor: 'pointer', display: 'flex', gap: '12px' }}>
                      {r.cover_image ? <img src={r.cover_image} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} /> : <div style={{ width: '80px', height: '80px', borderRadius: '8px', backgroundColor: `${textColor}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Music size={32} style={{ color: accentColor, opacity: 0.4 }} /></div>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px', color: textColor }}>{r.title?.split(' - ')[0] || 'Unknown'}</div>
                        <div style={{ fontSize: '12px', marginBottom: '4px', color: `${textColor}70` }}>{r.title?.split(' - ')[1] || r.title || 'Unknown'}</div>
                        {r.year && <div style={{ fontSize: '11px', color: `${textColor}50` }}>📅 {r.year}</div>}
                        {r.country && <div style={{ fontSize: '11px', color: `${textColor}50` }}>📍 {r.country}</div>}
                        {r.genre?.[0] && <div style={{ fontSize: '11px', color: `${textColor}50` }}>🎵 {r.genre[0]}</div>}
                        {r.format?.[0] && <div style={{ fontSize: '11px', color: `${textColor}50` }}>💿 {r.format[0]}</div>}
                        {r.label?.[0] && <div style={{ fontSize: '11px', color: `${textColor}50` }}>🏷️ {r.label[0]}</div>}
                        {r.catno && <div style={{ fontSize: '11px', color: `${textColor}50` }}># {r.catno}</div>}
                        {p ? <div style={{ marginTop: '8px' }}><div style={{ fontSize: '10px', color: `${textColor}50` }}>from Discogs</div><div style={{ fontSize: '16px', fontWeight: 'bold', color: accentColor }}>{p.currency} {p.value.toFixed(2)}</div></div> : <div style={{ fontSize: '12px', color: `${textColor}40`, marginTop: '8px' }}>Loading...</div>}
                      </div>
                    </div>
                  );
                })}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${textColor}15` }}>
                    <button onClick={prevPage} disabled={currentPage === 1} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: currentPage === 1 ? `${textColor}10` : accentColor, color: currentPage === 1 ? `${textColor}40` : primaryColor, border: 'none', fontWeight: 'bold', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>← Prev</button>
                    <span style={{ fontWeight: 'bold', color: textColor }}>{currentPage}/{totalPages}</span>
                    <button onClick={nextPage} disabled={currentPage === totalPages} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: currentPage === totalPages ? `${textColor}10` : accentColor, color: currentPage === totalPages ? `${textColor}40` : primaryColor, border: 'none', fontWeight: 'bold', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>Next →</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'camera' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setCameraMode('photo')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: cameraMode === 'photo' ? accentColor : `${textColor}10`, color: cameraMode === 'photo' ? primaryColor : textColor }}>📸 AI</button>
              <button onClick={() => setCameraMode('barcode')} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: cameraMode === 'barcode' ? accentColor : `${textColor}10`, color: cameraMode === 'barcode' ? primaryColor : textColor }}>📊 Barcode</button>
            </div>
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000' }}>
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: 'auto' }} />
              {isCameraActive && <button onClick={capture} style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', width: '64px', height: '64px', borderRadius: '50%', border: `4px solid ${accentColor}`, backgroundColor: accentColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={28} style={{ color: primaryColor }} /></button>}
            </div>
          </div>
        )}

        {activeTab === 'collection' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: textColor, margin: 0 }}>Collection</h2>
              <select value={collectionSort} onChange={e => setCollectionSort(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${textColor}20`, backgroundColor: primaryColor, color: textColor, fontSize: '12px' }}>
                <option value="artist-asc">Artist A-Z</option>
                <option value="artist-desc">Artist Z-A</option>
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
              </select>
            </div>
            {!collection.length ? <p style={{ textAlign: 'center', padding: '32px', color: `${textColor}60` }}>No records</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {sortColl(collection, collectionSort).map((i, x) => (
                  <div key={x} onClick={() => setSelectedResult(i)} style={{ borderRadius: '12px', padding: '12px', cursor: 'pointer', backgroundColor: `${textColor}05`, border: `1px solid ${textColor}10` }}>
                    {i.cover_image ? <img src={i.cover_image} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} /> : <div style={{ width: '100%', aspectRatio: '1', borderRadius: '8px', backgroundColor: `${textColor}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}><Music size={32} style={{ color: accentColor, opacity: 0.5 }} /></div>}
                    <h3 style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '4px', color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.title?.split(' - ')[0] || 'Unknown'}</h3>
                    <p style={{ fontSize: '11px', marginBottom: '8px', color: `${textColor}70`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.title?.split(' - ')[1] || i.title || 'Unknown'}</p>
                    {i.price?.value ? <p style={{ fontSize: '14px', fontWeight: 'bold', color: accentColor }}>{i.price.currency} {i.price.value.toFixed(2)}</p> : <p style={{ fontSize: '11px', color: `${textColor}40` }}>No price</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: textColor, margin: 0 }}>Profile</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowStats(true)} style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: `${accentColor}20`, color: accentColor, border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>📊</button>
                <button onClick={() => setShowExport(true)} style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: `${accentColor}20`, color: accentColor, border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>📤</button>
                <button onClick={() => setShowEditProfile(true)} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: accentColor, color: primaryColor, border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '4px' }}><Edit2 size={16} />Edit</button>
              </div>
            </div>
            <div style={{ borderRadius: '12px', padding: '16px', backgroundColor: `${textColor}05`, border: `1px solid ${textColor}10` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={32} style={{ color: primaryColor }} /></div>
                <div><h3 style={{ fontWeight: 'bold', color: textColor, marginBottom: '4px' }}>{userProfile.name || 'Collector'}</h3><p style={{ fontSize: '14px', color: `${textColor}60` }}>{userProfile.nickname || 'Set nickname'}</p></div>
              </div>
              {userProfile.email && <p style={{ fontSize: '14px', marginBottom: '4px', color: `${textColor}80` }}>📧 {userProfile.email}</p>}
              {userProfile.address && <p style={{ fontSize: '14px', color: `${textColor}80` }}>📍 {userProfile.address}, {userProfile.city}, {userProfile.country}</p>}
            </div>
            <div style={{ borderRadius: '12px', padding: '16px', backgroundColor: `${textColor}05`, border: `1px solid ${textColor}10` }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: '12px', color: textColor }}>Value</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: `${textColor}60` }}>Total:</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: accentColor }}>{calcVal().currency} {calcVal().value}</span>
              </div>
              <p style={{ fontSize: '12px', color: `${textColor}40` }}>Based on {calcVal().count} of {collection.length} records</p>
            </div>
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: primaryColor, borderTop: `1px solid ${textColor}10`, zIndex: 1000, display: 'flex', justifyContent: 'space-around', padding: '12px 8px' }}>
        {[{ id: 'search', icon: Search, label: 'Search' }, { id: 'camera', icon: Camera, label: 'Camera' }, { id: 'collection', icon: Music, label: 'Collection' }, { id: 'profile', icon: User, label: 'Profile' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1, border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
            <t.icon size={24} style={{ color: activeTab === t.id ? accentColor : `${textColor}50` }} />
            <span style={{ fontSize: '10px', color: activeTab === t.id ? accentColor : `${textColor}50`, whiteSpace: 'nowrap' }}>{t.label}</span>
          </button>
        ))}
      </div>

      <Modal show={showSettings} onClose={() => setShowSettings(false)} title="Settings">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button onClick={() => setShowThemes(true)} style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: `${accentColor}20`, color: accentColor, border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '4px' }}><Palette size={16} />Themes</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div><label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: `${textColor}80` }}>Discogs Token</label><input type="text" value={discogsToken} onChange={e => setDiscogsToken(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: `1px solid ${textColor}20`, backgroundColor: primaryColor, color: textColor }} /></div>
          <div><label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: `${textColor}80` }}>Anthropic Token</label><input type="password" value={anthropicToken} onChange={e => setAnthropicToken(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: `1px solid ${textColor}20`, backgroundColor: primaryColor, color: textColor }} /></div>
          <button onClick={saveSettings} style={{ width: '100%', padding: '16px', borderRadius: '8px', backgroundColor: accentColor, color: primaryColor, border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
        </div>
      </Modal>

      <Modal show={showThemes} onClose={() => setShowThemes(false)} title="🎨 Themes" wide>
        <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
          {Object.entries(themes).map(([k, t]) => (
            <button key={k} onClick={() => { applyTheme(k); setShowThemes(false); }} style={{ padding: '16px', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', backgroundColor: t.primary, border: `2px solid ${currentTheme === k ? t.accent : 'transparent'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', color: t.text }}>{t.name}</span>
                {currentTheme === k && <span style={{ color: t.accent }}>✓</span>}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: t.primary, border: `1px solid ${t.text}20` }} />
                <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: t.accent }} />
                <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: t.text }} />
              </div>
            </button>
          ))}
        </div>
        <button onClick={() => setShowCustomColors(true)} style={{ width: '100%', padding: '16px', borderRadius: '12px', backgroundColor: `${accentColor}20`, color: accentColor, border: `2px solid ${accentColor}`, fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Palette size={20} />Custom RGB</button>
      </Modal>

      <Modal show={showCustomColors} onClose={() => setShowCustomColors(false)} title="RGB Colors" wide>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {[{ key: 'primary', label: 'Background' }, { key: 'accent', label: 'Accent' }, { key: 'text', label: 'Text' }].map(({ key, label }) => (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <label style={{ fontSize: '16px', fontWeight: 'bold', color: textColor }}>{label}</label>
                <div style={{ width: '60px', height: '40px', borderRadius: '8px', backgroundColor: rgbToHex(customRGB[key].r, customRGB[key].g, customRGB[key].b), border: `2px solid ${textColor}20` }} />
              </div>
              {['r', 'g', 'b'].map(c => (
                <div key={c} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', color: `${textColor}80`, textTransform: 'uppercase' }}>{c}</span>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: textColor }}>{customRGB[key][c]}</span>
                  </div>
                  <input type="range" min="0" max="255" value={customRGB[key][c]} onChange={e => setCustomRGB({ ...customRGB, [key]: { ...customRGB[key], [c]: parseInt(e.target.value) } })} style={{ width: '100%' }} />
                </div>
              ))}
            </div>
          ))}
          <button onClick={() => { applyCustomColors(); setShowCustomColors(false); setShowThemes(false); }} style={{ width: '100%', padding: '16px', borderRadius: '8px', backgroundColor: accentColor, color: primaryColor, border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Apply</button>
        </div>
      </Modal>

      {showStats && (() => {
        const s = getStats();
        return s ? (
          <Modal show onClose={() => setShowStats(false)} title="📊 Statistics" wide>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ borderRadius: '12px', padding: '16px', backgroundColor: `${textColor}08`, border: `1px solid ${textColor}15` }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '12px', color: textColor }}>Overview</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ color: `${textColor}70` }}>Total:</span><span style={{ fontWeight: 'bold', color: textColor }}>{collection.length}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ color: `${textColor}70` }}>With Prices:</span><span style={{ fontWeight: 'bold', color: textColor }}>{calcVal().count}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: `${textColor}70` }}>Average:</span><span style={{ fontWeight: 'bold', color: accentColor }}>{s.currency} {s.avgPrice}</span></div>
              </div>
              {s.mostExpensive && (
                <div style={{ borderRadius: '12px', padding: '16px', backgroundColor: `${textColor}08`, border: `1px solid ${textColor}15` }}>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '12px', color: textColor }}>💎 Most Expensive</h3>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {s.mostExpensive.cover_image && <img src={s.mostExpensive.cover_image} alt="" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />}
                    <div style={{ flex: 1 }}><p style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px', color: textColor }}>{s.mostExpensive.title?.split(' - ')[0]}</p><p style={{ fontSize: '12px', marginBottom: '8px', color: `${textColor}70` }}>{s.mostExpensive.title?.split(' - ')[1] || s.mostExpensive.title}</p><p style={{ fontWeight: 'bold', color: accentColor }}>{s.currency} {s.mostExpensive.price.value.toFixed(2)}</p></div>
                  </div>
                </div>
              )}
              {s.cheapest && (
                <div style={{ borderRadius: '12px', padding: '16px', backgroundColor: `${textColor}08`, border: `1px solid ${textColor}15` }}>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '12px', color: textColor }}>💰 Cheapest</h3>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {s.cheapest.cover_image && <img src={s.cheapest.cover_image} alt="" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />}
                    <div style={{ flex: 1 }}><p style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px', color: textColor }}>{s.cheapest.title?.split(' - ')[0]}</p><p style={{ fontSize: '12px', marginBottom: '8px', color: `${textColor}70` }}>{s.cheapest.title?.split(' - ')[1] || s.cheapest.title}</p><p style={{ fontWeight: 'bold', color: accentColor }}>{s.currency} {s.cheapest.price.value.toFixed(2)}</p></div>
                  </div>
                </div>
              )}
              {s.topArtist && (
                <div style={{ borderRadius: '12px', padding: '16px', backgroundColor: `${textColor}08`, border: `1px solid ${textColor}15` }}>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: textColor }}>🎤 Top Artist</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 'bold', color: textColor }}>{s.topArtist[0]}</span><span style={{ color: `${textColor}70` }}>{s.topArtist[1]} records</span></div>
                </div>
              )}
              {s.topGenres.length > 0 && (
                <div style={{ borderRadius: '12px', padding: '16px', backgroundColor: `${textColor}08`, border: `1px solid ${textColor}15` }}>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '12px', color: textColor }}>🎵 Genres</h3>
                  {s.topGenres.map(([g, c]) => <div key={g} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ color: textColor }}>{g}</span><span style={{ color: `${textColor}70` }}>{c}</span></div>)}
                </div>
              )}
              {s.decadeList.length > 0 && (
                <div style={{ borderRadius: '12px', padding: '16px', backgroundColor: `${textColor}08`, border: `1px solid ${textColor}15` }}>
                  <h3 style={{ fontWeight: 'bold', marginBottom: '12px', color: textColor }}>📅 Decades</h3>
                  {s.decadeList.map(([d, c]) => <div key={d} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span style={{ color: textColor }}>{d}s</span><span style={{ color: `${textColor}70` }}>{c}</span></div>)}
                </div>
              )}
            </div>
          </Modal>
        ) : null;
      })()}

      <Modal show={showExport} onClose={() => setShowExport(false)} title="📤 Export">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button onClick={expCSV} style={{ width: '100%', padding: '16px', borderRadius: '8px', backgroundColor: `${textColor}08`, color: textColor, border: `1px solid ${textColor}15`, fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}><span style={{ display: 'block', marginBottom: '4px' }}>CSV</span><span style={{ fontSize: '12px', color: `${textColor}60` }}>Excel</span></button>
          <button onClick={expJSON} style={{ width: '100%', padding: '16px', borderRadius: '8px', backgroundColor: `${textColor}08`, color: textColor, border: `1px solid ${textColor}15`, fontWeight: 'bold', cursor: 'pointer', textAlign: 'left' }}><span style={{ display: 'block', marginBottom: '4px' }}>JSON</span><span style={{ fontSize: '12px', color: `${textColor}60` }}>Backup</span></button>
          <button onClick={copySh} style={{ width: '100%', padding: '16px', borderRadius: '8px', backgroundColor: accentColor, color: primaryColor, border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>📋 Copy Summary</button>
        </div>
      </Modal>

      <Modal show={showEditProfile} onClose={() => setShowEditProfile(false)} title="Edit Profile">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[{ key: 'name', label: 'Name' }, { key: 'nickname', label: 'Nickname' }, { key: 'email', label: 'Email' }, { key: 'address', label: 'Address' }, { key: 'city', label: 'City' }, { key: 'country', label: 'Country' }].map(f => (
            <div key={f.key}><label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: `${textColor}80` }}>{f.label}</label><input type="text" value={userProfile[f.key]} onChange={e => setUserProfile({...userProfile, [f.key]: e.target.value})} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: `1px solid ${textColor}20`, backgroundColor: primaryColor, color: textColor }} /></div>
          ))}
          <button onClick={saveProfile} style={{ width: '100%', padding: '16px', borderRadius: '8px', backgroundColor: accentColor, color: primaryColor, border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
        </div>
      </Modal>

      {selectedResult && (
        <Modal show onClose={() => setSelectedResult(null)} title={selectedResult.title?.split(' - ')[0] || 'Unknown'}>
          <p style={{ fontSize: '18px', color: `${textColor}80`, marginBottom: '16px' }}>{selectedResult.title?.split(' - ')[1] || selectedResult.title || 'Unknown'}</p>
          {selectedResult.cover_image && <img src={selectedResult.cover_image} alt="" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px', marginBottom: '16px', backgroundColor: `${textColor}05` }} />}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {selectedResult.year && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: `${textColor}60` }}>Year:</span><span style={{ color: textColor }}>{selectedResult.year}</span></div>}
            {selectedResult.label?.[0] && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: `${textColor}60` }}>Label:</span><span style={{ color: textColor }}>{selectedResult.label[0]}</span></div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {collection.find(i => i.id === selectedResult.id) ? (
              <>
                <button onClick={() => { const x = collection.findIndex(i => i.id === selectedResult.id); remColl(x); setSelectedResult(null); }} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #EF4444', backgroundColor: 'transparent', color: '#EF4444', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Trash2 size={20} />Remove</button>
                <button onClick={() => { const x = collection.findIndex(i => i.id === selectedResult.id); togFav(x); setSelectedResult({...selectedResult, favorite: !selectedResult.favorite}); }} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: `2px solid ${accentColor}`, backgroundColor: 'transparent', color: accentColor, fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Heart size={20} fill={selectedResult.favorite ? accentColor : 'none'} />{selectedResult.favorite ? 'Unfavorite' : 'Favorite'}</button>
              </>
            ) : (
              <button onClick={() => { addColl(selectedResult); setSelectedResult(null); }} style={{ width: '100%', padding: '16px', borderRadius: '8px', backgroundColor: accentColor, color: primaryColor, border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Add to Collection</button>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default VinylPriceFinder;