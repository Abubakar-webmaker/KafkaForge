/**
 * Safe error serialization
 *
 * Prevents:
 * - Secret leakage
 * - Circular reference crashes
 * - Unexpected data exposure
 */

import { BaseError, isBaseError } from './base-error.js';

const SECRET_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /auth/i,
  /credential/i,
];

/**
 * Check if a key might contain sensitive data
 */
function isSensitiveKey(key: string): boolean {
  return SECRET_PATTERNS.some((pattern) => pattern.test(key));
}

/**
 * Redact sensitive values from an object
 */
function redactSensitiveData(obj: unknown, depth = 0): unknown {
  // Prevent infinite recursion on circular structures
  if (depth > 10) {
    return '[circular or deeply nested]';
  }

  if (obj === null) {
    return null;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (obj instanceof Error) {
    return {
      message: obj.message,
      type: obj.constructor.name,
    };
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (isSensitiveKey(key)) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactSensitiveData(value, depth + 1);
      }
    }

    return result;
  }

  return obj;
}

/**
 * Serialize error to safe JSON object
 * Redacts sensitive data and breaks circular references
 */
export function serializeError(error: unknown): Record<string, unknown> {
  if (isBaseError(error)) {
    return error.toJSON() as Record<string, unknown>;
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      type: error.constructor.name,
      stack: error.stack,
    };
  }

  if (typeof error === 'object' && error !== null) {
    return redactSensitiveData(error) as Record<string, unknown>;
  }

  return {
    message: String(error),
    type: typeof error,
  };
}

/**
 * Format error for logging
 */
export function formatError(error: unknown): string {
  if (error instanceof BaseError) {
    return error.toString();
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
