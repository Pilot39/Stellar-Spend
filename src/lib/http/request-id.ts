import type { NextResponse } from 'next/server';

/**
 * Sets the `X-Request-Id` header on a response. Shared by offramp routes (#1470).
 */
export function withRequestId<T>(response: NextResponse<T>, requestId: string): NextResponse<T> {
  response.headers.set('X-Request-Id', requestId);
  return response;
}
