import { z } from 'zod';

const STELLAR_ADDRESS_REGEX = /^G[A-Z0-9]{55}$/;
const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const AMOUNT_REGEX = /^\d*\.?\d*$/;

/**
 * Zod schema for a positive decimal amount string (e.g. "10", "10.5").
 * Mirrors {@link validateAmount} semantics.
 */
export const amountSchema = z
  .string()
  .trim()
  .min(1, 'Amount is required')
  .refine((value) => AMOUNT_REGEX.test(value), 'Amount must be a valid decimal number')
  .refine((value) => value !== '.', 'Amount must be a valid decimal number')
  .refine((value) => {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num) && num > 0;
  }, 'Amount must be greater than zero');

/** Zod schema for a supported payout currency code. */
export const currencySchema = z
  .string()
  .trim()
  .min(1, 'Currency is required')
  .max(10, 'Currency is too long')
  .regex(/^[A-Za-z]{2,10}$/, 'Currency must be alphabetic');

/** Zod schema for a beneficiary name. */
export const beneficiarySchema = z
  .string()
  .trim()
  .min(1, 'Beneficiary is required')
  .max(100, 'Beneficiary is too long');

/** Zod schema for a Stellar or Base address. */
export const addressSchema = z
  .string()
  .trim()
  .refine(
    (value) => STELLAR_ADDRESS_REGEX.test(value) || EVM_ADDRESS_REGEX.test(value),
    'Invalid address',
  );

/** Zod schema for a chain discriminator. */
export const chainSchema = z.enum(['stellar', 'base']);

/** Request body schema for the offramp quote route. */
export const quoteRequestSchema = z.object({
  amount: amountSchema,
  currency: currencySchema,
  chain: chainSchema,
  address: addressSchema,
});

/** Request body schema for the offramp execute-payout route. */
export const executePayoutRequestSchema = z.object({
  quoteId: z.string().trim().min(1, 'Quote ID is required'),
  amount: amountSchema,
  currency: currencySchema,
  beneficiary: beneficiarySchema,
  address: addressSchema,
  chain: chainSchema,
});

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;
export type ExecutePayoutRequest = z.infer<typeof executePayoutRequestSchema>;

export function validateAmount(amount: string): boolean {
  if (!/^\d*\.?\d*$/.test(amount.trim()) || amount.trim() === '' || amount.trim() === '.')
    return false;
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0 && isFinite(num);
}

export function validateAddress(address: string, chain: 'stellar' | 'base'): boolean {
  if (!address) return false;
  if (chain === 'stellar') return STELLAR_ADDRESS_REGEX.test(address);
  if (chain === 'base') return EVM_ADDRESS_REGEX.test(address);
  return false;
}

export function isValidQuote(data: unknown): data is {
  destinationAmount: string;
  rate: number;
  currency: string;
  bridgeFee: string;
  payoutFee: string;
  estimatedTime: number;
} {
  if (!data || typeof data !== 'object') return false;

  const q = data as Record<string, unknown>;

  // Check all required fields exist
  if (
    typeof q.destinationAmount !== 'string' ||
    typeof q.rate !== 'number' ||
    typeof q.currency !== 'string' ||
    typeof q.bridgeFee !== 'string' ||
    typeof q.payoutFee !== 'string' ||
    typeof q.estimatedTime !== 'number'
  ) {
    return false;
  }

  // Validate numeric fields are finite and positive
  const rate = q.rate as number;
  const estimatedTime = q.estimatedTime as number;

  if (!isFinite(rate) || rate <= 0) return false;
  if (!isFinite(estimatedTime) || estimatedTime < 0) return false;

  // Validate string amounts are non-empty
  const destAmount = q.destinationAmount as string;
  const bridgeFee = q.bridgeFee as string;
  const payoutFee = q.payoutFee as string;

  if (!destAmount.trim() || !bridgeFee.trim() || !payoutFee.trim()) return false;

  // Validate amounts are valid numbers
  const destNum = parseFloat(destAmount);
  const bridgeNum = parseFloat(bridgeFee);
  const payoutNum = parseFloat(payoutFee);

  if (!isFinite(destNum) || destNum <= 0) return false;
  if (!isFinite(bridgeNum) || bridgeNum < 0) return false;
  if (!isFinite(payoutNum) || payoutNum < 0) return false;

  return true;
}
