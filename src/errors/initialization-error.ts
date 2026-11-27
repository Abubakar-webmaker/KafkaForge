/**
 * Application initialization errors
 */

import { BaseError } from './base-error.js';
import { ERROR_CODES } from './error-codes.js';
import type { ErrorContext } from './base-error.js';

/**
 * Thrown when application initialization fails
 */
export class InitializationError extends BaseError {
  constructor(message: string, context: ErrorContext = {}, cause: Error | undefined = undefined) {
    super(message, ERROR_CODES.INIT_FAILED, 'operational', context, cause);
    Object.setPrototypeOf(this, InitializationError.prototype);
  }
}
