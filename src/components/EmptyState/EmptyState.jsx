import React from 'react';
import { Search, Music, Camera, Heart, BarChart3 } from 'lucide-react';
import { designSystem } from '../../designsystem';

/**
 * EmptyState Component
 *
 * Displays friendly empty state messages with icons and actions
 */
export default function EmptyState({
  type = 'default', // 'default' | 'search' | 'collection' | 'favorites' | 'stats'
  title,
  message,
  icon: CustomIcon,
  action,
  actionLabel,
  themes
}) {
  // Default content based on type
  const defaults = {
    search: {
      icon: Search,
      title: 'No results found',
      message: 'Try adjusting your search terms or filters'
    },
    collection: {
      icon: Music,
      title: 'Your collection is empty',
      message: 'Start building your vinyl collection by searching and adding records'
    },
    favorites: {
      icon: Heart,
      title: 'No favorites yet',
      message: 'Mark your favorite vinyls by clicking the heart icon'
    },
    stats: {
      icon: BarChart3,
      title: 'No statistics available',
      message: 'Add some vinyls to your collection to see statistics'
    },
    camera: {
      icon: Camera,
      title: 'Camera not ready',
      message: 'Allow camera access to scan vinyl covers'
    },
    default: {
      icon: Music,
      title: 'Nothing here',
      message: 'There\'s nothing to display right now'
    }
  };

  const config = defaults[type] || defaults.default;
  const Icon = CustomIcon || config.icon;
  const displayTitle = title || config.title;
  const displayMessage = message || config.message;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${designSystem.spacing.xxxxl} ${designSystem.spacing.xl}`,
        textAlign: 'center',
        minHeight: '300px'
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '100px',
          height: '100px',
          borderRadius: designSystem.borderRadius.circle,
          backgroundColor: `rgba(212, 175, 55, 0.1)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: designSystem.spacing.xxl,
          border: `1px solid rgba(212, 175, 55, 0.2)`
        }}
      >
        <Icon size={48} color={themes?.primary || '#d4af37'} strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: designSystem.typography.sizes.xl,
          fontWeight: designSystem.typography.weights.semibold,
          color: themes?.text || '#0f172a',
          margin: 0,
          marginBottom: designSystem.spacing.sm
        }}
      >
        {displayTitle}
      </h3>

      {/* Message */}
      <p
        style={{
          fontSize: designSystem.typography.sizes.base,
          color: themes?.textSecondary || '#64748b',
          margin: 0,
          marginBottom: action ? designSystem.spacing.xl : 0,
          maxWidth: '400px',
          lineHeight: 1.6
        }}
      >
        {displayMessage}
      </p>

      {/* Action Button */}
      {action && (
        <button
          onClick={action}
          style={{
            padding: `${designSystem.spacing.md} ${designSystem.spacing.xl}`,
            backgroundColor: themes?.primary || '#d4af37',
            color: '#0f0f0f',
            border: 'none',
            borderRadius: '8px',
            fontSize: designSystem.typography.sizes.base,
            fontWeight: 600,
            cursor: 'pointer',
            transition: designSystem.transitions.base,
            boxShadow: designSystem.shadows.sm
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = themes?.primaryHover || '#b8860b';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = designSystem.shadows.md;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = themes?.primary || '#d4af37';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = designSystem.shadows.sm;
          }}
        >
          {actionLabel || 'Get Started'}
        </button>
      )}
    </div>
  );
}
