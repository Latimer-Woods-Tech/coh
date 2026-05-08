type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  userId?: string;
  route?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: { name: string; message: string; stack?: string };
}

function emit(level: LogLevel, message: string, context: LogContext, error?: unknown) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };

  if (error instanceof Error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  } else if (error !== undefined) {
    entry.error = { name: 'NonError', message: String(error) };
  }

  const out = level === 'error' || level === 'warn' ? console.error : console.log;
  out(JSON.stringify(entry));
}

export const logger = {
  debug: (message: string, context: LogContext = {}) => emit('debug', message, context),
  info: (message: string, context: LogContext = {}) => emit('info', message, context),
  warn: (message: string, context: LogContext = {}, error?: unknown) => emit('warn', message, context, error),
  error: (message: string, context: LogContext = {}, error?: unknown) => emit('error', message, context, error),
};

export type Logger = typeof logger;
