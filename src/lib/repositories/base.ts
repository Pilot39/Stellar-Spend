/**
 * Standard repository contract shared by every repository.
 *
 * Method names are uniform across repositories:
 *  - get(id)            → the entity, or null when not found
 *  - list()             → all entities
 *  - create(entity)     → persist a new entity
 *  - update(id, patch)  → merge a partial patch into an existing entity
 *  - delete(id)         → remove an entity
 */
export interface BaseRepository<T> {
  create(entity: T): Promise<void>;
  update(id: string, updates: Partial<T>): Promise<void>;
  get(id: string): Promise<T | null>;
  delete(id: string): Promise<void>;
  list(): Promise<T[]>;
}

export interface RepositoryFactory<T> {
  create(): BaseRepository<T>;
}

/**
 * Error raised when a database operation fails.
 *
 * Repositories translate driver/ORM specific failures into this error so that
 * callers (services, routes) can depend on a single, stable error type instead
 * of leaking infrastructure details.
 */
export class DatabaseError extends Error {
  /** The underlying error that triggered this failure, if any. */
  readonly cause?: unknown;
  /** Optional operation context, e.g. "create" or "list". */
  readonly operation?: string;

  constructor(message: string, options: { cause?: unknown; operation?: string } = {}) {
    super(message);
    this.name = 'DatabaseError';
    this.cause = options.cause;
    this.operation = options.operation;
    // Restore prototype chain for transpiled targets extending Error.
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Shared helper that maps an arbitrary thrown value into a {@link DatabaseError}.
 *
 * - If the value is already a `DatabaseError`, it is returned unchanged so that
 *   errors are not double-wrapped as they bubble up through layers.
 * - Otherwise a new `DatabaseError` is created, preserving the original value
 *   as `cause` and attaching the provided operation context.
 *
 * @param error     The thrown value to normalize.
 * @param operation Optional operation name for context (e.g. "create").
 * @returns A `DatabaseError` describing the failure.
 */
export function toDatabaseError(error: unknown, operation?: string): DatabaseError {
  if (error instanceof DatabaseError) {
    return error;
  }

  const message = extractErrorMessage(error);
  return new DatabaseError(message, { cause: error, operation });
}

/**
 * Wraps an async database operation, mapping any thrown value to a
 * {@link DatabaseError} via {@link toDatabaseError}.
 *
 * @param operation The operation name used for error context.
 * @param fn        The async function performing the DB work.
 */
export async function withDatabaseError<T>(
  operation: string,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw toDatabaseError(error, operation);
  }
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error.length > 0) {
    return error;
  }
  return 'Database operation failed';
}
</｜｜DSML｜｜ parameter>