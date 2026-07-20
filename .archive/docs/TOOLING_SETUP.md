# VinylScout Tooling Setup Guide

## ✅ Installed Packages

### State Management
- **zustand** (5.0.8) - Lightweight state management
- Benefits: Simple API, TypeScript support, devtools, persistence

### API Management
- **@tanstack/react-query** (5.90.10) - Data fetching and caching
- Benefits: Auto caching, background refetch, retry logic, optimistic updates

### Performance
- **@tanstack/react-virtual** (3.13.12) - List virtualization for large collections
- **react-lazy-load-image-component** (1.6.3) - Progressive image loading
- **use-debounce** (10.0.6) - Debounce expensive operations

### Utilities
- **date-fns** (4.1.0) - Modern date utility library
- **clsx** (2.1.1) - Conditional className builder

### Testing
- **vitest** (4.0.10) - Fast unit test framework
- **@testing-library/react** (16.3.0) - React component testing
- **@testing-library/jest-dom** (6.9.1) - Custom jest matchers
- **@testing-library/user-event** (14.6.1) - User interaction simulation
- **jsdom** (27.2.0) - DOM implementation for testing

### Code Quality
- **prettier** (3.6.2) - Code formatter
- **eslint-config-prettier** (10.1.8) - Disable ESLint rules that conflict with Prettier
- **husky** (9.1.7) - Git hooks
- **lint-staged** (16.2.6) - Run linters on staged files

## 📝 Configuration Files Created

### `.prettierrc`
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

### `vite.config.js` (updated)
Added Vitest configuration:
```javascript
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: './src/test/setup.js',
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html']
  }
}
```

### `package.json` (updated)
New scripts:
```json
{
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage",
  "format": "prettier --write \"src/**/*.{js,jsx,ts,tsx,json,css}\"",
  "format:check": "prettier --check \"src/**/*.{js,jsx,ts,tsx,json,css}\"",
  "lint:fix": "eslint . --fix"
}
```

## 📂 New Directory Structure

```
src/
├── stores/                 # Zustand state management
│   ├── README.md          # Store documentation
│   └── exampleStore.js    # Store template
├── hooks/                  # Custom React hooks
│   ├── README.md          # Hooks documentation
│   └── useExampleQuery.js # React Query template
├── services/              # API and business logic (create as needed)
├── components/            # React components (create as needed)
│   └── ExampleComponent.test.jsx  # Test template
├── test/                  # Test setup
│   └── setup.js           # Vitest configuration
└── examples/              # Example code (for reference)
```

## 🚀 How to Use Each Tool

### 1. Zustand (State Management)

**When to use:**
- Global app state (collection, settings, filters)
- State that needs to persist (localStorage)
- Complex state logic

**How to use:**
1. Copy `src/stores/exampleStore.js`
2. Rename to your feature (e.g., `collectionStore.js`)
3. Define your state and actions
4. Use in components with selectors

**Example:**
```javascript
// stores/collectionStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCollectionStore = create(
  persist(
    (set) => ({
      vinyls: [],
      addVinyl: (vinyl) => set((state) => ({
        vinyls: [...state.vinyls, vinyl]
      })),
    }),
    { name: 'collection-storage' }
  )
);

// In component
import { useCollectionStore } from './stores/collectionStore';

function MyComponent() {
  const vinyls = useCollectionStore((state) => state.vinyls);
  const addVinyl = useCollectionStore((state) => state.addVinyl);

  return <div>{vinyls.length} vinyls</div>;
}
```

### 2. React Query (API Management)

**When to use:**
- All API calls (Discogs, price fetching, etc.)
- Data that needs caching
- Background data updates

**How to use:**
1. Create service file in `src/services/`
2. Create hook file in `src/hooks/`
3. Wrap App in QueryClientProvider
4. Use hooks in components

**Setup in main.jsx:**
```javascript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
    },
  },
});

root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
```

**Example:**
```javascript
// hooks/useDiscogs.js
import { useQuery } from '@tanstack/react-query';

export function useVinylSearch(query) {
  return useQuery({
    queryKey: ['vinyl-search', query],
    queryFn: async () => {
      const response = await fetch(`/api/search?q=${query}`);
      return response.json();
    },
    enabled: !!query, // Only run if query exists
    staleTime: 1000 * 60 * 5,
  });
}

// In component
function SearchResults({ query }) {
  const { data, isLoading, error } = useVinylSearch(query);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{data.results.map(...)}</div>;
}
```

### 3. React Virtual (List Virtualization)

**When to use:**
- Collections with 100+ items
- Scrollable lists
- Performance is critical

**Example:**
```javascript
import { useVirtualizer } from '@tanstack/react-virtual';

function VinylGrid({ vinyls }) {
  const parentRef = useRef();

  const virtualizer = useVirtualizer({
    count: vinyls.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300,
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: '100vh', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => (
          <VinylCard
            key={item.key}
            vinyl={vinyls[item.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${item.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

### 4. Lazy Load Images

**Example:**
```javascript
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

function VinylCard({ vinyl }) {
  return (
    <LazyLoadImage
      src={vinyl.cover_image}
      placeholderSrc={vinyl.thumb} // Low-res placeholder
      effect="blur"
      alt={vinyl.title}
      threshold={100}
    />
  );
}
```

### 5. Debounce

**Example:**
```javascript
import { useDebouncedCallback } from 'use-debounce';

function SearchBar() {
  const [query, setQuery] = useState('');

  const debouncedSearch = useDebouncedCallback(
    (value) => {
      performSearch(value);
    },
    500 // Wait 500ms after user stops typing
  );

  return (
    <input
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        debouncedSearch(e.target.value);
      }}
    />
  );
}
```

### 6. Testing with Vitest

**Run tests:**
```bash
npm test                 # Run all tests
npm test -- --watch      # Watch mode
npm run test:coverage    # Coverage report
npm run test:ui          # Visual UI
```

**Write tests:**
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles click', () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### 7. Code Formatting

**Format code:**
```bash
npm run format           # Format all files
npm run format:check     # Check formatting
npm run lint:fix         # Fix linting issues
```

**Manual format:**
- VS Code: Shift + Alt + F
- WebStorm: Ctrl + Alt + L

**Install VS Code extension:**
1. Install "Prettier - Code formatter"
2. Set as default formatter
3. Enable "Format on Save"

### 8. Git Hooks (Optional)

**Initialize Husky:**
```bash
npm run prepare
```

**Create pre-commit hook:**
```bash
npx husky add .husky/pre-commit "npx lint-staged"
```

This will auto-format and lint files before each commit.

## ⚠️ Important Notes

### Node Version Warning
You're currently on Node v18.19.1, but these tools require Node 20+.

**Recommended:** Upgrade to Node 20 LTS for best compatibility.

**Workaround:** Tools will still work but you'll see warnings. Ignore them for now.

### TypeScript (Optional)
If you want type safety, you can gradually migrate to TypeScript:

```bash
npm install -D typescript @types/node
```

Rename files from `.js` to `.ts` and `.jsx` to `.tsx` one at a time.

## 🎓 Learning Resources

### Zustand
- Docs: https://zustand-demo.pmnd.rs/
- Video: "Zustand Tutorial" by Web Dev Simplified

### React Query
- Docs: https://tanstack.com/query/latest
- Video: "React Query Tutorial" by Codevolution

### Vitest
- Docs: https://vitest.dev/
- Similar to Jest, easy to learn

### Testing Library
- Docs: https://testing-library.com/react
- Video: "React Testing Library Tutorial" by Academind

## 🐛 Troubleshooting

### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Tests not running
Check that `src/test/setup.js` exists and vite.config.js has test configuration.

### Prettier not formatting
Install VS Code extension and enable "Format on Save" in settings.

### ESLint conflicts with Prettier
We've installed `eslint-config-prettier` which disables conflicting rules.

## 🎯 Next Steps

1. **Try the examples** - Run the example code from templates
2. **Create your first store** - Start with `collectionStore.js`
3. **Write your first test** - Test a simple component
4. **Refactor incrementally** - Don't rewrite everything at once

## 📞 Need Help?

Check these files:
- `ARCHITECTURE.md` - Full architecture guide
- `src/stores/README.md` - Store documentation
- `src/hooks/README.md` - Hooks documentation
- `src/components/ExampleComponent.test.jsx` - Test examples

All tools are configured and ready to use! Start small and refactor incrementally.
