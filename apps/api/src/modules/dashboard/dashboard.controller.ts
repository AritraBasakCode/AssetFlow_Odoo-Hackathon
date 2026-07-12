import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

export async function getKpis(req: AuthedRequest, res: Response) {
  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);

  const [
    assetsAvailable,
    assetsAllocated,
    maintenanceToday,
    activeBookings,
    pendingTransfers,
    upcomingReturns,
    overdueReturns,
    overdueBookings,
  ] = await Promise.all([
    prisma.asset.count({ where: { status: "AVAILABLE" } }),
    prisma.asset.count({ where: { status: "ALLOCATED" } }),
    prisma.maintenanceRequest.count({
      where: { status: { in: ["APPROVED", "TECH_ASSIGNED", "IN_PROGRESS"] }, createdAt: { gte: startOfDay, lte: endOfDay } },
    }),
    prisma.booking.count({ where: { status: { in: ["UPCOMING", "ONGOING"] } } }),
    prisma.transferRequest.count({ where: { status: "REQUESTED" } }),
    prisma.assetAllocation.count({
      where: { status: "ACTIVE", expectedReturnDate: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.assetAllocation.count({ where: { status: "ACTIVE", expectedReturnDate: { lt: now } } }),
    prisma.booking.count({ where: { status: "UPCOMING", endTime: { lt: now } } }),
  ]);

  res.json({
    assetsAvailable,
    assetsAllocated,
    maintenanceToday,
    activeBookings,
    pendingTransfers,
    upcomingReturns,
    overdueReturns,
    overdueBookings,
  });
}
