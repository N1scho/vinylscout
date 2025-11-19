import React from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { designSystem } from '../../designsystem';

/**
 * SearchBar Component
 *
 * Search input with integrated search button
 */
export default function SearchBar({
  query,
  onChange,
  onSearch,
  isLoading = false,
  placeholder = 'Search for vinyl...',
  themes
}) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      onSearch();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: designSystem.spacing.sm,
        marginBottom: designSystem.spacing.lg
      }}
    >
      <div style={{ position: 'relative', flex: 1 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: `${designSystem.spacing.md} ${designSystem.spacing.xl}`,
            paddingLeft: designSystem.spacing.xxxxl,
            fontSize: designSystem.typography.sizes.base,
            backgroundColor: themes.surface,
            color: themes.text,
            border: `1px solid ${themes.border}`,
            borderRadius: designSystem.borderRadius.md,
            outline: 'none',
            transition: designSystem.transitions.fast,
            opacity: isLoading ? 0.6 : 1
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = themes.primary;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${themes.primary10}`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = themes.border;
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <Search
          size={20}
          style={{
            position: 'absolute',
            left: designSystem.spacing.md,
            top: '50%',
            transform: 'translateY(-50%)',
            color: themes.textSecondary,
            pointerEvents: 'none'
          }}
        />
      </div>

      <button
        onClick={onSearch}
        disabled={isLoading || !query.trim()}
        style={{
          padding: `${designSystem.spacing.md} ${designSystem.spacing.xl}`,
          minWidth: designSystem.touchTarget.min,
          backgroundColor: themes.primary,
          color: 'white',
          border: 'none',
          borderRadius: designSystem.borderRadius.md,
          cursor: isLoading || !query.trim() ? 'not-allowed' : 'pointer',
          opacity: isLoading || !query.trim() ? 0.6 : 1,
          fontSize: designSystem.typography.sizes.base,
          fontWeight: designSystem.typography.weights.medium,
          display: 'flex',
          alignItems: 'center',
          gap: designSystem.spacing.sm,
          justifyContent: 'center',
          transition: designSystem.transitions.fast
        }}
        onMouseEnter={(e) => {
          if (!isLoading && query.trim()) {
            e.currentTarget.style.backgroundColor = themes.primaryHover;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = themes.primary;
        }}
      >
        {isLoading ? (
          <>
            <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Searching...</span>
          </>
        ) : (
          'Search'
        )}
      </button>
    </div>
  );
}
