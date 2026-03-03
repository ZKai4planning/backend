import { Request, Response, NextFunction } from "express";
import { log } from "../utils/log";

const logger = log("HTTP");

const redact = (obj: any, keysToRedact = ["password", "token", "authorization", "accessToken", "refreshToken"]) => {
  if (!obj || typeof obj !== "object") return obj;
  try {
    const copy = JSON.parse(JSON.stringify(obj));
    const walk = (o: any) => {
      if (!o || typeof o !== "object") return;
      for (const k of Object.keys(o)) {
        if (keysToRedact.includes(k.toLowerCase())) o[k] = "[REDACTED]";
        else if (typeof o[k] === "object") walk(o[k]);
      }
    };
    walk(copy);
    return copy;
  } catch {
    return "[UNSERIALIZABLE]";
  }
};

export const requestLogger = (
  req: Request & { requestId?: string; log?: any },
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  const id = req.headers["x-request-id"] as string | undefined;
  if (id) req.requestId = id;

  // attach request-scoped logger that injects requestId and route info
  req.log = {
    info: (msg: string, meta?: any) =>
      logger.info(msg, { requestId: req.requestId, route: req.originalUrl, ...meta }),
    warn: (msg: string, meta?: any) =>
      logger.warn(msg, { requestId: req.requestId, route: req.originalUrl, ...meta }),
    error: (msg: string, err?: any, meta?: any) =>
      logger.error(msg, { requestId: req.requestId, route: req.originalUrl, ...meta, stack: err?.stack || undefined }),
    debug: (msg: string, meta?: any) =>
      logger.debug(msg, { requestId: req.requestId, route: req.originalUrl, ...meta }),
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    const meta = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: duration,
      params: redact(req.params),
      query: redact(req.query),
      body: redact(req.body),
      ip: req.ip,
    };

    req.log.info(`${req.method} ${req.originalUrl} → ${res.statusCode}`, meta);
  });

  next();
};
