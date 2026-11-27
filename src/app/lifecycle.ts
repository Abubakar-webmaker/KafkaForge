/**
 * Application lifecycle state machine
 *
 * States:
 * - CREATED: Application object created, not yet initialized
 * - INITIALIZING: Initialization in progress
 * - INITIALIZED: Initialization complete, ready to start
 * - STARTING: Startup in progress
 * - RUNNING: Fully running and operational
 * - STOPPING: Shutdown in progress
 * - STOPPED: Cleanly shut down
 * - FAILED: Entered error state and cannot recover
 */

import { LifecycleError } from '../errors/lifecycle-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';

export type LifecycleState = 'CREATED' | 'INITIALIZING' | 'INITIALIZED' | 'STARTING' | 'RUNNING' | 'STOPPING' | 'STOPPED' | 'FAILED';

/**
 * Valid state transitions
 */
const VALID_TRANSITIONS: Record<LifecycleState, LifecycleState[]> = {
  CREATED: ['INITIALIZING', 'FAILED'],
  INITIALIZING: ['INITIALIZED', 'FAILED'],
  INITIALIZED: ['STARTING', 'STOPPING', 'FAILED'],
  STARTING: ['RUNNING', 'FAILED'],
  RUNNING: ['STOPPING', 'FAILED'],
  STOPPING: ['STOPPED', 'FAILED'],
  STOPPED: [],
  FAILED: ['STOPPING', 'STOPPED'],
};

/**
 * Check if a transition is valid
 */
export function isValidTransition(from: LifecycleState, to: LifecycleState): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

/**
 * Check if state is terminal (no more transitions possible)
 */
export function isTerminalState(state: LifecycleState): boolean {
  return state === 'STOPPED' || state === 'FAILED';
}

/**
 * Check if state represents a healthy running state
 */
export function isHealthyState(state: LifecycleState): boolean {
  return state === 'RUNNING' || state === 'INITIALIZED';
}

/**
 * State machine for lifecycle management
 */
export class LifecycleManager {
  private state: LifecycleState = 'CREATED';
  private stateChangedAt: Date = new Date();
  private failureReason: string | undefined;

  constructor() {}

  /**
   * Get current state
   */
  getState(): LifecycleState {
    return this.state;
  }

  /**
   * Get time current state was entered
   */
  getStateChangedAt(): Date {
    return new Date(this.stateChangedAt);
  }

  /**
   * Get failure reason (if in FAILED state)
   */
  getFailureReason(): string | undefined {
    return this.failureReason;
  }

  /**
   * Transition to a new state
   * @throws {LifecycleError} If transition is invalid
   */
  transitionTo(newState: LifecycleState, reason?: string): void {
    if (!isValidTransition(this.state, newState)) {
      throw new LifecycleError(
        `Invalid lifecycle transition from ${this.state} to ${newState}`,
        ERROR_CODES.LIFECYCLE_INVALID_TRANSITION,
        {
          from: this.state,
          to: newState,
        }
      );
    }

    this.state = newState;
    this.stateChangedAt = new Date();

    if (newState === 'FAILED' && reason) {
      this.failureReason = reason;
    }
  }

  /**
   * Check if currently in specified state
   */
  isInState(state: LifecycleState): boolean {
    return this.state === state;
  }

  /**
   * Check if any of the specified states
   */
  isInAnyState(...states: LifecycleState[]): boolean {
    return states.includes(this.state);
  }

  /**
   * Require specific state, throw if different
   */
  requireState(state: LifecycleState): void {
    if (this.state !== state) {
      throw new LifecycleError(`Expected state ${state}, but in ${this.state}`, ERROR_CODES.LIFECYCLE_INVALID_TRANSITION, {
        expected: state,
        actual: this.state,
      });
    }
  }

  /**
   * Require NOT in specific state
   */
  requireNotInState(state: LifecycleState): void {
    if (this.state === state) {
      throw new LifecycleError(`Cannot proceed while in state ${state}`, ERROR_CODES.LIFECYCLE_INVALID_TRANSITION, {
        state,
      });
    }
  }
}
