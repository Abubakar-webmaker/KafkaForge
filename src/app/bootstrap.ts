/**
 * Application bootstrap and initialization
 *
 * Sets up:
 * - Configuration loading
 * - Logging initialization
 * - Broker creation
 * - Signal handling
 * - Lifecycle management
 */

import { initializeConfiguration } from '../config/config.js';
import { initializeLogger, getLogger } from '../logging/logger.js';
import { Broker } from '../broker/broker.js';
import { Application } from './application.js';
import { LifecycleManager } from './lifecycle.js';

/**
 * Bootstrap the application
 *
 * @param cliLogLevel Optional log level from CLI arguments to override env/defaults
 */
export async function bootstrap(cliLogLevel?: string): Promise<Application> {
  // Initialize configuration first, applying CLI log level override if provided
  const config = initializeConfiguration(cliLogLevel);

  // Initialize logging with config
  const logger = initializeLogger(config.logLevel, {
    applicationName: config.applicationName,
    brokerId: config.brokerId,
  });

  logger.info('KafkaForge starting', {
    version: config.applicationVersion,
    environment: config.environment,
    brokerId: config.brokerId,
  });

  // Create broker
  const brokerConfig = {
    brokerId: config.brokerId,
    host: config.host,
    port: config.port,
  };

  const broker = new Broker(brokerConfig);

  // Create lifecycle manager
  const lifecycle = new LifecycleManager();

  // Create application
  const app = new Application(config, broker, lifecycle, logger);

  logger.debug('Application bootstrapped');

  return app;
}

/**
 * Handle process signals for graceful shutdown
 * Uses a guard to prevent duplicate listener registration
 */
let signalHandlersSetup = false;

export function setupSignalHandlers(app: Application): void {
  // Guard against multiple registrations
  if (signalHandlersSetup) {
    return;
  }
  signalHandlersSetup = true;

  const logger = getLogger();
  let sigintCount = 0;

  const handleSignal = (signal: string) => {
    logger.info(`Received ${signal}, initiating graceful shutdown...`);

    sigintCount++;

    if (sigintCount === 1) {
      // First signal: graceful shutdown
      app
        .stop()
        .catch((err) => {
          logger.error(`Error during graceful shutdown: ${err instanceof Error ? err.message : String(err)}`, {}, err instanceof Error ? err : undefined);
          process.exit(1);
        });
    } else if (sigintCount === 2) {
      // Second signal: force exit
      logger.warn('Force exiting (graceful shutdown did not complete)');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => handleSignal('SIGINT'));
  process.on('SIGTERM', () => handleSignal('SIGTERM'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', {}, error);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', {}, reason instanceof Error ? reason : new Error(String(reason)));
    process.exit(1);
  });
}
