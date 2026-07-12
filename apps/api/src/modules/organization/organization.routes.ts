import { Router } from "express";
import * as controller from "./organization.controller";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  createCategorySchema,
  updateCategorySchema,
  promoteRoleSchema,
  updateEmployeeStatusSchema,
} from "./organization.schemas";

const router = Router();
router.use(requireAuth);

// Departments — Admin manages, everyone can read (needed for dropdowns).
router.get("/departments", asyncHandler(controller.listDepartments));
router.post("/departments", requireRole("ADMIN"), validateBody(createDepartmentSchema), asyncHandler(controller.createDepartment));
router.patch("/departments/:id", requireRole("ADMIN"), validateBody(updateDepartmentSchema), asyncHandler(controller.updateDepartment));

// Asset Categories
router.get("/asset-categories", asyncHandler(controller.listCategories));
router.post("/asset-categories", requireRole("ADMIN"), validateBody(createCategorySchema), asyncHandler(controller.createCategory));
router.patch("/asset-categories/:id", requireRole("ADMIN"), validateBody(updateCategorySchema), asyncHandler(controller.updateCategory));

// Employee Directory
router.get("/employees", requireRole("ADMIN", "ASSET_MANAGER"), asyncHandler(controller.listEmployees));
router.patch("/employees/:id/role", requireRole("ADMIN"), validateBody(promoteRoleSchema), asyncHandler(controller.promoteEmployee));
router.patch("/employees/:id/status", requireRole("ADMIN"), validateBody(updateEmployeeStatusSchema), asyncHandler(controller.updateEmployeeStatus));

export default router;
