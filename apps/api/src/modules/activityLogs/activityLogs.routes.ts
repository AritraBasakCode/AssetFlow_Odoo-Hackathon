import { Router } from "express";
import * as controller from "./activityLogs.controller";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();
router.use(requireAuth, requireRole("ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"));

router.get("/", asyncHandler(controller.listActivityLogs));

export default router;
