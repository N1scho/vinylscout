import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Disc3 } from 'lucide-react';
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
      height: '64px',
      backgroundColor: themes.surface,
      borderBottom: `1px solid ${themes.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: designSystem.spacing.lg,
      paddingRight: designSystem.spacing.lg,
      zIndex: 100,
      boxShadow: designSystem.shadows.sm,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: designSystem.spacing.md
      }}>
        {!logoError ? (
          <img
            src={LOGO_PATH}
            alt="VinylScout Logo"
            style={{
              height: '40px',
              width: 'auto',
              objectFit: 'contain'
            }}
            onError={() => setLogoError(true)}
          />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: designSystem.spacing.sm,
            color: themes.primary
          }}>
            <Disc3 size={28} strokeWidth={1.5} />
            <h1 style={{
              fontSize: designSystem.typography.sizes.lg,
              fontWeight: 700,
              color: themes.text,
              margin: 0,
              letterSpacing: '0.5px'
            }}>
              VinylScout
            </h1>
          </div>
        )}
      </div>
      <div style={{
        fontSize: designSystem.typography.sizes.xs,
        color: themes.textSecondary,
        fontWeight: 500,
        letterSpacing: '1px',
        textTransform: 'uppercase'
      }}>
        Collection Manager
      </div>
    </header>
  );
});

Header.propTypes = {
  themes: PropTypes.shape({
    surface: PropTypes.string.isRequired,
    border: PropTypes.string.isRequired,
    primary: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    textSecondary: PropTypes.string.isRequired
  }).isRequired
};

export default Header;
