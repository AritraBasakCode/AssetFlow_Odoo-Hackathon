import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import { Prisma } from "@prisma/client";
import { logActivity, notify } from "../../services/notification.service";

// App-layer overlap check gives a fast, friendly rejection. The Postgres
// EXCLUDE constraint (see prisma/manual_sql/001_constraints.sql) is the real
// guarantee under concurrent booking requests for the same asset — matches
// the spec's example precisely: a slot ending at 10:00 does NOT overlap one
// starting at 10:00 (half-open interval [start, end)).
export async function createBooking(req: AuthedRequest, res: Response) {
  const { assetId, startTime, endTime } = req.body;

  const asset = await prisma.asset.findUnique({ where: { id: assetId } });
  if (!asset) return res.status(404).json({ error: "Asset not found" });
  if (!asset.isBookable) return res.status(400).json({ error: "This asset is not marked as bookable" });

  const overlapping = await prisma.booking.findFirst({
    where: {
      assetId,
      status: { in: ["UPCOMING", "ONGOING"] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (overlapping) {
    return res.status(409).json({
      error: `This resource is already booked from ${overlapping.startTime.toISOString()} to ${overlapping.endTime.toISOString()}.`,
    });
  }

  const booking = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const created = await tx.booking.create({
      data: { assetId, bookedById: req.user!.id, startTime, endTime, status: "UPCOMING" },
    });
    await logActivity(tx, req.user!.id, "BOOKING_CREATED", "Booking", created.id);
    await notify(tx, req.user!.id, "BOOKING_CONFIRMED", `Your booking for ${asset.name} is confirmed.`);
    return created;
  });

  res.status(201).json(booking);
}

export async function cancelBooking(req: AuthedRequest, res: Response) {
  const booking = await prisma.booking.update({
    where: { id: req.params.id },
    data: { status: "CANCELLED" },
  });
  await logActivity(prisma, req.user!.id, "BOOKING_CANCELLED", "Booking", booking.id);
  await notify(prisma, booking.bookedById, "BOOKING_CANCELLED", "Your booking has been cancelled.");
  res.json(booking);
}

export async function listBookingsForAsset(req: AuthedRequest, res: Response) {
  const bookings = await prisma.booking.findMany({
    where: { assetId: req.params.assetId },
    include: { bookedBy: { select: { id: true, name: true } } },
    orderBy: { startTime: "asc" },
  });
  res.json(bookings);
}

export async function listMyBookings(req: AuthedRequest, res: Response) {
  const bookings = await prisma.booking.findMany({
    where: { bookedById: req.user!.id },
    include: { asset: true },
    orderBy: { startTime: "asc" },
  });
  res.json(bookings);
}
