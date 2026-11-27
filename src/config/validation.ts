/**
 * Configuration validation utilities
 *
 * Validates configuration values and provides helpful error messages
 */

import { ConfigurationError } from '../errors/configuration-error.js';
import type { LogLevel } from '../logging/log-level.js';

const VALID_ENVIRONMENTS = ['development', 'production', 'test'] as const;
const VALID_LOG_LEVELS: readonly LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'] as const;

/**
 * Validates a string value is not empty
 */
export function validateRequired(value: string | undefined, fieldName: string): string {
  if (value === undefined || value === '') {
    throw new ConfigurationError(`Required configuration field "${fieldName}" is missing or empty`, {
      field: fieldName,
    });
  }
  return value;
}

/**
 * Validates a port number
 */
export function validatePort(value: string | number | undefined, fieldName: string): number {
  if (value === undefined) {
    throw new ConfigurationError(`Required configuration field "${fieldName}" is missing`, {
      field: fieldName,
    });
  }

  const port = typeof value === 'string' ? parseInt(value, 10) : value;

  if (!Number.isInteger(port) || Number.isNaN(port)) {
    throw new ConfigurationError(`Configuration field "${fieldName}" must be a valid integer, got "${value}"`, {
      field: fieldName,
      value,
    });
  }

  if (port < 0 || port > 65535) {
    throw new ConfigurationError(`Configuration field "${fieldName}" must be between 0 and 65535, got ${port}`, {
      field: fieldName,
      value: port,
    });
  }

  return port;
}

/**
 * Validates a positive integer
 */
export function validatePositiveInteger(value: string | number | undefined, fieldName: string, min = 1): number {
  if (value === undefined) {
    throw new ConfigurationError(`Required configuration field "${fieldName}" is missing`, {
      field: fieldName,
    });
  }

  const num = typeof value === 'string' ? parseInt(value, 10) : value;

  if (!Number.isInteger(num) || Number.isNaN(num)) {
    throw new ConfigurationError(`Configuration field "${fieldName}" must be a valid integer, got "${value}"`, {
      field: fieldName,
      value,
    });
  }

  if (num < min) {
    throw new ConfigurationError(`Configuration field "${fieldName}" must be >= ${min}, got ${num}`, {
      field: fieldName,
      value: num,
    });
  }

  return num;
}

/**
 * Validates environment value
 */
export function validateEnvironment(value: string | undefined): 'development' | 'production' | 'test' {
  const env = (value || 'development').toLowerCase();

  if (!VALID_ENVIRONMENTS.includes(env as 'development' | 'production' | 'test')) {
    throw new ConfigurationError(
      `Configuration field "environment" must be one of: ${VALID_ENVIRONMENTS.join(', ')}, got "${env}"`,
      {
        field: 'environment',
        value: env,
        validValues: VALID_ENVIRONMENTS,
      }
    );
  }

  return env as 'development' | 'production' | 'test';
}

/**
 * Validates log level
 */
export function validateLogLevel(value: string | undefined): LogLevel {
  const level = (value || 'INFO').toUpperCase();

  if (!VALID_LOG_LEVELS.includes(level as LogLevel)) {
    throw new ConfigurationError(
      `Configuration field "logLevel" must be one of: ${VALID_LOG_LEVELS.join(', ')}, got "${level}"`,
      {
        field: 'logLevel',
        value: level,
        validValues: VALID_LOG_LEVELS,
      }
    );
  }

  return level as LogLevel;
}

/**
 * Validates a hostname/IP address
 */
export function validateHost(value: string | undefined, fieldName: string): string {
  if (value === undefined || value === '') {
    throw new ConfigurationError(`Required configuration field "${fieldName}" is missing or empty`, {
      field: fieldName,
    });
  }

  // Basic validation: not empty, no spaces, reasonable length
  if (value.trim() !== value || value.length > 253) {
    throw new ConfigurationError(`Configuration field "${fieldName}" contains invalid characters or is too long`, {
      field: fieldName,
      value,
    });
  }

  return value;
}
