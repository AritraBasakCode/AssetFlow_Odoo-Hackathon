import { Router } from "express";
import * as controller from "./bookings.controller";
import { requireAuth } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { createBookingSchema } from "./bookings.schemas";

const router = Router();
router.use(requireAuth);

router.get("/mine", asyncHandler(controller.listMyBookings));
router.get("/asset/:assetId", asyncHandler(controller.listBookingsForAsset));
router.post("/", validateBody(createBookingSchema), asyncHandler(controller.createBooking));
router.patch("/:id/cancel", asyncHandler(controller.cancelBooking));

export default router;
