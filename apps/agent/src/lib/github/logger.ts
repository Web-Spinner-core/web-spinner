import { env } from "~/env";

export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

/**
 * Log a message to the console
 */
export function log(
  prefix: string,
  message: string,
  verbosity: number = LogLevel.DEBUG
) {
  if (verbosity >= LogLevel[env.LOG_LEVEL]) {
    console.log(`[${prefix}] ${message}`);
  }
}
