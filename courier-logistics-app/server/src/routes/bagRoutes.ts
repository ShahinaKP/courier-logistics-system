import { Router } from "express";
import {
  getAllBags,
  createBag,
  addPackageToBag,
  updateBagStatus,
} from "../controllers/bagController";

const router = Router();

router.get("/", getAllBags);
router.post("/", createBag);
router.post("/:bagId/packages", addPackageToBag);
router.patch("/:bagId/status", updateBagStatus);

export default router;
