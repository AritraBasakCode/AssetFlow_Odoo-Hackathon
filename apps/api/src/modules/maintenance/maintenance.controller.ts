import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import { Prisma } from "@prisma/client";
import { assertTransition } from "../../utils/stateMachine";
import { logActivity, notify } from "../../services/notification.service";

export async function createRequest(req: AuthedRequest, res: Response) {
  const request = await prisma.maintenanceRequest.create({
    data: { ...req.body, raisedById: req.user!.id, status: "PENDING" },
  });
  await logActivity(prisma, req.user!.id, "MAINTENANCE_REQUESTED", "MaintenanceRequest", request.id);
  res.status(201).json(request);
}

// Repair work cannot start until this approval step flips the asset's status —
// enforces "route through approval workflow before repair work starts".
export async function approveRequest(req: AuthedRequest, res: Response) {
  const request = await prisma.maintenanceRequest.findUnique({ where: { id: req.params.id }, include: { asset: true } });
  if (!request || request.status !== "PENDING") {
    return res.status(409).json({ error: "Request is not pending approval" });
  }

  assertTransition(request.asset.status, "UNDER_MAINTENANCE");

  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const req2 = await tx.maintenanceRequest.update({
      where: { id: request.id },
      data: { status: "APPROVED", approvedById: req.user!.id },
    });
    await tx.asset.update({ where: { id: request.assetId }, data: { status: "UNDER_MAINTENANCE" } });
    await logActivity(tx, req.user!.id, "MAINTENANCE_APPROVED", "MaintenanceRequest", request.id);
    await notify(tx, request.raisedById, "MAINTENANCE_APPROVED", "Your maintenance request was approved.");
    return req2;
  });

  res.json(updated);
}

export async function rejectRequest(req: AuthedRequest, res: Response) {
  const request = await prisma.maintenanceRequest.update({
    where: { id: req.params.id },
    data: { status: "REJECTED", approvedById: req.user!.id },
  });
  await logActivity(prisma, req.user!.id, "MAINTENANCE_REJECTED", "MaintenanceRequest", request.id);
  await notify(prisma, request.raisedById, "MAINTENANCE_REJECTED", "Your maintenance request was rejected.");
  res.json(request);
}

export async function assignTechnician(req: AuthedRequest, res: Response) {
  const request = await prisma.maintenanceRequest.update({
    where: { id: req.params.id },
    data: { status: "TECH_ASSIGNED", technicianName: req.body.technicianName },
  });
  await logActivity(prisma, req.user!.id, "MAINTENANCE_TECH_ASSIGNED", "MaintenanceRequest", request.id);
  res.json(request);
}

export async function startProgress(req: AuthedRequest, res: Response) {
  const request = await prisma.maintenanceRequest.update({
    where: { id: req.params.id },
    data: { status: "IN_PROGRESS" },
  });
  res.json(request);
}

export async function resolveRequest(req: AuthedRequest, res: Response) {
  const request = await prisma.maintenanceRequest.findUnique({ where: { id: req.params.id }, include: { asset: true } });
  if (!request) return res.status(404).json({ error: "Not found" });

  assertTransition(request.asset.status, "AVAILABLE");

  const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const req2 = await tx.maintenanceRequest.update({
      where: { id: request.id },
      data: { status: "RESOLVED", resolutionNotes: req.body.resolutionNotes, resolvedAt: new Date() },
    });
    await tx.asset.update({ where: { id: request.assetId }, data: { status: "AVAILABLE" } });
    await logActivity(tx, req.user!.id, "MAINTENANCE_RESOLVED", "MaintenanceRequest", request.id);
    await notify(tx, request.raisedById, "MAINTENANCE_RESOLVED", "Maintenance on your reported asset is complete.");
    return req2;
  });

  res.json(updated);
}

export async function listRequests(req: AuthedRequest, res: Response) {
  const { status, assetId } = req.query as Record<string, string>;
  const requests = await prisma.maintenanceRequest.findMany({
    where: { status: (status as any) || undefined, assetId: assetId || undefined },
    include: { asset: true, raisedBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(requests);
}
