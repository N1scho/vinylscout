# VinylScout Handover v3.3.1 — Button Styling & Icon Issues

**Date:** 2026-08-10  
**Branch:** master  
**Focus:** Liquid Glass button design + navigation icons

## Current State

### Completed
- ✅ Liquid Glass design system (subtle/bold/hybrid themes) added to `designsystem.js`
- ✅ Glass-styled buttons in AlbumGallery (Discover view)
- ✅ Glass-styled buttons in VinylCard (Wishlist cards, search results)
- ✅ Discover navigation arrows (❮ ❯) visible and clickable
- ✅ Design theme selector in Settings (3 buttons: subtle/bold/hybrid)
- ✅ Refresh button in Settings (two variants):
  - "Refresh App (keep collection)" — clears service worker cache only
  - "Clear All Data & Reload" — wipes localStorage + sessionStorage

### Open Issues

#### Issue 1: Wishlist Card Navigation Icons Not Visible
**Status:** UNRESOLVED  
**File:** `src/components/VinylCard/VinylCard.jsx` (lines 188-240)  
**Problem:** Image gallery navigation buttons show no icons (expected: ❮ ❯ symbols)  
**Observations:**
- Discover view arrows work fine (same code pattern, different component)
- Wishlist cards are VinylCard instances in WishlistView
- Last code push includes unicode arrow implementation
- Likely a cache/reload issue on phone browser

**Debugging Steps:**
1. Open VinylCard on phone in browser dev tools (F12)
2. Inspect `<button>` elements in image gallery nav (lines ~206-238)
3. Check if inner text contains ❮ or ❯ (should be visible in DOM)
4. If visible in DOM but not rendered: browser cache issue → use "Refresh App (keep collection)"
5. If missing from DOM entirely: code not deployed → git pull + hard refresh

**Next Fix:**
- Verify VinylCard code was updated with unicode arrows (check git log)
- If missing, re-apply unicode arrow fix to VinylCard
- Test on phone after "Refresh App (keep collection)" in Settings

#### Issue 2: Design Theme Differences Not Obvious
**Status:** DESIGN/VISIBILITY  
**Files:** `designsystem.js` (glassMorphism object), AlbumGallery, VinylCard  
**Problem:** User reports no visible difference between subtle/bold/hybrid themes  
**Root Cause:** Glass effect blur values may be too subtle on mobile; theme switching may require full page reload to see difference  

**Debugging Steps:**
1. Open Settings → Design Theme selector
2. Switch between subtle/bold/hybrid
3. Navigate to Discover view after each switch
4. Watch album cover navigation buttons (should see different blur intensity)
   - **Subtle:** minimal blur (blur 8px), light glow
   - **Bold:** heavy blur (blur 20px), strong glow
   - **Hybrid:** no blur, solid button background with border

**Next Fix:**
- If no difference visible: add explicit visual indicator (e.g., "Bold" label appears on button when active)
- Consider increasing blur values in `designsystem.js` for more obvious effect:
  ```javascript
  glassMorphism: {
    subtle: { blur: '12px', ... },
    bold: { blur: '25px', ... },  // increase from 20px
    hybrid: { ... }
  }
  ```
- Force page reload after theme switch (modify SettingsView onDesignThemeChange to trigger reload)

#### Issue 3: Icon Centering in Circle Buttons
**Status:** PARTIALLY FIXED  
**Files:** AlbumGallery (lines 216-260, 329-397), VinylCard (lines 206-238)  
**Problem:** Unicode arrows (❮ ❯) slightly off-center in circular buttons  
**Applied Fixes:**
- Added `padding: 0`, `margin: 0`, `lineHeight: '1em'` to all nav buttons
- Reduced fontSize slightly to avoid overflow

**If Still Misaligned:**
- Adjust button height/width to match icon baseline
- Try `transform: translateY(1px)` on icon text for fine-tuning
- Alternative: use CSS pseudo-elements for pixel-perfect centering

## Testing Checklist

### Before Deploy
```bash
npm run test       # Should pass 261+ tests
npm run build      # Should compile without errors
npm run dev        # Start server on localhost:5181
```

### On Phone (iOS/Android Chrome)
1. Navigate to `http://<windows-ip>:5181`
2. Hard refresh: Settings → "Refresh App (keep collection)" → wait 2s
3. Go to **Discover view**:
   - [ ] Album cover navigation: arrows visible and centered
   - [ ] Large prev/next buttons: arrows visible and centered
   - [ ] Wishlist heart button: ♥/♡ visible
4. Go to **Wishlist view**:
   - [ ] Card image navigation: arrows visible (❮ ❯)
   - [ ] "Add to Collection" button: visible with Plus icon
5. Go to **Settings**:
   - [ ] Design Theme selector: 3 buttons (subtle/bold/hybrid)
   - [ ] "Refresh App" button: clears cache, keeps collection data
   - [ ] "Clear All Data" button: nukes everything + reloads
6. Switch design themes (subtle/bold/hybrid) in Settings:
   - [ ] Return to Discover
   - [ ] Observe button styling changes (blur, glow intensity)

## Code Locations

| File | Issue | Lines |
|------|-------|-------|
| `src/views/DiscoverView/AlbumGallery.jsx` | Image nav icons, large nav buttons | 216-260, 329-397 |
| `src/components/VinylCard/VinylCard.jsx` | Image nav icons, "Add to Collection" button | 206-238, 582-613 |
| `src/views/SettingsView/SettingsView.jsx` | Design theme selector, refresh buttons | 159-187, 408-444 |
| `src/designsystem.js` | glassMorphism theme definitions | ~260-290 |

## Key Commits

- `6576630` — Replace lucide icons with unicode arrows for guaranteed visibility
- `08c257d` — Center arrow icons (margin/lineHeight fixes)
- `d62f367` — Increase image nav button size + icon weight
- `6d7df69` — Split cache refresh into two buttons
- `4975916` — Apply liquid glass styling to all navigation buttons

## Environment

- **Dev Server:** `npm run dev` → localhost:5181 (ports 5173-5180 in use)
- **Browser Cache:** Use "Refresh App (keep collection)" in Settings, NOT browser hard refresh
- **Collection Data:** localStorage persists across app refreshes (not cleared by "Refresh App")
- **Service Worker:** Cached by browser; "Refresh App" clears all service worker caches

## Next Steps for Future Sessions

1. **High Priority:** Fix Wishlist icon visibility
   - Verify VinylCard unicode arrow code is present in HEAD
   - Test after "Refresh App (keep collection)" on phone
   - If still missing: check browser network tab for errors during page load

2. **Medium Priority:** Make design theme differences more obvious
   - Increase blur values in glassMorphism for bold theme
   - Add visual label or indicator showing active theme
   - Consider forcing page reload on theme change

3. **Low Priority:** Fine-tune icon centering
   - Use browser dev tools to measure button baseline
   - Adjust `transform: translateY()` if needed
   - Test across different phone browsers (Safari, Chrome, Firefox)

## Contact/Questions

- All code on `origin/master`
- Test on phone via `http://<local-windows-ip>:5181`
- Always use "Refresh App (keep collection)" in Settings, not browser hard refresh
