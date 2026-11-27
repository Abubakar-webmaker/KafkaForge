/**
 * CLI interface
 *
 * Supports:
 * - --help: Show help message
 * - --version: Show version
 * - --config: Configuration file path (future)
 * - --log-level: Override log level
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = (() => {
  try {
    return join(fileURLToPath(import.meta.url), '..');
  } catch {
    return process.cwd();
  }
})();

/**
 * Parse command-line arguments
 */
export interface CliArgs {
  help: boolean;
  version: boolean;
  logLevel?: string;
}

export function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {
    help: false,
    version: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--version' || arg === '-v') {
      result.version = true;
    } else if (arg === '--log-level') {
      const nextArg = args[i + 1];
      if (nextArg !== undefined) {
        result.logLevel = nextArg;
        i++;
      }
    }
  }

  return result;
}

/**
 * Print help message
 */
export function printHelp(): void {
  const help = `
KafkaForge - Distributed Event Streaming Platform

USAGE:
  kafkaforge [OPTIONS]

OPTIONS:
  --help, -h              Show this help message
  --version, -v           Show version information
  --log-level LEVEL       Set log level (DEBUG, INFO, WARN, ERROR)

ENVIRONMENT VARIABLES:
  KAFKAFORGE_ENV                  Environment (development, production, test)
  KAFKAFORGE_LOG_LEVEL            Log level (DEBUG, INFO, WARN, ERROR)
  KAFKAFORGE_BROKER_ID            Broker ID (default: broker-1)
  KAFKAFORGE_HOST                 Server host (default: 0.0.0.0)
  KAFKAFORGE_PORT                 Server port (default: 9092)
  KAFKAFORGE_SHUTDOWN_TIMEOUT_MS  Shutdown timeout in ms (default: 30000)

EXAMPLES:
  kafkaforge --version
  kafkaforge --help
  KAFKAFORGE_PORT=9093 kafkaforge
`;

  console.log(help);
}

/**
 * Get version from package.json
 */
export function getVersion(): string {
  try {
    const packageJsonPath = join(__dirname, '..', '..', 'package.json');
    const content = readFileSync(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(content);
    return pkg.version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/**
 * Print version
 */
export function printVersion(): void {
  console.log(`kafkaforge v${getVersion()}`);
}
