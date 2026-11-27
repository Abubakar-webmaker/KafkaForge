/**
 * Environment variable reading and parsing
 */

/**
 * Reads an environment variable, returning undefined if not set
 */
export function getEnvironmentVariable(name: string): string | undefined {
  return process.env[name];
}

/**
 * Gets all KafkaForge-prefixed environment variables
 * Removes the prefix for easier access
 */
export function getKafkaforgeEnvironmentVariables(): Record<string, string> {
  const prefix = 'KAFKAFORGE_';
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith(prefix) && value !== undefined) {
      const unprefixed = key.substring(prefix.length).toLowerCase();
      result[unprefixed] = value;
    }
  }

  return result;
}
