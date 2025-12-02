/**
 * Header Component
 *
 * Application header with logo
 * Extracted from App.jsx v2.12.0
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Music } from 'lucide-react';
import { designSystem } from '../../designsystem';

const Header = React.memo(({ themes }) => {
  const LOGO_PATH = "/VinylScoutLogo.png";
  const [logoError, setLogoError] = useState(false);

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '56px',
      backgroundColor: themes.surface,
      borderBottom: `1px solid ${themes.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `0 ${designSystem.spacing.md}`,
      zIndex: 100,
      boxShadow: designSystem.shadows.sm
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: designSystem.spacing.sm
      }}>
        {!logoError ? (
          <img
            src={LOGO_PATH}
            alt="VinylScout Logo"
            style={{
              height: '36px',
              width: 'auto',
              objectFit: 'contain'
            }}
            onError={() => setLogoError(true)}
          />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: designSystem.spacing.xs
          }}>
            <Music size={22} color={themes.primary} />
            <h1 style={{
              fontSize: designSystem.typography.sizes.base,
              fontWeight: designSystem.typography.weights.bold,
              color: themes.text,
              margin: 0
            }}>
              VinylScout
            </h1>
          </div>
        )}
      </div>
    </header>
  );
});

Header.propTypes = {
  themes: PropTypes.shape({
    surface: PropTypes.string.isRequired,
    border: PropTypes.string.isRequired,
    primary: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired
  }).isRequired
};

export default Header;
