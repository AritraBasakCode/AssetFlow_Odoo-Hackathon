import { z } from "zod";

export const createDepartmentSchema = z.object({
  name: z.string().min(2),
  parentId: z.string().optional(),
  headId: z.string().optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2),
  extraFields: z.record(z.any()).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const promoteRoleSchema = z.object({
  role: z.enum(["ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"]),
});

export const updateEmployeeStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
