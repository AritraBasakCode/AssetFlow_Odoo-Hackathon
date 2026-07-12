import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import { generateAssetTag } from "../../utils/assetTag";
import { logActivity } from "../../services/notification.service";

export async function createAsset(req: AuthedRequest, res: Response) {
  const assetTag = await generateAssetTag();
  const asset = await prisma.asset.create({
    data: { ...req.body, assetTag, status: "AVAILABLE" },
  });
  await logActivity(prisma, req.user!.id, "ASSET_REGISTERED", "Asset", asset.id, { assetTag });
  res.status(201).json(asset);
}

export async function updateAsset(req: AuthedRequest, res: Response) {
  const asset = await prisma.asset.update({ where: { id: req.params.id }, data: req.body });
  await logActivity(prisma, req.user!.id, "ASSET_UPDATED", "Asset", asset.id, req.body);
  res.json(asset);
}

export async function listAssets(req: AuthedRequest, res: Response) {
  const { q, category, status, department, location } = req.query as Record<string, string>;

  const assets = await prisma.asset.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { assetTag: { contains: q, mode: "insensitive" } },
                { serialNumber: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
                { qrCode: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        category ? { categoryId: category } : {},
        status ? { status: status as any } : {},
        department ? { departmentId: department } : {},
        location ? { location: { contains: location, mode: "insensitive" } } : {},
      ],
    },
    include: { category: true, department: true },
    orderBy: { createdAt: "desc" },
  });

  res.json(assets);
}

export async function getAsset(req: AuthedRequest, res: Response) {
  const asset = await prisma.asset.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      department: true,
      allocations: { orderBy: { allocatedAt: "desc" }, include: { employee: { select: { id: true, name: true } } } },
      maintenanceRequests: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!asset) return res.status(404).json({ error: "Asset not found" });
  res.json(asset);
}
