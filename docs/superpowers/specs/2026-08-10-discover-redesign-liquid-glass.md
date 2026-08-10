# VinylScout Discover Redesign with Liquid Glass Themes

**Date:** 2026-08-10  
**Status:** Approved  
**Scope:** 4 improvements to Discover view, Search view, Settings, and genre data

---

## Overview

Redesign VinylScout's Discover experience with:
1. Filter/Discover subtabs (persistent state, internal UI)
2. Liquid Glass visual polish with 3 selectable design themes (Subtle, Bold, Hybrid)
3. "Add to Collection" button visible on all Search view items
4. Genre expansion (~15-20 new genres: Latin, Psychedelic, World music)
5. Design theme selector in Settings

---

## 1. Discover Tab → Filter + Discover Subtabs

### Current State
DiscoverView renders GenreSelector + AlbumGallery in sequence (vertical stack).

### Desired State
DiscoverView shows two internal subtabs:
- **Filter:** GenreSelector + RangeSliders (year, price)
- **Discover:** AlbumGallery (swipe/browse albums)

### Key Properties
- **Navigation:** Main "Discover" tab in Navigation/App.jsx remains unchanged
- **Subtab UI:** Two buttons below view header (Filter / Discover), styled with Liquid Glass
- **State Persistence:** `discoverStore` (genres, year, price, shuffle state) persists across:
  - Switching between subtabs
  - Leaving Discover and returning to it
  - Tab switches and app navigation
- **No Route Change:** Subtabs are local UI state in DiscoverView component, not router paths

### Implementation Details

#### DiscoverView.jsx
```javascript
// Add local state
const [discoverySubTab, setDiscoverySubTab] = useState('filter');

// Render subtab bar + content
<SubtabBar currentTab={discoverySubTab} onTabChange={setDiscoverySubTab} themes={themes} />
{discoverySubTab === 'filter' && <GenreSelector ... />}
{discoverySubTab === 'discover' && <AlbumGallery ... />}
```

#### GenreSelector, AlbumGallery
No internal changes. Components stay as-is.

#### SubtabBar Component (New)
- Two buttons: "Filter", "Discover"
- Active button highlighted with primary color
- Styled with glassMorphism tokens (blur, border, glow)
- Mobile-touch friendly (50px min height per WCAG)

---

## 2. Liquid Glass Design System + Three Themes

### Core Concept
Frosted glass effect (backdrop-filter blur + semi-transparency + soft glow) applied selectively to card/surface elements. Three design intensity options selectable in Settings.

### Three Design Themes

#### 🍃 Subtle (Default)
- **Blur:** 12px
- **Radius:** 12px
- **Background Opacity:** 0.85
- **Glow:** Soft (rgba shadow ~0.2 alpha)
- **Border:** 1px solid rgba(255,255,255,0.2)
- **Use Case:** Refined, minimal, readable. Mobile-friendly.

**CSS Example (Light Mode):**
```css
.glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1),
              inset 0 1px 1px rgba(255, 255, 255, 0.2);
}
```

**Dark Mode Variant:**
```css
.glass-card[data-theme="dark"] {
  background: rgba(30, 30, 30, 0.85);
  box-shadow: 0 8px 32px rgba(0, 183, 255, 0.1),
              inset 0 1px 1px rgba(255, 255, 255, 0.1);
}
```

#### ✨ Bold
- **Blur:** 20px
- **Radius:** 16px
- **Background Opacity:** 0.75
- **Glow:** Pronounced (rgba shadow ~0.4 alpha, colored with theme accent)
- **Gradient:** Optional accent overlay on cards
- **Use Case:** Premium, dramatic, statement. Higher visual impact.

#### ⚡ Hybrid
- **Cards:** Subtle blur (same as Subtle theme)
- **Buttons:** Solid fills (no blur, crisp)
- **Inputs:** Clean borders (no blur)
- **Gallery:** Cards only (AlbumGallery cards get Subtle blur, not Bold)
- **Use Case:** Balanced, mobile-optimized, fast. Controls stay crisp for usability.

### Where Glassmorphism Applies

**With Glass Effect:**
- GenreSelector container
- RangeSlider containers (year, price)
- AlbumGallery: card containers (entire VinylCard or outer wrapper)
- SubtabBar
- VinylDetailsModal (backdrop + content)
- Any new modals/overlays added later

**Without Glass Effect (Always Crisp):**
- Buttons (Select All, Clear All, Shuffle, Add to Collection, etc.)
- Text inputs and form controls
- Simple text labels, headings
- Navigation bar

### Implementation

#### designSystem.js
Add `glassMorphism` object:
```javascript
glassMorphism: {
  subtle: {
    blur: '12px',
    radius: '12px',
    bgOpacity: 0.85,
    glowAlpha: 0.2,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  bold: {
    blur: '20px',
    radius: '16px',
    bgOpacity: 0.75,
    glowAlpha: 0.4,
    borderColor: 'rgba(255, 255, 255, 0.25)'
  },
  hybrid: {
    cardBlur: '12px',
    buttonBlur: 'none',
    radius: '12px'
  }
}
```

#### settingsStore.js
Add state:
```javascript
designTheme: 'subtle' // 'subtle' | 'bold' | 'hybrid'
```
Persisted via Zustand persist middleware.

#### SettingsView.jsx
Add section "Visual Design" with three card/radio buttons:
- [ 🍃 Subtle ] (default)
- [ ✨ Bold ]
- [ ⚡ Hybrid ]

Each shows a brief description and preview (optional).

#### Component Changes
Update these components to apply glass styles based on `designTheme`:
- **GenreSelector.jsx:** Wrap container with glass style
- **RangeSlider.jsx:** Wrap slider container with glass style
- **AlbumGallery.jsx:** Wrap outer container with glass style
- **VinylCard.jsx (in gallery context):** Apply glass to card
- **SubtabBar (new):** Apply glass to bar

---

## 3. "Add to Collection" Button on Search Results

### Current State
SearchView renders VinylCard for each result. VinylCard supports `onAddToCollection` callback but button may not be visible by default.

### Desired State
"Add to Collection" button visible and prominent on every search result item.

### Key Properties
- **Button Label:** "Add to Collection" (with Plus icon from Lucide)
- **Style:** Use primary color, apply glass style if designTheme is Bold/Subtle
- **Position:** Below album title/artist or on card (same layout as Discover AlbumGallery)
- **Action:** Calls `onAddToCollection(vinyl)`, adds to collection store with current price
- **Availability:** All search results, always visible (not hover-only)

### Implementation

#### SearchView.jsx
Wire `onAddToCollection` callback to VinylCard:
```javascript
<VinylCard
  vinyl={item}
  price={resultPrices[item.id]}
  inCollection={collection.some(v => v.id === item.id)}
  onAddToCollection={handleAddToCollection}
  onToggleFavorite={handleToggleFavorite}
  onRefreshPrice={handleRefreshPrice}
  onRemove={handleRemove}
  onViewDetails={handleViewDetails}
  onPriceHistory={handlePriceHistory}
  themes={themes}
/>
```

#### VinylCard.jsx
Ensure "Add to Collection" button is:
- Always visible (not hidden by default)
- Positioned consistently (below title/price or integrated into action bar)
- Styled with primary color and glass effect (if applicable)
- Only shown when `onAddToCollection` callback is provided

**No breaking changes:** Existing collection/discover views unaffected.

---

## 4. Genre Expansion

### Current State
discoverAlbums.json contains ~78 genres.

### New Genres to Add (~15-20 total)

| Genre | Category | Reason |
|-------|----------|--------|
| Psychedelic Pop | Psychedelic | Expand beyond rock |
| Cumbia | Latin | Colombian core |
| Reggaeton | Latin | Modern urban |
| Bachata | Latin | Dominican tradition |
| Merengue | Latin | Dominican dance |
| Timba | Latin | Cuban modern |
| Bossa Nova | Latin | Brazilian jazz (verify if exists) |
| Forró | Latin | Brazilian folk |
| Champeta | Latin | Colombian Afro |
| Tango | Latin | Argentine ballroom |
| Flamenco | World | Spanish tradition |
| Fado | World | Portuguese tradition |
| Qat, Coffee & Qambus | World | Middle Eastern |
| Raï | World | Algerian popular |
| Tuvan Throat Singing | World | Central Asian vocal |

### Implementation

#### discoverAlbums.json
- Add genre objects to `genres[]` array
- Continue ID sequence (current max ~78, new ones get IDs 79-93)
- Each genre: `{ "id": "79", "name": "Psychedelic Pop", "albumCount": 75 }`
- All new genres get `albumCount: 75` (matches existing pattern)
- No code changes needed; store auto-populates from JSON

#### Verification
- Confirm Bossa Nova not already in list
- Confirm Flamenco not already in list
- Final count should reach ~93-98 genres

---

## 5. Settings: Design Theme Selector

### Current State
SettingsView has theme toggle (Light/Dark/Auto).

### New Section: "Visual Design"
Add below theme toggle:
- Three options: Subtle, Bold, Hybrid (radio buttons or card buttons)
- Display brief description for each
- Save selection to `settingsStore.designTheme`
- Apply theme app-wide via `designSystem.glassMorphism[designTheme]`

### Implementation

#### SettingsView.jsx
```javascript
// Add new section
<div className="settings-section">
  <h3>Visual Design</h3>
  <div className="design-theme-options">
    <button onClick={() => setDesignTheme('subtle')} className={designTheme === 'subtle' ? 'active' : ''}>
      🍃 Subtle
    </button>
    <button onClick={() => setDesignTheme('bold')} className={designTheme === 'bold' ? 'active' : ''}>
      ✨ Bold
    </button>
    <button onClick={() => setDesignTheme('hybrid')} className={designTheme === 'hybrid' ? 'active' : ''}>
      ⚡ Hybrid
    </button>
  </div>
  <p className="theme-description">
    {themeDescriptions[designTheme]}
  </p>
</div>
```

#### App.jsx
Pass designTheme to views:
```javascript
const designTheme = useSettingsStore(s => s.designTheme);
// Pass to DiscoverView, SearchView, etc. via props
```

---

## Files to Modify

| File | Change | Lines Affected |
|------|--------|----------------|
| src/views/DiscoverView/DiscoverView.jsx | Add subtab bar + local state | ~50 new lines |
| src/views/DiscoverView/SubtabBar.jsx | New component (subtab buttons) | ~80 lines |
| src/designsystem.js | Add glassMorphism tokens | ~30 new lines |
| src/stores/settingsStore.js | Add designTheme state | ~5 new lines |
| src/views/SettingsView/SettingsView.jsx | Add theme selector UI | ~30 new lines |
| src/views/DiscoverView/GenreSelector.jsx | Apply glass style | ~10 line changes |
| src/views/DiscoverView/AlbumGallery.jsx | Apply glass style | ~10 line changes |
| src/components/VinylCard/VinylCard.jsx | Ensure button visible in search | ~5 line changes |
| src/views/SearchView/SearchView.jsx | Wire onAddToCollection | ~5 line changes |
| src/data/discoverAlbums.json | Add 15-20 genres | +~250 lines |

---

## Testing Strategy

### Unit Tests
- SubtabBar: renders both tabs, switches on click
- designSystem: glassMorphism tokens accessible
- settingsStore: designTheme persists and updates
- DiscoverView: state persists across subtab switches

### Manual Testing
- **Mobile Chrome:** Subtab switching, glass styling on different screen sizes
- **Light/Dark modes:** Glass styling looks correct in both
- **All 3 design themes:** Subtle, Bold, Hybrid all render correctly
- **Search:** "Add to Collection" button visible and functional
- **Genres:** All new genres appear in filter list, filter works

### Performance
- No new network requests
- Glass effect uses `backdrop-filter` (hardware-accelerated in modern browsers)
- No re-renders on theme change (via memoization)

---

## Known Constraints & Trade-offs

### Constraints
- **Mobile:** Backdrop-filter support varies on older Android browsers. Fallback: solid semi-transparent background.
- **Performance:** Bold theme with 20px blur may be slower on low-end devices; recommend Subtle or Hybrid.
- **Accessibility:** Ensure sufficient contrast in all themes (test with Lighthouse).

### Trade-offs
- **Subtle + polished vs. Bold + dramatic:** Hybrid balances both — cards are polished, buttons stay crisp
- **3 themes vs. 1:** Extra settings complexity, but user choice justified by performance/aesthetic flexibility

---

## Success Criteria

- ✅ Discover shows two subtabs (Filter / Discover)
- ✅ Filter state persists across subtab switches and navigation
- ✅ All card/surface elements styled with glass effect (Subtle, Bold, or Hybrid)
- ✅ Design theme selector in Settings works and persists
- ✅ "Add to Collection" button visible on all search results
- ✅ 15+ new genres added to discover data
- ✅ Mobile Chrome: responsive, touch-friendly, no layout breaks
- ✅ Lighthouse scores: A11y, Performance, SEO all pass

---

**Spec Review:** Self-checked for placeholders (none), contradictions (none), scope (focused on Discover/Search/Settings), ambiguity (clarified). Ready for user review before implementation.
