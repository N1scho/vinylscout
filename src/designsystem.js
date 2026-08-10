// VinylScout Design System v2.3
// Professional, consistent, accessible design tokens
// Combines V2.2 architecture with V2.1 theme system

export const designSystem = {
  // ============================================
  // TYPOGRAPHY - Professional sans-serif
  // ============================================
  typography: {
    sizes: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '22px',
      xxl: '28px',
      xxxl: '36px',
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: 1.6,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
  },

  // ============================================
  // SPACING - 4px base unit (including nav)
  // ============================================
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
    xxxl: '48px',
    xxxxl: '64px',
    nav: '80px', // Added for bottom navigation spacing
  },

  // ============================================
  // BORDER RADIUS - 4 semantic values
  // ============================================
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    circle: '50%',
  },

  // ============================================
  // SHADOWS - Sophisticated elevation
  // ============================================
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.2)',
    md: '0 4px 12px rgba(0, 0, 0, 0.25)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.3)',
    xl: '0 16px 40px rgba(0, 0, 0, 0.35)',
    inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  },

  // ============================================
  // GLASS MORPHISM - Frosted glass effects
  // ============================================
  glassMorphism: {
    subtle: {
      blur: '12px',
      radius: '12px',
      bgOpacity: 0.85,
      glowAlpha: 0.2,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      description: 'Refined, minimal, readable'
    },
    bold: {
      blur: '20px',
      radius: '16px',
      bgOpacity: 0.75,
      glowAlpha: 0.4,
      borderColor: 'rgba(255, 255, 255, 0.25)',
      description: 'Premium, dramatic, statement'
    },
    hybrid: {
      cardBlur: '12px',
      buttonBlur: 'none',
      radius: '12px',
      description: 'Balanced, mobile-optimized, snappy'
    }
  },

  // ============================================
  // ICON SIZES - 3 semantic sizes
  // ============================================
  iconSize: {
    sm: 16,
    md: 20,
    lg: 24,
  },

  // ============================================
  // TOUCH TARGETS - Minimum 44x44px
  // ============================================
  touchTarget: {
    min: '44px',
  },

  // ============================================
  // BREAKPOINTS - Mobile-first responsive
  // ============================================
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
  },

  // ============================================
  // TRANSITIONS - Smooth micro-interactions
  // ============================================
  transitions: {
    fast: '150ms ease',
    base: '200ms ease',
    slow: '300ms ease',
  },
};

// ============================================
// COLOR UTILITIES - Generate opacity variants
// ============================================
export const withOpacity = (hexColor, opacity) => {
  if (!hexColor) return `rgba(0, 0, 0, ${opacity})`;
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// ============================================
// THEME DEFINITIONS - Expanded color schemes
// ============================================
export const themeDefinitions = {
  classic: {
    name: 'Classic',
    primary: '#2563eb',      // Blue
    background: '#ffffff',   // White
    accent: '#10b981',       // Green
  },
  dark: {
    name: 'Dark',
    primary: '#8b5cf6',      // Purple
    background: '#1a1a1a',   // Near black
    accent: '#f59e0b',       // Amber
  },
  neon: {
    name: 'Neon',
    primary: '#ec4899',      // Pink
    background: '#0f172a',   // Dark blue
    accent: '#06b6d4',       // Cyan
  },
  forest: {
    name: 'Forest',
    primary: '#10b981',      // Green
    background: '#f0fdf4',   // Light green
    accent: '#f59e0b',       // Amber
  },
  sunset: {
    name: 'Sunset',
    primary: '#f97316',      // Orange
    background: '#fef3c7',   // Light yellow
    accent: '#ef4444',       // Red
  },
  midnight: {
    name: 'Midnight',
    primary: '#3b82f6',      // Blue
    background: '#030712',   // Almost black
    accent: '#a855f7',       // Purple
  },
  gold: {
    name: 'Gold',
    primary: '#d4af37',      // Warm gold
    background: '#ffffff',   // White
    accent: '#b8860b',       // Darker gold
  },
  deepVinyl: {
    name: 'Deep Vinyl',
    primary: '#d4af37',      // Warm gold
    background: '#0f0f0f',   // Deep warm black
    accent: '#f5deb3',       // Wheat
  },
  rosewood: {
    name: 'Rosewood',
    primary: '#d946ef',      // Magenta
    background: '#1a0f1f',   // Deep burgundy-black
    accent: '#ec4899',       // Pink
  },
  slate: {
    name: 'Slate',
    primary: '#64748b',      // Slate
    background: '#0f172a',   // Dark slate
    accent: '#94a3b8',       // Light slate
  },
  ocean: {
    name: 'Ocean',
    primary: '#0ea5e9',      // Sky blue
    background: '#001f3f',   // Navy
    accent: '#06b6d4',       // Cyan
  },
};

// ============================================
// THEME GENERATOR - Creates consistent themes from 3 base colors
// ============================================
export const createTheme = (themeName, customColors = null) => {
  // Use customColors if provided and theme is 'custom', otherwise use preset
  const baseTheme = (themeName === 'custom' && customColors)
    ? { name: 'Custom', ...customColors }
    : (themeDefinitions[themeName] || themeDefinitions.classic);

  // Determine if background is dark or light
  const bgLuminance = parseInt(baseTheme.background.slice(1, 3), 16);
  const isDark = bgLuminance < 128;

  // Auto-generate surface colors from background
  const surface = isDark
    ? lighten(baseTheme.background, 0.1)
    : darken(baseTheme.background, 0.05);
  const surfaceVariant = isDark
    ? lighten(baseTheme.background, 0.15)
    : darken(baseTheme.background, 0.08);

  // Use custom text color if provided, otherwise auto-generate
  const text = baseTheme.text || (isDark ? '#ffffff' : '#0f172a');
  const textSecondary = baseTheme.text
    ? withOpacity(baseTheme.text, 0.7)
    : (isDark ? '#b3b3b3' : '#64748b');

  return {
    // Base 3 colors
    name: baseTheme.name,
    primary: baseTheme.primary,
    background: baseTheme.background,
    accent: baseTheme.accent,

    // Generated colors
    primaryHover: darken(baseTheme.primary, 0.1),
    secondary: baseTheme.accent,
    surface: surface,
    surfaceVariant: surfaceVariant,
    text: text,
    textSecondary: textSecondary,
    textTertiary: withOpacity(text, 0.6),
    gradient: `linear-gradient(135deg, ${baseTheme.primary} 0%, ${baseTheme.accent} 100%)`,

    // Semantic colors (fixed)
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',

    // Primary variants with opacity
    primary10: withOpacity(baseTheme.primary, 0.1),
    primary20: withOpacity(baseTheme.primary, 0.2),
    primary40: withOpacity(baseTheme.primary, 0.4),

    // Border colors
    border: withOpacity(text, 0.1),
    borderLight: withOpacity(text, 0.05),

    // Hover states
    hoverOverlay: withOpacity(baseTheme.primary, 0.08),
    activeOverlay: withOpacity(baseTheme.primary, 0.12),

    // Shadows
    shadow: isDark ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
    shadowLg: isDark ? '0 10px 25px rgba(0,0,0,0.5)' : '0 10px 25px rgba(0,0,0,0.15)',
  };
};

// Helper functions for color manipulation
const lighten = (hex, amount) => {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.floor((num >> 16) + 255 * amount));
  const g = Math.min(255, Math.floor(((num >> 8) & 0x00FF) + 255 * amount));
  const b = Math.min(255, Math.floor((num & 0x0000FF) + 255 * amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

const darken = (hex, amount) => {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.floor((num >> 16) * (1 - amount)));
  const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - amount)));
  const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

// ============================================
// RESPONSIVE UTILITIES
// ============================================
export const mediaQueries = {
  sm: `@media (min-width: ${designSystem.breakpoints.sm})`,
  md: `@media (min-width: ${designSystem.breakpoints.md})`,
  lg: `@media (min-width: ${designSystem.breakpoints.lg})`,
};

// ============================================
// GRID UTILITIES - Responsive grid configs
// ============================================
export const gridConfigs = {
  collection: {
    mobile: '1fr',
    tablet: 'repeat(2, 1fr)',
    desktop: 'repeat(3, 1fr)',
  },
  search: {
    mobile: '1fr',
    tablet: '1fr',
    desktop: '1fr',
  },
};