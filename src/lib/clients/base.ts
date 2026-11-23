/** Default per-request timeout shared by HTTP clients (#1465) */
export const DEFAULT_TIMEOUT_MS = 15_000;

export interface ClientConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface RetryOptions {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

export class ClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ClientError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * A 4xx response will fail the same way on retry, except for timeouts and rate limits (#1465).
 */
function isRetryable(error: Error): boolean {
  if (!(error instanceof ClientError)) return true;
  if (error.status === 408 || error.status === 429) return true;
  return error.status < 400 || error.status >= 500;
}

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  let lastError: Error | undefined;
  let delay = options.delayMs;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!isRetryable(lastError)) break;

      if (attempt < options.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= options.backoffMultiplier;
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}
