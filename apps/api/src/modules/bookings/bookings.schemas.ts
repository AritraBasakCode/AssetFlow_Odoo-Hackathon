import { z } from "zod";

export const createBookingSchema = z.object({
  assetId: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
}).refine((d) => d.endTime > d.startTime, { message: "endTime must be after startTime" });
