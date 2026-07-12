import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { prisma } from "../lib/prisma";

export interface AuthedRequest extends Request {
  user?: {
    id: string;
    role: string;
    departmentId: string | null;
  };
}

// Verifies the JWT access token from the httpOnly cookie and attaches req.user.
// This is the single gate every protected route passes through.
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const payload = verifyAccessToken(token);

    // Defense in depth: re-check the user is still active in case they were
    // deactivated after the token was issued.
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== "ACTIVE") {
      return res.status(401).json({ error: "Account inactive or not found" });
    }

    req.user = { id: user.id, role: user.role, departmentId: user.departmentId };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}
