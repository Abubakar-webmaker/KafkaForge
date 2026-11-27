/**
 * Error hierarchy exports
 */

export { BaseError, isBaseError } from './base-error.js';
export type { ErrorClassification, ErrorContext } from './base-error.js';

export { ConfigurationError } from './configuration-error.js';
export { InitializationError } from './initialization-error.js';
export { LifecycleError } from './lifecycle-error.js';

export { ERROR_CODES } from './error-codes.js';
export type { ErrorCode } from './error-codes.js';

export { serializeError, formatError } from './error-serializer.js';
