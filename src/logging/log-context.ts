/**
 * Logging context information
 *
 * Tracks metadata that should be included in all log records
 * from a particular logger instance.
 */

export interface LogContext {
  applicationName?: string;
  brokerId?: string;
  module?: string;
  requestId?: string;
  correlationId?: string;
  [key: string]: string | undefined;
}

/**
 * Merge contexts, with override taking precedence
 */
export function mergeContexts(base: LogContext, override: LogContext): LogContext {
  return {
    ...base,
    ...override,
  };
}
