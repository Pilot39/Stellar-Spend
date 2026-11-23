import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withIdempotency } from '@/lib/idempotency';
import { validateBody } from '@/lib/validation/validate-request';
import { apiError } from '@/lib/api-error';
import { executePayout } from '@/lib/services/payout-service';

export const executePayoutSchema = z.object({
  userAddress: z.string().min(1),
  amount: z.string().min(1),
  currency: z.string().min(1),
  beneficiary: z
    .object({
      institution: z.string().min(1),
      accountIdentifier: z.string().min(1),
      accountName: z.string().min(1),
      currency: z.string().min(1),
    })
    .passthrough(),
  receiveAmount: z.string().optional(),
  feeMethod: z.enum(['USDC', 'XLM', 'stablecoin', 'native']).optional(),
});

export async function POST(request: NextRequest) {
  return withIdempotency(
    request,
    async () => {
      const validation = await validateBody(request, executePayoutSchema);
      if (!validation.success) return validation.response;

      const result = await executePayout(validation.data);
      if (!result.ok) {
        return apiError(result.error);
      }

      return NextResponse.json(result.data, { status: 200 });
    },
    { required: true },
  );
}
