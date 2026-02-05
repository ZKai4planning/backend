import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  role?: string;
  roleId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role?: string; roleId?: string };
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
    req.user = { userId: decoded.userId, role: decoded.role, roleId: decoded.roleId };

    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};
