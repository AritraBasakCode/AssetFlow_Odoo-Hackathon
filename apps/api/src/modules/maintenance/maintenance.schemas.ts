import { z } from "zod";

export const createMaintenanceSchema = z.object({
  assetId: z.string(),
  issueDescription: z.string().min(3),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  photoUrl: z.string().url().optional(),
});

export const assignTechnicianSchema = z.object({
  technicianName: z.string().min(2),
});

export const resolveMaintenanceSchema = z.object({
  resolutionNotes: z.string().min(3),
});
