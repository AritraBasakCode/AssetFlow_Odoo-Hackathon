import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import { Prisma } from "@prisma/client";
import { logActivity, notify } from "../../services/notification.service";

// Creating a cycle auto-populates its item checklist from every asset in
// scope (department and/or location), and assigns the given auditors.
export async function createAuditCycle(req: AuthedRequest, res: Response) {
  const { name, scopeDepartmentId, scopeLocation, startDate, endDate, auditorIds } = req.body;

  const assetsInScope = await prisma.asset.findMany({
    where: {
      departmentId: scopeDepartmentId || undefined,
      location: scopeLocation ? { contains: scopeLocation, mode: "insensitive" } : undefined,
    },
    select: { id: true },
  });

  const cycle = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const created = await tx.auditCycle.create({
      data: { name, scopeDepartmentId, scopeLocation, startDate, endDate, status: "OPEN" },
    });

    await tx.auditCycleAuditor.createMany({
      data: auditorIds.map((userId: string) => ({ auditCycleId: created.id, userId })),
    });

    await tx.auditItem.createMany({
      data: assetsInScope.map((a) => ({ auditCycleId: created.id, assetId: a.id, result: "PENDING" as const })),
    });

    for (const auditorId of auditorIds) {
      await notify(tx, auditorId, "AUDIT_ASSIGNED", `You've been assigned as an auditor for cycle "${name}".`);
    }
    await logActivity(tx, req.user!.id, "AUDIT_CYCLE_CREATED", "AuditCycle", created.id, { assetCount: assetsInScope.length });

    return created;
  });

  res.status(201).json(cycle);
}

export async function markAuditItem(req: AuthedRequest, res: Response) {
  const item = await prisma.auditItem.update({
    where: { id: req.params.itemId },
    data: { result: req.body.result, notes: req.body.notes, verifiedById: req.user!.id, verifiedAt: new Date() },
  });
  await logActivity(prisma, req.user!.id, "AUDIT_ITEM_MARKED", "AuditItem", item.id, { result: req.body.result });
  res.json(item);
}

// Closing locks the cycle, updates asset statuses for confirmed-missing items,
// and the discrepancy report (MISSING + DAMAGED items) is simply queryable
// off this cycle from then on — no separate generation step needed.
export async function closeAuditCycle(req: AuthedRequest, res: Response) {
  const cycleId = req.params.id;
  const cycle = await prisma.auditCycle.findUnique({
    where: { id: cycleId },
    include: { items: true },
  });
  if (!cycle || cycle.status !== "OPEN") return res.status(409).json({ error: "Cycle is not open" });

  const missingItems = cycle.items.filter((i) => i.result === "MISSING");

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const item of missingItems) {
      await tx.asset.update({ where: { id: item.assetId }, data: { status: "LOST" } });
    }
    await tx.auditCycle.update({ where: { id: cycleId }, data: { status: "CLOSED", closedAt: new Date() } });
    await logActivity(tx, req.user!.id, "AUDIT_CYCLE_CLOSED", "AuditCycle", cycleId, { missingCount: missingItems.length });
  });

  res.json({ ok: true, missingMarkedLost: missingItems.length });
}

export async function getDiscrepancyReport(req: AuthedRequest, res: Response) {
  const items = await prisma.auditItem.findMany({
    where: { auditCycleId: req.params.id, result: { in: ["MISSING", "DAMAGED"] } },
    include: { asset: true, verifiedBy: { select: { name: true } } },
  });
  res.json(items);
}

export async function listAuditCycles(req: AuthedRequest, res: Response) {
  const cycles = await prisma.auditCycle.findMany({
    include: { auditors: { include: { user: { select: { id: true, name: true } } } }, _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(cycles);
}

export async function getAuditCycle(req: AuthedRequest, res: Response) {
  const cycle = await prisma.auditCycle.findUnique({
    where: { id: req.params.id },
    include: { items: { include: { asset: true } }, auditors: { include: { user: { select: { id: true, name: true } } } } },
  });
  if (!cycle) return res.status(404).json({ error: "Not found" });
  res.json(cycle);
}
