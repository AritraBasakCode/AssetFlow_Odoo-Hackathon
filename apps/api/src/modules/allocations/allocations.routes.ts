import { Router } from "express";
import * as controller from "./allocations.controller";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { createAllocationSchema, returnAllocationSchema, createTransferSchema } from "./allocations.schemas";

const router = Router();
router.use(requireAuth);

router.get("/allocations", asyncHandler(controller.listAllocations));
router.get("/allocations/overdue", asyncHandler(controller.listOverdueAllocations));
router.post("/allocations", requireRole("ASSET_MANAGER", "DEPARTMENT_HEAD", "ADMIN"), validateBody(createAllocationSchema), asyncHandler(controller.createAllocation));
router.post("/allocations/:id/return", requireRole("ASSET_MANAGER", "DEPARTMENT_HEAD", "ADMIN"), validateBody(returnAllocationSchema), asyncHandler(controller.returnAllocation));

router.get("/transfers", asyncHandler(controller.listTransfers));
router.post("/transfers", validateBody(createTransferSchema), asyncHandler(controller.createTransferRequest));
router.patch("/transfers/:id/approve", requireRole("ASSET_MANAGER", "DEPARTMENT_HEAD", "ADMIN"), asyncHandler(controller.approveTransfer));
router.patch("/transfers/:id/reject", requireRole("ASSET_MANAGER", "DEPARTMENT_HEAD", "ADMIN"), asyncHandler(controller.rejectTransfer));

export default router;
