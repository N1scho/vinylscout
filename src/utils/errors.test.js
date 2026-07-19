import { describe, it, expect } from 'vitest';
import { AppError, NetworkError, RateLimitError, ApiError } from './errors';

describe('error classes', () => {
  it('NetworkError is an AppError with correct name', () => {
    const err = new NetworkError('offline');
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('NetworkError');
    expect(err.message).toBe('offline');
  });

  it('RateLimitError carries retryAfter and default message', () => {
    const err = new RateLimitError(30);
    expect(err.retryAfter).toBe(30);
    expect(err.message).toContain('30');
    expect(new RateLimitError().retryAfter).toBe(60);
  });

  it('ApiError carries status and details', () => {
    const err = new ApiError('Discogs request failed', 502, 'upstream down');
    expect(err.status).toBe(502);
    expect(err.details).toBe('upstream down');
    expect(err.name).toBe('ApiError');
  });
});
