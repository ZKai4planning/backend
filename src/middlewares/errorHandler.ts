import { Request, Response, NextFunction } from "express";
import { log } from "../utils/log";

const logger = log("ErrorHandler");

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(
    `${req.method} ${req.originalUrl} failed`,
    err
  );

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
};
