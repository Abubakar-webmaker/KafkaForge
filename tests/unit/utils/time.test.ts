/**
 * Time utility tests
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getCurrentTimestamp,
  getCurrentIsoTimestamp,
  startTimer,
  sleep,
  secondsToMs,
  msToSeconds,
} from '../../../src/utils/time.js';

test('Time - getCurrentTimestamp returns number', () => {
  const timestamp = getCurrentTimestamp();

  assert.ok(typeof timestamp === 'number');
  assert.ok(timestamp > 0);
});

test('Time - getCurrentIsoTimestamp returns ISO string', () => {
  const iso = getCurrentIsoTimestamp();

  assert.ok(typeof iso === 'string');
  assert.ok(iso.includes('T'));
  assert.ok(iso.includes('Z'));
  assert.ok(!isNaN(Date.parse(iso)), 'Should be valid ISO 8601');
});

test('Time - Timer measures elapsed time', async () => {
  const timer = startTimer();

  await sleep(50);

  const elapsed = timer();

  assert.ok(typeof elapsed === 'number');
  assert.ok(elapsed >= 40, `Elapsed should be ~50ms, got ${elapsed}`);
  assert.ok(elapsed < 200, `Elapsed should not be too long, got ${elapsed}`);
});

test('Time - Sleep works', async () => {
  const timer = startTimer();

  await sleep(30);

  const elapsed = timer();

  assert.ok(elapsed >= 20, `Sleep(30) should take at least 20ms, got ${elapsed}`);
});

test('Time - Conversion functions work', () => {
  assert.equal(secondsToMs(1), 1000);
  assert.equal(secondsToMs(0.5), 500);
  assert.equal(msToSeconds(1000), 1);
  assert.equal(msToSeconds(500), 0.5);
});
