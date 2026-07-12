import { Response, NextFunction } from "express";
import { AuthedRequest } from "./auth";

// Declarative role gate — kept as a single reusable middleware factory so the
// RBAC matrix from the design doc maps 1:1 onto route definitions, rather than
// scattering ad-hoc `if (user.role !== ...)` checks through controllers.
export function requireRole(...roles: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}
