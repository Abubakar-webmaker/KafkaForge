/**
 * Stable error codes for KafkaForge
 *
 * Error codes are stable identifiers that remain constant
 * across versions, allowing reliable error handling in production.
 *
 * Code format: [DOMAIN][SEVERITY][NUMBER]
 * - DOMAIN: 2 chars (CFG=Config, APP=Application, BRK=Broker, etc.)
 * - SEVERITY: 1 char (E=Error, W=Warning, F=Fatal)
 * - NUMBER: 3 digits (001-999)
 */

export const ERROR_CODES = {
  // Configuration errors
  CONFIG_MISSING_VALUE: 'CFG_E_001',
  CONFIG_INVALID_TYPE: 'CFG_E_002',
  CONFIG_INVALID_RANGE: 'CFG_E_003',
  CONFIG_INVALID_VALUE: 'CFG_E_004',

  // Initialization errors
  INIT_FAILED: 'INIT_E_001',
  INIT_DEPENDENCY_FAILED: 'INIT_E_002',
  INIT_ALREADY_INITIALIZED: 'INIT_E_003',

  // Lifecycle errors
  LIFECYCLE_INVALID_TRANSITION: 'LC_E_001',
  LIFECYCLE_ALREADY_RUNNING: 'LC_E_002',
  LIFECYCLE_NOT_INITIALIZED: 'LC_E_003',
  LIFECYCLE_SHUTDOWN_TIMEOUT: 'LC_E_004',
  LIFECYCLE_CLEANUP_FAILED: 'LC_E_005',

  // General application errors
  UNKNOWN_ERROR: 'APP_E_999',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
