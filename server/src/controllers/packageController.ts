import { Request, Response } from "express";
import prisma from "../db/prisma";

export const getAllPackages = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const packages = await prisma.package.findMany({
      include: { region: true },
      orderBy: { created_at: "desc" },
    });

    const dashboard = {
      to_be_picked_up: packages.filter((p) => p.status === "to_be_picked_up"),
      active: packages.filter((p) =>
        ["picked_up", "added_to_bag", "en_route", "arrived"].includes(p.status),
      ),
      delayed: packages.filter((p) => p.delay_reason !== null),
    };

    res.json({ packages, dashboard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPackageByTrackingId = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const trackingId = req.params.trackingId as string;
    const pkg = await prisma.package.findUnique({
      where: { tracking_id: trackingId },
      include: { region: true },
    });

    if (!pkg) {
      res.status(404).json({ error: "Package not found" });
      return;
    }
    res.json(pkg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createPackage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      sender_name,
      sender_address,
      receiver_name,
      receiver_address,
      weight,
      region_id,
    } = req.body;

    const newPackage = await prisma.package.create({
      data: {
        sender_name,
        sender_address,
        receiver_name,
        receiver_address,
        weight,
        region_id: parseInt(region_id),
        status: "to_be_picked_up",
      },
    });

    const amount = Number(weight) * 10;

    await prisma.sale.create({
      data: {
        package_id: newPackage.id,
        tracking_id: newPackage.tracking_id,
        amount,
      },
    });

    res.status(201).json({
      message: "Package created successfully",
      package: newPackage,
      bill: { amount },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
