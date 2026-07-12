import { Router } from "express";
import * as controller from "./assets.controller";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { createAssetSchema, updateAssetSchema } from "./assets.schemas";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(controller.listAssets));
router.get("/:id", asyncHandler(controller.getAsset));
router.post("/", requireRole("ASSET_MANAGER", "ADMIN"), validateBody(createAssetSchema), asyncHandler(controller.createAsset));
router.patch("/:id", requireRole("ASSET_MANAGER", "ADMIN"), validateBody(updateAssetSchema), asyncHandler(controller.updateAsset));

export default router;
