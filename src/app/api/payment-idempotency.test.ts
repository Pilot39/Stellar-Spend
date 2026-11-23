/**
 * Payment-initiating POST routes must use the idempotency layer (#1462).
 * Guards against a new route or refactor dropping the key check.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const PAYMENT_ROUTES = [
  'src/app/api/offramp/execute-payout/route.ts',
  'src/app/api/offramp/batch/route.ts',
  'src/app/api/offramp/bridge/submit-soroban/route.ts',
  'src/app/api/merchant/payouts/route.ts',
];

describe('payment-initiating routes use idempotency (#1462)', () => {
  for (const route of PAYMENT_ROUTES) {
    it(`${route} references the idempotency layer`, () => {
      const source = fs.readFileSync(path.join(process.cwd(), route), 'utf-8');

      expect(source.toLowerCase()).toContain('idempoten');
    });
  }
});
