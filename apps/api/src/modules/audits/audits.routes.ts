import { Router } from "express";
import * as controller from "./audits.controller";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { createAuditCycleSchema, markAuditItemSchema } from "./audits.schemas";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(controller.listAuditCycles));
router.get("/:id", asyncHandler(controller.getAuditCycle));
router.post("/", requireRole("ADMIN"), validateBody(createAuditCycleSchema), asyncHandler(controller.createAuditCycle));
router.patch("/:id/items/:itemId", validateBody(markAuditItemSchema), asyncHandler(controller.markAuditItem));
router.patch("/:id/close", requireRole("ADMIN"), asyncHandler(controller.closeAuditCycle));
router.get("/:id/discrepancy-report", asyncHandler(controller.getDiscrepancyReport));

export default router;
