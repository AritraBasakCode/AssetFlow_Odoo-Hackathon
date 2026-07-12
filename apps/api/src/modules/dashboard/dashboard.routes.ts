import { Router } from "express";
import * as controller from "./dashboard.controller";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();
router.use(requireAuth);
router.get("/kpis", asyncHandler(controller.getKpis));

export default router;
