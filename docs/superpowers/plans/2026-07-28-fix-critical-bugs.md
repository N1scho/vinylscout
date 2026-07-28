# Fix 4 Critical Bugs — VinylScout v3.3.0

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 critical bugs blocking production deployment: hook violation, incomplete error retry, missing error boundary key, and Clear All Genres regression.

**Architecture:** 
- Issue #1: Lift `useDiscoverStore()` hook to component level (App.jsx), pass wishlist via props to utility function.
- Issue #2: Loop retry until space freed or max retries reached; throw user-friendly error if still exceeds quota.
- Issue #3: Add `key={view}` to ViewErrorBoundary to force component remount on view change.
- Issue #4: Add timing/flag to distinguish user-initiated "Clear All Genres" from corrupted-state auto-recovery.

**Tech Stack:** React, Zustand, Jest/Vitest

## Global Constraints

- Do not break existing tests (186+ passing tests must remain passing)
- Mobile Chrome is primary platform — test responsive behavior
- Maintain backward compatibility with existing localStorage structure
- No breaking changes to store APIs or component props

---

## Task 1: Add key prop to ViewErrorBoundary

**Files:**
- Modify: `src/App.jsx:577-581`

**Interfaces:**
- Consumes: `view` from uiStore (string: 'search', 'camera', 'collection', 'stats', 'discover', 'settings')
- Produces: No API change; ViewErrorBoundary receives `key={view}` prop

**Context:** 
ViewErrorBoundary has no `key` prop, so when a view crashes and user switches tabs, React doesn't remount the component. The old error state persists. Adding `key={view}` forces React to treat each view as a distinct instance and remount when view changes.

- [ ] **Step 1: Open App.jsx and locate ViewErrorBoundary (line 577)**

Line 577 currently:
```jsx
<ViewErrorBoundary
  viewName={view.charAt(0).toUpperCase() + view.slice(1)}
  themes={themes}
  onNavigateHome={() => handleViewChange('search')}
>
```

- [ ] **Step 2: Add key prop**

Change to:
```jsx
<ViewErrorBoundary
  key={view}
  viewName={view.charAt(0).toUpperCase() + view.slice(1)}
  themes={themes}
  onNavigateHome={() => handleViewChange('search')}
>
```

- [ ] **Step 3: Verify no other changes needed**

Check ViewErrorBoundary.jsx to confirm it accepts and uses the key prop (it should — React handles key automatically). No code change needed in ViewErrorBoundary itself.

- [ ] **Step 4: Test on mobile Chrome**

1. Navigate to any view (e.g., 'collection')
2. Intentionally trigger an error (e.g., add console.error in CollectionView to crash it)
3. Click error boundary's "Try Again" button — should reset
4. Switch to another view (e.g., 'search') — should remount cleanly, no stuck error screen
5. Return to previously-crashed view — should remount fresh, not show old error

- [ ] **Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "fix: add key to ViewErrorBoundary for proper remount on view change"
```

---

## Task 2: Fix hook violation in collectionHelpers.js

**Files:**
- Modify: `src/utils/collectionHelpers.js:68-114` (filterCollection function)
- Modify: `src/App.jsx:46-75` (filteredAndSorted selector + renderCollectionView)
- Modify: `src/views/CollectionView/CollectionView.jsx` (if it calls filterCollection directly; check first)

**Interfaces:**
- Consumes: 
  - filterCollection receives new `wishlistIds` param (array of IDs from useDiscoverStore)
  - useCollectionStore selector passes wishlist state via new param
- Produces: 
  - filterCollection signature changes from `(items, filter, searchQuery, genreFilter, decadeFilter, formatFilter)` to `(items, filter, searchQuery, genreFilter, decadeFilter, formatFilter, wishlistIds)`
  - No change to export or other signatures

**Context:**
The bug: collectionHelpers.js line 75 calls `useDiscoverStore()` inside `filterCollection`, a plain utility function. This violates React's Rules of Hooks because:
1. `filterCollection` is called from a Zustand selector (App.jsx line 57-69)
2. Zustand selectors can be called during render but hook call order must be stable
3. Calling a hook inside a selector breaks hook order stability → "Minified React error #185"

The fix: Move the hook call to component level (App.jsx), extract wishlist IDs, pass them as a parameter to filterCollection.

- [ ] **Step 1: Update filterCollection to accept wishlistIds parameter**

In `src/utils/collectionHelpers.js`, change the function signature and wishlist filter logic:

**OLD (lines 68, 74-76):**
```javascript
export const filterCollection = (items, filter, searchQuery = '', genreFilter = null, decadeFilter = null, formatFilter = null) => {
  // ...
  } else if (filter === 'wishlist') {
    const wishlistIds = useDiscoverStore().wishlist;
    filtered = items.filter(item => wishlistIds.includes(item.id));
  }
```

**NEW:**
```javascript
export const filterCollection = (items, filter, searchQuery = '', genreFilter = null, decadeFilter = null, formatFilter = null, wishlistIds = []) => {
  // ...
  } else if (filter === 'wishlist') {
    filtered = items.filter(item => wishlistIds.includes(item.id));
  }
```

- [ ] **Step 2: Import useDiscoverStore in App.jsx**

In `src/App.jsx`, add to imports (around line 23-28):
```javascript
import { useDiscoverStore } from './stores/discoverStore';
```

- [ ] **Step 3: Extract wishlist IDs in App.jsx and pass to filterCollection**

In `src/App.jsx`, after line 49 (after `const ui = useUIStore();`), add:
```javascript
const wishlist = useDiscoverStore((s) => s.wishlist);
```

Then modify the filteredAndSorted selector (lines 55-69) to pass wishlist IDs:

**OLD:**
```javascript
const filteredAndSorted = useCollectionStore(
  useShallow((s) =>
    sortCollection(
      filterCollection(
        s.collection,
        s.collectionFilter,
        s.collectionSearch,
        s.activeGenreFilter,
        s.activeDecadeFilter,
        s.activeFormatFilter
      ),
      s.sortBy
    )
  )
);
```

**NEW:**
```javascript
const filteredAndSorted = useCollectionStore(
  useShallow((s) =>
    sortCollection(
      filterCollection(
        s.collection,
        s.collectionFilter,
        s.collectionSearch,
        s.activeGenreFilter,
        s.activeDecadeFilter,
        s.activeFormatFilter,
        wishlist
      ),
      s.sortBy
    )
  )
);
```

- [ ] **Step 4: Search for other filterCollection calls**

Run:
```bash
grep -r "filterCollection(" src/ --include="*.jsx" --include="*.js"
```

Expected: Only `src/App.jsx` and `src/utils/collectionHelpers.js`. If CollectionView.jsx imports it directly, update those calls too to pass wishlist (pass empty array `[]` if no wishlist context available).

- [ ] **Step 5: Write and run test**

Create `src/utils/__tests__/collectionHelpers.test.js` with:

```javascript
import { filterCollection } from '../collectionHelpers';

describe('filterCollection', () => {
  const mockItems = [
    { id: 1, title: 'Artist 1 - Album 1', isFavorite: false },
    { id: 2, title: 'Artist 2 - Album 2', isFavorite: true },
    { id: 3, title: 'Artist 3 - Album 3', isFavorite: false },
  ];

  it('filters wishlist correctly with provided wishlistIds', () => {
    const wishlistIds = [1, 3];
    const result = filterCollection(mockItems, 'wishlist', '', null, null, null, wishlistIds);
    expect(result).toHaveLength(2);
    expect(result.map(i => i.id)).toEqual([1, 3]);
  });

  it('filters wishlist correctly with empty wishlistIds', () => {
    const result = filterCollection(mockItems, 'wishlist', '', null, null, null, []);
    expect(result).toHaveLength(0);
  });

  it('filters favorites correctly', () => {
    const result = filterCollection(mockItems, 'favorites', '', null, null, null, []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(2);
  });
});
```

Run:
```bash
npm run test -- collectionHelpers.test.js
```

Expected: All tests pass.

- [ ] **Step 6: Test on mobile Chrome**

1. Navigate to Collection view
2. Toggle wishlist filter (should not crash with React error #185)
3. Verify filtered results display correctly
4. Switch to another view and back — should maintain filter state correctly

- [ ] **Step 7: Run full test suite**

```bash
npm run test
```

Expected: 186+ tests still passing, no new failures.

- [ ] **Step 8: Commit**

```bash
git add src/utils/collectionHelpers.js src/App.jsx src/utils/__tests__/collectionHelpers.test.js
git commit -m "fix: lift useDiscoverStore hook to App.jsx, pass wishlist via props to filterCollection"
```

---

## Task 3: Fix QuotaExceededError retry logic

**Files:**
- Modify: `src/services/collectionStorage.js:64-78` (setItem method)

**Interfaces:**
- Consumes: localStorage API, MAX_BACKUPS constant (value: 3)
- Produces: 
  - setItem throws `Error` with message: "localStorage quota exceeded and no space could be freed" if all retries fail
  - On success, logs `[backupStorage] saved <name>, size: <size> bytes`

**Context:**
Current bug: When quota exceeded (line 70), only one backup is removed (line 72), then setItem is retried once (line 73). If second attempt still exceeds, error propagates. On mobile with tight storage, one backup clear may not be enough.

The fix: Loop retry up to MAX_BACKUPS times, freeing older backups each iteration. If all fail, throw user-friendly error.

- [ ] **Step 1: Review current code**

Current code (lines 64-78):
```javascript
setItem: (name, value) => {
  try {
    rotateBackups(localStorage.getItem(name));
    localStorage.setItem(name, value);
    console.log(`[backupStorage] saved ${name}, size: ${value.length} bytes`);
  } catch (error) {
    if (error && error.name === 'QuotaExceededError') {
      console.warn('[backupStorage] quota exceeded, freeing space');
      localStorage.removeItem(`${BACKUP_PREFIX}${MAX_BACKUPS}`);
      localStorage.setItem(name, value);
    } else {
      console.error('[backupStorage] error:', error);
      throw error;
    }
  }
}
```

- [ ] **Step 2: Implement retry loop**

Replace setItem with:

```javascript
setItem: (name, value) => {
  try {
    rotateBackups(localStorage.getItem(name));
    localStorage.setItem(name, value);
    console.log(`[backupStorage] saved ${name}, size: ${value.length} bytes`);
  } catch (error) {
    if (error && error.name === 'QuotaExceededError') {
      console.warn('[backupStorage] quota exceeded, retrying after clearing backups');
      
      let backupCleared = false;
      for (let i = MAX_BACKUPS; i >= 1; i--) {
        try {
          localStorage.removeItem(`${BACKUP_PREFIX}${i}`);
          backupCleared = true;
          console.warn(`[backupStorage] cleared backup slot ${i}, retrying...`);
          
          try {
            localStorage.setItem(name, value);
            console.log(`[backupStorage] saved ${name} after clearing backups, size: ${value.length} bytes`);
            return; // Success
          } catch (retryError) {
            if (retryError.name !== 'QuotaExceededError') {
              throw retryError;
            }
            // Continue to next backup
          }
        } catch (clearError) {
          console.error(`[backupStorage] failed to clear backup ${i}:`, clearError);
          // Continue to next backup
        }
      }
      
      if (!backupCleared) {
        throw new Error('localStorage quota exceeded and no space could be freed');
      }
      throw new Error('localStorage quota exceeded: insufficient space after clearing all backups');
    } else {
      console.error('[backupStorage] error:', error);
      throw error;
    }
  }
}
```

- [ ] **Step 3: Write and run test**

Create `src/services/__tests__/collectionStorage.test.js`:

```javascript
import { backupStorage, BACKUP_PREFIX, MAX_BACKUPS } from '../collectionStorage';

describe('backupStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('saves item successfully on first attempt', () => {
    const value = '{"state": {"collection": []}}';
    backupStorage.setItem('test-key', value);
    expect(localStorage.getItem('test-key')).toBe(value);
  });

  it('retries and clears backups on QuotaExceededError', () => {
    // Mock localStorage.setItem to throw QuotaExceededError first time, succeed second time
    let callCount = 0;
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = jest.fn((key, value) => {
      callCount++;
      if (callCount === 1 && key === 'test-key') {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      }
      originalSetItem.call(localStorage, key, value);
    });

    // Pre-populate backups
    originalSetItem.call(localStorage, `${BACKUP_PREFIX}1`, '{"state": {"collection": []}}');
    originalSetItem.call(localStorage, `${BACKUP_PREFIX}2`, '{"state": {"collection": []}}');

    const value = '{"state": {"collection": []}}';
    backupStorage.setItem('test-key', value);
    
    expect(localStorage.getItem('test-key')).toBe(value);
    expect(localStorage.getItem(`${BACKUP_PREFIX}1`)).toBeNull(); // Cleared during retry
  });

  it('throws user-friendly error when all retries exhausted', () => {
    // Mock localStorage.setItem to always throw QuotaExceededError
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = jest.fn((key, value) => {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    });

    const value = '{"state": {"collection": []}}';
    expect(() => backupStorage.setItem('test-key', value)).toThrow(
      'localStorage quota exceeded'
    );
  });
});
```

Run:
```bash
npm run test -- collectionStorage.test.js
```

Expected: All tests pass.

- [ ] **Step 4: Test on mobile Chrome with tight storage**

1. Open DevTools → Application → Storage
2. Manually fill localStorage close to quota limit
3. Try to add many items to collection
4. Observe: 
   - First time quota hit: retries clear backups and succeeds
   - After all backups cleared: shows user-friendly error toast (see SettingsView for error handling)

- [ ] **Step 5: Run full test suite**

```bash
npm run test
```

Expected: 186+ tests still passing.

- [ ] **Step 6: Commit**

```bash
git add src/services/collectionStorage.js src/services/__tests__/collectionStorage.test.js
git commit -m "fix: loop retry QuotaExceededError, clear all backup slots before throwing"
```

---

## Task 4: Fix Clear All Genres regression

**Files:**
- Modify: `src/stores/discoverStore.js` (add timestamp/flag tracking)
- Modify: `src/views/DiscoverView/DiscoverView.jsx:13-17` (rehydration logic)

**Interfaces:**
- Consumes: discoverStore state (allAlbums, selectedGenreIds, userClearedGenres flag)
- Produces: 
  - discoverStore.clearAllGenres() action to mark intentional clear
  - DiscoverView effect uses flag to skip auto-recovery when user cleared

**Context:**
Current bug: DiscoverView effect (line 14) runs: `if (allAlbums.length > 0 && selectedGenreIds.length === 0) initializeAlbums()`. This auto-recovers empty genre lists (corrupted state), BUT also triggers when user clicks "Clear All Genres", undoing their action.

Root cause: Can't distinguish intentional user clear from corrupted reload.

Solution: Add a `userClearedGenres` flag to store. When user clicks "Clear All", set flag. Effect skips recovery if flag is set within last 2 seconds.

- [ ] **Step 1: Update discoverStore to track user clear**

In `src/stores/discoverStore.js`, add to store state (find the create function):

Add field:
```javascript
userClearedGenres: false,
userClearTimestamp: 0,
```

Add action:
```javascript
clearAllGenresAction: (state) => ({
  ...state,
  selectedGenreIds: [],
  userClearedGenres: true,
  userClearTimestamp: Date.now(),
}),

resetUserClearFlag: (state) => ({
  ...state,
  userClearedGenres: false,
}),
```

Export these actions so components can call them:
```javascript
clearAllGenres: () => set(state => create.actions.clearAllGenresAction(state)),
resetUserClearFlag: () => set(state => create.actions.resetUserClearFlag(state)),
```

- [ ] **Step 2: Find GenreSelector component and update clear button**

Search for "Clear All" in `src/views/DiscoverView/`:
```bash
grep -r "Clear All" src/views/DiscoverView/ --include="*.jsx"
```

Expected: Found in `GenreSelector.jsx` or similar. Update the button handler:

**OLD:**
```javascript
const handleClearAll = () => {
  discoverStore.setSelectedGenreIds([]);
};
```

**NEW:**
```javascript
const handleClearAll = () => {
  discoverStore.clearAllGenres(); // Uses new action with timestamp
};
```

- [ ] **Step 3: Update DiscoverView effect**

In `src/views/DiscoverView/DiscoverView.jsx`, lines 13-17:

**OLD:**
```javascript
useEffect(() => {
  if (allAlbums.length === 0 || (allAlbums.length > 0 && selectedGenreIds.length === 0)) {
    initializeAlbums(discoverData);
  }
}, [allAlbums.length, selectedGenreIds.length, initializeAlbums]);
```

**NEW:**
```javascript
const { userClearedGenres, userClearTimestamp, resetUserClearFlag } = useDiscoverStore(
  (s) => ({ userClearedGenres: s.userClearedGenres, userClearTimestamp: s.userClearTimestamp, resetUserClearFlag: s.resetUserClearFlag })
);

useEffect(() => {
  const now = Date.now();
  const isRecentUserClear = userClearedGenres && (now - userClearTimestamp) < 2000;
  
  // Only auto-recover if user didn't just intentionally clear
  if (allAlbums.length === 0 || (allAlbums.length > 0 && selectedGenreIds.length === 0 && !isRecentUserClear)) {
    initializeAlbums(discoverData);
  }
  
  // Reset flag after 2 seconds
  if (isRecentUserClear) {
    const timer = setTimeout(() => {
      resetUserClearFlag();
    }, 2000);
    return () => clearTimeout(timer);
  }
}, [allAlbums.length, selectedGenreIds.length, initializeAlbums, userClearedGenres, userClearTimestamp, resetUserClearFlag]);
```

- [ ] **Step 4: Write test**

Create `src/stores/__tests__/discoverStore.test.js`:

```javascript
import { useDiscoverStore } from '../discoverStore';

describe('discoverStore', () => {
  beforeEach(() => {
    const state = useDiscoverStore.getState();
    useDiscoverStore.setState({
      selectedGenreIds: ['rock', 'jazz'],
      userClearedGenres: false,
      userClearTimestamp: 0,
    });
  });

  it('tracks user clear action with timestamp', () => {
    const before = Date.now();
    useDiscoverStore.getState().clearAllGenres();
    const after = Date.now();
    
    const state = useDiscoverStore.getState();
    expect(state.selectedGenreIds).toEqual([]);
    expect(state.userClearedGenres).toBe(true);
    expect(state.userClearTimestamp).toBeGreaterThanOrEqual(before);
    expect(state.userClearTimestamp).toBeLessThanOrEqual(after);
  });

  it('resets user clear flag', () => {
    useDiscoverStore.getState().clearAllGenres();
    useDiscoverStore.getState().resetUserClearFlag();
    
    const state = useDiscoverStore.getState();
    expect(state.userClearedGenres).toBe(false);
  });
});
```

Run:
```bash
npm run test -- discoverStore.test.js
```

Expected: All tests pass.

- [ ] **Step 5: Test on mobile Chrome**

1. Open Discover view
2. Select some genres (e.g., rock, jazz)
3. Click "Clear All Genres" button
4. Verify: 
   - Genres cleared immediately
   - Genres stay cleared (don't auto-recover within 2 seconds)
   - After 2 seconds, if you refresh or re-mount, corrupted-state recovery works normally
5. Simulate corrupted state: manually clear selectedGenreIds in DevTools localStorage
6. Navigate away and back to Discover — should auto-recover genres from corrupted state

- [ ] **Step 6: Run full test suite**

```bash
npm run test
```

Expected: 186+ tests still passing, no new failures.

- [ ] **Step 7: Commit**

```bash
git add src/stores/discoverStore.js src/views/DiscoverView/DiscoverView.jsx src/stores/__tests__/discoverStore.test.js
git commit -m "fix: track user-initiated genre clear with timestamp to prevent regression"
```

---

## Summary & Testing Checklist

After all 4 tasks complete:

- [ ] Run full test suite: `npm run test` (expect 190+ passing tests with new additions)
- [ ] Build production: `npm run build` (expect success)
- [ ] Test on mobile Chrome:
  - [ ] Navigate through all 6 views without crashes
  - [ ] Trigger a view error, click "Try Again", switch views — should recover cleanly
  - [ ] Toggle wishlist filter in Collection view — no React error #185
  - [ ] Add items to collection on low-storage device — quota retry works, shows friendly error if needed
  - [ ] Clear All Genres in Discover — stays cleared, doesn't auto-recover user action
  - [ ] Restart app with corrupted localStorage — auto-recovery still works for truly corrupted state
- [ ] Verify backward compatibility: old collection backups restore correctly

**All 4 critical issues resolved. Ready for production deployment.**
