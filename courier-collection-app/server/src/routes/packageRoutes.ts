import { Router } from "express";
import {
  getAllPackages,
  getPackageByTrackingId,
  createPackage,
  receiveRawUpdates,
  resyncToLogistics,
} from "../controllers/packageController";

import { authenticate, requireStaff } from "../middleware/authMiddleware";
import { verifySignature } from "../middleware/verifySignature";

const verifyEtl = verifySignature(
  process.env.ETL_API_KEY || "",
  process.env.ETL_API_SECRET || "",
);

const router = Router();

// Public route
router.get("/track/:trackingId", getPackageByTrackingId);
router.post("/raw-updates", verifyEtl, receiveRawUpdates);

// Staff only routes
router.get("/", authenticate, requireStaff, getAllPackages);
router.post("/", authenticate, requireStaff, createPackage);
router.post("/resync", authenticate, requireStaff, resyncToLogistics);
router.get("/:trackingId", authenticate, requireStaff, getPackageByTrackingId);

export default router;
