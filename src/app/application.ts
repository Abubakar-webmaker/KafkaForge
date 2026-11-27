/**
 * Main Application class
 *
 * Orchestrates:
 * - Configuration
 * - Logging
 * - Broker
 * - Lifecycle
 * - Startup and shutdown
 */

import { LifecycleError } from '../errors/lifecycle-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';
import { startTimer } from '../utils/time.js';
import { LifecycleManager } from './lifecycle.js';
import type { Config } from '../config/types.js';
import type { Broker } from '../broker/broker.js';
import type { Logger } from '../logging/logger.js';

export class Application {
  private config: Config;
  private broker: Broker;
  private lifecycle: LifecycleManager;
  private logger: Logger;
  
  /**
   * Tracks in-flight shutdown operation to prevent concurrent execution
   * - null: No shutdown in progress
   * - Promise: Shutdown currently executing, all callers await this promise
   */
  private shutdownPromise: Promise<void> | null = null;

  constructor(config: Config, broker: Broker, lifecycle: LifecycleManager, logger: Logger) {
    this.config = config;
    this.broker = broker;
    this.lifecycle = lifecycle;
    this.logger = logger;
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    this.lifecycle.requireState('CREATED');

    try {
      this.lifecycle.transitionTo('INITIALIZING');
      this.logger.debug('Application initializing');

      // Initialize broker
      await this.broker.initialize();
      this.logger.debug('Broker initialized', { brokerId: this.broker.getBrokerId() });

      this.lifecycle.transitionTo('INITIALIZED');
      this.logger.info('Application initialized successfully');
    } catch (error) {
      this.lifecycle.transitionTo('FAILED', error instanceof Error ? error.message : String(error));
      this.logger.error(
        'Application initialization failed',
        {},
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Start the application
   */
  async start(): Promise<void> {
    this.lifecycle.requireState('INITIALIZED');

    try {
      const timer = startTimer();
      this.lifecycle.transitionTo('STARTING');
      this.logger.debug('Application starting');

      // Start broker
      await this.broker.start();
      this.logger.debug('Broker started', { brokerId: this.broker.getBrokerId() });

      this.lifecycle.transitionTo('RUNNING');

      const elapsed = timer();
      this.logger.info('Application running', {
        brokerId: this.broker.getBrokerId(),
        startupMs: elapsed,
      });
    } catch (error) {
      this.lifecycle.transitionTo('FAILED', error instanceof Error ? error.message : String(error));
      this.logger.error(
        'Application startup failed',
        {},
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Stop the application gracefully
   *
   * Coordination:
   * - Only one broker.stop() may execute at a time
   * - Concurrent callers safely await the same shutdown operation
   * - If already stopping, subsequent calls await the in-flight operation
   * - Errors preserve cleanup failure (transitions to FAILED, not STOPPED)
   *
   * @throws {LifecycleError} If stop() cannot be initiated from current state,
   *         or if cleanup fails (transitions to FAILED and throws)
   */
  async stop(): Promise<void> {
    // If shutdown is already in progress, await it
    if (this.shutdownPromise !== null) {
      return this.shutdownPromise;
    }

    // If not in a state where stop can be initiated, fail immediately
    if (!this.lifecycle.isInAnyState('RUNNING', 'INITIALIZED', 'FAILED')) {
      throw new LifecycleError(
        `Cannot stop from state ${this.lifecycle.getState()}`,
        ERROR_CODES.LIFECYCLE_INVALID_TRANSITION,
        {
          state: this.lifecycle.getState(),
        }
      );
    }

    // Create the shutdown promise and store it
    // Multiple concurrent callers will all await this same promise
    this.shutdownPromise = this._executeShutdown();

    try {
      await this.shutdownPromise;
    } finally {
      // Reset shutdown tracking for future stop attempts
      // Note: In STOPPED state, further stop() calls will fail the state check above
      // In FAILED state, further stop() calls will execute shutdown again
      this.shutdownPromise = null;
    }
  }

  /**
   * Internal shutdown implementation
   * Only called once per shutdown sequence due to shutdownPromise guard
   * @private
   */
  private async _executeShutdown(): Promise<void> {
    try {
      const timer = startTimer();
      this.lifecycle.transitionTo('STOPPING');
      this.logger.info('Application stopping');

      // Stop broker - only executes once due to shutdownPromise guard
      await this.broker.stop();
      this.logger.debug('Broker stopped');

      this.lifecycle.transitionTo('STOPPED');

      const elapsed = timer();
      this.logger.info('Application stopped successfully', {
        shutdownMs: elapsed,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Cleanup failed - transition to FAILED to reflect actual state
      // Do NOT transition to STOPPED - that would hide the cleanup failure
      this.logger.error('Error during shutdown', { error: errorMsg }, error instanceof Error ? error : undefined);

      try {
        this.lifecycle.transitionTo('FAILED', `Cleanup failed: ${errorMsg}`);
      } catch (transitionError) {
        // If we can't even transition to FAILED, just log it
        this.logger.error(
          'Failed to transition to FAILED state during cleanup error',
          {},
          transitionError instanceof Error ? transitionError : undefined
        );
      }

      throw new LifecycleError(
        `Shutdown failed: ${errorMsg}`,
        ERROR_CODES.LIFECYCLE_CLEANUP_FAILED,
        { error: errorMsg },
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Check if application is healthy
   */
  isHealthy(): boolean {
    const state = this.lifecycle.getState();
    return state === 'RUNNING' || state === 'INITIALIZED';
  }

  /**
   * Get current lifecycle state
   */
  getState() {
    return this.lifecycle.getState();
  }

  /**
   * Get configuration
   */
  getConfig(): Config {
    return this.config;
  }

  /**
   * Get broker
   */
  getBroker(): Broker {
    return this.broker;
  }
}
