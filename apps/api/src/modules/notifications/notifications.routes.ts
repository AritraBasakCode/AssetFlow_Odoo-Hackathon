import { Router } from "express";
import * as controller from "./notifications.controller";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(controller.listMyNotifications));
router.patch("/:id/read", asyncHandler(controller.markRead));
router.patch("/read-all", asyncHandler(controller.markAllRead));

export default router;
