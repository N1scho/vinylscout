import React, { useMemo } from 'react';
import { useDiscoverStore } from '../../stores/discoverStore';
import { designSystem } from '../../designsystem';

export default function GenreSelector({ themes }) {
  const { genres, selectedGenreIds, selectAllGenres, clearAllGenres, setSelectedGenres } = useDiscoverStore();

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
    <div style={{
      padding: '16px',
      borderBottom: `1px solid ${themes.border}`,
      backgroundColor: themes.surface
    }}>
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
