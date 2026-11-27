/**
 * Tests for Phase 1 Critical Fixes
 *
 * This test file verifies that all critical and high-priority fixes
 * identified in the Phase 1 audit are working correctly.
 *
 * FIX #1: Application.stop() - Transition to FAILED instead of STOPPED on cleanup error
 * FIX #2: Broker.start() - Throw InitializationError instead of generic Error
 * FIX #3: CLI --log-level - Parse and apply log level from CLI arguments
 * FIX #4: setupSignalHandlers() - Prevent duplicate listener registration
 */

import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { Application } from '../src/app/application.js';
import { Broker } from '../src/broker/broker.js';
import { LifecycleManager } from '../src/app/lifecycle.js';
import { Logger } from '../src/logging/logger.js';
import { InitializationError } from '../src/errors/initialization-error.js';
import { LifecycleError } from '../src/errors/lifecycle-error.js';
import { loadConfiguration } from '../src/config/config.js';
import { parseArgs } from '../src/cli/index.js';

describe('Fixes - Phase 1 Critical Issues', () => {
  describe('FIX #1: Application.stop() failure state handling', () => {
    it('Should transition to FAILED state when broker cleanup fails', async () => {
      // Create a broker that will fail during cleanup
      const brokerConfig = { brokerId: 'test-broker', host: 'localhost', port: 9092 };
      const broker = new Broker(brokerConfig);

      const config = loadConfiguration();
      const lifecycle = new LifecycleManager();
      const logger = new Logger('INFO', { applicationName: 'test' });

      const app = new Application(config, broker, lifecycle, logger);

      // Initialize the app to get it to INITIALIZED state
      await app.initialize();

      // Start the app to get it to RUNNING state
      await app.start();

      // Verify we're in RUNNING state
      assert.equal(app.getState(), 'RUNNING', 'Application should be in RUNNING state');

      // Mock broker cleanup to fail
      const originalStop = broker.stop;
      broker.stop = async () => {
        throw new Error('Broker cleanup failed');
      };

      // Stop the app - this should transition to FAILED due to broker cleanup error
      try {
        await app.stop();
        assert.fail('Should have thrown an error');
      } catch (error) {
        // Expected - stop should throw when cleanup fails
        assert(error instanceof Error);
      }

      // Verify that app transitioned to FAILED instead of STOPPED
      assert.equal(app.getState(), 'FAILED', 'Application should be in FAILED state after cleanup error');

      // Restore original stop method
      broker.stop = originalStop;
    });
  });

  describe('FIX #2: Broker.start() error handling', () => {
    it('Should throw InitializationError when broker not initialized', async () => {
      const brokerConfig = { brokerId: 'test-broker', host: 'localhost', port: 9092 };
      const broker = new Broker(brokerConfig);

      // Try to start without initializing first
      try {
        await broker.start();
        assert.fail('Should have thrown InitializationError');
      } catch (error) {
        assert(error instanceof InitializationError, 'Should throw InitializationError');
        assert(
          error.message.includes('not initialized'),
          'Error message should indicate broker not initialized'
        );
      }
    });

    it('Should successfully start initialized broker', async () => {
      const brokerConfig = { brokerId: 'test-broker', host: 'localhost', port: 9092 };
      const broker = new Broker(brokerConfig);

      // Initialize first
      await broker.initialize();

      // Now start should work without throwing
      await broker.start();

      // Verify broker is marked as started
      const state = broker.getState();
      assert(state.startedAt !== null, 'Broker should have startedAt timestamp');
    });
  });

  describe('FIX #3: CLI --log-level argument parsing and application', () => {
    it('Should parse --log-level argument correctly', () => {
      const args1 = parseArgs(['--log-level', 'DEBUG']);
      assert.equal(args1.logLevel, 'DEBUG', 'Should parse DEBUG log level');

      const args2 = parseArgs(['--log-level', 'ERROR']);
      assert.equal(args2.logLevel, 'ERROR', 'Should parse ERROR log level');

      const args3 = parseArgs(['--help', '--log-level', 'WARN']);
      assert.equal(args3.help, true, 'Should parse help flag');
      assert.equal(args3.logLevel, 'WARN', 'Should parse log level with other flags');
    });

    it('Should handle missing log-level value gracefully', () => {
      const args = parseArgs(['--log-level']);
      assert.equal(args.logLevel, undefined, 'Should handle missing log-level value');
    });

    it('Should apply CLI log-level override to configuration', () => {
      // Test with DEBUG override
      const debugConfig = loadConfiguration('DEBUG');
      assert.equal(debugConfig.logLevel, 'DEBUG', 'Should apply CLI log level override to DEBUG');

      // Test with ERROR override
      const errorConfig = loadConfiguration('ERROR');
      assert.equal(errorConfig.logLevel, 'ERROR', 'Should apply CLI log level override to ERROR');
    });
  });

  describe('FIX #4: setupSignalHandlers() duplicate prevention', () => {
    it('Should not register duplicate signal handlers', async () => {
      const config = loadConfiguration();
      const brokerConfig = { brokerId: 'test-broker', host: 'localhost', port: 9092 };
      const broker = new Broker(brokerConfig);
      const lifecycle = new LifecycleManager();
      const logger = new Logger('INFO', { applicationName: 'test' });

      const app = new Application(config, broker, lifecycle, logger);

      // Import setupSignalHandlers to test
      const { setupSignalHandlers } = await import('../src/app/bootstrap.js');

      // Track listener count before
      const listeners1 = process.listeners('SIGINT').length;

      // Call setupSignalHandlers once
      setupSignalHandlers(app);
      const listeners2 = process.listeners('SIGINT').length;

      // Listener count should have increased
      assert(listeners2 > listeners1, 'Should add signal listeners');

      // Call setupSignalHandlers again
      setupSignalHandlers(app);
      const listeners3 = process.listeners('SIGINT').length;

      // Listener count should NOT increase again (guard prevented duplicate)
      assert.equal(
        listeners3,
        listeners2,
        'Should NOT add duplicate signal listeners on second call'
      );

      // Clean up: remove the listeners we added
      process.removeAllListeners('SIGINT');
      process.removeAllListeners('SIGTERM');
      process.removeAllListeners('uncaughtException');
      process.removeAllListeners('unhandledRejection');
    });
  });

  describe('Integration - Multiple fixes together', () => {
    it('Should handle CLI args parsing and log level application', () => {
      // Parse args with log-level
      const args = parseArgs(['--log-level', 'DEBUG', '--help']);

      // Verify both are captured
      assert.equal(args.help, true, 'Should parse help flag');
      assert.equal(args.logLevel, 'DEBUG', 'Should parse log level');

      // Load config with the parsed log level
      const config = loadConfiguration(args.logLevel);
      assert.equal(config.logLevel, 'DEBUG', 'Should apply parsed log level to config');
    });
  });

  describe('Concurrent Shutdown Coordination', () => {
    it('Two concurrent stop() calls should coordinate properly', async () => {
      const config = loadConfiguration();
      const brokerConfig = { brokerId: 'test-broker', host: 'localhost', port: 9092 };
      const broker = new Broker(brokerConfig);
      const lifecycle = new LifecycleManager();
      const logger = new Logger('INFO', { applicationName: 'test' });

      const app = new Application(config, broker, lifecycle, logger);
      await app.initialize();
      await app.start();

      // Track how many times broker.stop() is called
      let brokerStopCount = 0;
      const originalStop = broker.stop;
      broker.stop = async () => {
        brokerStopCount++;
        await originalStop.call(broker);
      };

      // Start two concurrent stop() calls
      const stop1 = app.stop();
      const stop2 = app.stop();

      // Both should complete without error
      await Promise.all([stop1, stop2]);

      // broker.stop() should have been called exactly once
      assert.equal(brokerStopCount, 1, 'broker.stop() must execute exactly once');
      assert.equal(app.getState(), 'STOPPED');
    });

    it('Multiple concurrent stop() calls should all coordinate safely', async () => {
      const config = loadConfiguration();
      const brokerConfig = { brokerId: 'test-broker', host: 'localhost', port: 9092 };
      const broker = new Broker(brokerConfig);
      const lifecycle = new LifecycleManager();
      const logger = new Logger('INFO', { applicationName: 'test' });

      const app = new Application(config, broker, lifecycle, logger);
      await app.initialize();
      await app.start();

      let brokerStopCount = 0;
      const originalStop = broker.stop;
      broker.stop = async () => {
        brokerStopCount++;
        await originalStop.call(broker);
      };

      // Start 5 concurrent stop() calls
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(app.stop());
      }

      await Promise.all(promises);

      assert.equal(brokerStopCount, 1, 'broker.stop() must execute exactly once despite 5 concurrent calls');
      assert.equal(app.getState(), 'STOPPED');
    });

    it('Second stop() after successful shutdown should fail', async () => {
      const config = loadConfiguration();
      const brokerConfig = { brokerId: 'test-broker', host: 'localhost', port: 9092 };
      const broker = new Broker(brokerConfig);
      const lifecycle = new LifecycleManager();
      const logger = new Logger('INFO', { applicationName: 'test' });

      const app = new Application(config, broker, lifecycle, logger);
      await app.initialize();
      await app.start();
      await app.stop();

      assert.equal(app.getState(), 'STOPPED');

      // Second stop() should fail
      try {
        await app.stop();
        assert.fail('Should have thrown');
      } catch (error) {
        assert(error instanceof LifecycleError);
        assert(error.message.includes('Cannot stop from state STOPPED'));
      }
    });

    it('Concurrent failure during shutdown should propagate to all callers', async () => {
      const config = loadConfiguration();
      const brokerConfig = { brokerId: 'test-broker', host: 'localhost', port: 9092 };
      const broker = new Broker(brokerConfig);
      const lifecycle = new LifecycleManager();
      const logger = new Logger('INFO', { applicationName: 'test' });

      const app = new Application(config, broker, lifecycle, logger);
      await app.initialize();
      await app.start();

      // Mock broker.stop() to fail
      broker.stop = async () => {
        throw new Error('Broker failure');
      };

      // Start 3 concurrent stop() calls
      const stop1 = app.stop().catch(err => ({ error: err }));
      const stop2 = app.stop().catch(err => ({ error: err }));
      const stop3 = app.stop().catch(err => ({ error: err }));

      const [result1, result2, result3] = await Promise.all([stop1, stop2, stop3]);

      // All should receive the error
      assert(result1.error instanceof LifecycleError);
      assert(result2.error instanceof LifecycleError);
      assert(result3.error instanceof LifecycleError);

      assert.equal(app.getState(), 'FAILED');
    });
  });
});
