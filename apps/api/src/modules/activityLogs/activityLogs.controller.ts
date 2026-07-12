import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

export async function listActivityLogs(req: AuthedRequest, res: Response) {
  const { entityType, entityId, actorId } = req.query as Record<string, string>;
  const logs = await prisma.activityLog.findMany({
    where: {
      entityType: entityType || undefined,
      entityId: entityId || undefined,
      actorId: actorId || undefined,
    },
    include: { actor: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json(logs);
}
