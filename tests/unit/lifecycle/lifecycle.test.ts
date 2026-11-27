/**
 * Lifecycle management tests
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LifecycleManager, isValidTransition, isTerminalState, isHealthyState } from '../../../src/app/lifecycle.js';
import { LifecycleError } from '../../../src/errors/index.js';

test('Lifecycle - Initial state is CREATED', () => {
  const manager = new LifecycleManager();
  assert.equal(manager.getState(), 'CREATED');
});

test('Lifecycle - Valid transition CREATED -> INITIALIZING', () => {
  const manager = new LifecycleManager();
  manager.transitionTo('INITIALIZING');
  assert.equal(manager.getState(), 'INITIALIZING');
});

test('Lifecycle - Valid transition chain', () => {
  const manager = new LifecycleManager();

  manager.transitionTo('INITIALIZING');
  assert.equal(manager.getState(), 'INITIALIZING');

  manager.transitionTo('INITIALIZED');
  assert.equal(manager.getState(), 'INITIALIZED');

  manager.transitionTo('STARTING');
  assert.equal(manager.getState(), 'STARTING');

  manager.transitionTo('RUNNING');
  assert.equal(manager.getState(), 'RUNNING');
});

test('Lifecycle - Invalid transition throws', () => {
  const manager = new LifecycleManager();

  assert.throws(() => {
    manager.transitionTo('RUNNING');
  }, LifecycleError);
});

test('Lifecycle - Duplicate transitions blocked', () => {
  const manager = new LifecycleManager();

  manager.transitionTo('INITIALIZING');

  assert.throws(() => {
    manager.transitionTo('INITIALIZING');
  }, LifecycleError);
});

test('Lifecycle - Requires specific state', () => {
  const manager = new LifecycleManager();

  assert.throws(() => {
    manager.requireState('INITIALIZED');
  }, /Expected state INITIALIZED/);
});

test('Lifecycle - isInState works', () => {
  const manager = new LifecycleManager();

  assert.ok(manager.isInState('CREATED'));
  assert.ok(!manager.isInState('INITIALIZED'));

  manager.transitionTo('INITIALIZING');
  assert.ok(!manager.isInState('CREATED'));
  assert.ok(manager.isInState('INITIALIZING'));
});

test('Lifecycle - isInAnyState works', () => {
  const manager = new LifecycleManager();

  assert.ok(manager.isInAnyState('CREATED', 'INITIALIZED'));
  assert.ok(!manager.isInAnyState('RUNNING', 'STOPPED'));
});

test('Lifecycle - Terminal states', () => {
  assert.ok(isTerminalState('STOPPED'));
  assert.ok(isTerminalState('FAILED'));
  assert.ok(!isTerminalState('RUNNING'));
  assert.ok(!isTerminalState('INITIALIZING'));
});

test('Lifecycle - Healthy states', () => {
  assert.ok(isHealthyState('RUNNING'));
  assert.ok(isHealthyState('INITIALIZED'));
  assert.ok(!isHealthyState('STOPPING'));
  assert.ok(!isHealthyState('FAILED'));
});

test('Lifecycle - Valid transitions validation', () => {
  assert.ok(isValidTransition('CREATED', 'INITIALIZING'));
  assert.ok(isValidTransition('RUNNING', 'STOPPING'));
  assert.ok(!isValidTransition('RUNNING', 'INITIALIZING'));
  assert.ok(!isValidTransition('STOPPED', 'RUNNING'));
});

test('Lifecycle - Failure transition with reason', () => {
  const manager = new LifecycleManager();

  manager.transitionTo('INITIALIZING');
  manager.transitionTo('FAILED', 'Test failure');

  assert.equal(manager.getState(), 'FAILED');
  assert.equal(manager.getFailureReason(), 'Test failure');
});
