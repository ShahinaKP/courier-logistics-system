import { Router } from "express";
import { lookupPincode } from "../controllers/pincodeController";

const router = Router();

// Public — no auth needed, used from the new package form
router.get("/:pincode", lookupPincode);

export default router;
