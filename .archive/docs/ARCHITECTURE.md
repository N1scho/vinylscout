# VinylScout Architecture Guide

## 📁 Project Structure

```
vinylscout/
├── src/
│   ├── components/          # React components
│   │   ├── common/         # Reusable UI components
│   │   ├── Search/         # Search feature components
│   │   ├── Collection/     # Collection feature components
│   │   ├── Stats/          # Statistics feature components
│   │   └── Modals/         # Modal dialogs
│   ├── hooks/              # Custom React hooks
│   │   └── useExampleQuery.js  # React Query template
│   ├── stores/             # Zustand state management
│   │   └── exampleStore.js     # Store template
│   ├── services/           # API and business logic
│   │   ├── discogsApi.js
│   │   ├── priceService.js
│   │   └── storageService.js
│   ├── utils/              # Helper functions
│   │   ├── formatters.js
│   │   └── validators.js
│   ├── test/               # Test utilities
│   │   └── setup.js
│   ├── designsystem.js     # Design tokens
│   ├── App.jsx             # Main app component
│   └── main.jsx            # App entry point
├── api/                    # Vercel serverless functions
│   └── analyze.js
└── public/                 # Static assets
```

## 🏗️ Architecture Patterns

### State Management (Zustand)

**When to use:**
- Global state shared across multiple components
- Data that should persist across page reloads
- Complex state logic that's hard to manage with useState

**Example:** Collection data, user settings, filters

**Location:** `src/stores/`

**Template:** `src/stores/exampleStore.js`

### API Layer (React Query)

**When to use:**
- All HTTP requests (GET, POST, PUT, DELETE)
- Data that comes from external APIs
- Data that needs caching, refetching, or background updates

**Example:** Fetching vinyl info from Discogs, price data

**Location:** `src/hooks/` (hooks) + `src/services/` (API functions)

**Template:** `src/hooks/useExampleQuery.js`

### Services Layer

**Purpose:** Separate business logic from components

**Contains:**
- API request functions
- Data transformation logic
- Complex calculations
- Integration with external services

**Example:**
```javascript
// src/services/discogsApi.js
export const discogsApi = {
  searchVinyl: async (query, token) => {
    const response = await fetch(
      `https://api.discogs.com/database/search?q=${query}`,
      {
        headers: {
          'Authorization': `Discogs token=${token}`,
          'User-Agent': 'VinylScout/2.5'
        }
      }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  fetchPrice: async (releaseId, token) => {
    // Implementation
  }
};
```

## 🔄 Data Flow

```
User Interaction
    ↓
Component
    ↓
Custom Hook (React Query) → Service Layer → External API
    ↓                            ↓
Zustand Store ← ← ← ← ← ← ← API Response
    ↓
Component Re-render
```

## 🎨 Component Patterns

### 1. Container/Presenter Pattern

**Container (Smart Component):**
- Handles data fetching
- Manages state
- Contains business logic

**Presenter (Dumb Component):**
- Receives props
- Renders UI
- Handles user interactions via callbacks

### 2. Custom Hooks for Logic

Extract complex logic into custom hooks:

```javascript
// hooks/useVinylCollection.js
export function useVinylCollection() {
  const collection = useCollectionStore((state) => state.collection);
  const { data: prices } = usePrices(collection.map((v) => v.id));

  const sortedCollection = useMemo(() => {
    return sortByPrice(collection, prices);
  }, [collection, prices]);

  return { collection: sortedCollection };
}
```

### 3. Composition over Props Drilling

Use context or stores instead of passing props through many levels.

## 🧪 Testing Strategy

### Test Pyramid

```
        E2E Tests (Few)
       /              \
  Integration Tests (Some)
 /                         \
Unit Tests (Many - 80% coverage goal)
```

### What to Test

**Components:**
- Renders correctly with props
- Handles user interactions
- Shows loading/error states
- Calls callbacks correctly

**Hooks:**
- Returns correct data
- Updates state correctly
- Handles edge cases

**Services:**
- API calls succeed
- Error handling
- Data transformation

**Stores:**
- Actions update state correctly
- Selectors return computed values
- Persistence works

### What NOT to Test

- Implementation details
- Third-party libraries
- CSS styles (unless critical)
- Console logs

## 🚀 Performance Optimization

### 1. Code Splitting

Split large features into separate chunks:

```javascript
const Stats = lazy(() => import('./components/Stats/StatsView'));

<Suspense fallback={<Loading />}>
  <Stats />
</Suspense>
```

### 2. Virtualization

For large lists (>100 items), use virtualization:

```javascript
import { useVirtualizer } from '@tanstack/react-virtual';

function VinylList({ vinyls }) {
  const parentRef = useRef();

  const virtualizer = useVirtualizer({
    count: vinyls.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300,
  });

  return (
    <div ref={parentRef} style={{ height: '100vh', overflow: 'auto' }}>
      {virtualizer.getVirtualItems().map((virtualItem) => (
        <VinylCard key={virtualItem.key} vinyl={vinyls[virtualItem.index]} />
      ))}
    </div>
  );
}
```

### 3. Memoization

Prevent unnecessary re-renders:

```javascript
// Expensive calculation
const stats = useMemo(() => calculateStats(collection), [collection]);

// Callback stability
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// Component memoization
const VinylCard = memo(({ vinyl }) => {
  return <div>{vinyl.title}</div>;
});
```

### 4. Debouncing

Delay expensive operations:

```javascript
import { useDebouncedCallback } from 'use-debounce';

const debouncedSearch = useDebouncedCallback(
  (query) => performSearch(query),
  500
);
```

## 🔐 Security Best Practices

### 1. API Keys

**❌ Bad:**
```javascript
localStorage.setItem('apiKey', key); // Exposed to client
```

**✅ Good:**
```javascript
// Store in environment variables
// Access via backend proxy
const response = await fetch('/api/proxy/discogs');
```

### 2. Input Validation

Always validate and sanitize user input:

```javascript
import DOMPurify from 'dompurify';

const cleanHtml = DOMPurify.sanitize(userInput);
```

### 3. CORS

Whitelist specific origins:

```javascript
const allowedOrigins = ['https://vinylscout.vercel.app'];
if (allowedOrigins.includes(req.headers.origin)) {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
}
```

## 📊 Monitoring

### Error Tracking

```javascript
try {
  await riskyOperation();
} catch (error) {
  // Log to error tracking service
  console.error('Operation failed:', error);

  // Show user-friendly message
  showToast('Something went wrong', 'error');
}
```

### Performance Monitoring

```javascript
// Measure component render time
const start = performance.now();
// ... render logic
const duration = performance.now() - start;
if (duration > 16) {
  console.warn(`Slow render: ${duration}ms`);
}
```

## 🚧 Migration Path

### Phase 1: Foundation (Current - Complete)
- ✅ Install tooling (Zustand, React Query, Vitest)
- ✅ Set up configuration
- ✅ Create example templates

### Phase 2: Extract State (Next)
1. Create `collectionStore.js` - Move collection state from App.jsx
2. Create `settingsStore.js` - Move settings state
3. Update App.jsx to use stores

### Phase 3: Extract API Logic
1. Create `discogsApi.js` service
2. Create `useDiscogs.js` React Query hooks
3. Replace fetch calls with hooks

### Phase 4: Component Breakdown
1. Extract Search components
2. Extract Collection components
3. Extract Stats components
4. Extract Modals

### Phase 5: Add Tests
1. Write tests for stores
2. Write tests for hooks
3. Write tests for components
4. Aim for 80% coverage

## 📚 Resources

- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)

## 🤝 Contributing

### Before Starting
1. Pull latest changes
2. Create feature branch
3. Run tests: `npm test`

### Development Workflow
1. Write failing test
2. Implement feature
3. Make test pass
4. Refactor if needed
5. Format code: `npm run format`
6. Lint code: `npm run lint:fix`
7. Commit with clear message

### Code Review Checklist
- [ ] Tests pass
- [ ] No console errors
- [ ] Code is formatted
- [ ] No type errors (if using TypeScript)
- [ ] Performance impact considered
- [ ] Security implications reviewed
- [ ] Documentation updated
