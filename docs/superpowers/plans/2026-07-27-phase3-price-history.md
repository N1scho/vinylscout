# Phase 3: Price History Implementation Plan

> **For agentic workers:** Use subagent-driven development to implement.

**Goal:** Track album price changes over time and display price trends as charts.

**Architecture:**
- Store historical prices in localStorage (album ID → [timestamp, price, currency])
- Save price snapshot whenever price is updated
- Display price history modal with chart showing trend
- Limit to last 30 price records per album (size constraint)

**Tech Stack:** React 19, localStorage, Canvas/SVG chart library (Recharts preferred)

## Global Constraints
- No breaking changes to existing Collection UI
- Max 50MB localStorage total (price history per album ≤ 500KB)
- Keep last 30 price records per album
- Must work with backup/recovery system

---

## File Structure

```
src/
  services/
    priceHistoryService.js      # New: price history storage/retrieval
  components/
    PriceHistoryModal/
      PriceHistoryModal.jsx     # New: chart + history display
  hooks/
    usePriceHistory.js          # New: history management hook
tests/
  services/
    priceHistoryService.test.js # New: history tests
```

---

## Tasks

### Task 1: Create priceHistoryService.js

Store/retrieve price history from localStorage. Structure:
```javascript
// localStorage key: `price-history-${albumId}`
[
  { timestamp: ISO8601, price: 29.99, currency: 'USD' },
  { timestamp: ISO8601, price: 24.99, currency: 'USD' },
  ...
]
```

Functions:
- `savePriceRecord(albumId, price, currency)` - add to history (max 30 records)
- `getPriceHistory(albumId)` - retrieve all records
- `clearPriceHistory(albumId)` - remove all history

### Task 2: Create PriceHistoryModal component

Display chart with price trend. Show:
- Line chart (Recharts) with price over time
- Table of all price records
- Min/max/avg price
- "Clear history" button
- Close button

### Task 3: Integrate history saving

Modify places where prices are updated:
- `useDiscogsSearch.js` refreshPrice() - save record after update
- `CollectionView` price refresh - save record
- Call `savePriceRecord()` on every price update

### Task 4: Add history to Collection UI

Add button per album in CollectionView:
- "Price History" button (shows PriceHistoryModal)
- Only enable if history exists

### Task 5: Tests + build

- Test priceHistoryService (save, retrieve, max 30 limit)
- Test modal rendering
- Build verification
- Browser test

---

## Summary

Track price changes → Display trends → Visualize history.

Estimated: 4-5 complex tasks, 150-200 lines core logic, chart component integration.

Next phase: Collection Recovery (auto-restore on data corruption).
