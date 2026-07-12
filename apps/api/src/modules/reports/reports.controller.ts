import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

export async function utilization(req: AuthedRequest, res: Response) {
  const assets = await prisma.asset.findMany({
    include: { _count: { select: { allocations: true, bookings: true } } },
  });
  const ranked = assets
    .map((a) => ({ id: a.id, assetTag: a.assetTag, name: a.name, usageCount: a._count.allocations + a._count.bookings }))
    .sort((a, b) => b.usageCount - a.usageCount);
  res.json(ranked);
}

export async function maintenanceFrequency(req: AuthedRequest, res: Response) {
  const grouped = await prisma.maintenanceRequest.groupBy({
    by: ["assetId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });
  const assets = await prisma.asset.findMany({ where: { id: { in: grouped.map((g) => g.assetId) } } });
  const result = grouped.map((g) => ({
    asset: assets.find((a) => a.id === g.assetId),
    requestCount: g._count.id,
  }));
  res.json(result);
}

export async function departmentSummary(req: AuthedRequest, res: Response) {
  const departments = await prisma.department.findMany({
    include: { _count: { select: { assets: true, members: true } } },
  });
  res.json(departments.map((d) => ({ id: d.id, name: d.name, assetCount: d._count.assets, memberCount: d._count.members })));
}

export async function bookingHeatmap(req: AuthedRequest, res: Response) {
  const bookings = await prisma.booking.findMany({ where: { status: { in: ["COMPLETED", "ONGOING", "UPCOMING"] } } });
  const heatmap: Record<number, number> = {};
  for (const b of bookings) {
    const hour = new Date(b.startTime).getHours();
    heatmap[hour] = (heatmap[hour] || 0) + 1;
  }
  res.json(heatmap);
}

export async function assetsNearingRetirement(req: AuthedRequest, res: Response) {
  // Simple heuristic for the demo: assets acquired more than 4 years ago.
  const fourYearsAgo = new Date();
  fourYearsAgo.setFullYear(fourYearsAgo.getFullYear() - 4);
  const assets = await prisma.asset.findMany({
    where: { acquisitionDate: { lt: fourYearsAgo }, status: { notIn: ["RETIRED", "DISPOSED"] } },
  });
  res.json(assets);
}
