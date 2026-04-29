import { inspect } from "util";
import type { JsonObject } from "type-fest";

/**
 * Additional information about the log message.
 */
export type LogDetails = JsonObject | string;

/**
 * The severity of the log message.
 */
export enum LogLevel {
  /**
   * Fine-grained messages that provide context to understand the steps leading
   * to errors and warnings.
   */
  DEBUG = "debug",

  /**
   * Informational messages that highlight the system state and progress.
   */
  INFO = "info",

  /**
   * Potential issues that might be problems or might not.
   */
  WARN = "warn",

  /**
   * Errors that prevent the system from working as intended.
   */
  ERROR = "error",
}

/**
 * A log message.
 *
 * Specifying a structured additional information type makes providing details required.
 */
export type Log = {
  /**
   * The severity of the log message.
   */
  level: LogLevel;

  /**
   * The log message.
   */
  message: string;

  /**
   * Additional information about the log message.
   */
  details?: LogDetails;
};

/**
 * A common interface for loggers.
 */
export abstract class Logger {
  debug(message: string, details?: LogDetails): void {
    this.log({
      level: LogLevel.DEBUG,
      message,
      details,
    });
  }

  info(message: string, details?: LogDetails): void {
    this.log({
      level: LogLevel.INFO,
      message,
      details,
    });
  }

  warn(message: string, details?: LogDetails): void {
    this.log({
      level: LogLevel.WARN,
      message,
      details,
    });
  }

  error(message: string, error?: unknown): void {
    let details;

    if (error !== undefined) {
      details = error instanceof Error ? error.stack : inspect(error);
    }

    this.log({
      level: LogLevel.ERROR,
      message,
      details,
    });
  }

  /**
   * Logs a message.
   *
   * @param log The log message.
   */
  abstract log(log: Log): void;
}
