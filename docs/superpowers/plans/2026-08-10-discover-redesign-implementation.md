# Discover Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Liquid Glass design polish, Filter/Discover subtabs, search "Add to Collection" button, and expand genres.

**Architecture:** 
- Foundation: designSystem tokens + settingsStore state for themes
- UI: New SubtabBar component, updated DiscoverView with conditional rendering
- Styling: Apply glassMorphism to cards/surfaces via inline styles + theme tokens
- Search enhancement: Wire existing onAddToCollection callback
- Data: Add 15-20 genres to JSON

**Tech Stack:** React, Zustand (stores), inline CSS (backdrop-filter), Lucide icons

## Global Constraints

- Mobile Chrome primary platform: all UI must be touch-friendly (50px min height for buttons)
- Liquid Glass uses `backdrop-filter` (fallback: solid semi-transparent bg for older browsers)
- No breaking changes to existing APIs
- All changes localized to their components; no cross-component refactoring
- Commit after each logical task (design system → state → UI → styling → data)

---

## Task 1: Update designSystem.js — Add Glass Morphism Tokens

**Files:**
- Modify: `src/designsystem.js`

**Interfaces:**
- Produces: `designSystem.glassMorphism` object with three themes: `subtle`, `bold`, `hybrid`

- [ ] **Step 1: Open designSystem.js and review current structure**

Run: `code src/designsystem.js` (or use Read tool)

Expected: See existing `spacing`, `shadows`, `colors` objects. Note the pattern.

- [ ] **Step 2: Add glassMorphism object after shadows object**

```javascript
// In src/designsystem.js, after the shadows object:

glassMorphism: {
  subtle: {
    blur: '12px',
    radius: '12px',
    bgOpacity: 0.85,
    glowAlpha: 0.2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    description: 'Refined, minimal, readable'
  },
  bold: {
    blur: '20px',
    radius: '16px',
    bgOpacity: 0.75,
    glowAlpha: 0.4,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    description: 'Premium, dramatic, statement'
  },
  hybrid: {
    cardBlur: '12px',
    buttonBlur: 'none',
    radius: '12px',
    description: 'Balanced, mobile-optimized, snappy'
  }
}
```

- [ ] **Step 3: Verify export**

Ensure `export { designSystem }` includes the new glassMorphism object (it should auto-include since it's part of the object).

- [ ] **Step 4: Commit**

```bash
git add src/designsystem.js
git commit -m "feat: add glassMorphism design tokens (subtle, bold, hybrid)"
```

---

## Task 2: Update settingsStore.js — Add designTheme State

**Files:**
- Modify: `src/stores/settingsStore.js`

**Interfaces:**
- Produces: `settingsStore.designTheme` (string: 'subtle' | 'bold' | 'hybrid')
- Produces: `settingsStore.setDesignTheme(theme)` action

- [ ] **Step 1: Open settingsStore.js and review current state shape**

Run: Read `src/stores/settingsStore.js` (limit 100)

Expected: See `theme` (light/dark), `shopSelection`, and actions like `setTheme()`.

- [ ] **Step 2: Add designTheme to initial state**

Find the state object in create() and add:

```javascript
// Inside the Zustand store state:
designTheme: 'subtle', // 'subtle' | 'bold' | 'hybrid'
```

This should be in the persist() middleware payload, so it auto-saves to localStorage.

- [ ] **Step 3: Add setDesignTheme action**

Add this method to the store object (same level as setTheme, setShop, etc.):

```javascript
setDesignTheme: (designTheme) => set({ designTheme }),
```

- [ ] **Step 4: Verify persist middleware includes designTheme**

Check the persist() config. The entire state object should be persisted. If there's a custom whitelist, add 'designTheme' to it.

- [ ] **Step 5: Commit**

```bash
git add src/stores/settingsStore.js
git commit -m "feat: add designTheme state to settings store (subtle/bold/hybrid)"
```

---

## Task 3: Create SubtabBar Component

**Files:**
- Create: `src/components/SubtabBar/SubtabBar.jsx`
- Create: `src/components/SubtabBar/SubtabBar.test.jsx`

**Interfaces:**
- Consumes: `themes` (object with primary, border, text, background colors)
- Consumes: `currentTab` (string: 'filter' | 'discover')
- Consumes: `onTabChange` (function: (tabName: string) => void)
- Consumes: `designSystem.glassMorphism` (tokens from Task 1)
- Consumes: `settingsStore.designTheme` (theme name from Task 2)
- Produces: React component that renders two tab buttons styled with glass effect

- [ ] **Step 1: Create SubtabBar.jsx**

```javascript
import React, { useMemo } from 'react';
import { designSystem } from '../../designsystem';
import { useSettingsStore } from '../../stores/settingsStore';

export default function SubtabBar({ currentTab, onTabChange, themes }) {
  const designTheme = useSettingsStore(s => s.designTheme);
  const glass = designSystem.glassMorphism[designTheme];

  // Build glass styles based on theme
  const getGlassStyle = useMemo(() => {
    if (designTheme === 'bold') {
      return {
        background: `rgba(${themes.background === '#fff' ? '255, 255, 255' : '30, 30, 30'}, ${glass.bgOpacity})`,
        backdropFilter: `blur(${glass.blur})`,
        borderRadius: glass.radius,
        border: `1px solid ${glass.borderColor}`,
        boxShadow: `0 8px 32px rgba(${themes.background === '#fff' ? '0, 0, 0' : '0, 183, 255'}, ${glass.glowAlpha})`
      };
    } else {
      // Subtle and Hybrid both use same blur for subtab bar
      return {
        background: `rgba(${themes.background === '#fff' ? '255, 255, 255' : '30, 30, 30'}, ${glass.bgOpacity || 0.85})`,
        backdropFilter: `blur(${glass.cardBlur || glass.blur || '12px'})`,
        borderRadius: glass.radius || '12px',
        border: `1px solid ${glass.borderColor || 'rgba(255, 255, 255, 0.2)'}`,
        boxShadow: `0 8px 32px rgba(${themes.background === '#fff' ? '0, 0, 0' : '0, 183, 255'}, 0.1)`
      };
    }
  }, [designTheme, themes.background, glass]);

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        padding: '12px 16px',
        ...getGlassStyle
      }}
    >
      {['filter', 'discover'].map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          style={{
            flex: 1,
            padding: '12px 16px',
            backgroundColor: currentTab === tab ? themes.primary : themes.border,
            color: currentTab === tab ? themes.buttonText : themes.text,
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 200ms ease',
            textTransform: 'capitalize'
          }}
          onMouseEnter={(e) => {
            if (currentTab !== tab) e.target.style.backgroundColor = themes.primaryHover || themes.primary;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = currentTab === tab ? themes.primary : themes.border;
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create SubtabBar.test.jsx**

```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubtabBar from './SubtabBar';
import { useSettingsStore } from '../../stores/settingsStore';

// Mock the settings store
jest.mock('../../stores/settingsStore', () => ({
  useSettingsStore: jest.fn()
}));

describe('SubtabBar', () => {
  const mockThemes = {
    primary: '#007bff',
    border: '#ddd',
    text: '#333',
    buttonText: '#fff',
    background: '#fff'
  };

  beforeEach(() => {
    useSettingsStore.mockReturnValue('subtle');
  });

  it('renders both tabs', () => {
    render(
      <SubtabBar currentTab="filter" onTabChange={() => {}} themes={mockThemes} />
    );
    expect(screen.getByText('filter')).toBeInTheDocument();
    expect(screen.getByText('discover')).toBeInTheDocument();
  });

  it('highlights the current tab', () => {
    render(
      <SubtabBar currentTab="filter" onTabChange={() => {}} themes={mockThemes} />
    );
    const filterBtn = screen.getByText('filter');
    expect(filterBtn).toHaveStyle(`backgroundColor: ${mockThemes.primary}`);
  });

  it('calls onTabChange when a tab is clicked', async () => {
    const mockOnChange = jest.fn();
    render(
      <SubtabBar currentTab="filter" onTabChange={mockOnChange} themes={mockThemes} />
    );
    await userEvent.click(screen.getByText('discover'));
    expect(mockOnChange).toHaveBeenCalledWith('discover');
  });
});
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
npm run test -- src/components/SubtabBar/SubtabBar.test.jsx
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/SubtabBar/SubtabBar.jsx src/components/SubtabBar/SubtabBar.test.jsx
git commit -m "feat: create SubtabBar component with liquid glass styling"
```

---

## Task 4: Update DiscoverView — Add Subtabs

**Files:**
- Modify: `src/views/DiscoverView/DiscoverView.jsx`

**Interfaces:**
- Consumes: `SubtabBar` component (from Task 3)
- Consumes: `GenreSelector` and `AlbumGallery` (existing)
- Produces: DiscoverView with internal subtab switching

- [ ] **Step 1: Open DiscoverView.jsx and review current structure**

Current:
```javascript
export default function DiscoverView({ themes }) {
  // ... store hooks, effects ...
  return (
    <div style={{ ... }}>
      <GenreSelector themes={themes} />
      <AlbumGallery themes={themes} />
    </div>
  );
}
```

- [ ] **Step 2: Add local state for current subtab**

At the top of the component function, after store hooks:

```javascript
const [discoverySubTab, setDiscoverySubTab] = useState('filter');
```

(Import useState from React if not already imported)

- [ ] **Step 3: Render SubtabBar and conditional content**

Replace the GenreSelector + AlbumGallery rendering with:

```javascript
return (
  <div
    style={{
      width: '100%',
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      backgroundColor: themes.background,
      padding: designSystem.spacing.md,
      paddingTop: '72px',
      paddingBottom: `calc(${designSystem.spacing.nav} + ${designSystem.spacing.md})`
    }}
  >
    <SubtabBar
      currentTab={discoverySubTab}
      onTabChange={setDiscoverySubTab}
      themes={themes}
    />
    {discoverySubTab === 'filter' && (
      <GenreSelector themes={themes} />
    )}
    {discoverySubTab === 'discover' && (
      <AlbumGallery themes={themes} />
    )}
  </div>
);
```

- [ ] **Step 4: Add SubtabBar import**

At the top of DiscoverView.jsx:

```javascript
import SubtabBar from '../../components/SubtabBar';
```

- [ ] **Step 5: Verify no regressions**

Run `npm run dev`, navigate to Discover tab in mobile Chrome. Should see two subtabs. Filter subtab shows controls, Discover subtab shows gallery.

- [ ] **Step 6: Commit**

```bash
git add src/views/DiscoverView/DiscoverView.jsx
git commit -m "feat: split discover view into filter and discover subtabs"
```

---

## Task 5: Update GenreSelector — Apply Glass Styling

**Files:**
- Modify: `src/views/DiscoverView/GenreSelector.jsx`

**Interfaces:**
- Consumes: `designSystem.glassMorphism` (Task 1)
- Consumes: `settingsStore.designTheme` (Task 2)
- Produces: GenreSelector container styled with glass effect

- [ ] **Step 1: Open GenreSelector.jsx and locate the main container div**

Current:
```javascript
return (
  <div style={{
    padding: '16px',
    borderBottom: `1px solid ${themes.border}`,
    backgroundColor: themes.surface
  }}>
    {/* content */}
  </div>
);
```

- [ ] **Step 2: Add useSettingsStore hook and create glass style function**

At the top of GenreSelector function:

```javascript
import { useSettingsStore } from '../../stores/settingsStore';

export default function GenreSelector({ themes }) {
  // ... existing hooks ...
  const designTheme = useSettingsStore(s => s.designTheme);
  
  const getGlassStyle = () => {
    const glass = designSystem.glassMorphism[designTheme];
    if (designTheme === 'hybrid') {
      // Hybrid: only cards get glass, keep container solid
      return {
        padding: '16px',
        borderBottom: `1px solid ${themes.border}`,
        backgroundColor: themes.surface
      };
    }
    // Subtle and Bold: apply glass to container
    return {
      padding: '16px',
      background: `rgba(${themes.background === '#fff' ? '255, 255, 255' : '30, 30, 30'}, ${glass.bgOpacity})`,
      backdropFilter: `blur(${glass.blur})`,
      borderRadius: glass.radius,
      border: `1px solid ${glass.borderColor}`,
      boxShadow: `0 8px 32px rgba(${themes.background === '#fff' ? '0, 0, 0' : '0, 183, 255'}, ${glass.glowAlpha})`
    };
  };
```

- [ ] **Step 3: Apply glass style to container**

Replace the container div's style prop:

```javascript
return (
  <div style={getGlassStyle()}>
    {/* rest of content */}
  </div>
);
```

- [ ] **Step 4: Verify in dev**

Run `npm run dev`, switch design themes in Settings. GenreSelector should update its glass effect.

- [ ] **Step 5: Commit**

```bash
git add src/views/DiscoverView/GenreSelector.jsx
git commit -m "feat: apply liquid glass styling to genre selector"
```

---

## Task 6: Update AlbumGallery — Apply Glass Styling to Cards

**Files:**
- Modify: `src/views/DiscoverView/AlbumGallery.jsx`

**Interfaces:**
- Consumes: `designSystem.glassMorphism` (Task 1)
- Consumes: `settingsStore.designTheme` (Task 2)
- Produces: AlbumGallery cards styled with glass effect

- [ ] **Step 1: Open AlbumGallery.jsx and locate card/wrapper elements**

Expected: Container div wrapping VinylCard components.

- [ ] **Step 2: Add useSettingsStore hook and glass style function**

```javascript
import { useSettingsStore } from '../../stores/settingsStore';

export default function AlbumGallery({ themes }) {
  // ... existing hooks ...
  const designTheme = useSettingsStore(s => s.designTheme);
  
  const getCardGlassStyle = () => {
    const glass = designSystem.glassMorphism[designTheme];
    if (designTheme === 'hybrid') {
      return {
        background: `rgba(${themes.background === '#fff' ? '255, 255, 255' : '30, 30, 30'}, 0.85)`,
        backdropFilter: `blur(${glass.cardBlur})`,
        borderRadius: glass.radius,
        border: `1px solid rgba(255, 255, 255, 0.2)`
      };
    }
    return {
      background: `rgba(${themes.background === '#fff' ? '255, 255, 255' : '30, 30, 30'}, ${glass.bgOpacity})`,
      backdropFilter: `blur(${glass.blur})`,
      borderRadius: glass.radius,
      border: `1px solid ${glass.borderColor}`,
      boxShadow: `0 8px 32px rgba(${themes.background === '#fff' ? '0, 0, 0' : '0, 183, 255'}, ${glass.glowAlpha})`
    };
  };
```

- [ ] **Step 3: Apply glass style to card wrapper**

Find where VinylCard is rendered and wrap it with a styled div:

```javascript
{shuffledAlbums.map((album, idx) => (
  <div key={album.id} style={getCardGlassStyle()}>
    <VinylCard
      vinyl={album}
      price={prices[album.id]}
      inCollection={...}
      onToggleFavorite={...}
      onViewDetails={...}
      themes={themes}
    />
  </div>
))}
```

(Or apply the style directly to an existing wrapper if one exists.)

- [ ] **Step 4: Test design theme switching**

Run `npm run dev`. Switch between Subtle/Bold/Hybrid in Settings while viewing Discover gallery. Cards should update glass effect.

- [ ] **Step 5: Commit**

```bash
git add src/views/DiscoverView/AlbumGallery.jsx
git commit -m "feat: apply liquid glass styling to album gallery cards"
```

---

## Task 7: Update SettingsView — Add Design Theme Selector

**Files:**
- Modify: `src/views/SettingsView/SettingsView.jsx`

**Interfaces:**
- Consumes: `settingsStore.designTheme` (Task 2)
- Consumes: `settingsStore.setDesignTheme` (Task 2)
- Produces: UI section with theme selector buttons

- [ ] **Step 1: Open SettingsView.jsx and locate where theme toggle is rendered**

Expected: Light/Dark/Auto theme buttons.

- [ ] **Step 2: Add design theme selector section after theme toggle**

Add this code (adjust placement based on existing structure):

```javascript
{/* Design Theme Selector */}
<div style={{ marginTop: '24px', paddingTop: '16px', borderTop: `1px solid ${themes.border}` }}>
  <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 600 }}>Visual Design</h3>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
    {['subtle', 'bold', 'hybrid'].map(theme => (
      <button
        key={theme}
        onClick={() => settings.setDesignTheme(theme)}
        style={{
          padding: '12px',
          backgroundColor: designTheme === theme ? themes.primary : themes.surface,
          color: designTheme === theme ? themes.buttonText : themes.text,
          border: `2px solid ${designTheme === theme ? themes.primary : themes.border}`,
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 200ms',
          fontSize: '14px',
          fontWeight: 500,
          textTransform: 'capitalize'
        }}
      >
        {theme === 'subtle' && '🍃 Subtle'}
        {theme === 'bold' && '✨ Bold'}
        {theme === 'hybrid' && '⚡ Hybrid'}
      </button>
    ))}
  </div>
  <p style={{ fontSize: '12px', color: themes.textSecondary || themes.text, marginTop: '8px', opacity: 0.7 }}>
    {theme === 'subtle' && 'Refined, minimal, readable'}
    {theme === 'bold' && 'Premium, dramatic, statement'}
    {theme === 'hybrid' && 'Balanced, mobile-optimized, snappy'}
  </p>
</div>
```

- [ ] **Step 3: Get designTheme from settings store**

At the top of the component:

```javascript
const designTheme = useSettingsStore(s => s.designTheme);
```

- [ ] **Step 4: Test in dev**

Run `npm run dev`, open Settings. Click each design theme button. Verify Discover/Search views update their glass effect immediately.

- [ ] **Step 5: Test persistence**

Reload the page. Design theme should remain selected.

- [ ] **Step 6: Commit**

```bash
git add src/views/SettingsView/SettingsView.jsx
git commit -m "feat: add design theme selector to settings view"
```

---

## Task 8: Update SearchView — Wire onAddToCollection Callback

**Files:**
- Modify: `src/views/SearchView/SearchView.jsx`

**Interfaces:**
- Consumes: Existing `onAddToCollection` handler in SearchView
- Produces: onAddToCollection callback passed to VinylCard

- [ ] **Step 1: Open SearchView.jsx and locate VinylCard rendering**

Expected: VinylCard component rendering search results, with various callbacks passed.

- [ ] **Step 2: Ensure onAddToCollection is passed to VinylCard**

Look for the VinylCard usage. If `onAddToCollection` is not passed, add it:

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

(If `onAddToCollection` is already being passed, no changes needed. Verify with a code read.)

- [ ] **Step 3: Verify handleAddToCollection exists**

Search SearchView.jsx for `handleAddToCollection`. If it doesn't exist, add it:

```javascript
const handleAddToCollection = useCallback((vinyl) => {
  collection.addItemToCollection(vinyl);
  // Optional: show toast notification
  ui.showToast({ message: 'Added to collection!', type: 'success' });
}, [collection, ui]);
```

- [ ] **Step 4: Test in dev**

Run `npm run dev`, search for an album, click "Add to Collection" button. Verify it appears in Collection view.

- [ ] **Step 5: Commit**

```bash
git add src/views/SearchView/SearchView.jsx
git commit -m "feat: wire onAddToCollection to search results"
```

---

## Task 9: Update VinylCard — Ensure Button Visibility in Search

**Files:**
- Modify: `src/components/VinylCard/VinylCard.jsx`

**Interfaces:**
- Consumes: Existing `onAddToCollection` callback
- Produces: "Add to Collection" button always visible in search context

- [ ] **Step 1: Open VinylCard.jsx and locate the button rendering**

Expected: Buttons for favorite, refresh, view details, etc. Look for where onAddToCollection button is rendered (may be missing or hidden).

- [ ] **Step 2: Check if Add to Collection button exists**

Search for "Add to Collection" or similar text. If it doesn't exist, add it in the action bar section:

```javascript
{onAddToCollection && (
  <button
    onClick={handleAddToCollection}
    style={{
      flex: 1,
      padding: '10px 12px',
      backgroundColor: themes.primary,
      color: themes.buttonText,
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 200ms ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px'
    }}
  >
    <Plus size={16} />
    Add to Collection
  </button>
)}
```

(Make sure Plus icon is imported from lucide-react.)

- [ ] **Step 3: Ensure button is always visible (not hover-only)**

If the button is currently hidden or show on hover only, remove any visibility-hiding styles. The button should render as part of the main action bar, not hidden.

- [ ] **Step 4: Test in dev**

Run `npm run dev`, search for albums. Each result should show "Add to Collection" button visibly.

- [ ] **Step 5: Commit**

```bash
git add src/components/VinylCard/VinylCard.jsx
git commit -m "fix: make add to collection button visible on search results"
```

---

## Task 10: Update discoverAlbums.json — Add New Genres

**Files:**
- Modify: `src/data/discoverAlbums.json`

**Interfaces:**
- Produces: Updated genres array with 15-20 new genres

- [ ] **Step 1: Open discoverAlbums.json and review current genre structure**

Expected:
```json
{
  "genres": [
    { "id": "01", "name": "Heavy Metal", "albumCount": 75 },
    ...
  ]
}
```

Find the highest genre ID currently in use.

- [ ] **Step 2: Add new genres to the end of the genres array**

Get the current max ID (likely around 78), then append new genres with IDs 79-93:

```json
{ "id": "79", "name": "Psychedelic Pop", "albumCount": 75 },
{ "id": "80", "name": "Cumbia", "albumCount": 75 },
{ "id": "81", "name": "Reggaeton", "albumCount": 75 },
{ "id": "82", "name": "Bachata", "albumCount": 75 },
{ "id": "83", "name": "Merengue", "albumCount": 75 },
{ "id": "84", "name": "Timba", "albumCount": 75 },
{ "id": "85", "name": "Forró", "albumCount": 75 },
{ "id": "86", "name": "Champeta", "albumCount": 75 },
{ "id": "87", "name": "Tango", "albumCount": 75 },
{ "id": "88", "name": "Flamenco", "albumCount": 75 },
{ "id": "89", "name": "Fado", "albumCount": 75 },
{ "id": "90", "name": "Raï", "albumCount": 75 },
{ "id": "91", "name": "Tuvan Throat Singing", "albumCount": 75 }
```

(Before adding, verify that Bossa Nova, Psychedelic Rock are already in the list. If so, skip Bossa Nova. If Flamenco exists, skip it.)

- [ ] **Step 3: Verify JSON syntax is valid**

Run: `npm run build`

Expected: No JSON parsing errors. Build succeeds.

- [ ] **Step 4: Test in dev**

Run `npm run dev`. Navigate to Discover > Filter subtab. Scroll through genre list. New genres should appear.

- [ ] **Step 5: Commit**

```bash
git add src/data/discoverAlbums.json
git commit -m "feat: add 13 new genres (psychedelic, latin, world music)"
```

---

## Integration & Testing Checklist

After all tasks complete, run:

### Unit Tests
```bash
npm run test
```
Expected: All tests pass, including new SubtabBar tests.

### Build
```bash
npm run build
```
Expected: No errors, build output generated.

### Dev Server
```bash
npm run dev
```
Navigate through:
1. **Discover tab:**
   - Click Filter subtab → see genre selector with glass effect
   - Click Discover subtab → see album gallery with glass effect
   - Verify state persists when switching tabs
   - Verify new genres appear in the list

2. **Settings:**
   - Switch design themes (Subtle, Bold, Hybrid)
   - Verify Discover views update immediately
   - Reload page, theme should persist

3. **Search:**
   - Search for albums
   - Verify "Add to Collection" button visible on each result
   - Click it, verify album added to Collection view

4. **Mobile Chrome:**
   - Responsive layout OK
   - Subtabs touch-friendly (50px+ height)
   - Glass effect visible (or fallback to solid bg on older browsers)

### Performance
- No layout thrashing on theme change
- No unnecessary re-renders

---

## Commit Summary

Expected commits (one per task):
1. `feat: add glassMorphism design tokens (subtle, bold, hybrid)`
2. `feat: add designTheme state to settings store`
3. `feat: create SubtabBar component with liquid glass styling`
4. `feat: split discover view into filter and discover subtabs`
5. `feat: apply liquid glass styling to genre selector`
6. `feat: apply liquid glass styling to album gallery cards`
7. `feat: add design theme selector to settings view`
8. `feat: wire onAddToCollection to search results`
9. `fix: make add to collection button visible on search results`
10. `feat: add 13 new genres (psychedelic, latin, world music)`

Total: ~10 focused commits, each with a single responsibility.

---

**Plan complete and saved to `docs/superpowers/plans/2026-08-10-discover-redesign-implementation.md`.**

Two execution options:

**1. Subagent-Driven (Recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
