import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { ErrorHandler } from '@/lib/error-handler';
import { withIdempotency } from '@/lib/idempotency';
import { validateBody, validateParams } from '@/lib/validation/validate-request';
import { updateTransaction } from '@/lib/services/transactions-service';

const idParamsSchema = z.object({ id: z.string().min(1) });

// Unknown fields are intentionally kept (passthrough): the DAL's update()
// already whitelists which columns it writes, this schema only needs to
// type-check the fields it knows about.
const updateTransactionSchema = z
  .object({
    status: z.string().min(1).optional(),
    bridgeStatus: z.string().min(1).optional(),
    payoutStatus: z.string().min(1).optional(),
    error: z.string().optional(),
    finalizedAt: z.number().optional(),
    amount: z.string().min(1).optional(),
    currency: z.string().min(1).optional(),
    userAddress: z.string().min(1).optional(),
    timestamp: z.number().optional(),
    feeMethod: z.string().optional(),
    bridgeFee: z.string().optional(),
    networkFee: z.string().optional(),
    paycrestFee: z.string().optional(),
    totalFee: z.string().optional(),
    stellarTxHash: z.string().optional(),
    payoutOrderId: z.string().optional(),
    note: z.string().max(1000).optional(),
    beneficiary: z
      .object({
        institution: z.string().optional(),
        accountIdentifier: z.string().optional(),
        accountName: z.string().optional(),
        currency: z.string().optional(),
      })
      .optional(),
  })
  .passthrough();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withIdempotency(
    request,
    async () => {
      const paramsValidation = validateParams(await params, idParamsSchema);
      if (!paramsValidation.success) return paramsValidation.response;
      const { id } = paramsValidation.data;

      const validation = await validateBody(request, updateTransactionSchema);
      if (!validation.success) return validation.response;
      const body = validation.data;

      try {
        const updated = await updateTransaction(id, body);
        if (!updated) {
          return ErrorHandler.notFound('transaction');
        }
        return NextResponse.json(updated, { status: 200 });
      } catch (err) {
        return ErrorHandler.serverError(err);
      }
    },
    { required: true },
  );
}
