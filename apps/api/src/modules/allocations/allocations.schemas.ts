import { z } from "zod";

export const createAllocationSchema = z.object({
  assetId: z.string(),
  employeeId: z.string().optional(),
  departmentId: z.string().optional(),
  expectedReturnDate: z.coerce.date().optional(),
}).refine((d) => d.employeeId || d.departmentId, {
  message: "Either employeeId or departmentId is required",
});

export const returnAllocationSchema = z.object({
  checkInNotes: z.string().optional(),
  condition: z.string().optional(),
});

export const createTransferSchema = z.object({
  assetId: z.string(),
  toUserId: z.string(),
});
