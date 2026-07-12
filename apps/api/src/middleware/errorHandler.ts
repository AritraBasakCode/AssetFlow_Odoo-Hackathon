import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err);

  // Prisma unique-constraint violation (e.g. the partial unique index on
  // AssetAllocation, or the booking EXCLUDE constraint firing under a race).
  if (err.code === "P2002" || err.code === "23P01" || err.code === "23505") {
    return res.status(409).json({ error: "Conflict: this action clashes with an existing record." });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ error: err.message || "Internal server error" });
}
