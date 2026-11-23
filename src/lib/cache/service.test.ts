/**
 * Rate lookups are served from cache until invalidated (#1469).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const store = vi.hoisted(() => new Map<string, string>());

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('./client', () => ({
  getCacheClient: () => ({
    get: async (key: string) => store.get(key) ?? null,
    set: async (key: string, value: string) => {
      store.set(key, value);
    },
    del: async (key: string) => {
      store.delete(key);
    },
    keys: async () => [],
    flushPattern: async () => {},
    ping: async () => true,
  }),
  resetCacheClient: () => {},
  getPoolMetrics: () => ({}),
}));

import { getCachedRate, invalidateRate } from './service';

describe('getCachedRate (#1469)', () => {
  beforeEach(() => {
    store.clear();
  });

  it('calls the fetcher once and serves the cached rate on the next call', async () => {
    const fetcher = vi.fn().mockResolvedValue(1.25);

    const first = await getCachedRate('usd', fetcher);
    const second = await getCachedRate('usd', fetcher);

    expect(first).toBe(1.25);
    expect(second).toBe(1.25);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('fetches again after the rate is invalidated', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(1.25).mockResolvedValueOnce(1.3);

    await getCachedRate('usd', fetcher);
    await invalidateRate('usd');
    const refreshed = await getCachedRate('usd', fetcher);

    expect(refreshed).toBe(1.3);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
