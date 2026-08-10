import React, { useMemo } from 'react';
import { designSystem } from '../../designsystem';
import { useSettingsStore } from '../../stores/settingsStore';

export default function SubtabBar({ currentTab, onTabChange, themes }) {
  const designTheme = useSettingsStore(s => s.designTheme);
  const glass = designSystem.glassMorphism[designTheme];

  // Build glass styles based on theme
  const getGlassStyle = useMemo(() => {
    if (designTheme === 'bold') {
      return {
        background: `rgba(${themes.background === '#fff' ? '255, 255, 255' : '30, 30, 30'}, ${glass.bgOpacity})`,
        backdropFilter: `blur(${glass.blur})`,
        borderRadius: glass.radius,
        border: `1px solid ${glass.borderColor}`,
        boxShadow: `0 8px 32px rgba(${themes.background === '#fff' ? '0, 0, 0' : '0, 183, 255'}, ${glass.glowAlpha})`
      };
    } else {
      // Subtle and Hybrid both use same blur for subtab bar
      return {
        background: `rgba(${themes.background === '#fff' ? '255, 255, 255' : '30, 30, 30'}, ${glass.bgOpacity || 0.85})`,
        backdropFilter: `blur(${glass.cardBlur || glass.blur || '12px'})`,
        borderRadius: glass.radius || '12px',
        border: `1px solid ${glass.borderColor || 'rgba(255, 255, 255, 0.2)'}`,
        boxShadow: `0 8px 32px rgba(${themes.background === '#fff' ? '0, 0, 0' : '0, 183, 255'}, 0.1)`
      };
    }
  }, [designTheme, themes.background, glass]);

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        padding: '12px 16px',
        ...getGlassStyle
      }}
    >
      {['filter', 'discover'].map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          style={{
            flex: 1,
            padding: '12px 16px',
            backgroundColor: currentTab === tab ? themes.primary : themes.border,
            color: currentTab === tab ? themes.buttonText : themes.text,
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 200ms ease',
            textTransform: 'capitalize'
          }}
          onMouseEnter={(e) => {
            if (currentTab !== tab) e.target.style.backgroundColor = themes.primaryHover || themes.primary;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = currentTab === tab ? themes.primary : themes.border;
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
