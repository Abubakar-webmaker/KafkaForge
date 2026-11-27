/**
 * Logger runtime verification tests
 *
 * Verifies that logger output filtering works correctly during application runtime,
 * especially when log level is set via CLI override.
 */

import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { Logger } from '../src/logging/logger.js';
import type { LogLevel } from '../src/logging/log-level.js';

/**
 * Capture logger output by temporarily replacing process.stdout.write
 */
function captureLoggerOutput(fn: () => void): string[] {
  const output: string[] = [];
  const originalWrite = process.stdout.write;
  const originalStderr = process.stderr.write;

  process.stdout.write = ((str: string) => {
    output.push(str);
    return true;
  }) as any;

  process.stderr.write = ((str: string) => {
    output.push(str);
    return true;
  }) as any;

  try {
    fn();
  } finally {
    process.stdout.write = originalWrite;
    process.stderr.write = originalStderr;
  }

  return output;
}

/**
 * Parse logger JSON output lines
 */
function parseLogLines(output: string[]): Array<{
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}> {
  return output
    .filter(line => line.trim().length > 0)
    .map(line => JSON.parse(line));
}

describe('Logger Output Filtering at Runtime', () => {
  describe('DEBUG level', () => {
    it('Should output DEBUG messages', () => {
      const output = captureLoggerOutput(() => {
        const logger = new Logger('DEBUG', { applicationName: 'test' });
        logger.debug('debug message');
        logger.info('info message');
        logger.warn('warn message');
        logger.error('error message');
      });

      const logs = parseLogLines(output);

      // All levels should appear
      assert(logs.some(log => log.level === 'DEBUG' && log.message === 'debug message'), 'DEBUG missing');
      assert(logs.some(log => log.level === 'INFO' && log.message === 'info message'), 'INFO missing');
      assert(logs.some(log => log.level === 'WARN' && log.message === 'warn message'), 'WARN missing');
      assert(logs.some(log => log.level === 'ERROR' && log.message === 'error message'), 'ERROR missing');
    });

    it('Should include context in output', () => {
      const output = captureLoggerOutput(() => {
        const logger = new Logger('DEBUG', { applicationName: 'test', version: '1.0' });
        logger.info('test message');
      });

      const logs = parseLogLines(output);
      const infoLog = logs.find(log => log.level === 'INFO');

      assert(infoLog, 'INFO log missing');
      assert.equal(infoLog.context?.applicationName, 'test');
      assert.equal(infoLog.context?.version, '1.0');
    });
  });

  describe('INFO level', () => {
    it('Should suppress DEBUG messages', () => {
      const output = captureLoggerOutput(() => {
        const logger = new Logger('INFO', { applicationName: 'test' });
        logger.debug('debug message');
        logger.info('info message');
      });

      const logs = parseLogLines(output);

      assert(!logs.some(log => log.level === 'DEBUG'), 'DEBUG should be filtered');
      assert(logs.some(log => log.level === 'INFO'), 'INFO should appear');
    });

    it('Should output INFO and above', () => {
      const output = captureLoggerOutput(() => {
        const logger = new Logger('INFO', { applicationName: 'test' });
        logger.debug('debug');
        logger.info('info');
        logger.warn('warn');
        logger.error('error');
      });

      const logs = parseLogLines(output);
      const levels = logs.map(log => log.level);

      assert(!levels.includes('DEBUG'), 'DEBUG should not appear');
      assert(levels.includes('INFO'), 'INFO should appear');
        assert(levels.includes('WARN'), 'WARN should appear');
      assert(levels.includes('ERROR'), 'ERROR should appear');
    });
  });

  describe('WARN level', () => {
    it('Should suppress DEBUG and INFO messages', () => {
      const output = captureLoggerOutput(() => {
        const logger = new Logger('WARN', { applicationName: 'test' });
        logger.debug('debug message');
        logger.info('info message');
        logger.warn('warn message');
        logger.error('error message');
      });

      const logs = parseLogLines(output);
      const levels = logs.map(log => log.level);

      assert(!levels.includes('DEBUG'), 'DEBUG should be filtered');
      assert(!levels.includes('INFO'), 'INFO should be filtered');
      assert(levels.includes('WARN'), 'WARN should appear');
      assert(levels.includes('ERROR'), 'ERROR should appear');
    });
  });

  describe('ERROR level', () => {
    it('Should suppress DEBUG, INFO, and WARN messages', () => {
      const output = captureLoggerOutput(() => {
        const logger = new Logger('ERROR', { applicationName: 'test' });
        logger.debug('debug');
        logger.info('info');
        logger.warn('warn');
        logger.error('error');
      });

      const logs = parseLogLines(output);
      const levels = logs.map(log => log.level);

      assert(!levels.includes('DEBUG'), 'DEBUG should be filtered');
      assert(!levels.includes('INFO'), 'INFO should be filtered');
      assert(!levels.includes('WARN'), 'WARN should be filtered');
      assert(levels.includes('ERROR'), 'ERROR should appear');
    });
  });

  describe('Child logger filtering', () => {
    it('Should inherit parent log level', () => {
      const output = captureLoggerOutput(() => {
        const parent = new Logger('INFO', { applicationName: 'test' });
        const child = parent.child({ module: 'submodule' });

        child.debug('debug from child');
        child.info('info from child');
      });

      const logs = parseLogLines(output);

      assert(!logs.some(log => log.message === 'debug from child'), 'DEBUG should be filtered');
      assert(logs.some(log => log.message === 'info from child'), 'INFO should appear');
    });

    it('Child should include parent and child context', () => {
      const output = captureLoggerOutput(() => {
        const parent = new Logger('DEBUG', { applicationName: 'test' });
        const child = parent.child({ module: 'submodule' });

        child.info('child message');
      });

      const logs = parseLogLines(output);
      const childLog = logs.find(log => log.message === 'child message');

      assert(childLog, 'Child log missing');
      assert.equal(childLog.context.applicationName, 'test', 'Parent context missing');
      assert.equal(childLog.context.module, 'submodule', 'Child context missing');
    });
  });

  describe('Metadata and error serialization', () => {
    it('Should include metadata in output', () => {
      const output = captureLoggerOutput(() => {
        const logger = new Logger('INFO', { applicationName: 'test' });
        logger.info('test message', { requestId: '123', duration: 42 });
      });

      const logs = parseLogLines(output);
      const infoLog = logs.find(log => log.message === 'test message');

      assert(infoLog, 'Log missing');
      assert.equal(infoLog.metadata?.requestId, '123');
      assert.equal(infoLog.metadata?.duration, 42);
    });

    it('Should serialize errors safely', () => {
      const output = captureLoggerOutput(() => {
        const logger = new Logger('ERROR', { applicationName: 'test' });
        const error = new Error('Test error');
        logger.error('error occurred', {}, error);
      });

      const logs = parseLogLines(output);
      const errorLog = logs.find(log => log.message === 'error occurred');

      assert(errorLog, 'Error log missing');
      assert(errorLog.error, 'Error object missing');
      assert.equal(errorLog.error?.message, 'Test error');
      assert.equal(errorLog.error?.type, 'Error');
      assert(errorLog.error?.stack, 'Stack trace should be included');
    });

    it('Should output to correct streams', () => {
      const stdoutLines: string[] = [];
      const stderrLines: string[] = [];

      const originalStdout = process.stdout.write;
      const originalStderr = process.stderr.write;

      process.stdout.write = ((str: string) => {
        stdoutLines.push(str);
        return true;
      }) as any;

      process.stderr.write = ((str: string) => {
        stderrLines.push(str);
        return true;
      }) as any;

      try {
        const logger = new Logger('DEBUG', { applicationName: 'test' });
        logger.debug('debug');
        logger.info('info');
        logger.warn('warn');
        logger.error('error');

        // INFO and DEBUG should go to stdout
        assert(stdoutLines.length > 0, 'stdout should have content');
        const stdoutLogs = stdoutLines.map(line => JSON.parse(line));
        assert(stdoutLogs.some(log => log.level === 'DEBUG'), 'DEBUG should be in stdout');
        assert(stdoutLogs.some(log => log.level === 'INFO'), 'INFO should be in stdout');

        // WARN and ERROR should go to stderr
        assert(stderrLines.length > 0, 'stderr should have content');
        const stderrLogs = stderrLines.map(line => JSON.parse(line));
        assert(stderrLogs.some(log => log.level === 'WARN'), 'WARN should be in stderr');
        assert(stderrLogs.some(log => log.level === 'ERROR'), 'ERROR should be in stderr');
      } finally {
        process.stdout.write = originalStdout;
        process.stderr.write = originalStderr;
      }
    });
  });

  describe('JSON output format', () => {
    it('Should output valid JSON', () => {
      const output = captureLoggerOutput(() => {
        const logger = new Logger('INFO', { applicationName: 'test' });
        logger.info('test');
      });

      const logs = parseLogLines(output);
      assert(logs.length > 0, 'Should have output');
      
      // If parsing succeeded without throwing, format is valid
      assert(logs[0].timestamp, 'Should have timestamp');
      assert(logs[0].level, 'Should have level');
      assert(logs[0].message, 'Should have message');
      assert(logs[0].context, 'Should have context');
    });

    it('Should include ISO timestamp', () => {
      const output = captureLoggerOutput(() => {
        const logger = new Logger('INFO', { applicationName: 'test' });
        logger.info('test');
      });

      const logs = parseLogLines(output);
      const log = logs[0];

      // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
      assert(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(log.timestamp),
        'Timestamp should be ISO 8601 format'
      );
    });
  });

  describe('Logger level validation', () => {
    it('Should accept valid log levels', () => {
      const validLevels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];

      for (const level of validLevels) {
        // Should not throw
        const logger = new Logger(level, { applicationName: 'test' });
        assert(logger, `Logger should accept level ${level}`);
      }
    });
  });

  describe('Multiple concurrent loggers', () => {
    it('Should not interfere with each other', () => {
      const output: string[] = [];
      const originalWrite = process.stdout.write;

      process.stdout.write = ((str: string) => {
        output.push(str);
        return true;
      }) as any;

      try {
        const debugLogger = new Logger('DEBUG', { applicationName: 'debug' });
        const errorLogger = new Logger('ERROR', { applicationName: 'error' });

        debugLogger.debug('debug from debugLogger');
        debugLogger.info('info from debugLogger');
        errorLogger.info('info from errorLogger'); // Should be suppressed
        errorLogger.error('error from errorLogger');

        const logs = parseLogLines(output);

        const debugOutput = logs.filter(log => log.context?.applicationName === 'debug');
        const errorOutput = logs.filter(log => log.context?.applicationName === 'error');

        assert(debugOutput.some(log => log.level === 'DEBUG'), 'debugLogger should output DEBUG');
        assert(debugOutput.some(log => log.level === 'INFO'), 'debugLogger should output INFO');

        assert(!errorOutput.some(log => log.level === 'INFO'), 'errorLogger should suppress INFO');
        assert(errorOutput.some(log => log.level === 'ERROR'), 'errorLogger should output ERROR');
      } finally {
        process.stdout.write = originalWrite;
      }
    });
  });
});
