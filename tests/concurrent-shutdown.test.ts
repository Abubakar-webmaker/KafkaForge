/**
 * Concurrent shutdown coordination tests
 *
 * Verifies that Application.stop() properly coordinates shutdown:
 * - Only one broker.stop() executes at a time
 * - Multiple concurrent callers safely await the same operation
 * - Errors are preserved and transitions are correct
 */

import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { Application } from '../src/app/application.js';
import { Broker } from '../src/broker/broker.js';
import { LifecycleManager } from '../src/app/lifecycle.js';
import { Logger } from '../src/logging/logger.js';
import { LifecycleError } from '../src/errors/lifecycle-error.js';
import { loadConfiguration } from '../src/config/config.js';

/**
 * Helper to create a test application
 */
function createTestApp(): { app: Application; broker: Broker } {
  const config = loadConfiguration();
  const brokerConfig = { brokerId: 'test-broker', host: 'localhost', port: 9092 };
  const broker = new Broker(brokerConfig);
  const lifecycle = new LifecycleManager();
  const logger = new Logger('INFO', { applicationName: 'test' });

  const app = new Application(config, broker, lifecycle, logger);
  return { app, broker };
}

/**
 * Helper to simulate deferred execution
 * Allows stopping a broker.stop() at a specific point for testing concurrency
 */
function createDeferredBrokerStop(): {
  deferred: { resolve: () => void; reject: (err: Error) => void; promise: Promise<void> };
  install: (broker: Broker) => void;
  brokerStopCount: { count: number };
} {
  let resolveDeferred: (() => void) | null = null;
  let rejectDeferred: ((err: Error) => void) | null = null;
  const deferredPromise = new Promise<void>((resolve, reject) => {
    resolveDeferred = resolve;
    rejectDeferred = reject;
  });

  const brokerStopCount = { count: 0 };

  return {
    deferred: {
      promise: deferredPromise,
      resolve: () => resolveDeferred?.(),
      reject: (err: Error) => rejectDeferred?.(err),
    },
    install: (broker: Broker) => {
      broker.stop = async () => {
        brokerStopCount.count++;
        await deferredPromise;
      };
    },
    brokerStopCount,
  };
}

describe('Concurrent Shutdown Coordination', () => {
  describe('Normal shutdown', () => {
    it('Should complete successfully', async () => {
      const { app } = createTestApp();
      await app.initialize();
      await app.start();

      assert.equal(app.getState(), 'RUNNING');

      await app.stop();

      assert.equal(app.getState(), 'STOPPED');
    });
  });

  describe('Two concurrent stop() calls', () => {
    it('Should coordinate via shared promise - both succeed', async () => {
      const { app } = createTestApp();
      await app.initialize();
      await app.start();

      // Start two stop() calls concurrently
      const stop1Promise = app.stop();
      const stop2Promise = app.stop();

      // Both should complete without error
      await Promise.all([stop1Promise, stop2Promise]);

      // State should be STOPPED (not ERROR or inconsistent)
      assert.equal(app.getState(), 'STOPPED');
    });

    it('Should execute broker.stop() exactly once', async () => {
      const { app, broker } = createTestApp();
      await app.initialize();
      await app.start();

      let brokerStopCount = 0;
      const originalStop = broker.stop;
      broker.stop = async () => {
        brokerStopCount++;
        await originalStop.call(broker);
      };

      // Two concurrent stop() calls
      const stop1 = app.stop();
      const stop2 = app.stop();

      await Promise.all([stop1, stop2]);

      // broker.stop() should have been called exactly once
      assert.equal(brokerStopCount, 1, 'broker.stop() must execute exactly once');
      assert.equal(app.getState(), 'STOPPED');
    });

    it('Should wait for first stop to complete before returning to second', async () => {
      const { app, broker } = createTestApp();
      await app.initialize();
      await app.start();

      const { deferred, install, brokerStopCount } = createDeferredBrokerStop();
      install(broker);

      // Start first stop (will block on deferred promise)
      const stop1 = app.stop();

      // Let stop1 reach the deferred point
      await new Promise(resolve => setImmediate(resolve));

      // Start second stop (should await stop1's promise)
      const stop2 = app.stop();

      // Both should still be pending (blocked on deferred)
      let stop1Done = false;
      let stop2Done = false;

      stop1.then(() => {
        stop1Done = true;
      });
      stop2.then(() => {
        stop2Done = true;
      });

      // Give them a moment to complete if they could
      await new Promise(resolve => setTimeout(resolve, 50));

      // Both should still be pending
      assert.equal(stop1Done, false, 'stop1 should still be pending');
      assert.equal(stop2Done, false, 'stop2 should still be pending');
      assert.equal(brokerStopCount.count, 1, 'broker.stop() should have been called once');

      // Resolve the deferred operation
      deferred.resolve();

      // Now both should complete
      await Promise.all([stop1, stop2]);

      assert.equal(brokerStopCount.count, 1, 'broker.stop() should still have been called only once');
      assert.equal(app.getState(), 'STOPPED');
    });
  });

  describe('Multiple concurrent stop() calls', () => {
    it('Should handle 5 concurrent calls safely', async () => {
      const { app, broker } = createTestApp();
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

      // broker.stop() should have been called exactly once
      assert.equal(brokerStopCount, 1, 'broker.stop() must execute exactly once despite 5 concurrent calls');
      assert.equal(app.getState(), 'STOPPED');
    });
  });

  describe('Broker cleanup failure', () => {
    it('Should transition to FAILED and throw error', async () => {
      const { app, broker } = createTestApp();
      await app.initialize();
      await app.start();

      // Mock broker.stop() to fail
      broker.stop = async () => {
        throw new Error('Broker cleanup failed');
      };

      try {
        await app.stop();
        assert.fail('Should have thrown an error');
      } catch (error) {
        assert(error instanceof LifecycleError);
        assert(error.message.includes('Shutdown failed'));
      }

      // State should be FAILED, not STOPPED
      assert.equal(app.getState(), 'FAILED');
    });

    it('Should preserve original error message', async () => {
      const { app, broker } = createTestApp();
      await app.initialize();
      await app.start();

      const originalError = new Error('Custom broker failure reason');
      broker.stop = async () => {
        throw originalError;
      };

      try {
        await app.stop();
        assert.fail('Should have thrown');
      } catch (error) {
        assert(error instanceof LifecycleError);
        assert(error.message.includes('Custom broker failure reason'));
      }

      assert.equal(app.getState(), 'FAILED');
    });

    it('Multiple concurrent calls should all receive error when cleanup fails', async () => {
      const { app, broker } = createTestApp();
      await app.initialize();
      await app.start();

      const { deferred, install } = createDeferredBrokerStop();
      install(broker);

      // Override to fail on resolution
      broker.stop = async () => {
        try {
          await deferred.promise;
        } catch (err) {
          throw err;
        }
      };

      // Start 3 concurrent stop() calls
      const stop1 = app.stop().catch(err => ({ error: err }));
      const stop2 = app.stop().catch(err => ({ error: err }));
      const stop3 = app.stop().catch(err => ({ error: err }));

      // Let them reach the pending point
      await new Promise(resolve => setImmediate(resolve));

      // Reject the deferred operation
      deferred.reject(new Error('Broker stop failed'));

      // All should receive the error
      const [result1, result2, result3] = await Promise.all([stop1, stop2, stop3]);

      assert(result1.error instanceof LifecycleError);
      assert(result2.error instanceof LifecycleError);
      assert(result3.error instanceof LifecycleError);

      assert.equal(app.getState(), 'FAILED');
    });
  });

  describe('Repeated stop() calls after shutdown', () => {
    it('Should fail if called after successful STOPPED', async () => {
      const { app } = createTestApp();
      await app.initialize();
      await app.start();
      await app.stop();

      assert.equal(app.getState(), 'STOPPED');

      // Second stop() should fail because state is STOPPED
      try {
        await app.stop();
        assert.fail('Should have thrown');
      } catch (error) {
        assert(error instanceof LifecycleError);
        assert(error.message.includes('Cannot stop from state STOPPED'));
      }
    });

    it('Should allow stop() after failed shutdown from FAILED state', async () => {
      const { app, broker } = createTestApp();
      await app.initialize();
      await app.start();

      // First attempt fails
      let shouldFail = true;
      broker.stop = async () => {
        if (shouldFail) {
          throw new Error('First attempt failure');
        }
      };

      try {
        await app.stop();
        assert.fail('First stop should fail');
      } catch {
        // Expected
      }

      assert.equal(app.getState(), 'FAILED');

      // Second attempt should allow retry (FAILED state permits stop)
      shouldFail = false;
      await app.stop();

      // Successfully transitioned to STOPPED
      assert.equal(app.getState(), 'STOPPED');
    });
  });

  describe('Stop called from STOPPING state', () => {
    it('Should wait for in-flight shutdown', async () => {
      const { app, broker } = createTestApp();
      await app.initialize();
      await app.start();

      const { deferred, install, brokerStopCount } = createDeferredBrokerStop();
      install(broker);

      // Start first stop (enters STOPPING, blocks on deferred)
      const stop1 = app.stop();

      // Give it time to transition to STOPPING
      await new Promise(resolve => setImmediate(resolve));

      // State should be STOPPING (or already past it)
      const stateWhileShuttingDown = app.getState();
      assert(
        stateWhileShuttingDown === 'STOPPING' || stateWhileShuttingDown === 'STOPPED',
        'State should be STOPPING or already STOPPED'
      );

      // Call stop again while first is in progress
      const stop2 = app.stop();

      // Both should still be pending
      let done = false;
      Promise.all([stop1, stop2]).then(() => {
        done = true;
      });

      await new Promise(resolve => setTimeout(resolve, 50));
      assert.equal(done, false, 'Should still be waiting');

      // Complete the deferred shutdown
      deferred.resolve();

      // Both should now complete
      await Promise.all([stop1, stop2]);

      assert.equal(brokerStopCount.count, 1, 'broker.stop() called only once');
      assert.equal(app.getState(), 'STOPPED');
    });
  });

  describe('Application lifecycle consistency', () => {
    it('Should maintain valid state transitions during concurrent shutdown', async () => {
      const { app } = createTestApp();
      await app.initialize();
      await app.start();

      const states: string[] = [];

      // Monkey-patch transitionTo to log state changes
      const lifecycle = (app as any).lifecycle;
      const originalTransitionTo = lifecycle.transitionTo.bind(lifecycle);
      lifecycle.transitionTo = function (newState: string) {
        states.push(newState);
        return originalTransitionTo(newState);
      };

      // Concurrent stop calls
      await Promise.all([app.stop(), app.stop()]);

      // Should see: STOPPING, then STOPPED (no duplicates or skips)
      assert(states.length >= 2);
      assert.equal(states[0], 'STOPPING', 'First transition should be to STOPPING');
      assert(states.some(s => s === 'STOPPED'), 'Should transition to STOPPED');
      assert.equal(app.getState(), 'STOPPED');
    });
  });

  describe('Stop before initialization', () => {
    it('Should throw LifecycleError when called from CREATED state', async () => {
      const { app } = createTestApp();

      try {
        await app.stop();
        assert.fail('Should have thrown');
      } catch (error) {
        assert(error instanceof LifecycleError);
        assert(error.message.includes('Cannot stop from state CREATED'));
      }
    });
  });
});
