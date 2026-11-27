/**
 * Configuration-related errors
 */

import { BaseError } from './base-error.js';
import { ERROR_CODES } from './error-codes.js';
import type { ErrorContext } from './base-error.js';

/**
 * Thrown when configuration is invalid or missing
 */
export class ConfigurationError extends BaseError {
  constructor(message: string, context: ErrorContext = {}, cause: Error | undefined = undefined) {
    super(message, ERROR_CODES.CONFIG_INVALID_VALUE, 'operational', context, cause);
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}
