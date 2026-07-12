import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import { Prisma } from "@prisma/client";
import { assertTransition } from "../../utils/stateMachine";
import { logActivity, notify } from "../../services/notification.service";

// ---------- Allocate ----------
// This is the headline "no double allocation" rule from the spec:
// 1) App-layer pre-check gives the friendly "currently held by X" message.
// 2) The transaction + DB partial-unique-index (see manual_sql) is the real
//    guarantee under concurrent requests — if two allocate calls race, the
//    DB constraint rejects the second one even if both pass the pre-check.
export async function createAllocation(req: AuthedRequest, res: Response) {
  const { assetId, employeeId, departmentId, expectedReturnDate } = req.body;

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: { allocations: { where: { status: "ACTIVE" }, include: { employee: true } } },
  });
  if (!asset) return res.status(404).json({ error: "Asset not found" });

  if (asset.allocations.length > 0) {
    const holder = asset.allocations[0].employee?.name || "another department";
    return res.status(409).json({
      error: `This asset is currently held by ${holder}.`,
      currentAllocationId: asset.allocations[0].id,
      suggestion: "TRANSFER_REQUEST",
    });
  }

  assertTransition(asset.status, "ALLOCATED");

  const allocation = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const created = await tx.assetAllocation.create({
      data: { assetId, employeeId, departmentId, expectedReturnDate, status: "ACTIVE" },
    });
    await tx.asset.update({ where: { id: assetId }, data: { status: "ALLOCATED" } });
    await logActivity(tx, req.user!.id, "ASSET_ALLOCATED", "Asset", assetId, { employeeId, departmentId });
    if (employeeId) {
      await notify(tx, employeeId, "ASSET_ASSIGNED", `Asset ${asset.assetTag} (${asset.name}) has been allocated to you.`);
    }
    return created;
  });

  res.status(201).json(allocation);
}

export async function returnAllocation(req: AuthedRequest, res: Response) {
  const allocation = await prisma.assetAllocation.findUnique({ where: { id: req.params.id }, include: { asset: true } });
  if (!allocation || allocation.status !== "ACTIVE") {
    return res.status(404).json({ error: "Active allocation not found" });
  }

  assertTransition(allocation.asset.status, "AVAILABLE");

  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const closed = await tx.assetAllocation.update({
      where: { id: allocation.id },
      data: { status: "RETURNED", returnedAt: new Date(), checkInNotes: req.body.checkInNotes },
    });
    await tx.asset.update({
      where: { id: allocation.assetId },
      data: { status: "AVAILABLE", condition: req.body.condition ?? undefined },
    });
    await logActivity(tx, req.user!.id, "ASSET_RETURNED", "Asset", allocation.assetId);
    return closed;
  });

  res.json(updated);
}

export async function listAllocations(req: AuthedRequest, res: Response) {
  const { assetId, status } = req.query as Record<string, string>;
  const allocations = await prisma.assetAllocation.findMany({
    where: { assetId: assetId || undefined, status: (status as any) || undefined },
    include: { asset: true, employee: { select: { id: true, name: true } }, department: true },
    orderBy: { allocatedAt: "desc" },
  });
  res.json(allocations);
}

export async function listOverdueAllocations(req: AuthedRequest, res: Response) {
  const overdue = await prisma.assetAllocation.findMany({
    where: { status: "ACTIVE", expectedReturnDate: { lt: new Date() } },
    include: { asset: true, employee: { select: { id: true, name: true } } },
  });
  res.json(overdue);
}

// ---------- Transfer Requests ----------
export async function createTransferRequest(req: AuthedRequest, res: Response) {
  const { assetId, toUserId } = req.body;
  const activeAllocation = await prisma.assetAllocation.findFirst({ where: { assetId, status: "ACTIVE" } });

  const transfer = await prisma.transferRequest.create({
    data: {
      assetId,
      toUserId,
      fromUserId: activeAllocation?.employeeId ?? null,
      requestedById: req.user!.id,
      status: "REQUESTED",
    },
  });

  await logActivity(prisma, req.user!.id, "TRANSFER_REQUESTED", "TransferRequest", transfer.id);
  res.status(201).json(transfer);
}

export async function approveTransfer(req: AuthedRequest, res: Response) {
  const transfer = await prisma.transferRequest.findUnique({ where: { id: req.params.id } });
  if (!transfer || transfer.status !== "REQUESTED") {
    return res.status(409).json({ error: "Transfer request is not pending" });
  }

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Close current allocation (if any) and open a new one atomically.
    await tx.assetAllocation.updateMany({
      where: { assetId: transfer.assetId, status: "ACTIVE" },
      data: { status: "RETURNED", returnedAt: new Date() },
    });

    const newAllocation = await tx.assetAllocation.create({
      data: { assetId: transfer.assetId, employeeId: transfer.toUserId, status: "ACTIVE" },
    });

    await tx.asset.update({ where: { id: transfer.assetId }, data: { status: "ALLOCATED" } });

    const updatedTransfer = await tx.transferRequest.update({
      where: { id: transfer.id },
      data: { status: "APPROVED", approvedById: req.user!.id, resolvedAt: new Date() },
    });

    await logActivity(tx, req.user!.id, "TRANSFER_APPROVED", "TransferRequest", transfer.id);
    await notify(tx, transfer.toUserId, "TRANSFER_APPROVED", "A transfer request has been approved — the asset is now allocated to you.");

    return { transfer: updatedTransfer, newAllocation };
  });

  res.json(result);
}

export async function rejectTransfer(req: AuthedRequest, res: Response) {
  const transfer = await prisma.transferRequest.update({
    where: { id: req.params.id },
    data: { status: "REJECTED", approvedById: req.user!.id, resolvedAt: new Date() },
  });
  await logActivity(prisma, req.user!.id, "TRANSFER_REJECTED", "TransferRequest", transfer.id);
  res.json(transfer);
}

export async function listTransfers(req: AuthedRequest, res: Response) {
  const transfers = await prisma.transferRequest.findMany({
    include: { asset: true, toUser: { select: { id: true, name: true } }, fromUser: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(transfers);
}
