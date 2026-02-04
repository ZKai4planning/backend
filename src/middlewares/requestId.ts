import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

export const requestId = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.headers["x-request-id"] || randomUUID();

  req.headers["x-request-id"] = id as string;
  res.setHeader("X-Request-ID", id as string);

  next();
};
