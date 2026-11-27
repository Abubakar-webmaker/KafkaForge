/**
 * Configuration loading and validation
 *
 * This module reads environment variables, applies defaults,
 * validates all values, and returns an immutable configuration object.
 */

import { DEFAULT_CONFIG } from './defaults.js';
import { getEnvironmentVariable } from './environment.js';
import {
  validateEnvironment,
  validateHost,
  validateLogLevel,
  validatePort,
  validatePositiveInteger,
  validateRequired,
} from './validation.js';
import type { Config, RawConfig } from './types.js';

/**
 * Load and validate configuration
 *
 * Process:
 * 1. Read environment variables (KAFKAFORGE_* prefix)
 * 2. Fall back to defaults for missing values
 * 3. Apply CLI overrides if provided
 * 4. Validate all values with descriptive errors
 * 5. Freeze configuration to prevent modifications
 * 6. Return immutable Config object
 *
 * @param overrideLogLevel Optional log level from CLI to override env/defaults
 * @throws {ConfigurationError} If any configuration value is invalid
 * @returns {Config} Validated and immutable configuration
 */
export function loadConfiguration(overrideLogLevel?: string): Config {
  // Read raw config from environment + defaults
  const raw = readRawConfiguration();

  // Apply CLI override for log level if provided
  if (overrideLogLevel !== undefined) {
    raw.logLevel = validateLogLevel(overrideLogLevel);
  }

  // Validate all fields
  validateConfiguration(raw);

  // Deep freeze to prevent modifications
  deepFreeze(raw);

  // Return as immutable Config type
  return raw as Config;
}

/**
 * Deep freeze an object recursively
 */
function deepFreeze(obj: any): void {
  Object.freeze(obj);

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
        deepFreeze(value);
      }
    }
  }
}

/**
 * Read raw configuration from environment with defaults
 */
function readRawConfiguration(): RawConfig {
  const envValue = getEnvironmentVariable('KAFKAFORGE_ENV');
  const logLevelValue = getEnvironmentVariable('KAFKAFORGE_LOG_LEVEL');
  const portValue = getEnvironmentVariable('KAFKAFORGE_PORT');
  const maxRequestSizeValue = getEnvironmentVariable('KAFKAFORGE_MAX_REQUEST_SIZE_BYTES');

  return {
    environment: validateEnvironment(envValue),
    applicationName: getEnvironmentVariable('KAFKAFORGE_APP_NAME') || DEFAULT_CONFIG.applicationName,
    applicationVersion: getEnvironmentVariable('KAFKAFORGE_APP_VERSION') || DEFAULT_CONFIG.applicationVersion,
    logLevel: validateLogLevel(logLevelValue),
    shutdownTimeoutMs: parseInt(getEnvironmentVariable('KAFKAFORGE_SHUTDOWN_TIMEOUT_MS') || '', 10) || DEFAULT_CONFIG.shutdownTimeoutMs,

    brokerId: getEnvironmentVariable('KAFKAFORGE_BROKER_ID') || DEFAULT_CONFIG.brokerId,
    host: getEnvironmentVariable('KAFKAFORGE_HOST') || DEFAULT_CONFIG.host,
    port: portValue ? validatePort(portValue, 'port') : DEFAULT_CONFIG.port,
    maxRequestSizeBytes: maxRequestSizeValue ? validatePositiveInteger(maxRequestSizeValue, 'maxRequestSizeBytes', 1024) : DEFAULT_CONFIG.maxRequestSizeBytes,
  };
}

/**
 * Validate all configuration values
 * Throws ConfigurationError if any value is invalid
 */
function validateConfiguration(config: RawConfig): void {
  // Application configuration
  validateRequired(config.applicationName, 'applicationName');
  validateRequired(config.applicationVersion, 'applicationVersion');

  // Environment and logging
  validateEnvironment(config.environment);
  validateLogLevel(config.logLevel);
  validatePositiveInteger(config.shutdownTimeoutMs, 'shutdownTimeoutMs', 100);

  // Broker configuration
  validateRequired(config.brokerId, 'brokerId');
  validateHost(config.host, 'host');
  validatePort(config.port, 'port');
  validatePositiveInteger(config.maxRequestSizeBytes, 'maxRequestSizeBytes', 1024);
}

/**
 * Get current configuration singleton instance
 * This is populated once at application startup
 */
let configurationInstance: Config | null = null;

/**
 * Initialize global configuration
 * Must be called exactly once during application bootstrap
 *
 * @param overrideLogLevel Optional log level from CLI to override env/defaults
 */
export function initializeConfiguration(overrideLogLevel?: string): Config {
  if (configurationInstance !== null) {
    throw new Error('Configuration already initialized');
  }

  configurationInstance = loadConfiguration(overrideLogLevel);
  return configurationInstance;
}

/**
 * Get the current configuration
 * Returns null if configuration has not been initialized
 */
export function getConfiguration(): Config | null {
  return configurationInstance;
}

/**
 * Get the current configuration or throw if not initialized
 */
export function requireConfiguration(): Config {
  if (configurationInstance === null) {
    throw new Error('Configuration not initialized. Call initializeConfiguration() first.');
  }

  return configurationInstance;
}
