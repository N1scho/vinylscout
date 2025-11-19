/**
 * useSearch Hook
 *
 * Manages search state and operations
 * Extracted from App.jsx v2.9.0
 */

import { useState, useEffect } from 'react';
import * as StorageService from '../services/storageService';

export const useSearch = () => {
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedSearch, setAdvancedSearch] = useState({
    artist: '', album: '', year: '', label: '', genre: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchHistory, setSearchHistory] = useState(() => StorageService.loadSearchHistory());

  // Price State (related to search results)
  const [resultPrices, setResultPrices] = useState({});
  const [refreshingPrices, setRefreshingPrices] = useState({});
  const [priceChanges, setPriceChanges] = useState({});

  // Save search history when it changes
  useEffect(() => {
    StorageService.saveSearchHistory(searchHistory);
  }, [searchHistory]);

  // Add to search history
  const addToSearchHistory = (query) => {
    if (!query.trim()) return;
    setSearchHistory(prev => {
      const filtered = prev.filter(q => q !== query);
      return [query, ...filtered].slice(0, 10); // Keep last 10
    });
  };

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
  };

  // Clear search results
  const clearSearchResults = () => {
    setSearchResults([]);
    setResultPrices({});
    setCurrentPage(1);
    setTotalPages(1);
  };

  // Reset advanced search
  const resetAdvancedSearch = () => {
    setAdvancedSearch({
      artist: '', album: '', year: '', label: '', genre: ''
    });
  };

  return {
    // State
    searchQuery,
    showAdvancedSearch,
    advancedSearch,
    searchResults,
    isLoading,
    currentPage,
    totalPages,
    searchHistory,
    resultPrices,
    refreshingPrices,
    priceChanges,

    // Setters
    setSearchQuery,
    setShowAdvancedSearch,
    setAdvancedSearch,
    setSearchResults,
    setIsLoading,
    setCurrentPage,
    setTotalPages,
    setResultPrices,
    setRefreshingPrices,
    setPriceChanges,

    // Operations
    addToSearchHistory,
    clearSearchHistory,
    clearSearchResults,
    resetAdvancedSearch
  };
};
