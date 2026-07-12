import { Router } from "express";
import * as controller from "./reports.controller";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();
router.use(requireAuth);

router.get("/utilization", asyncHandler(controller.utilization));
router.get("/maintenance-frequency", asyncHandler(controller.maintenanceFrequency));
router.get("/department-summary", asyncHandler(controller.departmentSummary));
router.get("/booking-heatmap", asyncHandler(controller.bookingHeatmap));
router.get("/nearing-retirement", asyncHandler(controller.assetsNearingRetirement));

export default router;
