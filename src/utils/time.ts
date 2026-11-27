/**
 * Time utilities
 *
 * Uses performance.now() for monotonic time measurement
 * Uses Date for calendar time
 */

/**
 * Get current timestamp in milliseconds (calendar time)
 * Suitable for logging, human-readable times
 */
export function getCurrentTimestamp(): number {
  return Date.now();
}

/**
 * Get current time as ISO 8601 string
 */
export function getCurrentIsoTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Measure duration using monotonic clock
 * Returns a function that calculates elapsed time
 *
 * Example:
 *   const timer = startTimer();
 *   // ... do work ...
 *   const elapsed = timer(); // milliseconds
 */
export function startTimer(): () => number {
  const start = performance.now();

  return () => {
    return Math.round(performance.now() - start);
  };
}

/**
 * Wait for specified milliseconds
 * Useful for testing and controlled delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Convert seconds to milliseconds
 */
export function secondsToMs(seconds: number): number {
  return seconds * 1000;
}

/**
 * Convert milliseconds to seconds
 */
export function msToSeconds(ms: number): number {
  return ms / 1000;
}
