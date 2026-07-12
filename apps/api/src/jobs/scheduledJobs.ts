import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { notify } from "../services/notification.service";

// Runs every 10 minutes. Idempotent: checks for an existing unread
// notification of the same type before creating a duplicate.
export function startScheduledJobs() {
  cron.schedule("*/10 * * * *", async () => {
    await flagOverdueAllocations();
    await sendBookingReminders();
    await promoteBookingStatuses();
  });
  console.log("[jobs] scheduled sweeps registered (every 10 min)");
}

async function flagOverdueAllocations() {
  const overdue = await prisma.assetAllocation.findMany({
    where: { status: "ACTIVE", expectedReturnDate: { lt: new Date() } },
    include: { asset: true },
  });

  for (const allocation of overdue) {
    if (!allocation.employeeId) continue;
    const existing = await prisma.notification.findFirst({
      where: { userId: allocation.employeeId, type: "OVERDUE_RETURN", message: { contains: allocation.asset.assetTag } },
    });
    if (existing) continue;
    await notify(prisma, allocation.employeeId, "OVERDUE_RETURN", `Return for ${allocation.asset.assetTag} is overdue.`);
  }
}

async function sendBookingReminders() {
  const soon = new Date(Date.now() + 15 * 60 * 1000);
  const upcoming = await prisma.booking.findMany({
    where: { status: "UPCOMING", startTime: { gte: new Date(), lte: soon } },
    include: { asset: true },
  });

  for (const booking of upcoming) {
    const existing = await prisma.notification.findFirst({
      where: { userId: booking.bookedById, type: "BOOKING_REMINDER", message: { contains: booking.id } },
    });
    if (existing) continue;
    await notify(prisma, booking.bookedById, "BOOKING_REMINDER", `Reminder: your booking for ${booking.asset.name} starts soon. (ref ${booking.id})`);
  }
}

async function promoteBookingStatuses() {
  const now = new Date();
  await prisma.booking.updateMany({
    where: { status: "UPCOMING", startTime: { lte: now }, endTime: { gt: now } },
    data: { status: "ONGOING" },
  });
  await prisma.booking.updateMany({
    where: { status: { in: ["UPCOMING", "ONGOING"] }, endTime: { lte: now } },
    data: { status: "COMPLETED" },
  });
}
