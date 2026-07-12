import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import authRoutes from "./modules/auth/auth.routes";
import organizationRoutes from "./modules/organization/organization.routes";
import assetRoutes from "./modules/assets/assets.routes";
import allocationRoutes from "./modules/allocations/allocations.routes";
import bookingRoutes from "./modules/bookings/bookings.routes";
import maintenanceRoutes from "./modules/maintenance/maintenance.routes";
import auditRoutes from "./modules/audits/audits.routes";
import notificationRoutes from "./modules/notifications/notifications.routes";
import activityLogRoutes from "./modules/activityLogs/activityLogs.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import reportRoutes from "./modules/reports/reports.routes";

import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api", organizationRoutes); // /api/departments, /api/asset-categories, /api/employees
  app.use("/api/assets", assetRoutes);
  app.use("/api", allocationRoutes); // /api/allocations, /api/transfers
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/maintenance-requests", maintenanceRoutes);
  app.use("/api/audit-cycles", auditRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/activity-logs", activityLogRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/reports", reportRoutes);

  app.use(errorHandler);

  return app;
}
