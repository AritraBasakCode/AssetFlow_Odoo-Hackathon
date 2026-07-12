import { z } from "zod";

export const createAssetSchema = z.object({
  name: z.string().min(2),
  categoryId: z.string(),
  serialNumber: z.string().min(1),
  acquisitionDate: z.coerce.date(),
  acquisitionCost: z.number().optional(),
  condition: z.string().min(1),
  location: z.string().min(1),
  isBookable: z.boolean().optional(),
  departmentId: z.string().optional(),
  photoUrl: z.string().url().optional(),
  qrCode: z.string().optional(),
});

export const updateAssetSchema = createAssetSchema.partial();
