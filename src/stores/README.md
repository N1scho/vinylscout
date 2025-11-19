# Zustand Stores

This directory contains global state management using Zustand.

## Example Usage

See `exampleStore.js` for a template of how to create a Zustand store.

## When to Use Stores

- **Use Zustand stores for**: Global state that multiple components need (collection, settings, filters)
- **Use local useState for**: Component-specific state (form inputs, UI toggles)

## Best Practices

1. Keep stores focused (one store per domain: collection, user, settings)
2. Use selectors to prevent unnecessary re-renders
3. Use persistence middleware for data that should survive page reloads
4. Keep actions simple and synchronous; use services for complex logic
