/**
 * Unit tests for src/lib/constants.ts
 *
 * Verifies that:
 *   1. Every exported named constant matches the value in CONFIG (no drift).
 *   2. All constants have the expected types and sane ranges.
 *   3. The module re-exports are exhaustive (no constant silently removed).
 *
 * Issue: #1542 — Centralize constants and config
 */

import { describe, it, expect } from 'vitest';
import { CONFIG } from './config';
import {
  // API
  API_MAX_DURATION_S,
  API_TIMEOUT_MS,
  API_RETRY_ATTEMPTS,
  API_RETRY_DELAY_MS,
  // Stellar
  STELLAR_MAINNET_PASSPHRASE,
  STELLAR_MIN_XLM_BALANCE,
  STELLAR_RESERVE_AMOUNT,
  // Bridge
  BRIDGE_POLLING_INTERVAL_MS,
  BRIDGE_MAX_POLLING_ATTEMPTS,
  BRIDGE_TIMEOUT_MS,
  // Payout
  PAYOUT_POLLING_INTERVAL_MS,
  PAYOUT_MAX_POLLING_ATTEMPTS,
  PAYOUT_TIMEOUT_MS,
  // Transaction
  TX_ESTIMATED_TIME_S,
  TX_CONFIRMATION_BLOCKS,
  // Rate limiting
  RATE_LIMIT_RPM,
  RATE_LIMIT_RPH,
  // Cache
  CACHE_CURRENCY_TTL_MS,
  CACHE_RATE_TTL_MS,
  CACHE_INSTITUTION_TTL_MS,
  // Validation
  VALIDATION_MIN_AMOUNT,
  VALIDATION_MAX_AMOUNT,
  VALIDATION_AMOUNT_DECIMALS,
} from './constants';

describe('constants — mirrors CONFIG values exactly', () => {
  describe('API constants', () => {
    it('API_MAX_DURATION_S matches CONFIG.API.MAX_DURATION', () => {
      expect(API_MAX_DURATION_S).toBe(CONFIG.API.MAX_DURATION);
    });
    it('API_TIMEOUT_MS matches CONFIG.API.TIMEOUT_MS', () => {
      expect(API_TIMEOUT_MS).toBe(CONFIG.API.TIMEOUT_MS);
    });
    it('API_RETRY_ATTEMPTS matches CONFIG.API.RETRY_ATTEMPTS', () => {
      expect(API_RETRY_ATTEMPTS).toBe(CONFIG.API.RETRY_ATTEMPTS);
    });
    it('API_RETRY_DELAY_MS matches CONFIG.API.RETRY_DELAY_MS', () => {
      expect(API_RETRY_DELAY_MS).toBe(CONFIG.API.RETRY_DELAY_MS);
    });
  });

  describe('Stellar constants', () => {
    it('STELLAR_MAINNET_PASSPHRASE matches CONFIG.STELLAR.MAINNET_PASSPHRASE', () => {
      expect(STELLAR_MAINNET_PASSPHRASE).toBe(CONFIG.STELLAR.MAINNET_PASSPHRASE);
    });
    it('STELLAR_MIN_XLM_BALANCE matches CONFIG.STELLAR.MIN_XLM_BALANCE', () => {
      expect(STELLAR_MIN_XLM_BALANCE).toBe(CONFIG.STELLAR.MIN_XLM_BALANCE);
    });
    it('STELLAR_RESERVE_AMOUNT matches CONFIG.STELLAR.RESERVE_AMOUNT', () => {
      expect(STELLAR_RESERVE_AMOUNT).toBe(CONFIG.STELLAR.RESERVE_AMOUNT);
    });
  });

  describe('Bridge constants', () => {
    it('BRIDGE_POLLING_INTERVAL_MS matches CONFIG.BRIDGE.POLLING_INTERVAL_MS', () => {
      expect(BRIDGE_POLLING_INTERVAL_MS).toBe(CONFIG.BRIDGE.POLLING_INTERVAL_MS);
    });
    it('BRIDGE_MAX_POLLING_ATTEMPTS matches CONFIG.BRIDGE.MAX_POLLING_ATTEMPTS', () => {
      expect(BRIDGE_MAX_POLLING_ATTEMPTS).toBe(CONFIG.BRIDGE.MAX_POLLING_ATTEMPTS);
    });
    it('BRIDGE_TIMEOUT_MS matches CONFIG.BRIDGE.TIMEOUT_MS', () => {
      expect(BRIDGE_TIMEOUT_MS).toBe(CONFIG.BRIDGE.TIMEOUT_MS);
    });
  });

  describe('Payout constants', () => {
    it('PAYOUT_POLLING_INTERVAL_MS matches CONFIG.PAYOUT.POLLING_INTERVAL_MS', () => {
      expect(PAYOUT_POLLING_INTERVAL_MS).toBe(CONFIG.PAYOUT.POLLING_INTERVAL_MS);
    });
    it('PAYOUT_MAX_POLLING_ATTEMPTS matches CONFIG.PAYOUT.MAX_POLLING_ATTEMPTS', () => {
      expect(PAYOUT_MAX_POLLING_ATTEMPTS).toBe(CONFIG.PAYOUT.MAX_POLLING_ATTEMPTS);
    });
    it('PAYOUT_TIMEOUT_MS matches CONFIG.PAYOUT.TIMEOUT_MS', () => {
      expect(PAYOUT_TIMEOUT_MS).toBe(CONFIG.PAYOUT.TIMEOUT_MS);
    });
  });

  describe('Transaction constants', () => {
    it('TX_ESTIMATED_TIME_S matches CONFIG.TRANSACTION.ESTIMATED_TIME_SECONDS', () => {
      expect(TX_ESTIMATED_TIME_S).toBe(CONFIG.TRANSACTION.ESTIMATED_TIME_SECONDS);
    });
    it('TX_CONFIRMATION_BLOCKS matches CONFIG.TRANSACTION.CONFIRMATION_BLOCKS', () => {
      expect(TX_CONFIRMATION_BLOCKS).toBe(CONFIG.TRANSACTION.CONFIRMATION_BLOCKS);
    });
  });

  describe('Rate limit constants', () => {
    it('RATE_LIMIT_RPM matches CONFIG.RATE_LIMIT.REQUESTS_PER_MINUTE', () => {
      expect(RATE_LIMIT_RPM).toBe(CONFIG.RATE_LIMIT.REQUESTS_PER_MINUTE);
    });
    it('RATE_LIMIT_RPH matches CONFIG.RATE_LIMIT.REQUESTS_PER_HOUR', () => {
      expect(RATE_LIMIT_RPH).toBe(CONFIG.RATE_LIMIT.REQUESTS_PER_HOUR);
    });
  });

  describe('Cache TTL constants', () => {
    it('CACHE_CURRENCY_TTL_MS matches CONFIG.CACHE.CURRENCY_TTL_MS', () => {
      expect(CACHE_CURRENCY_TTL_MS).toBe(CONFIG.CACHE.CURRENCY_TTL_MS);
    });
    it('CACHE_RATE_TTL_MS matches CONFIG.CACHE.RATE_TTL_MS', () => {
      expect(CACHE_RATE_TTL_MS).toBe(CONFIG.CACHE.RATE_TTL_MS);
    });
    it('CACHE_INSTITUTION_TTL_MS matches CONFIG.CACHE.INSTITUTION_TTL_MS', () => {
      expect(CACHE_INSTITUTION_TTL_MS).toBe(CONFIG.CACHE.INSTITUTION_TTL_MS);
    });
  });

  describe('Validation constants', () => {
    it('VALIDATION_MIN_AMOUNT matches CONFIG.VALIDATION.MIN_AMOUNT', () => {
      expect(VALIDATION_MIN_AMOUNT).toBe(CONFIG.VALIDATION.MIN_AMOUNT);
    });
    it('VALIDATION_MAX_AMOUNT matches CONFIG.VALIDATION.MAX_AMOUNT', () => {
      expect(VALIDATION_MAX_AMOUNT).toBe(CONFIG.VALIDATION.MAX_AMOUNT);
    });
    it('VALIDATION_AMOUNT_DECIMALS matches CONFIG.VALIDATION.AMOUNT_DECIMALS', () => {
      expect(VALIDATION_AMOUNT_DECIMALS).toBe(CONFIG.VALIDATION.AMOUNT_DECIMALS);
    });
  });
});

describe('constants — type and range sanity', () => {
  it('API_TIMEOUT_MS is a positive number', () => {
    expect(typeof API_TIMEOUT_MS).toBe('number');
    expect(API_TIMEOUT_MS).toBeGreaterThan(0);
  });

  it('API_RETRY_ATTEMPTS is a non-negative integer', () => {
    expect(Number.isInteger(API_RETRY_ATTEMPTS)).toBe(true);
    expect(API_RETRY_ATTEMPTS).toBeGreaterThanOrEqual(0);
  });

  it('STELLAR_MAINNET_PASSPHRASE is a non-empty string', () => {
    expect(typeof STELLAR_MAINNET_PASSPHRASE).toBe('string');
    expect(STELLAR_MAINNET_PASSPHRASE.length).toBeGreaterThan(0);
  });

  it('STELLAR_MIN_XLM_BALANCE is a positive number', () => {
    expect(STELLAR_MIN_XLM_BALANCE).toBeGreaterThan(0);
  });

  it('BRIDGE_POLLING_INTERVAL_MS is positive and less than BRIDGE_TIMEOUT_MS', () => {
    expect(BRIDGE_POLLING_INTERVAL_MS).toBeGreaterThan(0);
    expect(BRIDGE_POLLING_INTERVAL_MS).toBeLessThan(BRIDGE_TIMEOUT_MS);
  });

  it('PAYOUT_POLLING_INTERVAL_MS is positive and less than PAYOUT_TIMEOUT_MS', () => {
    expect(PAYOUT_POLLING_INTERVAL_MS).toBeGreaterThan(0);
    expect(PAYOUT_POLLING_INTERVAL_MS).toBeLessThan(PAYOUT_TIMEOUT_MS);
  });

  it('CACHE_RATE_TTL_MS is shorter than CACHE_CURRENCY_TTL_MS', () => {
    expect(CACHE_RATE_TTL_MS).toBeLessThan(CACHE_CURRENCY_TTL_MS);
  });

  it('CACHE_CURRENCY_TTL_MS is shorter than CACHE_INSTITUTION_TTL_MS', () => {
    expect(CACHE_CURRENCY_TTL_MS).toBeLessThan(CACHE_INSTITUTION_TTL_MS);
  });

  it('VALIDATION_MIN_AMOUNT parses to a positive number', () => {
    const min = parseFloat(VALIDATION_MIN_AMOUNT);
    expect(isNaN(min)).toBe(false);
    expect(min).toBeGreaterThan(0);
  });

  it('VALIDATION_MAX_AMOUNT is greater than VALIDATION_MIN_AMOUNT', () => {
    const min = parseFloat(VALIDATION_MIN_AMOUNT);
    const max = parseFloat(VALIDATION_MAX_AMOUNT);
    expect(max).toBeGreaterThan(min);
  });

  it('RATE_LIMIT_RPH is at least 10x RATE_LIMIT_RPM', () => {
    expect(RATE_LIMIT_RPH).toBeGreaterThanOrEqual(RATE_LIMIT_RPM * 10);
  });
});
