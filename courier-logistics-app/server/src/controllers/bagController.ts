import { Request, Response } from "express";
import prisma from "../db/prisma";
import { getDirection } from "../utils/directionUtils";

export const getAllBags = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const bags = await prisma.bag.findMany({
      include: {
        region: true,
        package_bags: {
          include: {
            package: {
              include: {
                destination_region: true,
                current_region: true,
              },
            },
          },
        },
        truck_bags: {
          include: { truck_schedule: { include: { truck: true } } },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const result = bags.map((b) => ({
      ...b,
      package_count: b.package_bags.length,
      packages: b.package_bags.map((pb) => pb.package),
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createBag = async (req: Request, res: Response): Promise<void> => {
  try {
    const { region_id, direction } = req.body;

    if (!region_id || !direction) {
      res.status(400).json({ error: "region_id and direction are required" });
      return;
    }

    const bag = await prisma.bag.create({
      data: {
        bag_code: `BAG-${Date.now()}`,
        region_id: parseInt(region_id as string),
        direction,
      },
    });

    res.status(201).json(bag);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addPackageToBag = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const bagId = parseInt(req.params.bagId as string);
    const packageId = parseInt(req.body.package_id as string);

    // Validate bag exists and is open
    const bag = await prisma.bag.findUnique({
      where: { id: bagId },
      include: { region: true },
    });
    if (!bag) {
      res.status(404).json({ error: "Bag not found" });
      return;
    }
    if (bag.status !== "open") {
      res.status(400).json({ error: "Cannot add packages to a non-open bag" });
      return;
    }

    // Validate package exists and is eligible
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: { destination_region: true },
    });
    if (!pkg) {
      res.status(404).json({ error: "Package not found" });
      return;
    }

    const eligible = ["to_be_picked_up", "picked_up"];
    if (!eligible.includes(pkg.status)) {
      res.status(400).json({
        error: `Package status "${pkg.status}" is not eligible for bagging.`,
      });
      return;
    }

    // Check not already bagged
    const alreadyBagged = await prisma.packageBag.findFirst({
      where: { package_id: packageId },
    });
    if (alreadyBagged) {
      res.status(409).json({ error: "Package is already in a bag" });
      return;
    }

    // ── Direction validation ──────────────────────────────────────────────────
    // Only validate if we know both the bag's hub region AND the package's
    // destination region. If either is missing we allow it (edge case / legacy).
    if (bag.region && pkg.destination_region) {
      const expectedDirection = getDirection(
        bag.region.region_code,
        pkg.destination_region.region_code,
      );

      if (bag.direction !== expectedDirection) {
        res.status(400).json({
          error:
            `Wrong bag direction. Package is going to ${pkg.destination_region.region_name} ` +
            `(${pkg.destination_region.region_code}), so it should go "${expectedDirection}" ` +
            `from ${bag.region.region_code}, but this bag goes "${bag.direction}".`,
        });
        return;
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    await prisma.packageBag.create({
      data: { package_id: packageId, bag_id: bagId },
    });

    await prisma.package.update({
      where: { id: packageId },
      data: { status: "added_to_bag", updated_at: new Date() },
    });

    res.status(201).json({ message: "Package added to bag" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateBagStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const bagId = parseInt(req.params.bagId as string);
    const { status, delay_reason } = req.body;

    if (status === "sealed") {
      const count = await prisma.packageBag.count({ where: { bag_id: bagId } });
      if (count === 0) {
        res.status(400).json({
          error: "Cannot seal an empty bag. Add at least one package first.",
        });
        return;
      }
    }

    await prisma.bag.update({
      where: { id: bagId },
      data: { status, updated_at: new Date() },
    });

    const packageIds = (
      await prisma.packageBag.findMany({ where: { bag_id: bagId } })
    )
      .map((pb) => pb.package_id!)
      .filter(Boolean);

    if (status === "delayed" && delay_reason) {
      await prisma.package.updateMany({
        where: { id: { in: packageIds } },
        data: { delay_reason, updated_at: new Date() },
      });
    }

    if (status === "sealed" || status === "open") {
      await prisma.package.updateMany({
        where: { id: { in: packageIds } },
        data: { delay_reason: null, updated_at: new Date() },
      });
    }

    res.json({ message: "Bag status updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
