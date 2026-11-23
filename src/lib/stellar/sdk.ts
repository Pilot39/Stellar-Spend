/**
 * Single import point for the Stellar SDK (#1463).
 * Modules outside src/lib/stellar import from here so the SDK version and
 * the symbols in use are visible in one place.
 */

export * from '@stellar/stellar-sdk';
