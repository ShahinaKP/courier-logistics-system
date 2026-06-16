import { Request, Response } from "express";
import prisma from "../db/prisma";

export const getAllBags = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const bags = await prisma.bag.findMany({
      include: {
        region: true,
        package_bags: {
          include: { package: true },
        },
        truck_bags: {
          include: {
            truck_schedule: {
              include: { truck: true },
            },
          },
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
    const bag = await prisma.bag.findUnique({ where: { id: bagId } });
    if (!bag) {
      res.status(404).json({ error: "Bag not found" });
      return;
    }
    if (bag.status !== "open") {
      res.status(400).json({ error: "Cannot add packages to a non-open bag" });
      return;
    }

    // Validate package exists and is in an eligible status
    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) {
      res.status(404).json({ error: "Package not found" });
      return;
    }

    const eligible = ["to_be_picked_up", "picked_up"];
    if (!eligible.includes(pkg.status)) {
      res.status(400).json({
        error: `Package status "${pkg.status}" is not eligible for bagging. Must be "to_be_picked_up" or "picked_up".`,
      });
      return;
    }

    // Check package is not already in a bag
    const alreadyBagged = await prisma.packageBag.findFirst({
      where: { package_id: packageId },
    });
    if (alreadyBagged) {
      res.status(409).json({ error: "Package is already in a bag" });
      return;
    }

    // Add to bag
    await prisma.packageBag.create({
      data: { package_id: packageId, bag_id: bagId },
    });

    // Advance status:
    // - "to_be_picked_up" packages are implicitly picked up when the hub bags them,
    //   so we go straight to "added_to_bag".
    // - "picked_up" packages also move to "added_to_bag".
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

    // ── Guard: cannot seal an empty bag ──────────────────────────────────────
    if (status === "sealed") {
      const count = await prisma.packageBag.count({ where: { bag_id: bagId } });
      if (count === 0) {
        res
          .status(400)
          .json({
            error: "Cannot seal an empty bag. Add at least one package first.",
          });
        return;
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

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
      // Propagate delay reason to all packages in the bag
      await prisma.package.updateMany({
        where: { id: { in: packageIds } },
        data: { delay_reason, updated_at: new Date() },
      });
    }

    if (status === "sealed" || status === "open") {
      // Clear any delay reason when sealing or reopening
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
