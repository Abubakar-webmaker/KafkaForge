/**
 * Configuration system tests
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfiguration } from '../../../src/config/config.js';
import { ConfigurationError } from '../../../src/errors/configuration-error.js';

test('Configuration - Defaults', () => {
  const originalEnv = process.env;
  process.env = {};

  try {
    const config = loadConfiguration();

    assert.equal(config.environment, 'development');
    assert.equal(config.applicationName, 'kafkaforge');
    assert.equal(config.applicationVersion, '0.1.0');
    assert.equal(config.logLevel, 'INFO');
    assert.equal(config.shutdownTimeoutMs, 30000);
    assert.equal(config.brokerId, 'broker-1');
    assert.equal(config.host, '0.0.0.0');
    assert.equal(config.port, 9092);
    assert.equal(config.maxRequestSizeBytes, 1048576);
  } finally {
    process.env = originalEnv;
  }
});

test('Configuration - Valid environment variables', () => {
  const originalEnv = process.env;
  process.env = {
    KAFKAFORGE_ENV: 'production',
    KAFKAFORGE_LOG_LEVEL: 'ERROR',
    KAFKAFORGE_PORT: '8080',
    KAFKAFORGE_BROKER_ID: 'custom-broker',
  };

  try {
    const config = loadConfiguration();

    assert.equal(config.environment, 'production');
    assert.equal(config.logLevel, 'ERROR');
    assert.equal(config.port, 8080);
    assert.equal(config.brokerId, 'custom-broker');
  } finally {
    process.env = originalEnv;
  }
});

test('Configuration - Invalid environment value throws', () => {
  const originalEnv = process.env;
  process.env = {
    KAFKAFORGE_ENV: 'invalid',
  };

  try {
    assert.throws(() => loadConfiguration(), ConfigurationError);
  } finally {
    process.env = originalEnv;
  }
});

test('Configuration - Invalid log level throws', () => {
  const originalEnv = process.env;
  process.env = {
    KAFKAFORGE_LOG_LEVEL: 'INVALID',
  };

  try {
    assert.throws(() => loadConfiguration(), ConfigurationError);
  } finally {
    process.env = originalEnv;
  }
});

test('Configuration - Invalid port throws', () => {
  const originalEnv = process.env;
  process.env = {
    KAFKAFORGE_PORT: 'not-a-number',
  };

  try {
    assert.throws(() => loadConfiguration(), ConfigurationError);
  } finally {
    process.env = originalEnv;
  }
});

test('Configuration - Port out of range throws', () => {
  const originalEnv = process.env;
  process.env = {
    KAFKAFORGE_PORT: '99999',
  };

  try {
    assert.throws(() => loadConfiguration(), ConfigurationError);
  } finally {
    process.env = originalEnv;
  }
});

test('Configuration - Config is immutable', () => {
  const originalEnv = process.env;
  process.env = {};

  try {
    const config = loadConfiguration();

    assert.throws(() => {
      // @ts-ignore - intentionally testing immutability
      config.port = 8080;
    });
  } finally {
    process.env = originalEnv;
  }
});
