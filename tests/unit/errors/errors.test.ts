/**
 * Error hierarchy tests
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BaseError,
  ConfigurationError,
  InitializationError,
  LifecycleError,
  serializeError,
} from '../../../src/errors/index.js';

test('Errors - BaseError stores code and context', () => {
  const context = { field: 'testField' };
  const error = new BaseError('Test error', 'CFG_E_001', 'operational', context);

  assert.equal(error.message, 'Test error');
  assert.equal(error.code, 'CFG_E_001');
  assert.equal(error.classification, 'operational');
  assert.deepEqual(error.context, context);
});

test('Errors - BaseError preserves cause', () => {
  const cause = new Error('Original error');
  const error = new BaseError('Wrapped error', 'APP_E_999', 'programming', {}, cause);

  assert.equal(error.cause, cause);
});

test('Errors - ConfigurationError is operational', () => {
  const error = new ConfigurationError('Missing config');

  assert.equal(error.classification, 'operational');
  assert.equal(error.isOperational(), true);
  assert.equal(error.isProgrammingError(), false);
});

test('Errors - InitializationError is operational', () => {
  const error = new InitializationError('Init failed');

  assert.equal(error.classification, 'operational');
  assert.equal(error.isOperational(), true);
});

test('Errors - LifecycleError is operational', () => {
  const error = new LifecycleError('Invalid transition');

  assert.equal(error.classification, 'operational');
  assert.equal(error.isOperational(), true);
});

test('Errors - Error chain generation', () => {
  const cause1 = new Error('Root cause');
  const cause2 = new BaseError('Intermediate', 'APP_E_999', 'programming', {}, cause1);
  const cause3 = new BaseError('Top level', 'APP_E_999', 'programming', {}, cause2);

  const chain = cause3.getErrorChain();

  assert.equal(chain.length, 3);
  assert.equal(chain[0], cause3);
  assert.equal(chain[1], cause2);
  assert.equal(chain[2], cause1);
});

test('Errors - Serialization is safe', () => {
  const error = new BaseError('Test', 'APP_E_999', 'operational', { field: 'value' });
  const serialized = error.toJSON();

  assert.equal(serialized.code, 'APP_E_999');
  assert.equal(serialized.message, 'Test');
  assert.equal(serialized.classification, 'operational');
  assert.ok(serialized.timestamp);
});

test('Errors - Redacts sensitive data', () => {
  // Test that sensitive keys are redacted from object properties
  const errorWithSecrets = {
    message: 'Error',
    password: 'secret123',
    apiKey: 'xyz789',
    normalField: 'value',
  };

  const serialized = serializeError(errorWithSecrets);
  const json = JSON.stringify(serialized);

  // Sensitive keys should be redacted
  assert.ok(json.includes('[REDACTED]'), 'Sensitive data should be redacted');
  assert.ok(!json.includes('secret123'), 'Password should be redacted');
  assert.ok(!json.includes('xyz789'), 'API key should be redacted');
  assert.ok(json.includes('value'), 'Normal fields should remain');
});

test('Errors - Handles circular references', () => {
  const obj: Record<string, any> = { a: 1 };
  obj.self = obj; // Create circular reference

  const serialized = serializeError({ data: obj });

  // Should not throw and should contain something
  assert.ok(serialized);
  assert.ok(JSON.stringify(serialized)); // Should be stringifiable
});
