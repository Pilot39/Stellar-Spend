/**
 * Structured request logging utility
 * Delegates to the centralized logger with correlation ID support.
 */

import { logger, redactSensitive } from '@/lib/logger';
import { randomUuid } from '@/lib/crypto/ids';

export interface RequestLog {
  requestId: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode?: number;
  duration: number;
  error?: string;
  errorStack?: string;
}

function selectLevel(statusCode?: number): 'error' | 'warn' | 'info' {
  if (statusCode && statusCode >= 500) return 'error';
  if (statusCode && statusCode >= 400) return 'warn';
  return 'info';
}

/**
 * Generate a unique request ID for tracing.
 * Uses crypto.randomUUID — the previous hand-rolled v4 generator depended on
 * Math.random, which is not cryptographically secure (#1371).
 */
export function generateRequestId(): string {
  return randomUuid();
}

/**
 * Create a request logger middleware.
 * Thin wrapper over the centralized logger; emits a single structured
 * `request.log` entry containing requestId, method, path, status and duration.
 */
export function createRequestLogger(requestId: string, method: string, path: string) {
  const startTime = Date.now();
  const scoped = logger.withContext({ requestId });

  const emit = (statusCode: number, error?: Error | string) => {
    const duration = Date.now() - startTime;
    const entry: RequestLog = {
      requestId,
      timestamp: new Date().toISOString(),
      method,
      path,
      statusCode,
      duration,
    };

    if (error !== undefined) {
      entry.error = typeof error === 'string' ? error : error.message;
      if (error instanceof Error) {
        entry.errorStack = error.stack;
      }
    }

    scoped[selectLevel(statusCode)]('request.log', redactSensitive(entry));
  };

  return {
    requestId,
    logSuccess: (statusCode: number) => emit(statusCode),
    logError: (statusCode: number, error: Error | string) => emit(statusCode, error),
  };
}
