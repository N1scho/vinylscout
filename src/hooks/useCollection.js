/**
 * useCollection Hook
 *
 * Manages collection state and operations
 * Extracted from App.jsx v2.9.0
 */

import { useState, useEffect, useMemo } from 'react';
import { sortCollection, filterCollection, calculateCollectionValue } from '../utils/collectionHelpers';
import { toggleItemFavorite, removeItemFromCollection, calculatePriceChange } from '../utils/collectionOperations';
import * as StorageService from '../services/storageService';

export const useCollection = () => {
  // Collection State
  const [collection, setCollection] = useState([]);
  const [sortBy, setSortBy] = useState('artist-asc');
  const [collectionView, setCollectionView] = useState('grid');
  const [collectionFilter, setCollectionFilter] = useState('all');
  const [collectionSearch, setCollectionSearch] = useState('');
  const [activeGenreFilter, setActiveGenreFilter] = useState(null);
  const [activeDecadeFilter, setActiveDecadeFilter] = useState(null);
  const [activeFormatFilter, setActiveFormatFilter] = useState(null);

  // Load collection on mount
  useEffect(() => {
    const savedCollection = StorageService.loadCollection();
    if (savedCollection.length > 0) {
      setCollection(savedCollection);
    }
  }, []);

  // Save collection when it changes
  useEffect(() => {
    if (collection.length > 0) {
      StorageService.saveCollection(collection);
    }
  }, [collection]);

  // Memoized filtered and sorted collection
  const filteredAndSorted = useMemo(() =>
    sortCollection(
      filterCollection(
        collection,
        collectionFilter,
        collectionSearch,
        activeGenreFilter,
        activeDecadeFilter,
        activeFormatFilter,
        [] // No wishlist context available in this legacy hook; see App.jsx for the live selector
      ),
      sortBy
    ),
    [collection, collectionFilter, collectionSearch, activeGenreFilter, activeDecadeFilter, activeFormatFilter, sortBy]
  );

  // Memoized collection value
  const collectionValue = useMemo(() =>
    calculateCollectionValue(collection),
    [collection]
  );

  // Collection operations
  const addToCollection = (newItem) => {
    setCollection(prev => [...prev, newItem]);
  };

  const removeFromCollection = (id) => {
    setCollection(prev => removeItemFromCollection(prev, id));
  };

  const toggleFavorite = (id) => {
    setCollection(prev => toggleItemFavorite(prev, id));
  };

  const updateItemInCollection = (id, updates) => {
    setCollection(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const clearFilters = () => {
    setActiveGenreFilter(null);
    setActiveDecadeFilter(null);
    setActiveFormatFilter(null);
    setCollectionSearch('');
  };

  const getPriceChange = (item) => {
    return calculatePriceChange(item);
  };

  return {
    // State
    collection,
    sortBy,
    collectionView,
    collectionFilter,
    collectionSearch,
    activeGenreFilter,
    activeDecadeFilter,
    activeFormatFilter,
    filteredAndSorted,
    collectionValue,

    // Setters
    setCollection,
    setSortBy,
    setCollectionView,
    setCollectionFilter,
    setCollectionSearch,
    setActiveGenreFilter,
    setActiveDecadeFilter,
    setActiveFormatFilter,

    // Operations
    addToCollection,
    removeFromCollection,
    toggleFavorite,
    updateItemInCollection,
    clearFilters,
    getPriceChange
  };
};
