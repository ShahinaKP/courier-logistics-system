import { Router } from "express";
import { getAllRegions } from "../controllers/regionController";

const router = Router();

router.get("/", getAllRegions);

export default router;
