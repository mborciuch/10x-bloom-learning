// src/lib/utils/logger.ts

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

class Logger {
  log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    };

    const logFn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    logFn(JSON.stringify(entry));
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.log("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.log("warn", message, meta);
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.log("error", message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.log("debug", message, meta);
  }
}

export const logger = new Logger();
