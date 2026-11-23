/**
 * Readiness probe returns 503 when the DB or Stellar RPC is down (#1472).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const healthMock = vi.hoisted(() => ({
  performHealthCheck: vi.fn(),
  checkDatabaseHealth: vi.fn(),
}));
vi.mock('@/lib/health-check', () => healthMock);

import { GET } from './route';

function healthy() {
  return { status: 'healthy' as const };
}

function depsHealthy() {
  return {
    status: 'healthy' as const,
    timestamp: '',
    version: '',
    dependencies: {
      stellar: healthy(),
      base: healthy(),
      paycrest: healthy(),
      allbridge: healthy(),
    },
  };
}

describe('GET /api/health/readiness (#1472)', () => {
  beforeEach(() => {
    healthMock.performHealthCheck.mockReset().mockResolvedValue(depsHealthy());
    healthMock.checkDatabaseHealth.mockReset().mockResolvedValue(healthy());
  });

  it('returns 200 and ready when DB and Stellar are healthy', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('ready');
  });

  it('returns 503 and not_ready when the database is unhealthy', async () => {
    healthMock.checkDatabaseHealth.mockResolvedValue({ status: 'unhealthy', message: 'down' });

    const res = await GET();

    expect(res.status).toBe(503);
    expect((await res.json()).status).toBe('not_ready');
  });

  it('returns 503 when the Stellar RPC is unhealthy', async () => {
    const down = depsHealthy();
    down.dependencies.stellar = { status: 'unhealthy', message: 'HTTP 500' };
    healthMock.performHealthCheck.mockResolvedValue(down);

    const res = await GET();

    expect(res.status).toBe(503);
  });
});
