import { Router } from "express";
import {
  getAllPackages,
  getPackageByTrackingId,
  createPackage,
  receiveRawUpdates,
} from "../controllers/packageController";

import { authenticate, requireStaff } from "../middleware/authMiddleware";

const router = Router();

// Public route
router.get("/track/:trackingId", getPackageByTrackingId);
router.post("/raw-updates", receiveRawUpdates);

// Staff only routes
router.get("/", authenticate, requireStaff, getAllPackages);
router.post("/", authenticate, requireStaff, createPackage);
router.get("/:trackingId", authenticate, requireStaff, getPackageByTrackingId);

export default router;
