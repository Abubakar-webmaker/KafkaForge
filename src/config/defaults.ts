/**
 * Default configuration values
 *
 * These defaults are used when environment variables are not provided.
 * Defaults must be safe for development environments.
 */

import type { RawConfig } from './types.js';

export const DEFAULT_CONFIG: Readonly<RawConfig> = {
  // Application
  environment: 'development',
  applicationName: 'kafkaforge',
  applicationVersion: '0.1.0',
  logLevel: 'INFO',
  shutdownTimeoutMs: 30000,

  // Broker
  brokerId: 'broker-1',
  host: '0.0.0.0',
  port: 9092,
  maxRequestSizeBytes: 1024 * 1024, // 1 MB
} as const;
