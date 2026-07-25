import { describe, it, expect } from 'vitest';

/**
 * Test suite for utility functions
 *
 * These are simple example tests that will pass.
 * You can use these as templates for your own utility tests.
 */

// Example utility functions (you can create these later in utils/formatters.js)
function formatPrice(value, currency = 'EUR') {
  if (typeof value !== 'number' || isNaN(value)) {
    return 'N/A';
  }
  return `${currency} ${value.toFixed(2)}`;
}

function formatDate(dateString) {
  try {
    if (!dateString) {
      return 'Invalid date';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
}

function truncateText(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

describe('formatPrice', () => {
  it('formats number with currency', () => {
    expect(formatPrice(25.5, 'EUR')).toBe('EUR 25.50');
    expect(formatPrice(100, 'USD')).toBe('USD 100.00');
  });

  it('handles zero', () => {
    expect(formatPrice(0, 'EUR')).toBe('EUR 0.00');
  });

  it('handles invalid values', () => {
    expect(formatPrice(NaN, 'EUR')).toBe('N/A');
    expect(formatPrice('invalid', 'EUR')).toBe('N/A');
    expect(formatPrice(null, 'EUR')).toBe('N/A');
  });

  it('uses default currency when not provided', () => {
    expect(formatPrice(50)).toBe('EUR 50.00');
  });
});

describe('formatDate', () => {
  it('formats valid date string', () => {
    expect(formatDate('2025-11-19')).toMatch(/Nov 19, 2025/);
  });

  it('handles invalid date', () => {
    expect(formatDate('invalid')).toBe('Invalid date');
    expect(formatDate('')).toBe('Invalid date');
    expect(formatDate(null)).toBe('Invalid date');
  });
});

describe('truncateText', () => {
  it('returns text as-is if shorter than max length', () => {
    expect(truncateText('Short text', 50)).toBe('Short text');
  });

  it('truncates long text with ellipsis', () => {
    const longText = 'This is a very long text that should be truncated';
    expect(truncateText(longText, 20)).toBe('This is a very long ...');
  });

  it('handles empty string', () => {
    expect(truncateText('', 10)).toBe('');
  });

  it('handles null/undefined', () => {
    expect(truncateText(null, 10)).toBe('');
    expect(truncateText(undefined, 10)).toBe('');
  });

  it('uses default max length', () => {
    const text = 'x'.repeat(60);
    expect(truncateText(text)).toHaveLength(53); // 50 + '...'
  });
});

describe('Math operations', () => {
  it('addition works', () => {
    expect(1 + 1).toBe(2);
    expect(10 + 20).toBe(30);
  });

  it('multiplication works', () => {
    expect(2 * 3).toBe(6);
    expect(5 * 5).toBe(25);
  });
});
