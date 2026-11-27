/**
 * Type definitions for KafkaForge configuration
 */

import type { DeepReadonly, Environment } from '../types/common.js';
import type { LogLevel } from '../logging/log-level.js';

/**
 * Complete configuration object
 * Immutable after initialization
 */
export interface Config extends DeepReadonly<RawConfig> {
  readonly isValid: true;
}

/**
 * Raw configuration before validation
 */
export interface RawConfig {
  // Application settings
  environment: Environment;
  applicationName: string;
  applicationVersion: string;
  logLevel: LogLevel;
  shutdownTimeoutMs: number;

  // Broker settings
  brokerId: string;
  host: string;
  port: number;
  maxRequestSizeBytes: number;
}

/**
 * Configuration value types for validation
 */
export interface ConfigValue {
  environment: string | undefined;
  applicationName: string | undefined;
  applicationVersion: string | undefined;
  logLevel: string | undefined;
  shutdownTimeoutMs: string | number | undefined;
  brokerId: string | undefined;
  host: string | undefined;
  port: string | number | undefined;
  maxRequestSizeBytes: string | number | undefined;
}
