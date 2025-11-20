/**
 * useSearch Hook
 *
 * Manages search state and operations
 * Extracted from App.jsx v2.9.0
 */

import { useState, useEffect } from 'react';
import * as StorageService from '../services/storageService';

export const useSearch = () => {
  // Search State - Load from localStorage for persistence
  const [searchQuery, setSearchQuery] = useState(() => {
    try {
      return localStorage.getItem('searchQuery') || '';
    } catch {
      return '';
    }
  });
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedSearch, setAdvancedSearch] = useState({
    artist: '', album: '', year: '', label: '', genre: ''
  });
  const [searchResults, setSearchResults] = useState(() => {
    try {
      const saved = localStorage.getItem('searchResults');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const saved = localStorage.getItem('searchPage');
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });
  const [totalPages, setTotalPages] = useState(() => {
    try {
      const saved = localStorage.getItem('searchTotalPages');
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });
  const [searchHistory, setSearchHistory] = useState(() => StorageService.loadSearchHistory());

  // Price State (related to search results)
  const [resultPrices, setResultPrices] = useState({});
  const [refreshingPrices, setRefreshingPrices] = useState({});
  const [priceChanges, setPriceChanges] = useState({});

  // Save search query when it changes
  useEffect(() => {
    try {
      localStorage.setItem('searchQuery', searchQuery);
    } catch (error) {
      console.error('Failed to save search query:', error);
    }
  }, [searchQuery]);

  // Save search results when they change
  useEffect(() => {
    try {
      localStorage.setItem('searchResults', JSON.stringify(searchResults));
    } catch (error) {
      console.error('Failed to save search results:', error);
    }
  }, [searchResults]);

  // Save current page when it changes
  useEffect(() => {
    try {
      localStorage.setItem('searchPage', currentPage.toString());
    } catch (error) {
      console.error('Failed to save search page:', error);
    }
  }, [currentPage]);

  // Save total pages when it changes
  useEffect(() => {
    try {
      localStorage.setItem('searchTotalPages', totalPages.toString());
    } catch (error) {
      console.error('Failed to save total pages:', error);
    }
  }, [totalPages]);

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
