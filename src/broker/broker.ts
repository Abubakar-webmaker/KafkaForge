/**
 * Broker domain model
 *
 * Phase 1: Minimal broker foundation
 * - Identity (brokerId)
 * - Configuration
 * - Lifecycle integration
 * - State tracking
 *
 * Future phases will add:
 * - TCP networking
 * - Kafka protocol
 * - Topics and partitions
 * - Message storage
 * - Replication
 */

import { InitializationError } from '../errors/initialization-error.js';
import { BrokerStateManager } from './broker-state.js';
import type { BrokerConfig } from './types.js';

export class Broker {
  private config: BrokerConfig;
  private stateManager: BrokerStateManager;

  constructor(config: BrokerConfig) {
    this.config = config;
    this.stateManager = new BrokerStateManager(config.brokerId);
  }

  /**
   * Initialize broker
   * @throws {InitializationError}
   */
  async initialize(): Promise<void> {
    // Phase 1: Minimal initialization
    // - Validate configuration
    // - Set up state tracking
    // - Verify broker identity

    if (this.stateManager.initialized()) {
      throw new InitializationError('Broker already initialized', {
        brokerId: this.config.brokerId,
      });
    }

    try {
      // Validate broker identity
      if (!this.config.brokerId || this.config.brokerId.length === 0) {
        throw new Error('Broker ID is empty');
      }

      // Validate configuration
      if (!this.config.host || this.config.host.length === 0) {
        throw new Error('Broker host is empty');
      }

      if (!Number.isInteger(this.config.port) || this.config.port < 0 || this.config.port > 65535) {
        throw new Error(`Invalid port: ${this.config.port}`);
      }

      // Mark as initialized
      this.stateManager.markInitialized();
    } catch (cause) {
      throw new InitializationError('Broker initialization failed', {
        brokerId: this.config.brokerId,
      }, cause instanceof Error ? cause : new Error(String(cause)));
    }
  }

  /**
   * Start broker
   * Phase 1: Just mark as started (no TCP server yet)
   * @throws {InitializationError}
   */
  async start(): Promise<void> {
    if (!this.stateManager.initialized()) {
      throw new InitializationError('Broker not initialized. Call initialize() first.', {
        brokerId: this.config.brokerId,
      });
    }

    this.stateManager.markStarted();
  }

  /**
   * Stop broker gracefully
   */
  async stop(): Promise<void> {
    // Phase 1: No resources to clean up yet
  }

  /**
   * Get broker ID
   */
  getBrokerId(): string {
    return this.config.brokerId;
  }

  /**
   * Get broker configuration
   */
  getConfig(): Readonly<BrokerConfig> {
    return this.config;
  }

  /**
   * Get broker state
   */
  getState() {
    return this.stateManager.getState();
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.stateManager.initialized();
  }

  /**
   * Get uptime in milliseconds
   */
  getUptimeMs(): number | null {
    return this.stateManager.getUptimeMs();
  }
}
