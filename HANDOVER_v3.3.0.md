# VinylScout — Development Handover
**Version:** 3.3.0-feature-batch-1  
**Date:** 2026-07-28  
**Status:** Production-ready with critical bugs identified (see Issues section)

---

## Session Summary

Completed Phase 1-3 bug fixes + implemented 9 quick-win features. Built on v3.2.0-stable baseline.

**Commits:** 13 total (9 features + 4 fixes)  
**Build:** ✓ Production build succeeds  
**Tests:** ✓ 186+ passing  
**Backups:** v3.2.0-stable (tag + branch), v3.3.0-feature-batch-1 (current)

---

## Features Implemented (Session)

| # | Feature | File | Status |
|---|---------|------|--------|
| 1 | Search History Persistence | searchStore.js, SearchView.jsx | ✓ Complete |
| 2 | Collection Quick-Filters | CollectionView.jsx | ✓ Complete |
| 3 | Vinyl Condition Tracking | schemas, VinylDetailsModal.jsx | ✓ Complete |
| 4 | Condition Statistics | statistics.js, StatsView.jsx | ✓ Complete |
| 5 | Favorites Breakdown | statistics.js, StatsView.jsx | ✓ Complete |
| 6 | Wishlist Summary Card | StatsView.jsx | ✓ Complete |
| 7 | Collection Growth (by Year) | statistics.js, StatsView.jsx | ✓ Complete |
| 8 | Format Value Breakdown | statistics.js, StatsView.jsx | ✓ Complete |
| 9 | Genre Value Breakdown | statistics.js, StatsView.jsx | ✓ Complete |

---

## Critical Issues Found (Audit 2026-07-28)

**Must fix before production deployment:**

### 1. Hook Violation in collectionHelpers.js:74 (PRE-EXISTING)
- **Issue:** `useDiscoverStore()` called inside plain function used as Zustand selector
- **Symptom:** "Minified React error #185" when toggling wishlist filter
- **Root cause:** Rules of Hooks violation; hook call order changes between renders
- **Fix:** Lift `useDiscoverStore()` to component level (App.jsx), pass wishlist via props to filterCollection
- **Severity:** CRITICAL — causes app crash

### 2. QuotaExceededError Retry Incomplete in collectionStorage.js:73
- **Issue:** Storage quota exceeded, retry logic only frees one backup slot, second attempt unguarded
- **Symptom:** Uncaught error on mobile Chrome with tight storage limits
- **Fix:** Loop retry until backup clears enough space or throw user-friendly error
- **Severity:** CRITICAL — blocks collection saves on mobile

### 3. ViewErrorBoundary Missing Key in App.jsx:577
- **Issue:** No `key={view}` on ViewErrorBoundary
- **Symptom:** Once a view crashes, switching tabs doesn't recover; stuck on error screen until clicking "Try Again"
- **Fix:** Add `key={view}` to force component remount on view change
- **Severity:** HIGH — major UX break

### 4. Regression: Clear All Genres Undone (DiscoverView.jsx:13)
- **Issue:** Corrupted-state recovery effect (added this session) now undoes user's "Clear All Genres" action
- **Root cause:** Can't distinguish user-cleared from corrupted state
- **Fix:** Check if intentional (user just clicked) vs unintentional (rehydrate after app restart); use flag or timing check
- **Severity:** HIGH — regression from this session

### 5. Format Breakdown Missing Array Guard (statistics.js:116)
- **Issue:** Schema allows format as string OR array, but stats calculation doesn't handle array case
- **Symptom:** Array-typed formats skipped in value breakdown; stats fragmented
- **Fix:** Add guard like CollectionView's: `const fmt = Array.isArray(v.format) ? v.format[0] : v.format`
- **Severity:** MEDIUM — stats inaccuracy

### 6. Year Filter Skips Falsy Years (discoverStore.js:26)
- **Issue:** Year filter condition: `if (album.year && (album.year < ...))` silently skips falsy years
- **Symptom:** Albums with year=0, year=null, or missing year don't appear in filtered results
- **Fix:** Separate checks: `if (album.year === undefined || album.year === null) return true` (don't filter), then range check
- **Severity:** MEDIUM — filtering logic bug

### 7. Division by Zero (statistics.js:284)
- **Issue:** `avgValue: formatCounts[format] > 0 ? value / formatCounts[format] : 0` — guard exists but pattern unreachable
- **Severity:** LOW — code smell only

---

## Bug Fixes Applied (Session)

| Commit | Issue | Fix |
|--------|-------|-----|
| f6c592f | Wishlist crash: undefined state | Added `?.` optional chaining + null coalescing |
| f6c592f | Discover sliders return no results | Reinitialized genres if empty after localStorage load |
| 80ba1cb | searchStore persist syntax error | Fixed Zustand middleware nesting |
| 9661071 | No cache clearing option | Added "Clear Cache & Storage" button in Settings |

---

## Architecture Overview

### Stores (Zustand)
- **collectionStore.js** — Main collection (with updateItemInCollection for condition edits)
- **discoverStore.js** — Discover mode: genres, albums, wishlist, year/price filters (with rehydration guard)
- **searchStore.js** — Search queries + history (now persisted via localStorage)
- **settingsStore.js** — Theme, shop selection
- **uiStore.js** — Modal state, toast notifications

### Services
- **storageService.js** — Backup/restore (rolling 3-backup system)
- **priceHistoryService.js** — Save/retrieve price history per album
- **collectionStorage.js** — Collection import/export + storage quota handling

### Views
- **SearchView** — Query + advanced search, results, pagination (+ search history buttons)
- **CameraView** — Vinyl recognition via Claude vision
- **CollectionView** — Grid/list, sort/filter, quick-filter buttons (genre/format/decade)
- **StatsView** — Comprehensive stats: top genres/formats/decades, value breakdowns, favorites, wishlist count, added-by-year
- **DiscoverView** — Genre selection, year/price sliders, album swipe gallery, wishlist toggle
- **SettingsView** — Theme, export (JSON/CSV), import, backup recovery, **clear cache**

### Components
- **VinylCard** — Album display (grid/list)
- **PriceHistoryModal** — Chart + statistics for album price trends
- **VinylDetailsModal** — Album details + **condition selector** (Mint/NM/VG+/VG/Good/Fair/Poor)
- **FilterChip** — Active filter badges
- **RangeSlider** — Dual-range input (year/price in discover)
- **ViewErrorBoundary** — Crash recovery per view (⚠️ no key={view} — see issue #3)

### Schemas
- **vinylSchemas.js** — Zod validation for Vinyl (now includes condition field), prices, settings, advanced search

---

## Known Limitations

1. **Search history:** Only persisted searches (not advanced search field combinations) — can extend if needed
2. **Discogs format/label:** Can be string or array — code mostly handles this but statistics.js needs guard
3. **Rate limiting:** Discogs 60 req/min enforced; observable in UI, no automatic backoff
4. **Duplicates:** Not detected or merged
5. **PWA offline:** Service worker caches only search results + app shell; collection data requires connectivity

---

## Testing

- **Unit tests:** 186+ passing (discoverStore, storageService, priceHistoryService, RangeSlider, PriceHistoryModal, collectionOperations)
- **Manual testing:** Mobile Chrome primary (responsive, touch-friendly)
- **Build:** Vite production build succeeds; PWA manifest generated

---

## Next Steps (Prioritized)

### IMMEDIATE (stability blockers)
1. Fix hook violation in collectionHelpers.js (#1 above)
2. Fix QuotaExceededError retry logic (#2)
3. Add key={view} to ViewErrorBoundary (#3)
4. Fix Clear All Genres regression (#4)

### SHORT-TERM (correctness)
5. Add format array guard in statistics.js (#5)
6. Fix year filter to include falsy years (#6)
7. Remove unreachable division-by-zero code (#7)

### MEDIUM-TERM (features, post-fix)
- Advanced search filters (year/price range in search view)
- Decade filtering (make decades clickable in stats)
- Most-added artists (show recent/frequent additions)
- Bulk operations (multi-select, batch favorite/delete)

---

## Development Notes

### Model Selection (Updated 2026-07-28)
- **Default:** Sonnet 5 (good balance for feature work + bug fixes)
- **Use Opus 5:** Deep architecture decisions, tricky bugs that survived 2+ Sonnet attempts
- **Use Fable 5/Haiku:** Single-file edits, typos, repetitive additions (via Agent subagent with model override)
- **Key:** Flag model tier before starting a task; I cannot self-switch mid-session

### Token Cost Optimization
- Feature batch 1 was mechanically repetitive (stats additions) → overpaid running on Sonnet
- Future: Delegate mechanical work to Fable subagents via Agent tool with `model: 'fable'`
- Sonnet handles orchestration, Fable handles boilerplate

### Mobile-First Testing
- Primary platform: Chrome on mobile phone
- Test: viewport responsiveness, touch interactions, PWA install prompt
- Check: localStorage limits (mobile has tighter constraints)

### Git Workflow
- Tag before major work: `git tag -a vX.Y.Z-stable`
- Create backup branch: `git branch backup-vX.Y.Z`
- All commits go to master; push after verification

---

## Files Changed (Session Summary)

**New/Modified:**
- src/stores/discoverStore.js (rehydration guard)
- src/stores/searchStore.js (persist middleware)
- src/stores/collectionStore.js (updateItemInCollection exposed)
- src/views/SearchView/SearchView.jsx (search history UI)
- src/views/CollectionView/CollectionView.jsx (quick-filters)
- src/views/DiscoverView/DiscoverView.jsx (genre reinitialization)
- src/views/SettingsView/SettingsView.jsx (clear cache button)
- src/views/StatsView/StatsView.jsx (new stats sections)
- src/schemas/vinylSchemas.js (condition field)
- src/utils/statistics.js (new breakdowns: condition, genre-value, format-value, added-by-year, favorites)
- src/components/VinylDetailsModal/VinylDetailsModal.jsx (condition selector)

**Unchanged (stable):**
- src/App.jsx (main structure intact, exception: need to fix hook violation)
- src/hooks/, src/utils/ (mostly unchanged)
- src/components/DetailModal/, src/components/PriceHistoryModal/ (working as-is)

---

## How to Resume

1. **Check git status:**
   ```bash
   git log --oneline | head -20
   npm run build
   ```

2. **Run tests:**
   ```bash
   npm run test
   ```

3. **Start dev server:**
   ```bash
   npm run dev
   ```

4. **Fix critical issues first** (see "Known Issues" above), then test on mobile Chrome.

5. **Model selection for next session:**
   - Bug fixes: Sonnet 5 (set via `/model` at start of session)
   - Simple additions: Fable 5 (via Agent subagent with `model: 'fable'`)
   - Architecture: Opus 5 (rare, only if blocked)

---

## Memory Files (Session Context)

For future sessions, check these in `.claude/projects/C--Users-nikol-vinylscout/memory/`:
- `primary_platform.md` — Mobile Chrome is primary use case
- `backup_strategy.md` — Tag/branch backups before major work
- `model_selection_strategy.md` — When to flag model switches
- `feature_batch_1.md` — This session's 9 features + what wasn't built

---

**End of Handover — Ready for next session**
