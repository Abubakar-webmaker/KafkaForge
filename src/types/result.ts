/**
 * Result type for explicit error handling
 *
 * Provides a type-safe way to represent success or failure
 * without throwing exceptions.
 */

/**
 * Success result
 */
export interface Ok<T> {
  readonly isOk: true;
  readonly value: T;
}

/**
 * Failure result
 */
export interface Err<E> {
  readonly isOk: false;
  readonly error: E;
}

/**
 * Result type: either Ok<T> or Err<E>
 */
export type Result<T, E = Error> = Ok<T> | Err<E>;

/**
 * Create a success result
 */
export function ok<T>(value: T): Ok<T> {
  return { isOk: true, value };
}

/**
 * Create a failure result
 */
export function err<E>(error: E): Err<E> {
  return { isOk: false, error };
}

/**
 * Map a result value
 */
export function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.isOk ? ok(fn(result.value)) : result;
}

/**
 * Map a result error
 */
export function mapError<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return result.isOk ? result : err(fn(result.error));
}

/**
 * Flat map (chain) results
 */
export function flatMapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  return result.isOk ? fn(result.value) : result;
}

/**
 * Get value or default
 */
export function getResultOrDefault<T, E>(result: Result<T, E>, defaultValue: T): T {
  return result.isOk ? result.value : defaultValue;
}

/**
 * Convert result to promise
 */
export async function toPromise<T, E extends Error>(result: Result<T, E>): Promise<T> {
  if (result.isOk) {
    return result.value;
  }

  throw result.error;
}
