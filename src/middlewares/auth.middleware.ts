import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({ message: "Unauthorized: Missing token" });

    const token = authHeader.split(" ")[1];

    const secret = process.env.JWT_SECRET || "your_jwt_secret";

    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Attach userId to request object
    req.user = { userId: decoded.userId };

    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};
