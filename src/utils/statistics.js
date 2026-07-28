/**
 * Statistics Utility Module
 *
 * Provides comprehensive statistics calculation for vinyl collections
 * Extracted from App.jsx v2.8.0
 */

/**
 * Calculate comprehensive statistics for a vinyl collection
 *
 * @param {Array} collection - The vinyl collection array
 * @param {Function} getPriceChange - Function to get price change for an item
 * @returns {Object} Statistics object with all calculated metrics
 */
export const calculateCollectionStats = (collection, getPriceChange) => {
  const total = collection.length;
  const favorites = collection.filter(v => v.isFavorite).length;
  const withPrice = collection.filter(v => v.lowestPrice !== null && v.lowestPrice !== undefined).length;
  const totalValue = collection.reduce((sum, v) => {
    const price = v.lowestPrice;
    return sum + (typeof price === 'number' ? price : 0);
  }, 0);
  const avgValue = withPrice > 0 ? totalValue / withPrice : 0;

  // Get most common currency from price history
  const currencies = collection
    .flatMap(v => v.priceHistory || [])
    .map(p => p.currency)
    .filter(Boolean);
  const currencyCount = currencies.reduce((acc, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {});
  const currency = Object.keys(currencyCount).length > 0
    ? Object.keys(currencyCount).sort((a, b) => currencyCount[b] - currencyCount[a])[0]
    : 'EUR';

  // Genre statistics
  const genreCounts = {};
  collection.forEach(v => {
    v.genres?.forEach(g => {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    });
  });
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Most valuable record
  const mostValuable = collection
    .filter(v => v.lowestPrice && v.lowestPrice > 0)
    .sort((a, b) => (b.lowestPrice || 0) - (a.lowestPrice || 0))[0] || null;

  // Recent additions (last 7 days)
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const recentAdditions = collection.filter(v =>
    v.addedAt && new Date(v.addedAt).getTime() > sevenDaysAgo
  ).length;

  // Price gainers (top 3)
  const priceGainers = collection
    .filter(v => {
      const change = getPriceChange(v);
      return change && change.isPositive;
    })
    .sort((a, b) => {
      const aChange = getPriceChange(a);
      const bChange = getPriceChange(b);
      return (bChange?.value || 0) - (aChange?.value || 0);
    })
    .slice(0, 3);

  // Price losers (top 3)
  const priceLosers = collection
    .filter(v => {
      const change = getPriceChange(v);
      return change && change.isNegative;
    })
    .sort((a, b) => {
      const aChange = getPriceChange(a);
      const bChange = getPriceChange(b);
      return (aChange?.value || 0) - (bChange?.value || 0);
    })
    .slice(0, 3);

  // Decade breakdown
  const decadeCounts = {};
  collection.forEach(v => {
    if (v.year) {
      const decade = Math.floor(v.year / 10) * 10;
      decadeCounts[`${decade}s`] = (decadeCounts[`${decade}s`] || 0) + 1;
    }
  });
  const topDecades = Object.entries(decadeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Format breakdown
  const formatCounts = {};
  collection.forEach(v => {
    const format = v.format || v.formats?.[0] || 'Unknown';
    formatCounts[format] = (formatCounts[format] || 0) + 1;
  });
  const topFormats = Object.entries(formatCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Top Artists (most albums)
  const artistCounts = {};
  collection.forEach(v => {
    const artist = v.artist || 'Unknown';
    artistCounts[artist] = (artistCounts[artist] || 0) + 1;
  });
  const topArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Top Labels
  const labelCounts = {};
  collection.forEach(v => {
    const label = v.label || 'Unknown';
    labelCounts[label] = (labelCounts[label] || 0) + 1;
  });
  const topLabels = Object.entries(labelCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Total runtime (if tracklist has durations)
  let totalRuntime = 0;
  let totalTracks = 0;
  collection.forEach(v => {
    if (v.tracklist) {
      totalTracks += v.tracklist.length;
      v.tracklist.forEach(track => {
        if (track.duration) {
          const parts = track.duration.split(':');
          if (parts.length === 2) {
            const minutes = parseInt(parts[0]) || 0;
            const seconds = parseInt(parts[1]) || 0;
            totalRuntime += (minutes * 60) + seconds;
          }
        }
      });
    }
  });
  const avgTracksPerAlbum = collection.length > 0 ? totalTracks / collection.length : 0;

  // Oldest and newest releases
  const sortedByYear = collection
    .filter(v => v.year)
    .sort((a, b) => a.year - b.year);
  const oldestRelease = sortedByYear[0] || null;
  const newestRelease = sortedByYear[sortedByYear.length - 1] || null;

  // Collection diversity score (genres per album ratio)
  const totalGenres = Object.keys(genreCounts).length;
  const diversityScore = collection.length > 0 ? totalGenres / collection.length : 0;

  // Added this month/year
  const now = new Date();
  const thisMonth = collection.filter(v => {
    if (!v.addedAt) return false;
    const added = new Date(v.addedAt);
    return added.getMonth() === now.getMonth() && added.getFullYear() === now.getFullYear();
  }).length;

  const thisYear = collection.filter(v => {
    if (!v.addedAt) return false;
    const added = new Date(v.addedAt);
    return added.getFullYear() === now.getFullYear();
  }).length;

  // Added by year breakdown
  const addedByYear = {};
  collection.forEach(v => {
    if (v.addedAt) {
      const year = new Date(v.addedAt).getFullYear();
      addedByYear[year] = (addedByYear[year] || 0) + 1;
    }
  });
  const addedByYearStats = Object.entries(addedByYear)
    .sort((a, b) => b[0] - a[0])
    .slice(0, 5)
    .map(([year, count]) => ({ year, count }));

  // Value distribution
  const priceRanges = {
    '0-10': 0,
    '10-25': 0,
    '25-50': 0,
    '50-100': 0,
    '100+': 0
  };
  collection.forEach(v => {
    const price = v.lowestPrice;
    if (typeof price === 'number') {
      if (price < 10) priceRanges['0-10']++;
      else if (price < 25) priceRanges['10-25']++;
      else if (price < 50) priceRanges['25-50']++;
      else if (price < 100) priceRanges['50-100']++;
      else priceRanges['100+']++;
    }
  });

  // Completeness score (% with price data)
  const completenessScore = collection.length > 0 ? (withPrice / collection.length) * 100 : 0;

  // Average collection age (years since release)
  const currentYear = new Date().getFullYear();
  const totalAge = collection.reduce((sum, v) => {
    if (v.year) {
      return sum + (currentYear - v.year);
    }
    return sum;
  }, 0);
  const avgAge = collection.length > 0 ? totalAge / collection.length : 0;

  // Rarest items (least collected on Discogs - placeholder, would need API data)
  // For now, show items with highest value as proxy for rarity
  const rarestItems = collection
    .filter(v => v.lowestPrice && v.lowestPrice > 100)
    .sort((a, b) => (b.lowestPrice || 0) - (a.lowestPrice || 0))
    .slice(0, 5);

  // Total value growth (comparing first vs last price in history)
  let totalValueGrowth = 0;
  let itemsWithGrowth = 0;
  collection.forEach(v => {
    if (v.priceHistory && v.priceHistory.length >= 2) {
      const firstPrice = v.priceHistory[0].price;
      const lastPrice = v.priceHistory[v.priceHistory.length - 1].price;
      const growth = lastPrice - firstPrice;
      totalValueGrowth += growth;
      itemsWithGrowth++;
    }
  });
  const avgValueGrowth = itemsWithGrowth > 0 ? totalValueGrowth / itemsWithGrowth : 0;

  // Most valuable items (for stats display)
  const mostValuableItems = collection
    .filter(v => v.lowestPrice && v.lowestPrice > 0)
    .sort((a, b) => (b.lowestPrice || 0) - (a.lowestPrice || 0))
    .slice(0, 5);

  // Condition breakdown
  const conditionCounts = {};
  collection.forEach(v => {
    const condition = v.condition || 'Not Set';
    conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
  });
  const conditionBreakdown = Object.entries(conditionCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([condition, count]) => ({
      condition,
      count,
      percentage: ((count / collection.length) * 100).toFixed(1)
    }));

  // Favorites breakdown by genre
  const favoritesByGenre = {};
  collection.forEach(v => {
    if (v.isFavorite) {
      v.genres?.forEach(g => {
        favoritesByGenre[g] = (favoritesByGenre[g] || 0) + 1;
      });
    }
  });
  const topFavoriteGenres = Object.entries(favoritesByGenre)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const favoritePercentage = collection.length > 0 ? ((favorites / collection.length) * 100).toFixed(1) : 0;

  return {
    // Core stats
    total,
    favorites,
    favoritePercentage,
    withPrice,
    totalValue,
    avgValue,
    currency,

    // Breakdowns
    topGenres,
    topDecades,
    topFormats,
    conditionBreakdown,
    topFavoriteGenres,

    // Value stats
    mostValuable,
    mostValuableItems,
    priceGainers,
    priceLosers,
    priceRanges,
    avgValueGrowth,

    // Collection insights
    recentAdditions,
    thisMonth,
    thisYear,
    addedByYearStats,
    oldestRelease,
    newestRelease,
    avgAge,

    // Artist & Label stats
    topArtists,
    topLabels,

    // Audio stats
    totalTracks,
    totalRuntime,
    avgTracksPerAlbum,

    // Quality metrics
    completenessScore,
    diversityScore,
    totalGenres,
    rarestItems
  };
};
