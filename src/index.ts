/**
 * KafkaForge - Distributed Event Streaming Platform
 * Phase 1: Foundation & Architecture
 *
 * Main entry point for the application.
 */

// Public API exports
export { Application } from './app/application.js';
export { Broker } from './broker/broker.js';
export { BaseError, ConfigurationError, InitializationError, LifecycleError } from './errors/index.js';
export { Logger } from './logging/logger.js';
export type { LogLevel } from './logging/log-level.js';
export type { Config } from './config/types.js';

// CLI entry point
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { bootstrap, setupSignalHandlers } from './app/bootstrap.js';
import { parseArgs, printHelp, printVersion } from './cli/index.js';
import { getLogger } from './logging/logger.js';

/**
 * Main application entry point
 * This runs when started as a CLI application
 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (args.version) {
    printVersion();
    process.exit(0);
  }

  try {
    // Pass CLI log level to bootstrap (overrides env/defaults)
    const app = await bootstrap(args.logLevel);
    setupSignalHandlers(app);

    // Initialize
    await app.initialize();

    // Start
    await app.start();
  } catch (error) {
    const logger = getLogger();
    logger.error(
      'Fatal error',
      {},
      error instanceof Error ? error : new Error(String(error))
    );
    process.exit(1);
  }
}

// Run main if this is the entry point
// Cross-platform entry point detection (works on Windows and Unix)
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
