/**
 * Log record formatting
 *
 * Converts log records to structured JSON output
 * with safe serialization of metadata and errors.
 */

import { serializeError } from '../errors/error-serializer.js';
import type { LogLevel } from './log-level.js';
import type { LogContext } from './log-context.js';

export interface LogRecord {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  metadata?: Record<string, unknown>;
  error?: Record<string, unknown>;
}

/**
 * Format a log record as JSON
 */
export function formatLogRecordAsJson(record: LogRecord): string {
  return JSON.stringify(record, null, 0);
}

/**
 * Create a log record object
 */
export function createLogRecord(
  level: LogLevel,
  message: string,
  context: LogContext,
  metadata: Record<string, unknown> | undefined = undefined,
  error: Error | undefined = undefined
): LogRecord {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    ...(metadata && Object.keys(metadata).length > 0 && { metadata }),
    ...(error && { error: serializeError(error) }),
  };
}
