/**
 * View Error Boundary Component
 *
 * Specialized error boundary for individual views
 * Provides graceful degradation without breaking the entire app
 */

import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { designSystem } from '../../designsystem';

class ViewErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`Error in ${this.props.viewName || 'View'}:`, error, errorInfo);

    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Optional: Send to error tracking service
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          },
          view: {
            name: this.props.viewName
          }
        }
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleNavigateHome = () => {
    if (this.props.onNavigateHome) {
      this.props.onNavigateHome();
    }
    this.handleReset();
  };

  render() {
    const { themes } = this.props;

    if (this.state.hasError) {
      // If error persists after multiple retries, show more serious message
      const isPersistentError = this.state.errorCount > 2;

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          padding: designSystem.spacing.xl,
          backgroundColor: themes?.background || '#f8f9fa',
          borderRadius: designSystem.borderRadius.lg
        }}>
          <div style={{
            maxWidth: '480px',
            textAlign: 'center'
          }}>
            {/* Icon */}
            <div style={{
              width: '72px',
              height: '72px',
              margin: '0 auto 24px',
              backgroundColor: themes?.errorLight || '#fee2e2',
              borderRadius: designSystem.borderRadius.circle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle
                size={36}
                color={themes?.error || '#ef4444'}
              />
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: designSystem.typography.sizes['2xl'],
              fontWeight: designSystem.typography.weights.bold,
              color: themes?.text || '#1a1a1a',
              marginBottom: designSystem.spacing.sm,
              fontFamily: designSystem.typography.fontFamily
            }}>
              {isPersistentError ? 'Persistent Error' : 'View Error'}
            </h2>

            {/* Description */}
            <p style={{
              fontSize: designSystem.typography.sizes.base,
              color: themes?.textSecondary || '#666',
              marginBottom: designSystem.spacing.md,
              lineHeight: 1.6
            }}>
              {isPersistentError
                ? `The ${this.props.viewName || 'view'} encountered a persistent error. Please navigate to a different view or reload the app.`
                : `Something went wrong in the ${this.props.viewName || 'view'}. Don't worry, the rest of the app is still working.`
              }
            </p>

            {/* Error message (in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={{
                marginBottom: designSystem.spacing.lg,
                padding: designSystem.spacing.md,
                backgroundColor: themes?.surfaceVariant || '#f8f9fa',
                borderRadius: designSystem.borderRadius.md,
                border: `1px solid ${themes?.border || '#e5e7eb'}`
              }}>
                <p style={{
                  fontFamily: 'monospace',
                  fontSize: designSystem.typography.sizes.sm,
                  color: themes?.error || '#ef4444',
                  margin: 0,
                  textAlign: 'left',
                  wordBreak: 'break-word'
                }}>
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: designSystem.spacing.sm,
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {!isPersistentError && (
                <button
                  onClick={this.handleReset}
                  style={{
                    padding: `${designSystem.spacing.sm} ${designSystem.spacing.lg}`,
                    backgroundColor: themes?.primary || '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: designSystem.borderRadius.md,
                    fontSize: designSystem.typography.sizes.base,
                    fontWeight: designSystem.typography.weights.medium,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: designSystem.spacing.xs,
                    transition: designSystem.transitions.fast,
                    fontFamily: designSystem.typography.fontFamily
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  <RefreshCw size={16} />
                  Try Again
                </button>
              )}

              {this.props.onNavigateHome && (
                <button
                  onClick={this.handleNavigateHome}
                  style={{
                    padding: `${designSystem.spacing.sm} ${designSystem.spacing.lg}`,
                    backgroundColor: 'transparent',
                    color: themes?.primary || '#2563eb',
                    border: `1px solid ${themes?.border || '#e5e7eb'}`,
                    borderRadius: designSystem.borderRadius.md,
                    fontSize: designSystem.typography.sizes.base,
                    fontWeight: designSystem.typography.weights.medium,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: designSystem.spacing.xs,
                    transition: designSystem.transitions.fast,
                    fontFamily: designSystem.typography.fontFamily
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = themes?.surfaceVariant || '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Home size={16} />
                  Go to Search
                </button>
              )}
            </div>

            {/* Error count indicator (development only) */}
            {process.env.NODE_ENV === 'development' && this.state.errorCount > 1 && (
              <p style={{
                marginTop: designSystem.spacing.md,
                fontSize: designSystem.typography.sizes.sm,
                color: themes?.textTertiary || '#999',
                fontStyle: 'italic'
              }}>
                Error occurred {this.state.errorCount} time(s)
              </p>
            )}

            {/* Stack trace (development only) */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details style={{
                marginTop: designSystem.spacing.lg,
                textAlign: 'left',
                backgroundColor: themes?.surfaceVariant || '#f8f9fa',
                padding: designSystem.spacing.md,
                borderRadius: designSystem.borderRadius.md,
                border: `1px solid ${themes?.border || '#e5e7eb'}`,
                fontSize: designSystem.typography.sizes.xs,
                fontFamily: 'monospace',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: designSystem.typography.weights.semibold,
                  marginBottom: designSystem.spacing.xs,
                  color: themes?.text || '#1a1a1a'
                }}>
                  Component Stack
                </summary>
                <pre style={{
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                  color: themes?.textSecondary || '#666'
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ViewErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  viewName: PropTypes.string,
  onNavigateHome: PropTypes.func,
  themes: PropTypes.shape({
    background: PropTypes.string,
    text: PropTypes.string,
    textSecondary: PropTypes.string,
    textTertiary: PropTypes.string,
    primary: PropTypes.string,
    error: PropTypes.string,
    errorLight: PropTypes.string,
    surface: PropTypes.string,
    surfaceVariant: PropTypes.string,
    border: PropTypes.string
  })
};

ViewErrorBoundary.defaultProps = {
  viewName: 'this view',
  onNavigateHome: null,
  themes: {}
};

export default ViewErrorBoundary;
