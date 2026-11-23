/**
 * Application-wide named constants — single source of truth.
 *
 * All magic numbers and string literals used across more than one module
 * must be defined here (or in the domain-specific modules listed below)
 * rather than inlined at each call site.
 *
 * Domain-specific constants live in:
 *   - FEE_CONSTANTS        → @stellar-spend/shared (fee percentages, basis points)
 *   - CONFIG               → src/lib/config/index.ts (full config object with schema)
 *   - RATE_LIMIT_REGISTRY  → src/lib/rateLimiter.ts (per-route rate limit configs)
 *   - SUPPORTED_CURRENCIES → src/lib/currencies.ts
 *   - SUPPORTED_STABLECOINS→ src/lib/stablecoins.ts
 *   - CORRIDOR_CONFIG      → src/lib/corridor-config.ts
 *
 * This file re-exports the most commonly referenced values from CONFIG as
 * named constants so callers can import directly without reaching into the
 * nested CONFIG shape:
 *
 *   // Before (magic number):
 *   const ttl = 3_600_000;
 *
 *   // After (named constant):
 *   import { CACHE_CURRENCY_TTL_MS } from '@/lib/constants';
 *   const ttl = CACHE_CURRENCY_TTL_MS;
 *
 * Issue: #1542
 */

import { CONFIG } from './config';

// ── API ───────────────────────────────────────────────────────────────────────

/** Default maximum Vercel/edge function duration in seconds. */
export const API_MAX_DURATION_S = CONFIG.API.MAX_DURATION;

/** Default HTTP request timeout in milliseconds. */
export const API_TIMEOUT_MS = CONFIG.API.TIMEOUT_MS;

/** Number of retry attempts for transient failures. */
export const API_RETRY_ATTEMPTS = CONFIG.API.RETRY_ATTEMPTS;

/** Base delay between retry attempts in milliseconds. */
export const API_RETRY_DELAY_MS = CONFIG.API.RETRY_DELAY_MS;

// ── Stellar ───────────────────────────────────────────────────────────────────

/** Stellar mainnet network passphrase. */
export const STELLAR_MAINNET_PASSPHRASE = CONFIG.STELLAR.MAINNET_PASSPHRASE;

/** Minimum XLM balance required to keep an account open. */
export const STELLAR_MIN_XLM_BALANCE = CONFIG.STELLAR.MIN_XLM_BALANCE;

/** Base XLM reserve per ledger entry. */
export const STELLAR_RESERVE_AMOUNT = CONFIG.STELLAR.RESERVE_AMOUNT;

// ── Bridge polling ────────────────────────────────────────────────────────────

/** How often to poll the bridge status endpoint (ms). */
export const BRIDGE_POLLING_INTERVAL_MS = CONFIG.BRIDGE.POLLING_INTERVAL_MS;

/** Maximum number of bridge status poll attempts before giving up. */
export const BRIDGE_MAX_POLLING_ATTEMPTS = CONFIG.BRIDGE.MAX_POLLING_ATTEMPTS;

/** Overall timeout for a bridge operation (ms). */
export const BRIDGE_TIMEOUT_MS = CONFIG.BRIDGE.TIMEOUT_MS;

// ── Payout polling ────────────────────────────────────────────────────────────

/** How often to poll the payout status endpoint (ms). */
export const PAYOUT_POLLING_INTERVAL_MS = CONFIG.PAYOUT.POLLING_INTERVAL_MS;

/** Maximum number of payout status poll attempts before giving up. */
export const PAYOUT_MAX_POLLING_ATTEMPTS = CONFIG.PAYOUT.MAX_POLLING_ATTEMPTS;

/** Overall timeout for a payout operation (ms). */
export const PAYOUT_TIMEOUT_MS = CONFIG.PAYOUT.TIMEOUT_MS;

// ── Transactions ──────────────────────────────────────────────────────────────

/** Estimated time for a transaction to settle (seconds). */
export const TX_ESTIMATED_TIME_S = CONFIG.TRANSACTION.ESTIMATED_TIME_SECONDS;

/** Number of confirmation blocks required. */
export const TX_CONFIRMATION_BLOCKS = CONFIG.TRANSACTION.CONFIRMATION_BLOCKS;

// ── Rate limiting ─────────────────────────────────────────────────────────────

/** Default requests-per-minute for general API endpoints. */
export const RATE_LIMIT_RPM = CONFIG.RATE_LIMIT.REQUESTS_PER_MINUTE;

/** Default requests-per-hour for general API endpoints. */
export const RATE_LIMIT_RPH = CONFIG.RATE_LIMIT.REQUESTS_PER_HOUR;

// ── Cache TTLs ────────────────────────────────────────────────────────────────

/** Cache TTL for currency lists (1 hour in ms). */
export const CACHE_CURRENCY_TTL_MS = CONFIG.CACHE.CURRENCY_TTL_MS;

/** Cache TTL for FX rates (1 minute in ms). */
export const CACHE_RATE_TTL_MS = CONFIG.CACHE.RATE_TTL_MS;

/** Cache TTL for institution lists (24 hours in ms). */
export const CACHE_INSTITUTION_TTL_MS = CONFIG.CACHE.INSTITUTION_TTL_MS;

// ── Validation ────────────────────────────────────────────────────────────────

/** Minimum transaction amount (string, used in Zod schemas). */
export const VALIDATION_MIN_AMOUNT = CONFIG.VALIDATION.MIN_AMOUNT;

/** Maximum transaction amount (string, used in Zod schemas). */
export const VALIDATION_MAX_AMOUNT = CONFIG.VALIDATION.MAX_AMOUNT;

/** Decimal precision for amount fields. */
export const VALIDATION_AMOUNT_DECIMALS = CONFIG.VALIDATION.AMOUNT_DECIMALS;
