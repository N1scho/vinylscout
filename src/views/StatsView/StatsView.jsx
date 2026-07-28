import React from 'react';
import { designSystem } from '../../designsystem';

/**
 * StatsView Component
 *
 * Statistics and analytics display for the vinyl collection
 *
 * Features:
 * - Overview statistics cards (total, favorites, value, etc.)
 * - Top genres with filtering
 * - Top decades with filtering
 * - Top formats with filtering
 * - Top artists display
 * - Top labels display
 * - Most valuable items
 * - Clickable stats for filtering
 *
 * @component
 */
export default function StatsView({
  // Stats data
  stats,

  // Actions
  onGenreClick,
  onDecadeClick,
  onFormatClick,
  formatPrice,

  // Theme
  themes
}) {
  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        padding: designSystem.spacing.md,
        paddingTop: '72px',
        paddingBottom: `calc(${designSystem.spacing.nav} + ${designSystem.spacing.md})`
      }}
    >
      {/* Header */}
      <h2
        style={{
          fontSize: designSystem.typography.sizes.xl,
          fontWeight: designSystem.typography.weights.bold,
          color: themes.text,
          marginBottom: designSystem.spacing.lg
        }}
      >
        Statistics
      </h2>

      {/* Overview Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: designSystem.spacing.md,
          marginBottom: designSystem.spacing.xl
        }}
      >
        {[
          { label: 'Total Vinyls', value: stats.total },
          { label: 'Favorites', value: stats.favorites },
          { label: 'With Price', value: stats.withPrice },
          { label: 'Added (7 days)', value: stats.recentAdditions },
          { label: 'Total Value', value: formatPrice(stats.totalValue, stats.currency) },
          { label: 'Avg Value', value: formatPrice(stats.avgValue, stats.currency) },
          {
            label: 'Most Valuable',
            value: stats.mostValuable
              ? `$${stats.mostValuable.lowestPrice.toFixed(2)}`
              : 'N/A'
          }
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: themes.surface,
              padding: designSystem.spacing.md,
              borderRadius: designSystem.borderRadius.md,
              border: `1px solid ${themes.border}`
            }}
          >
            <p
              style={{
                fontSize: designSystem.typography.sizes.xs,
                color: themes.textSecondary,
                margin: `0 0 ${designSystem.spacing.xs} 0`
              }}
            >
              {stat.label}
            </p>
            <p
              style={{
                fontSize: designSystem.typography.sizes.lg,
                fontWeight: designSystem.typography.weights.bold,
                color: themes.text,
                margin: 0
              }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Top Genres */}
      {stats.topGenres.length > 0 && (
        <div style={{ marginBottom: designSystem.spacing.xl }}>
          <h3
            style={{
              fontSize: designSystem.typography.sizes.lg,
              fontWeight: designSystem.typography.weights.semibold,
              color: themes.text,
              marginBottom: designSystem.spacing.md
            }}
          >
            Top Genres
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: designSystem.spacing.sm }}>
            {stats.topGenres.map(([genre, count]) => (
              <div
                key={genre}
                onClick={() => onGenreClick(genre)}
                style={{
                  backgroundColor: themes.surface,
                  padding: designSystem.spacing.md,
                  borderRadius: designSystem.borderRadius.md,
                  border: `1px solid ${themes.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: designSystem.transitions.fast
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = themes.hoverOverlay;
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = themes.surface;
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <span
                  style={{
                    fontSize: designSystem.typography.sizes.base,
                    color: themes.text
                  }}
                >
                  {genre}
                </span>
                <span
                  style={{
                    fontSize: designSystem.typography.sizes.sm,
                    fontWeight: designSystem.typography.weights.medium,
                    color: themes.primary
                  }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Decades */}
      {stats.topDecades.length > 0 && (
        <div style={{ marginBottom: designSystem.spacing.xl }}>
          <h3
            style={{
              fontSize: designSystem.typography.sizes.lg,
              fontWeight: designSystem.typography.weights.semibold,
              color: themes.text,
              marginBottom: designSystem.spacing.md
            }}
          >
            By Decade
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: designSystem.spacing.sm }}>
            {stats.topDecades.map(([decade, count]) => (
              <div
                key={decade}
                onClick={() => onDecadeClick(decade)}
                style={{
                  backgroundColor: themes.surface,
                  padding: designSystem.spacing.md,
                  borderRadius: designSystem.borderRadius.md,
                  border: `1px solid ${themes.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: designSystem.transitions.fast
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = themes.hoverOverlay;
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = themes.surface;
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <span
                  style={{
                    fontSize: designSystem.typography.sizes.base,
                    color: themes.text
                  }}
                >
                  {decade}
                </span>
                <span
                  style={{
                    fontSize: designSystem.typography.sizes.sm,
                    fontWeight: designSystem.typography.weights.medium,
                    color: themes.primary
                  }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Formats */}
      {stats.topFormats.length > 0 && (
        <div style={{ marginBottom: designSystem.spacing.xl }}>
          <h3
            style={{
              fontSize: designSystem.typography.sizes.lg,
              fontWeight: designSystem.typography.weights.semibold,
              color: themes.text,
              marginBottom: designSystem.spacing.md
            }}
          >
            By Format
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: designSystem.spacing.sm }}>
            {stats.topFormats.map(([format, count]) => (
              <div
                key={format}
                onClick={() => onFormatClick(format)}
                style={{
                  backgroundColor: themes.surface,
                  padding: designSystem.spacing.md,
                  borderRadius: designSystem.borderRadius.md,
                  border: `1px solid ${themes.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: designSystem.transitions.fast
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = themes.hoverOverlay;
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = themes.surface;
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <span
                  style={{
                    fontSize: designSystem.typography.sizes.base,
                    color: themes.text
                  }}
                >
                  {format}
                </span>
                <span
                  style={{
                    fontSize: designSystem.typography.sizes.sm,
                    fontWeight: designSystem.typography.weights.medium,
                    color: themes.primary
                  }}
                >
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Condition Breakdown */}
      {stats.conditionBreakdown && stats.conditionBreakdown.length > 0 && (
        <div style={{ marginBottom: designSystem.spacing.xl }}>
          <h3
            style={{
              fontSize: designSystem.typography.sizes.lg,
              fontWeight: designSystem.typography.weights.semibold,
              color: themes.text,
              marginBottom: designSystem.spacing.md
            }}
          >
            By Condition
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: designSystem.spacing.sm }}>
            {stats.conditionBreakdown.map((item) => (
              <div
                key={item.condition}
                style={{
                  backgroundColor: themes.surface,
                  padding: designSystem.spacing.md,
                  borderRadius: designSystem.borderRadius.md,
                  border: `1px solid ${themes.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <span
                    style={{
                      fontSize: designSystem.typography.sizes.base,
                      color: themes.text,
                      fontWeight: designSystem.typography.weights.medium,
                      marginRight: designSystem.spacing.md
                    }}
                  >
                    {item.condition}
                  </span>
                  <span
                    style={{
                      fontSize: designSystem.typography.sizes.sm,
                      color: themes.textSecondary
                    }}
                  >
                    {item.percentage}%
                  </span>
                </div>
                <span
                  style={{
                    fontSize: designSystem.typography.sizes.sm,
                    fontWeight: designSystem.typography.weights.medium,
                    color: themes.primary
                  }}
                >
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Artists */}
      {stats.topArtists.length > 0 && (
        <div style={{ marginBottom: designSystem.spacing.xl }}>
          <h3
            style={{
              fontSize: designSystem.typography.sizes.lg,
              fontWeight: designSystem.typography.weights.semibold,
              color: themes.text,
              marginBottom: designSystem.spacing.md
            }}
          >
            Top Artists
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: designSystem.spacing.sm }}>
            {stats.topArtists.slice(0, 5).map(([artist, count]) => (
              <div
                key={artist}
                style={{
                  backgroundColor: themes.surface,
                  padding: designSystem.spacing.md,
                  borderRadius: designSystem.borderRadius.md,
                  border: `1px solid ${themes.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span
                  style={{
                    fontSize: designSystem.typography.sizes.base,
                    color: themes.text,
                    fontWeight: designSystem.typography.weights.medium
                  }}
                >
                  {artist}
                </span>
                <span
                  style={{
                    fontSize: designSystem.typography.sizes.sm,
                    fontWeight: designSystem.typography.weights.bold,
                    color: themes.primary
                  }}
                >
                  {count} album{count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Labels */}
      {stats.topLabels.length > 0 && (
        <div style={{ marginBottom: designSystem.spacing.xl }}>
          <h3
            style={{
              fontSize: designSystem.typography.sizes.lg,
              fontWeight: designSystem.typography.weights.semibold,
              color: themes.text,
              marginBottom: designSystem.spacing.md
            }}
          >
            Top Labels
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: designSystem.spacing.sm }}>
            {stats.topLabels.slice(0, 5).map(([label, count]) => (
              <div
                key={label}
                style={{
                  backgroundColor: themes.surface,
                  padding: designSystem.spacing.md,
                  borderRadius: designSystem.borderRadius.md,
                  border: `1px solid ${themes.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span
                  style={{
                    fontSize: designSystem.typography.sizes.base,
                    color: themes.text,
                    fontWeight: designSystem.typography.weights.medium
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: designSystem.typography.sizes.sm,
                    fontWeight: designSystem.typography.weights.bold,
                    color: themes.primary
                  }}
                >
                  {count} release{count !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Most Valuable Items */}
      {stats.mostValuableItems && stats.mostValuableItems.length > 0 && (
        <div style={{ marginBottom: designSystem.spacing.xl }}>
          <h3
            style={{
              fontSize: designSystem.typography.sizes.lg,
              fontWeight: designSystem.typography.weights.semibold,
              color: themes.text,
              marginBottom: designSystem.spacing.md
            }}
          >
            Most Valuable
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: designSystem.spacing.sm }}>
            {stats.mostValuableItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: themes.surface,
                  padding: designSystem.spacing.md,
                  borderRadius: designSystem.borderRadius.md,
                  border: `1px solid ${themes.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: designSystem.typography.sizes.base,
                      color: themes.text,
                      fontWeight: designSystem.typography.weights.medium,
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {item.title}
                  </p>
                  <p
                    style={{
                      fontSize: designSystem.typography.sizes.xs,
                      color: themes.textSecondary,
                      margin: `${designSystem.spacing.xs} 0 0 0`
                    }}
                  >
                    {item.year || 'Year unknown'}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: designSystem.typography.sizes.lg,
                    fontWeight: designSystem.typography.weights.bold,
                    color: themes.success,
                    marginLeft: designSystem.spacing.md,
                    flexShrink: 0
                  }}
                >
                  ${item.lowestPrice ? item.lowestPrice.toFixed(2) : 'N/A'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
