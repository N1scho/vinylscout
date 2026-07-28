/**
 * UI Store - Zustand
 *
 * Manages UI state (modals, toasts, navigation)
 * Replaces the useModals hook and navigation state
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

export const useUIStore = create(
  devtools(
    persist(
      (set) => ({
      // Navigation State
      currentView: 'search',
      viewHistory: ['search'],

      // Modal State
      selectedResult: null,
      selectedVinyl: null,
      showValueModal: false,
      valueHistory: [],
      confirmDelete: null,
      errorModal: {
        show: false,
        title: '',
        message: ''
      },

      // Toast State
      toast: {
        show: false,
        message: '',
        type: 'info'
      },

      // Navigation Actions
      setView: (view) => set((state) => ({
        currentView: view,
        viewHistory: [...state.viewHistory, view]
      })),

      goBack: () => set((state) => {
        if (state.viewHistory.length > 1) {
          const newHistory = state.viewHistory.slice(0, -1);
          return {
            viewHistory: newHistory,
            currentView: newHistory[newHistory.length - 1]
          };
        }
        return state;
      }),

      resetHistory: () => set({
        viewHistory: ['search'],
        currentView: 'search'
      }),

      // Modal Actions
      setSelectedResult: (selectedResult) => set({ selectedResult }),
      setSelectedVinyl: (selectedVinyl) => set({ selectedVinyl }),
      setShowValueModal: (showValueModal) => set({ showValueModal }),
      setValueHistory: (valueHistory) => set({ valueHistory }),
      setConfirmDelete: (confirmDelete) => set({ confirmDelete }),
      showError: (title, message) => set({
        errorModal: {
          show: true,
          title,
          message
        }
      }),
      hideError: () => set((state) => ({
        errorModal: {
          ...state.errorModal,
          show: false
        }
      })),

      openValueModal: (item) => {
        const history = item.priceHistory || [];
        set({
          showValueModal: true,
          valueHistory: history,
          selectedResult: item
        });
      },

      closeAllModals: () => set({
        selectedResult: null,
        selectedVinyl: null,
        showValueModal: false,
        valueHistory: [],
        confirmDelete: null,
        toast: { show: false, message: '', type: 'info' }
      }),

      // Toast Actions
      showToast: (message, type = 'info') => {
        set({
          toast: {
            show: true,
            message,
            type
          }
        });

        // Auto-hide after 3 seconds
        setTimeout(() => {
          set((state) => ({
            toast: {
              ...state.toast,
              show: false
            }
          }));
        }, 3000);
      },

      hideToast: () => set((state) => ({
        toast: {
          ...state.toast,
          show: false
        }
      })),
      }),
      {
        name: 'vinyl-ui-storage',
        // Only persist view state
        partialize: (state) => ({
          currentView: state.currentView,
          viewHistory: state.viewHistory
        })
      }
    ),
    { name: 'UIStore' }
  )
);
