import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Demo Store - Interactive example to show Zustand working
 *
 * This store manages a simple counter and message.
 * Look for the demo panel in the bottom-right of your app!
 */

export const useDemoStore = create(
  persist(
    (set, get) => ({
      // State
      count: 0,
      message: 'Zustand is working! 🎉',
      clicks: [],
      isVisible: true,

      // Actions
      increment: () =>
        set((state) => {
          const newCount = state.count + 1;
          return {
            count: newCount,
            clicks: [
              ...state.clicks,
              {
                count: newCount,
                timestamp: new Date().toISOString(),
              },
            ].slice(-10), // Keep last 10 clicks
          };
        }),

      decrement: () =>
        set((state) => ({
          count: Math.max(0, state.count - 1),
        })),

      reset: () =>
        set({
          count: 0,
          clicks: [],
        }),

      setMessage: (message) => set({ message }),

      toggleVisibility: () =>
        set((state) => ({
          isVisible: !state.isVisible,
        })),

      // Selectors
      getTotal: () => get().count,
      getClickHistory: () => get().clicks,
    }),
    {
      name: 'demo-storage', // localStorage key
      partialize: (state) => ({
        count: state.count,
        clicks: state.clicks,
        // Don't persist isVisible
      }),
    }
  )
);
