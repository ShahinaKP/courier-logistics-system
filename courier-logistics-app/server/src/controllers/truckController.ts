import { Request, Response } from "express";
import prisma from "../db/prisma";

export const getAllTrucks = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const trucks = await prisma.truck.findMany({
      orderBy: { truck_code: "asc" },
    });
    res.json(trucks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createTruck = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { truck_code, capacity } = req.body;
    if (!truck_code) {
      res.status(400).json({ error: "truck_code is required" });
      return;
    }
    const truck = await prisma.truck.create({
      data: {
        truck_code: truck_code.toUpperCase(),
        capacity: capacity ? parseInt(capacity) : 10,
        status: "available",
      },
    });
    res.status(201).json(truck);
  } catch (err: any) {
    if (err.code === "P2002") {
      res.status(409).json({ error: "Truck code already exists" });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllSchedules = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const schedules = await prisma.truckSchedule.findMany({
      include: {
        truck: true,
        region: true,
        truck_bags: {
          include: {
            bag: {
              include: { package_bags: true },
            },
          },
        },
      },
      orderBy: { scheduled_departure: "desc" },
    });

    const result = schedules.map((s) => ({
      ...s,
      bag_count: s.truck_bags.length,
      package_count: s.truck_bags.reduce(
        (acc, tb) => acc + (tb.bag?.package_bags.length ?? 0),
        0,
      ),
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createSchedule = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { truck_id, region_id, scheduled_departure } = req.body;

    const schedule = await prisma.truckSchedule.create({
      data: {
        truck_id: parseInt(truck_id),
        region_id: parseInt(region_id),
        scheduled_departure: new Date(scheduled_departure),
      },
    });

    res.status(201).json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateSchedule = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const scheduleId = parseInt(req.params.scheduleId as string);
    const { status, delay_reason, actual_departure } = req.body;

    const schedule = await prisma.truckSchedule.update({
      where: { id: scheduleId },
      data: {
        status,
        delay_reason: delay_reason ?? null,
        actual_departure: actual_departure
          ? new Date(actual_departure)
          : undefined,
      },
    });

    // If status is "departed", update all bags in this schedule to en_route
    if (status === "departed") {
      const truckBags = await prisma.truckBag.findMany({
        where: { truck_schedule_id: scheduleId },
        include: { bag: { include: { package_bags: true } } },
      });

      const packageIds = truckBags.flatMap(
        (tb) =>
          tb.bag?.package_bags.map((pb) => pb.package_id!).filter(Boolean) ??
          [],
      );

      if (packageIds.length > 0) {
        await prisma.package.updateMany({
          where: { id: { in: packageIds } },
          data: { status: "en_route", updated_at: new Date() },
        });
      }
    }

    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/trucks/schedules/:scheduleId/bags — load a bag onto a truck schedule
export const loadBagOntoTruck = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const scheduleId = parseInt(req.params.scheduleId as string);
    const { bag_id } = req.body;

    if (!bag_id) {
      res.status(400).json({ error: "bag_id is required" });
      return;
    }

    // Check bag is sealed
    const bag = await prisma.bag.findUnique({
      where: { id: parseInt(bag_id) },
    });
    if (!bag) {
      res.status(404).json({ error: "Bag not found" });
      return;
    }
    if (bag.status !== "sealed") {
      res
        .status(400)
        .json({ error: "Only sealed bags can be loaded onto a truck" });
      return;
    }

    // Check not already loaded
    const existing = await prisma.truckBag.findFirst({
      where: { bag_id: parseInt(bag_id) },
    });
    if (existing) {
      res.status(409).json({ error: "Bag is already loaded on a truck" });
      return;
    }

    const truckBag = await prisma.truckBag.create({
      data: {
        truck_schedule_id: scheduleId,
        bag_id: parseInt(bag_id),
      },
    });

    // Update bag status to loaded
    await prisma.bag.update({
      where: { id: parseInt(bag_id) },
      data: { status: "loaded", updated_at: new Date() },
    });

    res.status(201).json({ message: "Bag loaded onto truck", truckBag });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
