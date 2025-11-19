/**
 * Navigation Component
 *
 * Bottom navigation bar with view switching
 * Extracted from App.jsx v2.12.0
 */

import React from 'react';
import { Search, Camera, Grid, BarChart3, Settings } from 'lucide-react';
import { designSystem } from '../../designsystem';

const Navigation = ({ view, onViewChange, themes }) => {
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
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: designSystem.spacing.md,
      backgroundColor: themes.surface,
      borderTop: `1px solid ${themes.border}`,
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 100
    }}>
      {navItems.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onViewChange(id)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: designSystem.spacing.xs,
            padding: designSystem.spacing.sm,
            minWidth: designSystem.touchTarget.min,
            minHeight: designSystem.touchTarget.min,
            backgroundColor: 'transparent',
            border: 'none',
            color: view === id ? themes.primary : themes.textSecondary,
            cursor: 'pointer',
            transition: designSystem.transitions.fast
          }}
        >
          <Icon size={designSystem.iconSize.md} />
          <span style={{ fontSize: designSystem.typography.sizes.xs }}>{label}</span>
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
