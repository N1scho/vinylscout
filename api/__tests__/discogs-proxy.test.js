// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../discogs-proxy.js';

function createRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
    end() { return this; },
  };
}

describe('discogs-proxy handler', () => {
  beforeEach(() => {
    vi.stubEnv('DISCOGS_TOKEN', 'test-token');
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('rejects non-POST', async () => {
    const res = createRes();
    await handler({ method: 'GET' }, res);
    expect(res.statusCode).toBe(405);
  });

  it('rejects endpoints outside the allowlist', async () => {
    const res = createRes();
    await handler(
      { method: 'POST', body: { endpoint: '/users/evil' } },
      res
    );
    expect(res.statusCode).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns 500 with details when DISCOGS_TOKEN missing', async () => {
    vi.stubEnv('DISCOGS_TOKEN', '');
    const res = createRes();
    await handler(
      { method: 'POST', body: { endpoint: '/database/search', params: { q: 'x' } } },
      res
    );
    expect(res.statusCode).toBe(500);
    expect(res.body.details).toContain('DISCOGS_TOKEN');
  });

  it('proxies an allowed search request with token header', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ results: [{ id: 1 }] }),
    });
    const res = createRes();
    await handler(
      { method: 'POST', body: { endpoint: '/database/search', params: { q: 'nirvana' } } },
      res
    );
    expect(res.statusCode).toBe(200);
    expect(res.body.results).toHaveLength(1);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('https://api.discogs.com/database/search?q=nirvana');
    expect(opts.headers.Authorization).toBe('Discogs token=test-token');
  });

  it('passes through 429 with retryAfter', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: (h) => (h === 'Retry-After' ? '42' : null) },
      text: async () => 'rate limited',
    });
    const res = createRes();
    await handler(
      { method: 'POST', body: { endpoint: '/marketplace/stats/123' } },
      res
    );
    expect(res.statusCode).toBe(429);
    expect(res.body.retryAfter).toBe(42);
  });

  it('falls back to 60 when Retry-After header is missing', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: () => null },
      text: async () => 'rate limited',
    });
    const res = createRes();
    await handler(
      { method: 'POST', body: { endpoint: '/marketplace/stats/123' } },
      res
    );
    expect(res.statusCode).toBe(429);
    expect(res.body.retryAfter).toBe(60);
  });

  it('falls back to 60 when Retry-After header is a non-numeric date', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: (h) => (h === 'Retry-After' ? 'Wed, 21 Oct 2026 07:28:00 GMT' : null) },
      text: async () => 'rate limited',
    });
    const res = createRes();
    await handler(
      { method: 'POST', body: { endpoint: '/marketplace/stats/123' } },
      res
    );
    expect(res.statusCode).toBe(429);
    expect(res.body.retryAfter).toBe(60);
  });

  it('maps upstream errors to same status with details', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      headers: { get: () => null },
      text: async () => 'not found',
    });
    const res = createRes();
    await handler(
      { method: 'POST', body: { endpoint: '/releases/999' } },
      res
    );
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Discogs API request failed');
  });
});
