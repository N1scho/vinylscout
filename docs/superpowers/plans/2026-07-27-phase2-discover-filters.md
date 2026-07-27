# Phase 2: Advanced Discover Filters Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add year range and price range filters to Discover mode, with re-shuffle capability.

**Architecture:**
- Extend GenreSelector to include year/price range sliders
- Filter shuffledAlbums based on selected ranges
- Re-shuffle button to randomize album order within current filters
- Store filter state in discoverStore

**Tech Stack:** React 19, Zustand, designSystem, lucide-react

## Global Constraints
- No breaking changes to existing Discover UI
- Filters cumulative (genre + year + price all apply)
- Re-shuffle must preserve current filter selection
- Must work with backup/recovery system (no new storage dependencies)
- Tests verify filter logic and re-shuffle randomization

---

## File Structure

```
src/
  stores/
    discoverStore.js          # Add filter state: yearRange, priceRange
  views/
    DiscoverView/
      GenreSelector.jsx       # Add year/price range sliders
      AlbumGallery.jsx        # Use filtered albums
      DiscoverView.jsx        # Trigger re-shuffle
  components/
    RangeSlider.jsx           # New: reusable range input
tests/
  stores/
    discoverStore.test.js     # Add filter tests
```

---

## Task 1: Add Filter State to discoverStore

**Files:**
- Modify: `src/stores/discoverStore.js`

**Interfaces:**
- Produces: `yearRange: [min, max]`, `priceRange: [min, max]`
- Produces: `setYearRange(range)`, `setPriceRange(range)`, `shuffle()`

**State to add:**
```javascript
yearRange: [1960, 2025],  // min/max year from albums
priceRange: [0, 500],     // min/max price in USD
```

**Functions to add:**
- `setYearRange(range)` — update year filter
- `setPriceRange(range)` — update price filter
- `shuffle()` — re-shuffle within current filters

**Steps:**

- [ ] Add yearRange/priceRange state to store
- [ ] Implement setYearRange/setPriceRange functions
- [ ] Implement shuffle() that re-randomizes shuffledAlbums based on current filters
- [ ] Calculate min/max year and price from allAlbums on init
- [ ] Write tests (set range, verify filtering, shuffle randomness)
- [ ] Commit: `feat: add year/price range filters and shuffle to discover store`

---

## Task 2: Create RangeSlider Component

**Files:**
- Create: `src/components/RangeSlider.jsx`

**Interfaces:**
- Props: `min, max, value: [min, max], onChange, label, step`
- Produces: Horizontal range slider UI

**Component:**
- Dual-thumb slider (min/max selection)
- Display current range values
- Use designSystem styling
- Touch-friendly (48px min height)

**Steps:**

- [ ] Create RangeSlider.jsx with dual-thumb slider
- [ ] Implement onChange callback for value changes
- [ ] Style with designSystem (spacing, colors, fonts)
- [ ] Test input range (HTML5 <input type="range">)
- [ ] Commit: `feat: create RangeSlider component for filter ranges`

---

## Task 3: Extend GenreSelector with Filters

**Files:**
- Modify: `src/views/DiscoverView/GenreSelector.jsx`

**Interfaces:**
- Consumes: `yearRange, priceRange, setYearRange, setPriceRange` from discoverStore
- Produces: Updated UI with year/price sliders

**Changes:**
- Add year range slider (1960-2025, step 1)
- Add price range slider (0-500, step 10)
- Add "Re-shuffle" button (calls `shuffle()`)
- Show current filter values
- Button layout: [Select All] [Clear All] [Re-shuffle]

**Steps:**

- [ ] Import RangeSlider and filter functions
- [ ] Add year slider section to GenreSelector UI
- [ ] Add price slider section to GenreSelector UI
- [ ] Add Re-shuffle button (calls discoverStore.shuffle())
- [ ] Update JSDoc to document new filters
- [ ] Test in browser (sliders work, values update, re-shuffle randomizes)
- [ ] Commit: `feat: add year/price range filters to Discover mode`

---

## Task 4: Update AlbumGallery Filtering

**Files:**
- Modify: `src/views/DiscoverView/AlbumGallery.jsx`

**Interfaces:**
- Consumes: `shuffledAlbums` (already filtered by store based on genre/year/price)
- No changes needed if discoverStore handles all filtering

**Verification:**
- Confirm AlbumGallery uses `shuffledAlbums` (it does)
- Verify `discoverStore.shuffledAlbums` is already filtered by all criteria
- If not: implement client-side filtering in AlbumGallery

**Steps:**

- [ ] Read current AlbumGallery implementation
- [ ] Verify shuffledAlbums are filtered by store
- [ ] If filtering happens in store: no changes needed, test in browser
- [ ] If filtering needed in component: add `useMemo` filter logic
- [ ] Test: change year/price filters, verify gallery updates
- [ ] Commit: (only if changes made) `refactor: ensure AlbumGallery uses filtered albums`

---

## Task 5: Write Tests for Filters

**Files:**
- Modify: `tests/stores/discoverStore.test.js`

**Tests to add:**
- `setYearRange updates state`
- `setPriceRange updates state`
- `shuffle randomizes order but preserves count`
- `filtering by year/price reduces album count`
- `filters are cumulative (genre + year + price)`

**Steps:**

- [ ] Add test suite for filter functions
- [ ] Test year range setter/getter
- [ ] Test price range setter/getter
- [ ] Test shuffle preserves count and changes order
- [ ] Test combined filtering (all 3 dimensions)
- [ ] Run tests: `npm run test -- run tests/stores/discoverStore.test.js`
- [ ] Commit: `test: add filter and shuffle tests`

---

## Task 6: Browser Testing & Refinement

**Manual testing:**

- [ ] Start dev server: `vercel dev`
- [ ] Navigate to Discover mode
- [ ] Select genres → verify album gallery updates
- [ ] Adjust year slider → verify gallery filters
- [ ] Adjust price slider → verify gallery filters
- [ ] Click Re-shuffle → verify order changes
- [ ] Combine filters (genre + year + price) → verify all apply
- [ ] Test edge cases:
  - Year range covers all albums
  - Year range excludes all albums (empty gallery)
  - Price range 0-0 (only free albums)
  - Price range very high (no albums)
- [ ] Verify responsive design on mobile
- [ ] Test with different themes

**Refinements if needed:**
- Adjust slider ranges based on actual data
- Improve UX (tooltips, labels, min/max indicators)
- Add "Reset Filters" button if useful

---

## Summary

**What will be built:**
- Filter state in discoverStore (year, price ranges)
- RangeSlider reusable component
- Extended GenreSelector with year/price inputs
- Re-shuffle functionality
- Comprehensive filter tests

**Metrics:**
- +200 lines store code (filters + shuffle)
- +150 lines RangeSlider component
- +100 lines GenreSelector updates
- +20 tests for filter logic
- Full browser testing & verification

**Next phase:** Price History (complex: historical data storage + trends)
