import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDiscogsSearch } from './useDiscogsSearch';
import * as DiscogsService from '../services/discogsService';

vi.mock('../services/discogsService', () => ({
  searchDiscogs: vi.fn(),
  fetchPriceInfo: vi.fn(),
  fetchVinylDetails: vi.fn(),
  waitForRateLimit: vi.fn().mockResolvedValue(undefined),
}));

describe('useDiscogsSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('performSearch calls service without token and reports success', async () => {
    DiscogsService.searchDiscogs.mockResolvedValue({
      results: [{ id: 1 }],
      pagination: { page: 1, pages: 1, items: 1 },
    });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useDiscogsSearch());

    await act(async () => {
      await result.current.performSearch({ query: 'nirvana', onSuccess });
    });

    expect(DiscogsService.searchDiscogs).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'nirvana' })
    );
    expect(DiscogsService.searchDiscogs.mock.calls[0][0]).not.toHaveProperty('token');
    expect(onSuccess).toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('performSearch reports service error message via onError', async () => {
    DiscogsService.searchDiscogs.mockRejectedValue(new Error('Rate limit erreicht. Bitte in 30 Sekunden erneut versuchen.'));
    const onError = vi.fn();
    const { result } = renderHook(() => useDiscogsSearch());

    await act(async () => {
      await result.current.performSearch({ query: 'x', onError });
    });

    expect(onError).toHaveBeenCalledWith(expect.stringContaining('Rate limit'));
  });

  it('refreshPrice updates resultPrices', async () => {
    DiscogsService.fetchPriceInfo.mockResolvedValue({ value: 20, currency: 'EUR' });
    const { result } = renderHook(() => useDiscogsSearch());

    await act(async () => {
      await result.current.refreshPrice(7);
    });

    expect(result.current.resultPrices[7].value).toBe(20);
    expect(result.current.refreshingPrices[7]).toBe(false);
  });

  it('fetchDetails returns null on service error', async () => {
    DiscogsService.fetchVinylDetails.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useDiscogsSearch());

    let details;
    await act(async () => {
      details = await result.current.fetchDetails(5);
    });
    expect(details).toBeNull();
  });
});
