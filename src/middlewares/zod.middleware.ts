import { ZodError, ZodTypeAny } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate =
  (schema: ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors: Record<string, string> = {};

        error.issues.forEach((issue) => {
          const field = issue.path[0] as string;
          formattedErrors[field] = issue.message;
        });

        return res.status(400).json({
          message: "Validation failed",
          errors: formattedErrors,
        });
      }

      next(error);
    }
  };
