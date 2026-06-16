import { Router } from "express";
import {
  getAllTrucks,
  createTruck,
  getAllSchedules,
  createSchedule,
  updateSchedule,
  loadBagOntoTruck,
} from "../controllers/truckController";

const router = Router();
router.get("/", getAllTrucks);
router.post("/", createTruck);
router.get("/schedules", getAllSchedules);
router.post("/schedules", createSchedule);
router.patch("/schedules/:scheduleId", updateSchedule);
router.post("/schedules/:scheduleId/bags", loadBagOntoTruck);

export default router;
