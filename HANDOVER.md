# VinylScout - Development Handover

**Date:** 2026-07-26  
**Version:** 3.2.1  
**Status:** Phase 3 - Discover Mode (Improvements & Fixes)

---

## Recent Changes (This Session)

### ✅ Fixed Issues

#### Price Display Reliability
- Fixed "No price data" appearing even when data available
- Changed from sequential batching to parallel Promise.all requests
- Improved error validation - accept both string and number prices
- Safe toFixed() handling with null checks
- Prices now display consistently in Search and Collection views

#### Rate Limiting
- Implemented exponential backoff retry (2s, 4s, 8s) on 429 errors
- 3-attempt retry logic in proxy layer
- Reduced default search price fetch from 50 to 20 items
- Removed client-side delays (rely on proxy backoff)
- Most searches no longer hit rate limits

#### Chrome Import Issues
- Added better error logging for collection import
- Improved error messages in UI toast
- File input ref for better Chrome compatibility

#### Type Safety
- Fixed TypeError on undefined price.value toFixed()
- Added comprehensive null/undefined checks
- Safe fallbacks: '0.00' for missing prices, 'No price available' for UI

### ✅ New Features

#### Discogs Album Covers
- Integrated Discogs API for real album covers in Discover mode
- Fallback to local 90x90 images if Discogs unavailable
- Loading spinner while fetching covers
- Caches cover URLs to minimize API calls

#### Release Year from Discogs
- Fetches actual release year from Discogs
- Displays "Year unknown" only if both Discogs and local missing
- 5770 albums in discover had year=0 from Excel, now populated from Discogs

#### Camera Zoom
- Reduced camera view zoom by 20% (scale 0.85)
- Better framing for vinyl record photography

#### Advanced Search: Country Field
- Added "Country" field to advanced search
- Support for country codes (US, UK, DE, etc.)
- Passes to Discogs API for filtering by release country

#### Discover Mode: Album Prices
- Shows average/lowest price from Discogs marketplace
- Fetches price in parallel with cover/year
- "No price available" fallback
- Safe toFixed handling

---

## Known Issues (Not Critical)

### Album Cover Misalignment (Discover Mode)
**Status:** Partially mitigated by Discogs covers  
**Note:** Discogs API now provides covers instead of misaligned Excel images

### Collection Data Recovery
**Status:** Can use `/recover-storage.html` to export/restore  
**Note:** localStorage structure may have changed between versions

### Incomplete Discogs Data
**Status:** Expected behavior  
**Note:** Some Discogs entries lack genre/format/year data. UI handles gracefully.

---

## Architecture

### Key Services

#### discogsService.js
- `searchDiscogs()` — Search Discogs database
- `fetchPriceInfo()` — Get marketplace price + availability
- `getDiscogsAlbumMetadata()` — Fetch cover + year + releaseId
- `proxyRequest()` — Route all requests through /api/discogs-proxy with retry logic

#### useDiscogsSearch.js
- `performSearch()` — Execute search (basic or advanced)
- `fetchAllPrices()` — Parallel price fetch for 20 search results
- `refreshPrice()` — Update single item price with history

### Discogs Integration Flow

```
User Search
  ↓
SearchDiscogs API call
  ↓
Fetch top 20 prices in parallel (Promise.all)
  ↓
Update resultPrices state
  ↓
Display in VinylCard with fallbacks
```

### Rate Limiting Strategy

```
Client Request
  ↓
Proxy receives (proxyRequest)
  ↓
API returns 429?
  ↓
Retry with exponential backoff (2s, 4s, 8s)
  ↓
Success or fail after 3 attempts
```

---

## File Structure

```
src/
  services/
    discogsService.js          # All Discogs API integration
    storageService.js          # localStorage operations
  views/
    DiscoverView/
      AlbumGallery.jsx         # Album display + price/cover fetch
      GenreSelector.jsx        # Genre multi-select
      DiscoverView.jsx         # Container
    SearchView/
      SearchView.jsx           # Search results display
    CollectionView/
      CollectionView.jsx       # Collection management
  components/
    VinylCard/
      VinylCard.jsx            # Card component (safe toFixed)
    DetailModal/
      EnhancedDetailModal.jsx  # Detail view (safe toFixed)
    AdvancedSearch.jsx         # Advanced search form (with Country field)
  hooks/
    useDiscogsSearch.js        # Price fetch logic (parallel)
    useCamera.js               # Camera control
  stores/
    discoverStore.js           # Zustand discover state
    collectionStore.js         # Collection + validation

api/
  discogs-proxy.js             # Proxy with retry logic (exponential backoff)
```

---

## Critical Notes

### Price Fetching
- Uses Promise.all for parallel requests (not sequential)
- Limited to 20 items per search to avoid rate limits
- Proxy's exponential backoff handles 429 errors
- If prices fail, they just won't display (no blocking)

### Discover Mode Data Flow
1. User selects genres
2. App loads shuffled albums from discoverAlbums.json
3. When viewing album: fetch cover + year + releaseId from Discogs (cached)
4. Then fetch price using releaseId (separate call)
5. Display all three pieces of data with fallbacks

### Error Handling
- Discogs API failures don't crash the app
- Missing data shows graceful fallbacks
- Price errors show "No price data" instead of errors
- Image errors hide gracefully

---

## Build & Deploy

### Local Build
```bash
npm run build          # Runs Excel parser + Vite build
npm run test --run    # Tests (186+ passing)
npm run preview       # Preview production build
```

### Vercel Deployment
- Automatic on push to master
- Parser runs in build step (reads Excel from Desktop)
- Fallback: uses cached discoverAlbums.json if Excel unavailable
- PWA service worker caching enabled

### Recent Commits
```
3b79928 feat: add average price to discover mode albums
ee3a24a fix: prevent toFixed error on undefined price values
f2eaffc fix: simplify price fetching to use parallel requests
d691f6b fix: implement exponential backoff + batching for rate limit handling
a1ee834 feat: add country field to advanced search
791b4bd feat: integrate Discogs covers for Discover mode and reduce camera zoom
d484fde fix: add better error logging for collection import (Chrome compatibility)
```

---

## Next Steps (Future Work)

1. **Image Resolution** — Excel covers 90x90px still used as fallback
   - Could use higher-res images from Discogs directly
   - Or accept low-res as acceptable

2. **Collection Recovery** — No auto-restore from backups
   - Could implement versioning/migration
   - Or remind users to export regularly

3. **Price History** — Currently shows only recent price for each item
   - Could visualize price trends over time
   - Would require historical data storage

4. **Advanced Filters in Discover** — Genre selection only
   - Could add year range, price range filters
   - Would require re-shuffling

---

## Testing Checklist

- [ ] Search returns results with prices
- [ ] Discover mode shows covers + year + price
- [ ] Camera zoom is noticeably zoomed out
- [ ] Advanced search country field works
- [ ] Collection import/export works
- [ ] No toFixed errors when clicking entries
- [ ] Prices eventually load (may take 2-3 seconds)
- [ ] Clicking album shows details without errors

---

## Contact & Context

**Last worked:** 2026-07-26  
**Phase:** 3 (Discover Mode stabilization)  
**Current focus:** Bug fixes + UX improvements  
**Next phase:** Could be image resolution, price history, or new search filters
