# Custom Hooks

This directory contains reusable React hooks.

## React Query Hooks

For API calls, use React Query (TanStack Query) hooks. See `useExampleQuery.js` for template.

## Benefits of React Query

- Automatic caching and deduplication
- Background refetching
- Stale data handling
- Loading and error states
- Retry logic with exponential backoff
- Optimistic updates
- Pagination and infinite scroll

## Best Practices

1. One hook per API resource (useVinyl, usePrice, useSearch)
2. Use query keys that match your data structure
3. Set appropriate `staleTime` and `cacheTime`
4. Handle loading and error states in components
5. Use mutations for POST/PUT/DELETE operations
