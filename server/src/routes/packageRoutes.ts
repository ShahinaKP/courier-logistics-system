import { Router } from "express";
import {
  getAllPackages,
  getPackageByTrackingId,
  createPackage,
} from "../controllers/packageController";

const router = Router();

router.get("/", getAllPackages);
router.get("/:trackingId", getPackageByTrackingId);
router.post("/", createPackage);

export default router;
