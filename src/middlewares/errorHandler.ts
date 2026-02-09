import { Request, Response, NextFunction } from "express";
import { log } from "../utils/log";

const logger = log("ErrorHandler");

export const errorHandler = (
  err: any,
  req: Request & { requestId?: string; log?: any },
  res: Response,
  next: NextFunction
) => {
  const meta = {
    requestId: (req as any).requestId,
    method: req.method,
    url: req.originalUrl,
    params: req.params,
    query: req.query,
    // don't log full body by default to avoid PII leakage; log length
    bodyLength: req.body ? JSON.stringify(req.body).length : 0,
  };

  // Prefer request-scoped logger if available
  if (req.log && typeof req.log.error === "function") {
    req.log.error(`${req.method} ${req.originalUrl} failed`, err, meta);
  } else {
    logger.error(`${req.method} ${req.originalUrl} failed`, err, meta);
  }

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
};
