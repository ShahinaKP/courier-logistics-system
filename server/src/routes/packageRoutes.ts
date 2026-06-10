import { Router } from "express";
import {
  getAllPackages,
  getPackageByTrackingId,
  createPackage,
  receiveRawUpdates,
} from "../controllers/packageController";

const router = Router();

router.get("/", getAllPackages);
router.get("/:trackingId", getPackageByTrackingId);
router.post("/", createPackage);
router.post("/raw-updates", receiveRawUpdates);

export default router;
