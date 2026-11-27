/**
 * Common types used throughout KafkaForge
 */

/**
 * Represents the operational status of a component
 */
export type OperationalStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/**
 * Represents application environment
 */
export type Environment = 'development' | 'production' | 'test';

/**
 * Marks a value as required (not undefined)
 */
export type Required<T> = T extends undefined ? never : T;

/**
 * Marks a type as deeply readonly
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
