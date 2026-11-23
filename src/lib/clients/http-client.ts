import { apiRequest, ApiError } from '../api/client';
import { DEFAULT_TIMEOUT_MS } from './base';

export interface HttpClientConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  circuitBreakerThreshold?: number;
  circuitBreakerResetMs?: number;
  headers?: Record<string, string>;
  onRequest?: (url: string, init: RequestInit) => void;
  onResponse?: (url: string, status: number, durationMs: number) => void;
}

type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitOpenError extends Error {
  constructor(public readonly url: string) {
    super(`Circuit breaker open for: ${url}`);
    this.name = 'CircuitOpenError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class HttpClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpClientError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class HttpClient {
  private readonly config: Required<
    Omit<HttpClientConfig, 'baseUrl' | 'headers' | 'onRequest' | 'onResponse'>
  > &
    Pick<HttpClientConfig, 'baseUrl' | 'headers' | 'onRequest' | 'onResponse'>;
  private circuitState: CircuitState = 'closed';
  private failures = 0;
  private lastFailureTime = 0;

  constructor(config: HttpClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl,
      timeout: config.timeout ?? DEFAULT_TIMEOUT_MS,
      retries: config.retries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      backoffMultiplier: config.backoffMultiplier ?? 2,
      circuitBreakerThreshold: config.circuitBreakerThreshold ?? 5,
      circuitBreakerResetMs: config.circuitBreakerResetMs ?? 30000,
      headers: config.headers,
      onRequest: config.onRequest,
      onResponse: config.onResponse,
    };
  }

  private checkCircuit(url: string): void {
    if (this.circuitState === 'open') {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.config.circuitBreakerResetMs) {
        this.circuitState = 'half-open';
      } else {
        throw new CircuitOpenError(url);
      }
    }
  }

  private recordSuccess(): void {
    this.failures = 0;
    this.circuitState = 'closed';
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.config.circuitBreakerThreshold) {
      this.circuitState = 'open';
    }
  }

  async request<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
    const url = this.config.baseUrl ? `${this.config.baseUrl}${path}` : path;
    this.checkCircuit(url);

    const mergedInit: RequestInit = {
      ...init,
      headers: { ...this.config.headers, ...(init.headers as Record<string, string>) },
    };
    this.config.onRequest?.(url, mergedInit);

    let delay = this.config.retryDelay;
    let lastError: Error = new Error('Request failed');

    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        // Delegate fetch/JSON/error handling to the centralized typed client.
        const result = await apiRequest<T>(url, {
          ...mergedInit,
          timeout: this.config.timeout,
          onResponse: (status, durationMs) => this.config.onResponse?.(url, status, durationMs),
        });
        this.recordSuccess();
        return result;
      } catch (error) {
        if (error instanceof CircuitOpenError) throw error;

        if (error instanceof ApiError) {
          // Don't retry 4xx except 429
          if (error.status >= 400 && error.status < 500 && error.status !== 429) {
            this.recordFailure();
            throw new HttpClientError(error.message, error.status, error.details);
          }
          lastError = new HttpClientError(error.message, error.status, error.details);
        } else {
          const err = error as { name?: string; message?: string };
          if (err.name === 'AbortError') {
            lastError = new HttpClientError('Request timeout', 504);
          } else {
            lastError = new HttpClientError(err.message || 'Network error', 502);
          }
        }

        if (attempt < this.config.retries) {
          await new Promise((r) => setTimeout(r, delay));
          delay *= this.config.backoffMultiplier;
          continue;
        }

        this.recordFailure();
        throw lastError;
      }
    }

    this.recordFailure();
    throw lastError;
  }

  get<T = unknown>(path: string, init?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...init, method: 'GET' });
  }

  post<T = unknown>(path: string, body: unknown, init?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...init, method: 'POST', body: JSON.stringify(body) });
  }
}
