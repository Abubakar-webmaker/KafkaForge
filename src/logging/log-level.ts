/**
 * Log level definitions
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

/**
 * Check if a level is enabled given the minimum level
 */
export function isLevelEnabled(minLevel: LogLevel, checkLevel: LogLevel): boolean {
  return LOG_LEVELS[checkLevel] >= LOG_LEVELS[minLevel];
}
