import { NextResponse } from 'next/server';
import { ErrorHandler } from '@/lib/errors';

export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'operational' | 'degraded' | 'down';
  components: {
    name: string;
    status: 'operational' | 'degraded' | 'down';
    responseTime?: number;
    lastCheck: number;
  }[];
  corridors: {
    corridor: string;
    provider: string;
    status: 'operational' | 'degraded' | 'down';
    lastTransaction: number;
  }[];
  uptime: {
    day: number;
    week: number;
    month: number;
  };
  timestamp: number;
}

const CORRIDORS = [
  { corridor: 'USDC → NGN', provider: 'Paycrest' },
  { corridor: 'USDC → KES', provider: 'Paycrest' },
  { corridor: 'USDC → GHS', provider: 'Paycrest' },
  { corridor: 'USDC → ZAR', provider: 'Paycrest' },
];

export async function GET() {
  try {
    const now = Date.now();

    // In production, this would check actual services. Until real probes are
    // wired up, report deterministic statuses instead of random mock values.
    const health: HealthStatus = {
      status: 'operational',
      components: [
        { name: 'API', status: 'operational', lastCheck: now },
        { name: 'Database', status: 'operational', lastCheck: now },
        { name: 'Stellar Network', status: 'operational', lastCheck: now },
        { name: 'Payment Providers', status: 'operational', lastCheck: now },
      ],
      corridors: CORRIDORS.map(({ corridor, provider }) => ({
        corridor,
        provider,
        status: 'operational',
        lastTransaction: now,
      })),
      uptime: {
        day: 99.98,
        week: 99.95,
        month: 99.87,
      },
      timestamp: now,
    };

    return NextResponse.json(health);
  } catch (error) {
    return ErrorHandler.serverError(error);
  }
}
