/**
 * Broker type definitions
 */

import type { DeepReadonly } from '../types/common.js';

/**
 * Broker configuration (read from app config)
 */
export interface BrokerConfig extends DeepReadonly<RawBrokerConfig> {}

export interface RawBrokerConfig {
  brokerId: string;
  host: string;
  port: number;
}
