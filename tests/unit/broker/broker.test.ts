/**
 * Broker tests
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Broker } from '../../../src/broker/broker.js';
import { InitializationError } from '../../../src/errors/index.js';

test('Broker - Initialize succeeds with valid config', async () => {
  const broker = new Broker({
    brokerId: 'test-broker',
    host: 'localhost',
    port: 9092,
  });

  await broker.initialize();

  assert.ok(broker.isInitialized());
});

test('Broker - Duplicate initialize throws', async () => {
  const broker = new Broker({
    brokerId: 'test-broker',
    host: 'localhost',
    port: 9092,
  });

  await broker.initialize();

  assert.rejects(() => broker.initialize(), InitializationError);
});

test('Broker - Invalid broker ID throws', async () => {
  const broker = new Broker({
    brokerId: '',
    host: 'localhost',
    port: 9092,
  });

  assert.rejects(() => broker.initialize(), InitializationError);
});

test('Broker - Invalid port throws', async () => {
  const broker = new Broker({
    brokerId: 'test-broker',
    host: 'localhost',
    port: 99999 as any,
  });

  assert.rejects(() => broker.initialize(), InitializationError);
});

test('Broker - GetBrokerId works', async () => {
  const broker = new Broker({
    brokerId: 'my-broker',
    host: 'localhost',
    port: 9092,
  });

  assert.equal(broker.getBrokerId(), 'my-broker');
});

test('Broker - GetConfig returns broker config', async () => {
  const config = {
    brokerId: 'test-broker',
    host: 'localhost',
    port: 9092,
  };

  const broker = new Broker(config);

  const retrieved = broker.getConfig();
  assert.equal(retrieved.brokerId, config.brokerId);
  assert.equal(retrieved.host, config.host);
  assert.equal(retrieved.port, config.port);
});

test('Broker - Start and stop work', async () => {
  const broker = new Broker({
    brokerId: 'test-broker',
    host: 'localhost',
    port: 9092,
  });

  await broker.initialize();
  await broker.start();

  const state = broker.getState();
  assert.equal(state.isInitialized, true);

  await broker.stop();
});

test('Broker - Uptime calculation', async () => {
  const broker = new Broker({
    brokerId: 'test-broker',
    host: 'localhost',
    port: 9092,
  });

  assert.equal(broker.getUptimeMs(), null, 'Uptime should be null before start');

  await broker.initialize();
  await broker.start();

  const uptime = broker.getUptimeMs();
  assert.ok(uptime !== null && uptime >= 0, 'Uptime should be non-negative number');
});
