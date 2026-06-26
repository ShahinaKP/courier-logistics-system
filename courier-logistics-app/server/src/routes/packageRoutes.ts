import { Router } from "express";
import {
  getAllPackages,
  createPackage,
  updatePackageStatus,
  webhookCreatePackage,
} from "../controllers/packageController";
import { verifySignature } from "../middleware/verifySignature";

const verifyWebhook = verifySignature(
  process.env.WEBHOOK_API_KEY || "",
  process.env.WEBHOOK_API_SECRET || "",
);

const router = Router();
router.get("/", getAllPackages);
router.post("/", createPackage);
router.post("/webhook", verifyWebhook, webhookCreatePackage); // add verifyWebhook

router.patch("/:trackingId/status", updatePackageStatus);

export default router;
