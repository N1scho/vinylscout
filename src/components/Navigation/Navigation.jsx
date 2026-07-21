import React from 'react';
import PropTypes from 'prop-types';
import { Search, Camera, Grid, BarChart3, Settings } from 'lucide-react';
import { designSystem } from '../../designsystem';

const Navigation = React.memo(({ view, onViewChange, themes }) => {
  const navItems = [
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'camera', icon: Camera, label: 'Camera' },
    { id: 'collection', icon: Grid, label: 'Collection' },
    { id: 'stats', icon: BarChart3, label: 'Stats' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: designSystem.spacing.xs,
      padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
      backgroundColor: themes.surface,
      borderTop: `1px solid ${themes.border}`,
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
    }}>
      {navItems.map(({ id, icon: Icon, label }) => {
        const isActive = view === id;
        return (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: `${designSystem.spacing.md} ${designSystem.spacing.lg}`,
              minWidth: designSystem.touchTarget.min,
              minHeight: designSystem.touchTarget.min,
              backgroundColor: isActive ? `rgba(212, 175, 55, 0.1)` : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: isActive ? themes.primary : themes.textSecondary,
              cursor: 'pointer',
              transition: designSystem.transitions.base,
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.target.style.backgroundColor = `rgba(212, 175, 55, 0.05)`;
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            <Icon
              size={designSystem.iconSize.md}
              strokeWidth={isActive ? 2 : 1.5}
              style={{ transition: designSystem.transitions.fast }}
            />
            <span style={{
              fontSize: designSystem.typography.sizes.xs,
              fontWeight: isActive ? 600 : 400,
              transition: designSystem.transitions.fast
            }}>
              {label}
            </span>
            {isActive && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '24px',
                height: '2px',
                backgroundColor: themes.primary,
                borderRadius: '1px'
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
});

Navigation.propTypes = {
  view: PropTypes.oneOf(['search', 'camera', 'collection', 'stats', 'settings']).isRequired,
  onViewChange: PropTypes.func.isRequired,
  themes: PropTypes.shape({
    primary: PropTypes.string.isRequired,
    textSecondary: PropTypes.string.isRequired,
    surface: PropTypes.string.isRequired,
    border: PropTypes.string.isRequired
  }).isRequired
};

export default Navigation;
