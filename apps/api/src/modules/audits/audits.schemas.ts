import { z } from "zod";

export const createAuditCycleSchema = z.object({
  name: z.string().min(2),
  scopeDepartmentId: z.string().optional(),
  scopeLocation: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  auditorIds: z.array(z.string()).min(1),
});

export const markAuditItemSchema = z.object({
  result: z.enum(["VERIFIED", "MISSING", "DAMAGED"]),
  notes: z.string().optional(),
});
