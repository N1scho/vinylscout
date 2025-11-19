import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Example Zustand store template
 *
 * This is a template showing best practices for creating stores.
 * Copy this file and modify for your needs (collectionStore, settingsStore, etc.)
 */

export const useExampleStore = create(
  persist(
    (set, get) => ({
      // ============================================
      // STATE
      // ============================================
      items: [],
      filter: '',
      isLoading: false,

      // ============================================
      // ACTIONS
      // ============================================

      /**
       * Add an item to the store
       */
      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item],
        })),

      /**
       * Remove an item by ID
       */
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      /**
       * Update an item
       */
      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),

      /**
       * Set filter
       */
      setFilter: (filter) => set({ filter }),

      /**
       * Set loading state
       */
      setLoading: (isLoading) => set({ isLoading }),

      /**
       * Clear all items
       */
      clear: () => set({ items: [], filter: '' }),

      // ============================================
      // SELECTORS (computed state)
      // ============================================

      /**
       * Get filtered items
       * Use this instead of filtering in components
       */
      getFilteredItems: () => {
        const { items, filter } = get();
        if (!filter) return items;
        return items.filter((item) =>
          item.name.toLowerCase().includes(filter.toLowerCase())
        );
      },

      /**
       * Get item count
       */
      getCount: () => get().items.length,
    }),
    {
      name: 'example-storage', // localStorage key
      // Only persist specific fields
      partialize: (state) => ({
        items: state.items,
        // Don't persist filter or isLoading
      }),
    }
  )
);

// ============================================
// USAGE IN COMPONENTS
// ============================================

/*
// Import the store
import { useExampleStore } from './stores/exampleStore';

function MyComponent() {
  // Subscribe to specific state (prevents unnecessary re-renders)
  const items = useExampleStore((state) => state.items);
  const addItem = useExampleStore((state) => state.addItem);
  const filter = useExampleStore((state) => state.filter);

  // Or use selector for computed values
  const filteredItems = useExampleStore((state) => state.getFilteredItems());

  // Or get multiple values
  const { items, addItem, removeItem } = useExampleStore((state) => ({
    items: state.items,
    addItem: state.addItem,
    removeItem: state.removeItem,
  }));

  return (
    <div>
      <input
        value={filter}
        onChange={(e) => useExampleStore.getState().setFilter(e.target.value)}
      />
      <button onClick={() => addItem({ id: Date.now(), name: 'New Item' })}>
        Add Item
      </button>
      <ul>
        {filteredItems.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
*/
