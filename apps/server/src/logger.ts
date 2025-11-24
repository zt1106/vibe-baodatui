import pino from 'pino';

type LogContext = Record<string, unknown>;

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'poker-server' },
  timestamp: pino.stdTimeFunctions.isoTime
});

const normalizeError = (error: unknown) => {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return error;
};

export function logInfo(event: string, context: LogContext = {}) {
  logger.info({ event, ...context });
}

export function logWarn(event: string, context: LogContext = {}) {
  logger.warn({ event, ...context });
}

export function logError(event: string, error: unknown, context: LogContext = {}) {
  logger.error({ event, error: normalizeError(error), ...context });
}

export { logger };
