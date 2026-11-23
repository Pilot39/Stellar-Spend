I'll analyze the current file and the requirements to produce the updated content.

The step asks to:
1. Make `formatResponse` emit the standardized envelope from `error-types` (code, message, details only in non-production, requestId when available)
2. Map `ApiError`/`TimeoutError`/`PaycrestHttpError`/`DatabaseError` to correct statuses
3. Expose validation/notFound/unauthorized/forbidden/serverError helpers
4. Replace any `console.*` logging with structured logger from `src/lib/logger.ts`
5. Add unit tests (tests are separate files, but I should note this in the file)

Since I can only return the file content for `src/lib/error-handler.ts`, I'll focus on the implementation. The current file has no `console.*` calls, but I should ensure the structured logger is used where appropriate (e.g., logging server errors). I need to reference `DatabaseError` from error-types (assuming it exists there or is imported). Since I don't have the exact `error-types.ts` content, I'll work with what's imported and add `DatabaseError` handling defensively.

Let me construct the updated file. I'll:
- Import the logger
- Add `DatabaseError` handling (import from error-types if available, otherwise handle generically)
- Update `formatResponse` to include `code` and `requestId`
- Log server errors via structured logger
- Keep all existing helpers

Since I don't know if `DatabaseError` is exported from `error-types`, I'll import it and assume it is (the step explicitly mentions mapping `DatabaseError`). I'll also add `requestId` support to `ErrorContext` usage — but `ErrorContext` is defined in error-types. To be safe, I'll handle requestId via a parameter/optional field without breaking the existing `ErrorContext` type. I'll add requestId to the response object conditionally.

Let me write the file carefully, preserving all existing functionality while adding the new features.

For `StandardErrorResponse`, I'll assume it has `error`, `message?`, `details?`, and now `code?`, `requestId?`. Since I can't modify error-types, I'll cast where needed to add `code` and `requestId`. Actually, to be safe and type-correct, I'll build the response object and assign optional fields with type assertions.

Let me write it:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import {
  StandardErrorResponse,
  ErrorContext,
  ErrorType,
  ERROR_STATUS_CODES,
  ApiError,
  getEnvironmentConfig,
  isError,
  hasMessage,
} from './error-types';
import { TimeoutError } from './offramp/utils/timeout';
import { PaycrestHttpError } from './offramp/adapters/paycrest-adapter';
import { logger } from './logger';
```

Wait — I need to be careful about the logger import path. The step says "structured logger from src/lib/logger.ts". Since this file is in src/lib/, the import is `./logger`. I'll assume `logger` is exported (named export). I'll use `logger.error(...)`.

For DatabaseError — I'll import it from error-types if it exists. Since I'm not 100% sure, I'll import it and use it. The step explicitly says to map it, so it must exist. I'll add it to the import.

Actually, to be defensive and not break compilation if DatabaseError isn't in error-types, I could handle it via duck-typing. But the step says "map ... DatabaseError to correct statuses" — implying it's a known type. I'll import it from error-types.

Let me also add requestId support. I'll add an optional `requestId` to the handle method signature and thread it through. But `ErrorContext` may not have requestId. I'll add it to the response building directly.

Let me write the final version. I'll add a `requestId` optional param to `handle` and to `formatResponse` via context extension. To keep it simple, I'll add `requestId?: string` to a local extended context type.

Actually, `ErrorContext` is imported. I'll extend it locally:

```typescript
interface ExtendedErrorContext extends ErrorContext {
  requestId?: string;
}
```

And `formatResponse(context: ExtendedErrorContext)`.

For the response, I'll build:
```typescript
const response: StandardErrorResponse & { code?: string; requestId?: string } = {
  error: context.errorType,
  code: context.errorType,
};
```

Wait, the envelope should have `code`. Let me set `code` to the error type string (or a more specific code). I'll use `context.errorType` as the code value.

Let me finalize. I'll also add logging for server errors (5xx) using the structured logger, replacing any console usage (there's none currently, but adding logging is good practice and satisfies "replace console.* with structured logger").

Here's my plan for the file:

1. Imports: add `logger`, `DatabaseError`
2. `handle(error, statusCode?, requestId?)` — thread requestId
3. Add `DatabaseError` branch in `handle`
4. `formatResponse` — add `code`, `requestId`, details only in non-production
5. Log server errors via `logger.error`
6. Keep all helpers

Let me write it out fully now.

For DatabaseError mapping — typically a database error maps to 500 (SERVER_ERROR) or 503. I'll map to 500 SERVER_ERROR, or if it has a status, use it. I'll handle it like PaycrestHttpError but default to 500.

Let me write the complete file.

I need to be careful: `getEnvironmentConfig().includeDetails` — the step says "details only in non-production". The existing code uses `includeDetails`. I'll keep using `includeDetails` but also check `!isProduction` to be safe. Actually `includeDetails` likely already reflects non-production. I'll use `config.includeDetails && !config.isProduction` for the details gate to strictly satisfy "details only in non-production".

Let me write.

For the logger call, I'll do:
```typescript
logger.error('Unhandled API error', {
  errorType: context.errorType,
  statusCode: context.statusCode,
  message: context.message,
  requestId: context.requestId,
});
```
But I should only log server errors (5xx) to avoid noise. I'll log when statusCode >= 500.

Now writing the full file.```typescript
import { NextRequest, NextResponse } from 'next/server';
import {
  StandardErrorResponse,
  ErrorContext,
  ErrorType,
  ERROR_STATUS_CODES,
  ApiError,
  DatabaseError,
  getEnvironmentConfig,
  isError,
  hasMessage,
} from './error-types';
import { TimeoutError } from './offramp/utils/timeout';
import { PaycrestHttpError } from './offramp/adapters/paycrest-adapter';
import { logger } from './logger';

/**
 * Extended error context that carries an optional request correlation id so it
 * can be surfaced in the standardized error envelope.
 */
interface ExtendedErrorContext extends ErrorContext {
  requestId?: string;
}

/**
 * Standardized error envelope emitted by this handler.
 *
 * Shape:
 *   {
 *     error: ErrorType,      // backwards-compatible discriminator
 *     code: string,          // machine-readable code (mirrors error type)
 *     message?: string,      // sanitized human-readable message
 *     details?: unknown,     // only present in non-production
 *     requestId?: string,    // present when a correlation id is available
 *   }
 */
type StandardErrorEnvelope = StandardErrorResponse & {
  code?: string;
  requestId?: string;
};

/**
 * Centralized error handler for standardized API error responses.
 *
 * This is the single shared error helper used by every route under
 * `src/app/api/`. It maps known error types to the correct HTTP status and
 * emits the standardized `{ error, code, message?, details?, requestId? }`
 * envelope.
 */
export class ErrorHandler {
  /**
   * Main error handling method that processes any error and returns a standardized response.
   */
  static handle(
    error: unknown,
    statusCode?: number,
    requestId?: string,
  ): NextResponse<StandardErrorResponse> {
    // Preserve the exact type/status/details for errors raised via ApiError factories
    if (error instanceof ApiError) {
      const context: ExtendedErrorContext = {
        originalError: error,
        statusCode: error.statusCode,
        errorType: error.errorType,
        message: error.message,
        details: error.details,
        requestId,
      };
      return this.respond(context);
    }

    // Handle timeout errors specifically (504 Gateway Timeout)
    if (error instanceof TimeoutError) {
      return this.timeout(error, requestId);
    }

    // Preserve HTTP status from Paycrest errors
    if (error instanceof PaycrestHttpError) {
      const context: ExtendedErrorContext = {
        originalError: error,
        statusCode: error.status,
        errorType: this.classifyError(error, error.status),
        message: error.message,
        details: error.details as Record<string, unknown> | undefined,
        requestId,
      };
      return this.respond(context);
    }

    // Map database errors to a server error (or their own status when present)
    if (error instanceof DatabaseError) {
      const dbStatus =
        typeof (error as { statusCode?: number }).statusCode === 'number'
          ? (error as { statusCode?: number }).statusCode!
          : ERROR_STATUS_CODES[ErrorType.SERVER_ERROR];
      const context: ExtendedErrorContext = {
        originalError: error,
        statusCode: dbStatus,
        errorType: ErrorType.SERVER_ERROR,
        message: error.message,
        details: (error as { details?: Record<string, unknown> }).details,
        requestId,
      };
      return this.respond(context);
    }

    const context = this.createErrorContext(error, statusCode, requestId);
    return this.respond(context);
  }

  /**
   * Handle validation errors with consistent formatting.
   */
  static validation(
    message: string,
    field?: string,
    requestId?: string,
  ): NextResponse<StandardErrorResponse> {
    const errorMessage = field ? `Validation failed for field: ${field}` : message;
    const context: ExtendedErrorContext = {
      originalError: new Error(errorMessage),
      statusCode: ERROR_STATUS_CODES[ErrorType.VALIDATION],
      errorType: ErrorType.VALIDATION,
      message: errorMessage,
      requestId,
    };
    return this.respond(context);
  }

  /**
   * Handle not found errors.
   */
  static notFound(resource?: string, requestId?: string): NextResponse<StandardErrorResponse> {
    const message = resource ? `${resource} not found` : 'Resource not found';
    const context: ExtendedErrorContext = {
      originalError: new Error(message),
      statusCode: ERROR_STATUS_CODES[ErrorType.NOT_FOUND],
      errorType: ErrorType.NOT_FOUND,
      message,
      requestId,
    };
    return this.respond(context);
  }

  /**
   * Handle unauthorized errors.
   */
  static unauthorized(message?: string, requestId?: string): NextResponse<StandardErrorResponse> {
    const errorMessage = message || 'Unauthorized access';
    const context: ExtendedErrorContext = {
      originalError: new Error(errorMessage),
      statusCode: ERROR_STATUS_CODES[ErrorType.UNAUTHORIZED],
      errorType: ErrorType.UNAUTHORIZED,
      message: errorMessage,
      requestId,
    };
    return this.respond(context);
  }

  /**
   * Handle forbidden errors.
   */
  static forbidden(message?: string, requestId?: string): NextResponse<StandardErrorResponse> {
    const errorMessage = message || 'Forbidden';
    const context: ExtendedErrorContext = {
      originalError: new Error(errorMessage),
      statusCode: ERROR_STATUS_CODES[ErrorType.FORBIDDEN],
      errorType: ErrorType.FORBIDDEN,
      message: errorMessage,
      requestId,
    };
    return this.respond(context);
  }

  /**
   * Handle conflict errors (duplicate resource, invalid state transition, etc.)
   */
  static conflict(
    message: string,
    details?: Record<string, unknown>,
    requestId?: string,
  ): NextResponse<StandardErrorResponse> {
    const config = getEnvironmentConfig();
    const context: ExtendedErrorContext = {
      originalError: new Error(message),
      statusCode: ERROR_STATUS_CODES[ErrorType.CONFLICT],
      errorType: ErrorType.CONFLICT,
      message,
      details: config.includeDetails && !config.isProduction ? details : undefined,
      requestId,
    };
    return this.respond(context);
  }

  /**
   * Handle rate limit errors, optionally setting a Retry-After header.
   */
  static rateLimit(
    message?: string,
    retryAfter?: number,
    requestId?: string,
  ): NextResponse<StandardErrorResponse> {
    const errorMessage = message || 'Rate limit exceeded';
    const context: ExtendedErrorContext = {
      originalError: new Error(errorMessage),
      statusCode: ERROR_STATUS_CODES[ErrorType.RATE_LIMIT],
      errorType: ErrorType.RATE_LIMIT,
      message: errorMessage,
      requestId,
    };

    const nextResponse = this.respond(context);
    if (retryAfter) {
      nextResponse.headers.set('Retry-After', retryAfter.toString());
    }
    return nextResponse;
  }

  /**
   * Handle timeout errors with 504 Gateway Timeout.
   */
  static timeout(error: TimeoutError, requestId?: string): NextResponse<StandardErrorResponse> {
    const context: ExtendedErrorContext = {
      originalError: error,
      statusCode: 504,
      errorType: ErrorType.SERVER_ERROR,
      message: error.message,
      requestId,
    };
    return this.respond(context);
  }

  /**
   * Handle server errors. In production the message is masked to avoid leaking
   * internal details; the underlying error is still logged via the structured
   * logger for observability.
   */
  static serverError(error?: unknown, requestId?: string): NextResponse<StandardErrorResponse> {
    const config = getEnvironmentConfig();
    const message = config.isProduction
      ? 'Internal server error'
      : isError(error)
        ? error.message
        : 'Internal server error';

    const context: ExtendedErrorContext = {
      originalError: error || new Error('Internal server error'),
      statusCode: ERROR_STATUS_CODES[ErrorType.SERVER_ERROR],
      errorType: ErrorType.SERVER_ERROR,
      message,
      requestId,
    };
    return this.respond(context);
  }

  /**
   * Build a NextResponse from an error context, logging server-side failures
   * through the structured logger and emitting the standardized envelope.
   */
  private static respond(context: ExtendedErrorContext): NextResponse<StandardErrorResponse> {
    // Log server-side failures (5xx) with structured context for observability.
    if (context.statusCode >= 500) {
      logger.error('API request failed', {
        errorType: context.errorType,
        statusCode: context.statusCode,
        message: context.message,
        requestId: context.requestId,
        stack: isError(context.originalError) ? context.originalError.stack : undefined,
      });
    }

    const response = this.formatResponse(context);
    return NextResponse.json(response, { status: context.statusCode });
  }

  /**
   * Create error context from various input types.
   */
  private static createErrorContext(
    error: unknown,
    statusCode?: number,
    requestId?: string,
  ): ExtendedErrorContext {
    const config = getEnvironmentConfig();

    // Handle different input types
    if (isError(error)) {
      return {
        originalError: error,
        statusCode: statusCode || ERROR_STATUS_CODES[ErrorType.SERVER_ERROR],
        errorType: this.classifyError(error, statusCode),
        message: error.message,
        stack: error.stack,
        details: config.includeDetails && !config.isProduction ? { stack: error.stack } : undefined,
        requestId,
      };
    }

    if (typeof error === 'string') {
      return {
        originalError: error,
        statusCode: statusCode || ERROR_STATUS_CODES[ErrorType.SERVER_ERROR],
        errorType: this.classifyError(error, statusCode),
        message: error,
        requestId,
      };
    }

    if (hasMessage(error)) {
      return {
        originalError: error,
        statusCode: statusCode || ERROR_STATUS_CODES[ErrorType.SERVER_ERROR],
        errorType: this.classifyError(error, statusCode),
        message: error.message,
        details: config.includeDetails && !config.isProduction ? error : undefined,
        requestId,
      };
    }

    // Fallback for unknown error types
    return {
      originalError: error,
      statusCode: statusCode || ERROR_STATUS_CODES[ErrorType.SERVER_ERROR],
      errorType: ErrorType.SERVER_ERROR,
      message: 'An unexpected error occurred',
      requestId,
    };
  }

  /**
   * Classify error type based on error content and status code.
   */
  private static classifyError(error: unknown, statusCode?: number): ErrorType {
    if (statusCode) {
      if (statusCode === 400) return ErrorType.VALIDATION;
      if (statusCode === 401) return ErrorType.UNAUTHORIZED;
      if (statusCode === 403) return ErrorType.FORBIDDEN;
      if (statusCode === 404) return ErrorType.NOT_FOUND;
      if (statusCode === 409) return ErrorType.CONFLICT;
      if (statusCode === 429) return ErrorType.RATE_LIMIT;
      if (statusCode >= 500) return ErrorType.SERVER_ERROR;
    }

    if (isError(error)) {
      const message = error.message.toLowerCase();
      if (message.includes('validation') || message.includes('invalid')) {
        return ErrorType.VALIDATION;
      }
      if (message.includes('not found') || message.includes('missing')) {
        return ErrorType.NOT_FOUND;
      }
      if (message.includes('unauthorized') || message.includes('authentication')) {
        return ErrorType.UNAUTHORIZED;
      }
      if (message.includes('forbidden') || message.includes('permission')) {
        return ErrorType.FORBIDDEN;
      }
    }

    return ErrorType.SERVER_ERROR;
  }

  /**
   * Format the error response according to the standard envelope.
   *
   * - `error` and `code` are always present (backwards-compatible discriminator).
   * - `message` is sanitized to strip sensitive information.
   * - `details` are only included in non-production environments.
   * - `requestId` is included when available for correlation.
   */
  private static formatResponse(context: ExtendedErrorContext): StandardErrorResponse {
    const config = getEnvironmentConfig();
    const includeDetails = config.includeDetails && !config.isProduction;

    const response: StandardErrorEnvelope = {
      error: context.errorType,
      code: context.errorType,
    };

    // Add message if available
    if (context.message) {
      response.message = this.sanitizeMessage(context.message);
    }

    // Add details only in non-production
    if (includeDetails && context.details) {
      response.details = this.sanitizeDetails(context.details);
    } else if (includeDetails && context.stack) {
      response.details = { stack: context.stack };
    }

    // Add request correlation id when available
    if (context.requestId) {
      response.requestId = context.requestId;
    }

    return response as StandardErrorResponse;
  }

  /**
   * Sanitize error messages to remove sensitive information.
   */
  private static sanitizeMessage(message: string): string {
    // Remove file paths
    message = message.replace(/\/[^\s]+\.(js|ts|jsx|tsx|json)/g, '[file]');

    // Remove connection strings
    message = message.replace(/mongodb:\/\/[^\s]+/g, '[connection_string]');
    message = message.replace(/postgres:\/\/[^\s]+/g, '[connection_string]');

    // Remove API keys and tokens
    message = message.replace(/[a-zA-Z0-9]{32,}/g, '[api_key]');

    return message;
  }

  /**
   * Sanitize details object to remove sensitive information.
   */
  private static sanitizeDetails(details: unknown): unknown {
    if (typeof details === 'string') {
      return this.sanitizeMessage(details);
    }

    if (Array.isArray(details)) {
      return details.map((item) => this.sanitizeDetails(item));
    }

    if (typeof details === 'object' && details !== null) {
      const sanitized: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(details)) {
        // Skip sensitive keys
        if (this.isSensitiveKey(key)) {
          sanitized[key] = '[redacted]';
        } else {
          sanitized[key] = this.sanitizeDetails(value);
        }
      }

      return sanitized;
    }

    return details;
  }

  /**
   * Check if a key contains sensitive information.
   */
  private static isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'credential',
      'connection',
      'database',
      'db',
      'mongo',
      'postgres',
      'redis',
    ];

    const lowerKey = key.toLowerCase();
    return sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive));
  }
}

/**
 * Wraps a Next.js route handler so any thrown error (ApiError or otherwise)
 * is converted to the standard { error, code, message?, details?, requestId? }
 * response shape via ErrorHandler, instead of every route repeating its own
 * try/catch.
 *
 * Usage:
 *   export const GET = withApiErrorHandling(async (request) => { ... });
 */
export function withApiErrorHandling<
  Args extends unknown[] = [NextRequest, ...unknown[]],
  Res = unknown,
>(
  handler: (...args: Args) => Promise<NextResponse<Res>>,
): (...args: Args) => Promise<NextResponse<Res | StandardErrorResponse>> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return ErrorHandler.handle(error);
    }
  };
}