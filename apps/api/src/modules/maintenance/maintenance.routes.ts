import { Router } from "express";
import * as controller from "./maintenance.controller";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { createMaintenanceSchema, assignTechnicianSchema, resolveMaintenanceSchema } from "./maintenance.schemas";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(controller.listRequests));
router.post("/", validateBody(createMaintenanceSchema), asyncHandler(controller.createRequest));
router.patch("/:id/approve", requireRole("ASSET_MANAGER", "ADMIN"), asyncHandler(controller.approveRequest));
router.patch("/:id/reject", requireRole("ASSET_MANAGER", "ADMIN"), asyncHandler(controller.rejectRequest));
router.patch("/:id/assign-technician", requireRole("ASSET_MANAGER", "ADMIN"), validateBody(assignTechnicianSchema), asyncHandler(controller.assignTechnician));
router.patch("/:id/start-progress", requireRole("ASSET_MANAGER", "ADMIN"), asyncHandler(controller.startProgress));
router.patch("/:id/resolve", requireRole("ASSET_MANAGER", "ADMIN"), validateBody(resolveMaintenanceSchema), asyncHandler(controller.resolveRequest));

export default router;
