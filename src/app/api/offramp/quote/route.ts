import { NextResponse, type NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { validateBody } from '@/lib/error-handler';
import { quoteRouteSchema } from '@/lib/validators';
import { getOfframpQuote } from '@/lib/services/offramp-quote';

export const maxDuration = 20;

export async function POST(request: NextRequest) {
  const validation = await validateBody(request, quoteRouteSchema);
  if (!validation.success) {
    return validation.response;
  }

  try {
    const quote = await getOfframpQuote(validation.data);
    return NextResponse.json(quote);
  } catch (error) {
    logger.error('Quote fetch error', {}, error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch quote',
        },
      },
      { status: 500 },
    );
  }
}
