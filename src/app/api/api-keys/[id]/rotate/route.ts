import { NextRequest, NextResponse } from 'next/server';
import { ErrorHandler } from '@/lib/error-handler';
import { auditLoggingService } from '@/lib/audit-logging';
import { rotateApiKey } from '@/lib/api-keys';
import { requireApiKeyAdmin } from '@/app/api/api-keys/_utils';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireApiKeyAdmin(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;

  try {
    const rotated = await rotateApiKey(id);
    if (!rotated) {
      return ErrorHandler.notFound('api key');
    }

    await auditLoggingService.logAction('api_key.rotated', 'api_key', 'success', {
      resourceId: id,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
    });

    return NextResponse.json({ data: rotated }, { status: 200 });
  } catch (error) {
    return ErrorHandler.serverError(error);
  }
}
