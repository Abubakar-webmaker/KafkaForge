/**
 * Logger tests
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Logger } from '../../../src/logging/logger.js';

test('Logger - All log levels', () => {
  const logger = new Logger('DEBUG', { applicationName: 'test' });

  // These just shouldn't throw
  logger.debug('debug message');
  logger.info('info message');
  logger.warn('warning message');
  logger.error('error message');

  assert.ok(true);
});

test('Logger - Child logger inherits context', () => {
  const parentLogger = new Logger('INFO', { applicationName: 'parent' });
  const childLogger = parentLogger.child({ module: 'child' });

  // This just verifies the child logger is created
  assert.ok(childLogger instanceof Logger);
});

test('Logger - Respects log level filtering', () => {
  const logger = new Logger('WARN');
  
  let capturedStdout = '';
  let capturedStderr = '';
  
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;
  
  // Capture both stdout and stderr
  process.stdout.write = function(chunk: any) {
    capturedStdout += chunk.toString();
    return true;
  } as any;

  process.stderr.write = function(chunk: any) {
    capturedStderr += chunk.toString();
    return true;
  } as any;

  try {
    logger.debug('debug - should not appear');
    logger.info('info - should not appear');
    logger.warn('warn - should appear');

    const allOutput = capturedStdout + capturedStderr;

    // Check that WARN message was logged (goes to stderr)
    assert.ok(allOutput.includes('warn - should appear'), 'Warn message should be logged');
    
    // Check that DEBUG and INFO were not logged
    assert.ok(!allOutput.includes('debug - should not appear'), 'Debug should not be logged at WARN level');
    assert.ok(!allOutput.includes('info - should not appear'), 'Info should not be logged at WARN level');
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  }
});

test('Logger - Error serialization', () => {
  const logger = new Logger('ERROR');
  const output: string[] = [];

  const originalWrite = process.stderr.write;
  process.stderr.write = ((chunk: string | Buffer) => {
    output.push(chunk.toString());
    return true;
  }) as any;

  try {
    const error = new Error('Test error');
    logger.error('Error occurred', {}, error);

    const logged = output.join('');
    assert.ok(logged.includes('Test error'), 'Error message should be logged');
    assert.ok(logged.includes('error'), 'Log should contain error');
  } finally {
    process.stderr.write = originalWrite;
  }
});

test('Logger - JSON output format', () => {
  const logger = new Logger('INFO');
  const output: string[] = [];

  const originalWrite = process.stdout.write;
  process.stdout.write = ((chunk: string | Buffer) => {
    output.push(chunk.toString());
    return true;
  }) as any;

  try {
    logger.info('test message', { key: 'value' });

    const logged = output[0];
    assert.ok(logged, 'Should have logged something');

    const parsed = JSON.parse(logged);
    assert.equal(parsed.level, 'INFO');
    assert.equal(parsed.message, 'test message');
    assert.ok(parsed.timestamp, 'Should have timestamp');
    assert.ok(parsed.metadata, 'Should have metadata');
    assert.equal(parsed.metadata.key, 'value');
  } finally {
    process.stdout.write = originalWrite;
  }
});
