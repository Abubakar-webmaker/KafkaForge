/**
 * ID generation tests
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateId, generateRequestId, generateCorrelationId, isValidId } from '../../../src/utils/id.js';

test('ID - Generates valid hex string', () => {
  const id = generateId();

  assert.ok(typeof id === 'string');
  assert.ok(id.length > 0);
  assert.ok(/^[a-f0-9]+$/.test(id), 'Should be hex string');
});

test('ID - Generated IDs are unique', () => {
  const ids = new Set<string>();

  for (let i = 0; i < 100; i++) {
    ids.add(generateId());
  }

  assert.equal(ids.size, 100, 'All generated IDs should be unique');
});

test('ID - RequestId works', () => {
  const id = generateRequestId();

  assert.ok(typeof id === 'string');
  assert.ok(id.length > 0);
});

test('ID - CorrelationId works', () => {
  const id = generateCorrelationId();

  assert.ok(typeof id === 'string');
  assert.ok(id.length > 0);
});

test('ID - Validation rejects invalid formats', () => {
  assert.equal(isValidId(''), false);
  assert.equal(isValidId('not-hex-at-all'), false);
  assert.equal(isValidId(123), false);
  assert.equal(isValidId(null), false);
  assert.equal(isValidId(undefined), false);
});

test('ID - Validation accepts valid ID format', () => {
  const id = generateId();
  assert.equal(isValidId(id), true);
});
