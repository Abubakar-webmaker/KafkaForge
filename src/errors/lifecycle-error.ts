/**
 * Application lifecycle errors
 */

import { BaseError } from './base-error.js';
import { ERROR_CODES } from './error-codes.js';
import type { ErrorContext } from './base-error.js';

/**
 * Thrown when lifecycle state transition is invalid or timeout occurs
 */
export class LifecycleError extends BaseError {
  constructor(
    message: string,
    code: (typeof ERROR_CODES)[keyof typeof ERROR_CODES] = ERROR_CODES.LIFECYCLE_INVALID_TRANSITION,
    context: ErrorContext = {},
    cause: Error | undefined = undefined
  ) {
    super(message, code, 'operational', context, cause);
    Object.setPrototypeOf(this, LifecycleError.prototype);
  }
}
