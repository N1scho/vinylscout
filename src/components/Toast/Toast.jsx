/**
 * Toast Component
 *
 * Toast notification for user feedback
 * Extracted from App.jsx v2.10.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import { designSystem } from '../../designsystem';

const Toast = React.memo(({
  toast,
  onClose,
  themes
}) => {
  if (!toast) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '20px',
      zIndex: 9999,
      backgroundColor: toast.type === 'error' ? themes.error : themes.success,
      color: '#FFFFFF',
      padding: '16px 24px',
      borderRadius: designSystem.borderRadius.md,
      boxShadow: designSystem.shadows.lg,
      display: 'flex',
      alignItems: 'center',
      gap: designSystem.spacing.sm,
      maxWidth: '400px',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <span style={{ flex: 1, fontSize: designSystem.typography.sizes.sm }}>{toast.message}</span>
      <X
        size={18}
        onClick={onClose}
        style={{ cursor: 'pointer', flexShrink: 0 }}
      />
    </div>
  );
});

Toast.propTypes = {
  toast: PropTypes.shape({
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['error', 'success', 'info']).isRequired
  }),
  onClose: PropTypes.func.isRequired,
  themes: PropTypes.shape({
    error: PropTypes.string.isRequired,
    success: PropTypes.string.isRequired
  }).isRequired
};

export default Toast;
