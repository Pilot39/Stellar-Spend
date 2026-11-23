/**
 * Bridge provider registry accepts mock adapters through the shared interface (#1464).
 */

import { describe, it, expect, vi } from 'vitest';
import { BridgeProviderRegistry } from './provider-registry';
import type { BridgeProviderAdapter } from './bridge-provider';

function mockBridge(): BridgeProviderAdapter {
  return {
    getQuote: vi.fn(),
    buildSendTx: vi.fn(),
    getTransferStatus: vi.fn(),
    getAverageTransferTime: vi.fn().mockReturnValue(0),
    getHealth: vi.fn().mockResolvedValue({ ok: true, latencyMs: 1 }),
  };
}

describe('BridgeProviderRegistry (#1464)', () => {
  it('returns the adapter registered under a name', () => {
    const registry = new BridgeProviderRegistry();
    const adapter = mockBridge();

    registry.registerBridge('mock-bridge', adapter);

    expect(registry.getBridge('mock-bridge')).toBe(adapter);
  });

  it('returns undefined for a bridge that was never registered', () => {
    const registry = new BridgeProviderRegistry();

    expect(registry.getBridge('missing')).toBeUndefined();
  });
});
