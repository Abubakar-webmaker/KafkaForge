/**
 * Application lifecycle integration tests
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Application } from '../../../src/app/application.js';
import { Broker } from '../../../src/broker/broker.js';
import { LifecycleManager } from '../../../src/app/lifecycle.js';
import { Logger } from '../../../src/logging/logger.js';

function createTestApplication() {
  const config = {
    environment: 'test' as const,
    applicationName: 'test-app',
    applicationVersion: '0.1.0',
    logLevel: 'ERROR' as const,
    shutdownTimeoutMs: 5000,
    brokerId: 'test-broker',
    host: 'localhost',
    port: 9092,
    maxRequestSizeBytes: 1024,
    isValid: true as const,
  };

  const broker = new Broker({
    brokerId: config.brokerId,
    host: config.host,
    port: config.port,
  });

  const lifecycle = new LifecycleManager();
  const logger = new Logger('ERROR');

  return new Application(config, broker, lifecycle, logger);
}

test('Application - Initialize and start lifecycle', async () => {
  const app = createTestApplication();

  assert.equal(app.getState(), 'CREATED');

  await app.initialize();
  assert.equal(app.getState(), 'INITIALIZED');

  await app.start();
  assert.equal(app.getState(), 'RUNNING');

  await app.stop();
  assert.equal(app.getState(), 'STOPPED');
});

test('Application - Cannot initialize twice', async () => {
  const app = createTestApplication();

  await app.initialize();

  assert.rejects(() => app.initialize(), /Expected state CREATED/);
});

test('Application - Cannot start before initialize', async () => {
  const app = createTestApplication();

  assert.rejects(() => app.start(), /Expected state INITIALIZED/);
});

test('Application - IsHealthy checks', async () => {
  const app = createTestApplication();

  assert.ok(!app.isHealthy());

  await app.initialize();
  assert.ok(app.isHealthy());

  await app.start();
  assert.ok(app.isHealthy());

  await app.stop();
  assert.ok(!app.isHealthy());
});

test('Application - Configuration is accessible', async () => {
  const app = createTestApplication();

  const config = app.getConfig();
  assert.equal(config.applicationName, 'test-app');
  assert.equal(config.brokerId, 'test-broker');
});

test('Application - Broker is accessible', async () => {
  const app = createTestApplication();

  const broker = app.getBroker();
  assert.equal(broker.getBrokerId(), 'test-broker');
});

test('Application - Stop is idempotent from INITIALIZED', async () => {
  const app = createTestApplication();

  await app.initialize();
  await app.stop();
  assert.equal(app.getState(), 'STOPPED');
});

test('Application - Cannot stop from CREATED', async () => {
  const app = createTestApplication();

  assert.rejects(() => app.stop(), /Cannot stop from state CREATED/);
});
