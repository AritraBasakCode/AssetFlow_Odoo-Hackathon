import { Request, Response, NextFunction, RequestHandler } from "express";

// Wraps async route handlers so thrown errors reach the central errorHandler
// instead of crashing the process / needing try-catch in every controller.
export function asyncHandler(fn: (req: any, res: Response, next: NextFunction) => Promise<any>): RequestHandler {
  return (req, res, next) => fn(req, res, next).catch(next);
}
