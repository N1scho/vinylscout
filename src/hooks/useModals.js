/**
 * useModals Hook
 *
 * Manages modal state and operations
 * Extracted from App.jsx v2.9.0
 */

import { useState, useEffect } from 'react';
import { getItemPriceHistory } from '../utils/collectionOperations';

export const useModals = () => {
  // Modal State
  const [selectedVinyl, setSelectedVinyl] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const [showValueModal, setShowValueModal] = useState(false);
  const [valueHistory, setValueHistory] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedResult || selectedVinyl || showValueModal || confirmDelete) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = 'auto'; };
    }
  }, [selectedResult, selectedVinyl, showValueModal, confirmDelete]);

  // Focus first button when modal opens
  useEffect(() => {
    if (selectedResult || selectedVinyl) {
      const firstButton = document.querySelector('[data-modal-button]');
      if (firstButton) {
        firstButton.focus();
      }
    }
  }, [selectedResult, selectedVinyl]);

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (confirmDelete) {
          setConfirmDelete(null);
        } else if (showValueModal) {
          setShowValueModal(false);
          setValueHistory([]);
        } else if (selectedResult) {
          setSelectedResult(null);
        } else if (selectedVinyl) {
          setSelectedVinyl(null);
        }
      }
    };

    if (selectedResult || selectedVinyl || showValueModal || confirmDelete) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [selectedResult, selectedVinyl, showValueModal, confirmDelete]);

  // Auto-hide toast after 5 seconds with proper cleanup
  useEffect(() => {
    if (!toast) return;

    const timerId = setTimeout(() => {
      setToast(null);
    }, 5000);

    // Cleanup: cancel timer if component unmounts or toast changes
    return () => clearTimeout(timerId);
  }, [toast]);

  // Show toast notification
  const showToast = (message, type = 'error') => {
    setToast({ message, type });
  };

  // Open value modal with price history
  const openValueModal = (item) => {
    setSelectedResult(item);
    setShowValueModal(true);
    const history = getItemPriceHistory(item);
    setValueHistory(history);
  };

  // Close all modals
  const closeAllModals = () => {
    setSelectedVinyl(null);
    setSelectedResult(null);
    setShowValueModal(false);
    setValueHistory([]);
    setConfirmDelete(null);
  };

  return {
    // State
    selectedVinyl,
    selectedResult,
    showValueModal,
    valueHistory,
    confirmDelete,
    toast,

    // Setters
    setSelectedVinyl,
    setSelectedResult,
    setShowValueModal,
    setValueHistory,
    setConfirmDelete,

    // Operations
    showToast,
    openValueModal,
    closeAllModals
  };
};
