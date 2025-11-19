/**
 * Unified Error Handling
 *
 * Provides consistent error handling and user feedback across the app
 */

/**
 * Extract user-friendly error message from various error types
 */
export const getErrorMessage = (error) => {
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Network error. Please check your internet connection.';
  }

  // Rate limiting
  if (error.status === 429 || error.message?.includes('rate limit')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Authentication errors
  if (error.status === 401 || error.status === 403) {
    return 'Authentication failed. Please check your API token in Settings.';
  }

  // Server errors
  if (error.status >= 500) {
    return 'Server error. Please try again later.';
  }

  // API-specific errors
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Fallback to error message or generic message
  return error.message || 'An unexpected error occurred. Please try again.';
};

/**
 * Handle errors consistently
 *
 * @param {Error} error - The error object
 * @param {string} context - Where the error occurred (e.g., 'searchDiscogs')
 * @param {string} userMessage - Optional custom message for user
 * @param {Function} showToast - Toast notification function
 */
export const handleError = (error, context, userMessage, showToast) => {
  // Log for debugging
  console.error(`[${context}]`, error);

  // Get user-friendly message
  const message = userMessage || getErrorMessage(error);

  // Show toast if function provided
  if (showToast) {
    showToast(message, 'error');
  }

  // Optional: Send to error tracking service (Sentry, LogRocket, etc.)
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureException(error, {
      tags: { context },
      extra: { userMessage }
    });
  }

  return message;
};

/**
 * Retry wrapper for failed operations
 *
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} delay - Delay between retries (ms)
 */
export const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error.message);

      // Don't retry on client errors (4xx)
      if (error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }

      // Wait before retrying (with exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
};

/**
 * Timeout wrapper for long-running operations
 *
 * @param {Function} fn - Async function
 * @param {number} timeoutMs - Timeout in milliseconds
 */
export const withTimeout = async (fn, timeoutMs = 10000) => {
  return Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    )
  ]);
};
