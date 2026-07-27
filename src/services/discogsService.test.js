import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { searchDiscogs, fetchPriceInfo, fetchVinylDetails } from './discogsService';
import { RateLimitError, ApiError, NetworkError } from '../utils/errors';

describe('discogsService (proxy client)', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const okResponse = (payload) => ({
    ok: true,
    status: 200,
    json: async () => payload,
  });

  it('searchDiscogs posts query to the proxy', async () => {
    global.fetch.mockResolvedValue(
      okResponse({ results: [{ id: 1 }], pagination: { page: 1, pages: 2, items: 51 } })
    );

    const result = await searchDiscogs({ query: 'nirvana', page: 1, perPage: 50 });

    expect(result.results).toHaveLength(1);
    expect(result.pagination.pages).toBe(2);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/discogs-proxy');
    const body = JSON.parse(opts.body);
    expect(body.endpoint).toBe('/database/search');
    expect(body.params.q).toBe('nirvana');
    expect(body.params.type).toBe('release');
  });

  it('searchDiscogs builds advanced params', async () => {
    global.fetch.mockResolvedValue(okResponse({ results: [], pagination: {} }));

    await searchDiscogs({
      isAdvanced: true,
      advancedSearch: { artist: 'Miles Davis', year: '1959' },
    });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.params.artist).toBe('Miles Davis');
    expect(body.params.year).toBe('1959');
    expect(body.params.q).toBeUndefined();
  });

  it('searchDiscogs rejects empty input', async () => {
    await expect(searchDiscogs({ query: '   ' })).rejects.toThrow('Suchbegriff');
    await expect(
      searchDiscogs({ isAdvanced: true, advancedSearch: {} })
    ).rejects.toThrow();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('throws RateLimitError on 429', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Rate limit exceeded', retryAfter: 0.001 }),
    });
    await expect(searchDiscogs({ query: 'x' })).rejects.toBeInstanceOf(RateLimitError);
  });

  it('throws ApiError with server details on other errors', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server configuration error', details: 'DISCOGS_TOKEN not configured on server' }),
    });
    await expect(searchDiscogs({ query: 'x' })).rejects.toBeInstanceOf(ApiError);
  });

  it('throws NetworkError when fetch itself fails', async () => {
    global.fetch.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(searchDiscogs({ query: 'x' })).rejects.toBeInstanceOf(NetworkError);
  });

  it('fetchPriceInfo returns null when no offers', async () => {
    global.fetch.mockResolvedValue(okResponse({ lowest_price: null, num_for_sale: 0 }));
    expect(await fetchPriceInfo(123)).toBeNull();
  });

  it('fetchPriceInfo maps price data', async () => {
    global.fetch.mockResolvedValue(
      okResponse({ lowest_price: { value: 25.5, currency: 'EUR' }, num_for_sale: 4 })
    );
    const price = await fetchPriceInfo(123);
    expect(price.value).toBe(25.5);
    expect(price.currency).toBe('EUR');
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.endpoint).toBe('/marketplace/stats/123');
  });

  it('fetchPriceInfo returns null on 404 instead of throwing', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Discogs API request failed', status: 404 }),
    });
    expect(await fetchPriceInfo(123)).toBeNull();
  });

  it('fetchVinylDetails requests the release endpoint', async () => {
    global.fetch.mockResolvedValue(okResponse({ id: 42, title: 'Kind of Blue' }));
    const details = await fetchVinylDetails(42);
    expect(details.title).toBe('Kind of Blue');
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.endpoint).toBe('/releases/42');
  });
});
