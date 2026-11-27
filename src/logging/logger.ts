/**
 * Structured logging system
 *
 * Features:
 * - JSON output to stdout/stderr
 * - Context-aware child loggers
 * - Safe error serialization
 * - Log level filtering
 * - No dependencies on third-party logging libraries
 */

import { createLogRecord, formatLogRecordAsJson } from './log-formatter.js';
import { isLevelEnabled, type LogLevel } from './log-level.js';
import { mergeContexts, type LogContext } from './log-context.js';

export class Logger {
  private minLevel: LogLevel;
  private context: LogContext;
  private baseContext: LogContext;

  constructor(minLevel: LogLevel = 'INFO', baseContext: LogContext = {}) {
    this.minLevel = minLevel;
    this.baseContext = { ...baseContext };
    this.context = { ...this.baseContext };
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    const child = new Logger(this.minLevel, this.baseContext);
    child.context = mergeContexts(this.context, additionalContext);
    return child;
  }

  /**
   * Log at DEBUG level
   */
  debug(message: string, metadata?: Record<string, unknown>, error?: Error): void {
    this.log('DEBUG', message, metadata, error);
  }

  /**
   * Log at INFO level
   */
  info(message: string, metadata?: Record<string, unknown>, error?: Error): void {
    this.log('INFO', message, metadata, error);
  }

  /**
   * Log at WARN level
   */
  warn(message: string, metadata?: Record<string, unknown>, error?: Error): void {
    this.log('WARN', message, metadata, error);
  }

  /**
   * Log at ERROR level
   */
  error(message: string, metadata?: Record<string, unknown>, error?: Error): void {
    this.log('ERROR', message, metadata, error);
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, metadata: Record<string, unknown> | undefined, error: Error | undefined): void {
    if (!isLevelEnabled(this.minLevel, level)) {
      return;
    }

    const record = createLogRecord(level, message, this.context, metadata, error);
    const json = formatLogRecordAsJson(record);

    // Write to stdout for INFO/DEBUG, stderr for WARN/ERROR
    const stream = level === 'ERROR' || level === 'WARN' ? process.stderr : process.stdout;
    stream.write(json + '\n');
  }
}

/**
 * Global logger instance (populated at startup)
 */
let globalLogger: Logger | null = null;

/**
 * Initialize the global logger
 */
export function initializeLogger(minLevel: LogLevel = 'INFO', baseContext: LogContext = {}): Logger {
  globalLogger = new Logger(minLevel, baseContext);
  return globalLogger;
}

/**
 * Get the global logger instance
 */
export function getLogger(): Logger {
  if (globalLogger === null) {
    globalLogger = new Logger('INFO', {});
  }

  return globalLogger;
}
