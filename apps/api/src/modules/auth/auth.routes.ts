import { Router } from "express";
import * as controller from "./auth.controller";
import { validateBody } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schemas";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.post("/signup", validateBody(signupSchema), asyncHandler(controller.signup));
router.post("/login", validateBody(loginSchema), asyncHandler(controller.login));
router.post("/refresh", asyncHandler(controller.refresh));
router.post("/logout", asyncHandler(controller.logout));
router.post("/forgot-password", validateBody(forgotPasswordSchema), asyncHandler(controller.forgotPassword));
router.post("/reset-password", validateBody(resetPasswordSchema), asyncHandler(controller.resetPassword));
router.get("/me", requireAuth, asyncHandler(controller.me));

export default router;
