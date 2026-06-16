import { Router } from "express";
import { getRegions } from "../controllers/regionController";

const router = Router();

router.get("/", getRegions);

export default router;
