import { Router } from "express";
import {
  getAllPackages,
  createPackage,
  updatePackageStatus,
  webhookCreatePackage,
} from "../controllers/packageController";

const router = Router();
router.get("/", getAllPackages);
router.post("/", createPackage);
router.post("/webhook", webhookCreatePackage);
router.patch("/:trackingId/status", updatePackageStatus);

export default router;
