/**
 * Unique ID generation
 *
 * Uses node:crypto for unpredictable, cryptographically secure IDs
 */

import { randomBytes } from 'node:crypto';

/**
 * Generate a random hex string of specified byte length
 */
function generateRandomHex(byteLength: number): string {
  return randomBytes(byteLength).toString('hex');
}

/**
 * Generate a unique ID suitable for messages, requests, or correl IDs
 *
 * Format: timestamp(13 digits) + random(16 hex chars) + sequence(4 hex chars)
 * Example: 1234567890123abcdef0123456789012abcd
 *
 * Properties:
 * - Roughly time-ordered (timestamp prefix)
 * - Cryptographically unpredictable
 * - 40 character hex string
 * - Very low collision probability
 */
export function generateId(): string {
  const timestamp = Date.now().toString(16).padStart(13, '0');
  const random = generateRandomHex(8);

  return timestamp + random;
}

/**
 * Generate a request ID for tracking requests
 * Same as generateId() but semantically named
 */
export function generateRequestId(): string {
  return generateId();
}

/**
 * Generate a correlation ID for tracing related operations
 * Same as generateId() but semantically named
 */
export function generateCorrelationId(): string {
  return generateId();
}

/**
 * Validate ID format
 */
export function isValidId(id: unknown): boolean {
  if (typeof id !== 'string') {
    return false;
  }

  // Should be 29 hex chars: 13 (timestamp) + 16 (random)
  return /^[a-f0-9]{29}$/.test(id);
}
