import { describe, it, expect, vi } from 'vitest';
import { ClientError, withRetry } from './base';

const options = { maxRetries: 2, delayMs: 0, backoffMultiplier: 1 };

describe('withRetry', () => {
  it('does not retry a 4xx response other than 408 or 429 (#1465)', async () => {
    const fn = vi.fn().mockRejectedValue(new ClientError('bad request', 400));
    await expect(withRetry(fn, options)).rejects.toThrow('bad request');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries a 429 response', async () => {
    const fn = vi.fn().mockRejectedValue(new ClientError('slow down', 429));
    await expect(withRetry(fn, options)).rejects.toThrow('slow down');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('retries a 5xx response', async () => {
    const fn = vi.fn().mockRejectedValueOnce(new ClientError('oops', 503)).mockResolvedValue('ok');
    await expect(withRetry(fn, options)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
