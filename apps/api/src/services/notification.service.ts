import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient | typeof prisma;

// Both helpers are called from *inside* the same transaction as the triggering
// write (e.g. approving a transfer), so notifications/logs are never lost to a
// partial failure and never require a separate message queue for a hackathon.
export async function notify(
  tx: Tx,
  userId: string,
  type: string,
  message: string
) {
  return tx.notification.create({ data: { userId, type, message } });
}

export async function logActivity(
  tx: Tx,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, any>
) {
  return tx.activityLog.create({
    data: { actorId, action, entityType, entityId, metadata: metadata ?? undefined },
  });
}
