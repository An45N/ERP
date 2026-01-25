import { Request, Response, NextFunction } from "express";
import { AuthService, JwtPayload } from "../lib/auth";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);
    const payload = AuthService.verifyToken(token);
    
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const requireTenant = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user?.tenantId) {
    res.status(403).json({ error: "Tenant context required" });
    return;
  }
  next();
};
