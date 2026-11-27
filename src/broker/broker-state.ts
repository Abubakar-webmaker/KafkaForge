/**
 * Broker state management
 */

export interface BrokerState {
  readonly brokerId: string;
  readonly isInitialized: boolean;
  readonly startedAt: Date | null;
}

export class BrokerStateManager {
  private brokerId: string;
  private isInitialized: boolean = false;
  private startedAt: Date | null = null;

  constructor(brokerId: string) {
    this.brokerId = brokerId;
  }

  /**
   * Get current state
   */
  getState(): BrokerState {
    return {
      brokerId: this.brokerId,
      isInitialized: this.isInitialized,
      startedAt: this.startedAt ? new Date(this.startedAt) : null,
    };
  }

  /**
   * Mark broker as initialized
   */
  markInitialized(): void {
    this.isInitialized = true;
  }

  /**
   * Mark broker as started
   */
  markStarted(): void {
    this.startedAt = new Date();
  }

  /**
   * Check if initialized
   */
  initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get uptime in milliseconds
   */
  getUptimeMs(): number | null {
    if (this.startedAt === null) {
      return null;
    }

    return Date.now() - this.startedAt.getTime();
  }
}
