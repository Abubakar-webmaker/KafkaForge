/**
 * General-purpose validation utilities
 */

/**
 * Validate a string is not empty
 */
export function validateString(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Expected non-empty string, got: ${typeof value}`);
  }

  return value;
}

/**
 * Validate a value is an integer
 */
export function validateInteger(value: unknown): number {
  if (!Number.isInteger(value)) {
    throw new Error(`Expected integer, got: ${typeof value}`);
  }

  return value as number;
}

/**
 * Validate a value is within a range
 */
export function validateIntegerInRange(value: unknown, min: number, max: number): number {
  const num = validateInteger(value);

  if (num < min || num > max) {
    throw new Error(`Expected integer between ${min} and ${max}, got: ${num}`);
  }

  return num;
}

/**
 * Validate a port number (1-65535)
 */
export function validatePort(value: unknown): number {
  return validateIntegerInRange(value, 1, 65535);
}

/**
 * Validate a positive integer
 */
export function validatePositiveInteger(value: unknown, minimum = 1): number {
  const num = validateInteger(value);

  if (num < minimum) {
    throw new Error(`Expected integer >= ${minimum}, got: ${num}`);
  }

  return num;
}

/**
 * Validate value is defined
 */
export function validateRequired<T>(value: T | undefined | null): T {
  if (value === undefined || value === null) {
    throw new Error('Expected required value, got: ' + String(value));
  }

  return value;
}
