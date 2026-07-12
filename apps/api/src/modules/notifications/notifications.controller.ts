import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";

export async function listMyNotifications(req: AuthedRequest, res: Response) {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(notifications);
}

export async function markRead(req: AuthedRequest, res: Response) {
  const notification = await prisma.notification.update({
    where: { id: req.params.id },
    data: { isRead: true },
  });
  res.json(notification);
}

export async function markAllRead(req: AuthedRequest, res: Response) {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true },
  });
  res.json({ ok: true });
}
