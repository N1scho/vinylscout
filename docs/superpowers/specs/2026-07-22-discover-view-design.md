# Discover View Design

**Date:** 2026-07-22  
**Status:** Brainstorming Complete - Option A Approved  
**Approach:** Genre-Toggle + Galerie inline

## Overview

New "Discover" tab in VinylScout navigation (bottom bar, position 6). Users browse vinyl albums from vinyl_master.xlsx (80 genres, ~25 albums each = ~2000 total), filter by genre, and swipe through them. Add albums to new Wishlist feature.

## Data Source

- **File:** `C:\Users\nikol\Desktop\Claude\Genre Lists\Vinyl_Master.xlsx`
- **Structure:** 80 sheets (genre-named), sheet per genre contains ~25 albums
- **Columns:** Artist, Year, Album, Cover (embedded images), Katalognummer, Preis
- **Images:** Embedded as shapes in Excel (72+ images per genre sheet)
- **Import Strategy:** Load once at app startup into collection store, persist to localStorage

## Architecture

### New Store: `discoverStore`
- `allAlbums`: Array of all 2000 albums (loaded from Excel on init)
- `selectedGenres`: Set of selected genre IDs (default: all selected)
- `shuffledAlbums`: Current shuffled/filtered list based on selection
- `currentAlbumIndex`: Current position in swipe gallery
- `wishlist`: Array of album IDs added to wishlist (persisted to localStorage)

### New View: `DiscoverView`
Location: `src/views/DiscoverView/DiscoverView.jsx`

**Components:**
1. **GenreSelector** (`src/views/DiscoverView/GenreSelector.jsx`)
   - "Select All" button (top-left)
   - "Clear All" button (top-right)
   - Genre checkboxes in scrollable grid
   - When selection changes → shuffle albums, reset index to 0

2. **AlbumGallery** (`src/views/DiscoverView/AlbumGallery.jsx`)
   - Current album with image, artist, album name, year
   - Swipe/touch handlers for next/prev
   - Wishlist icon button (heart)
   - Keyboard: arrow keys or spacebar for next

3. **EmptyState**
   - Show if no genres selected

### Updated View: `CollectionView`
- Add filter option: "Show Wishlist Only"
- Wishlist appears as subset of collection with wishlist badge
- Wishlist albums also removable from collection separately

### Data Import
**On app init (App.jsx):**
1. Check if `discoverAlbums` in localStorage
2. If not, fetch and parse Excel file (extract images as base64 or copy to public/)
3. Store in discoverStore
4. Re-check on version change (app update)

**Excel Parsing Strategy:**
- Use Node.js script in build process (pre-deployment) OR
- Use PowerShell script to extract Excel data on first app load
- Convert embedded images to PNG files in `/public/vinyl-covers/<genre>/<album-id>.png`
- Store album data as JSON in localStorage

## UI/UX Details

### Discover Tab Layout (Mobile-First)
```
┌─────────────────────────┐
│ [Select All] [Clear All]│  ← Genre controls
├─────────────────────────┤
│ ☑ Heavy Metal           │  ← Genre list (scrollable)
│ ☑ Thrash Metal          │     + checkboxes
│ ☑ Death Metal           │
│ ☐ Doom Metal            │
│ ...                     │
├─────────────────────────┤
│                         │
│   [  Album Cover  ]     │  ← Image, centered
│                         │
│   Black Sabbath         │  ← Artist
│   Paranoid              │  ← Album name
│   1970                  │  ← Year
│                         │
│   [←]  [♡]  [→]         │  ← Navigation + wishlist button
│                         │
└─────────────────────────┘
```

### Wishlist Integration
- Heart icon on album gallery (filled = in wishlist)
- Click to toggle on/off
- Toast: "Added to Wishlist" / "Removed from Wishlist"
- Wishlist persisted in localStorage + synced with collection store

### Collection View Update
- New filter chip: "Wishlist" (toggles to show only wishlist albums)
- Wishlist badge on wishlist albums in grid/list view
- Separate "Remove from Wishlist" action (vs "Remove from Collection")

## Data Flow

```
App.init()
  → Load Excel data (async)
  → Parse 80 sheets
  → Extract images
  → Store in discoverStore
  → Render DiscoverView with all 2000 albums

User selects genres
  → discoverStore.setSelectedGenres()
  → Shuffle filtered albums
  → Reset currentAlbumIndex to 0

User swipes
  → Update currentAlbumIndex
  → Show next album

User clicks heart
  → discoverStore.toggleWishlist(albumId)
  → Update collectionStore (or separate wishlist state)
  → Persist to localStorage
```

## Technical Decisions

1. **Shuffle on Selection:** Every time genres change, shuffle the filtered list for randomness
2. **Images:** Extract from Excel as base64 strings in JSON OR copy PNG files to `/public/`. Base64 in localStorage might be too large—recommend PNG files.
3. **Wishlist Storage:** Separate from collection, but UI shows in Collection view as a filtered subset
4. **Performance:** Load all 2000 albums once at startup; filtering/shuffling is O(n) client-side only
5. **Swipe Gesture:** Use touch event handlers or a swipe library (e.g., react-swipe-gesture)

## Success Criteria

- [ ] Genre selector functional (select/deselect/all/none)
- [ ] Album gallery displays shuffled albums with swipe navigation
- [ ] Wishlist add/remove works
- [ ] Wishlist persists across sessions
- [ ] Wishlist visible in Collection view
- [ ] Images load and display correctly
- [ ] Performance acceptable on mobile

## Next Steps (after user approval)

1. Invoke `superpowers:writing-plans` to create implementation plan
2. Implement discoverStore (Zustand)
3. Build Excel parser + image extractor
4. Create GenreSelector component
5. Create AlbumGallery component with swipe handling
6. Update CollectionView to show wishlist filter
7. Test on mobile device
