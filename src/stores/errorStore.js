import { create } from 'zustand';

export const useErrorStore = create((set, get) => ({
  errors: [],

  addError: (error) => {
    const timestamp = new Date().toISOString();
    const errorEntry = {
      id: `${timestamp}-${Math.random()}`,
      timestamp,
      message: error.message || String(error),
      endpoint: error.endpoint || null,
      status: error.status || null,
      details: error.details || null,
    };

    set((state) => ({
      errors: [errorEntry, ...state.errors].slice(0, 50), // Keep last 50
    }));
  },

  clearErrors: () => set({ errors: [] }),

  removeError: (id) =>
    set((state) => ({
      errors: state.errors.filter((e) => e.id !== id),
    })),
}));
