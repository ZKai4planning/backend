import { logger } from "./logger";

type LogMeta = {
  requestId?: string;
};

export const log = (module: string) => ({
  info: (msg: string, meta?: LogMeta) =>
    logger.info(msg, { module, ...meta }),

  warn: (msg: string, meta?: LogMeta) =>
    logger.warn(msg, { module, ...meta }),

  debug: (msg: string, meta?: LogMeta) =>
    logger.debug(msg, { module, ...meta }),

  error: (msg: string, err?: Error, meta?: LogMeta) =>
    logger.error(msg, {
      module,
      ...meta,
      stack: err?.stack,
    }),
});
