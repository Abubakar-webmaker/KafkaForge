/**
 * Base error class for all KafkaForge errors
 *
 * Features:
 * - Stable error codes
 * - Error cause preservation (error chains)
 * - Operational classification
 * - Detailed error context
 * - Safe serialization
 */

import type { ErrorCode } from './error-codes.js';

/**
 * Operational error classification
 * - operational: Expected error, should be handled gracefully
 * - programming: Unexpected error, indicates a bug
 * - unknown: Error status is unclear
 */
export type ErrorClassification = 'operational' | 'programming' | 'unknown';

export interface ErrorContext {
  [key: string]: unknown;
}

/**
 * Base error class for all application errors
 */
export class BaseError extends Error {
  public readonly code: ErrorCode;
  public readonly classification: ErrorClassification;
  public readonly context: Readonly<ErrorContext>;
  public readonly cause: Error | undefined;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: ErrorCode,
    classification: ErrorClassification = 'unknown',
    context: ErrorContext = {},
    cause: Error | undefined = undefined
  ) {
    super(message);

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, BaseError.prototype);

    this.code = code;
    this.classification = classification;
    this.context = Object.freeze({ ...context });
    this.cause = cause;
    this.timestamp = new Date();

    // Capture stack trace (V8 only, ignored elsewhere)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Check if an error is operational (expected, should be handled)
   */
  isOperational(): boolean {
    return this.classification === 'operational';
  }

  /**
   * Check if an error is a programming error (bug)
   */
  isProgrammingError(): boolean {
    return this.classification === 'programming';
  }

  /**
   * Get full error chain as array
   */
  getErrorChain(): Error[] {
    const chain: Error[] = [this];
    let current = this.cause;

    while (current !== undefined) {
      chain.push(current);
      current = current instanceof BaseError ? current.cause : undefined;
    }

    return chain;
  }

  /**
   * Convert to safe serializable object (no secrets, no circular refs)
   */
  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      classification: this.classification,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      cause: this.cause instanceof BaseError ? this.cause.toJSON() : this.cause?.message,
    };
  }

  /**
   * User-friendly error message with chain
   */
  toString(): string {
    const chain = this.getErrorChain();
    return chain.map((err, index) => `${index > 0 ? '  → ' : ''}${err.message}`).join('\n');
  }
}

/**
 * Type guard to check if error is BaseError
 */
export function isBaseError(error: unknown): error is BaseError {
  return error instanceof BaseError;
}
