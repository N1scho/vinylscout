import React, { useMemo } from 'react';
import { useDiscoverStore } from '../../stores/discoverStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { designSystem } from '../../designsystem';
import RangeSlider from '../../components/RangeSlider';

export default function GenreSelector({ themes }) {
  const {
    genres,
    selectedGenreIds,
    selectAllGenres,
    clearAllGenres,
    setSelectedGenres,
    yearRange,
    priceRange,
    setYearRange,
    setPriceRange,
    shuffle
  } = useDiscoverStore();

  const designTheme = useSettingsStore(s => s.designTheme);

  const getGlassStyle = () => {
    const glass = designSystem.glassMorphism[designTheme];
    if (designTheme === 'hybrid') {
      // Hybrid: only cards get glass, keep container solid
      return {
        padding: '16px',
        borderBottom: `1px solid ${themes.border}`,
        backgroundColor: themes.surface
      };
    }
    // Subtle and Bold: apply glass to container
    const isLight = parseInt(themes.background.slice(1, 3), 16) >= 128;
    const bgRGB = isLight ? '255, 255, 255' : '30, 30, 30';
    const glowRGB = isLight ? '0, 0, 0' : '0, 183, 255';
    return {
      padding: '16px',
      background: `rgba(${bgRGB}, ${glass.bgOpacity})`,
      backdropFilter: `blur(${glass.blur})`,
      borderRadius: glass.radius,
      border: `1px solid ${glass.borderColor}`,
      boxShadow: `0 8px 32px rgba(${glowRGB}, ${glass.glowAlpha})`
    };
  };

  const handleGenreToggle = (genreId) => {
    const newSelected = new Set(selectedGenreIds);
    if (newSelected.has(genreId)) {
      newSelected.delete(genreId);
    } else {
      newSelected.add(genreId);
    }
    setSelectedGenres(Array.from(newSelected));
  };

  const selectAllCount = useMemo(() => selectedGenreIds.length === genres.length, [selectedGenreIds.length, genres.length]);

  return (
    <div style={getGlassStyle()}>
      {/* Control Buttons */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px'
      }}>
        <button
          onClick={selectAllGenres}
          style={{
            flex: 1,
            padding: '10px 12px',
            backgroundColor: selectAllCount ? themes.primary : themes.border,
            color: selectAllCount ? themes.buttonText : themes.text,
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 200ms ease'
          }}
          onMouseEnter={(e) => {
            if (!selectAllCount) e.target.style.backgroundColor = themes.primaryHover || themes.primary;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = selectAllCount ? themes.primary : themes.border;
          }}
        >
          Select All ({genres.length})
        </button>
        <button
          onClick={clearAllGenres}
          style={{
            flex: 1,
            padding: '10px 12px',
            backgroundColor: selectedGenreIds.length === 0 ? themes.primary : themes.border,
            color: selectedGenreIds.length === 0 ? themes.buttonText : themes.text,
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 200ms ease'
          }}
          onMouseEnter={(e) => {
            if (selectedGenreIds.length > 0) e.target.style.backgroundColor = themes.primaryHover || themes.primary;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = selectedGenreIds.length === 0 ? themes.primary : themes.border;
          }}
        >
          Clear All
        </button>
        <button
          onClick={shuffle}
          style={{
            flex: 1,
            padding: '10px 12px',
            backgroundColor: themes.primary,
            color: themes.buttonText,
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 200ms ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = themes.primaryHover || themes.primary;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = themes.primary;
          }}
        >
          Re-shuffle
        </button>
      </div>

      {/* Sliders Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <RangeSlider
          min={1960}
          max={2025}
          value={yearRange}
          onChange={setYearRange}
          label="Release Year"
          step={1}
          themes={themes}
        />
        <RangeSlider
          min={0}
          max={500}
          value={priceRange}
          onChange={setPriceRange}
          label="Price ($)"
          step={10}
          themes={themes}
        />
      </div>

      {/* Genre List */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '10px',
        maxHeight: '300px',
        overflowY: 'auto'
      }}>
        {genres.map((genre) => (
          <label
            key={genre.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              cursor: 'pointer',
              borderRadius: '4px',
              backgroundColor: selectedGenreIds.includes(genre.id) ? `${themes.primary}15` : 'transparent',
              userSelect: 'none',
              fontSize: '13px'
            }}
          >
            <input
              type="checkbox"
              checked={selectedGenreIds.includes(genre.id)}
              onChange={() => handleGenreToggle(genre.id)}
              style={{
                cursor: 'pointer',
                width: '16px',
                height: '16px'
              }}
            />
            <span>{genre.name}</span>
            <span style={{ fontSize: '12px', color: themes.textSecondary }}>
              ({genre.albumCount})
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
