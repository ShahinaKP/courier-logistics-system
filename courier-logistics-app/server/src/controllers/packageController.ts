import { Request, Response } from "express";
import prisma from "../db/prisma";

export const getAllPackages = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const packages = await prisma.package.findMany({
      include: {
        destination_region: true,
        current_region: true,
      },
      orderBy: { created_at: "desc" },
    });

    const now = new Date();
    const noon = new Date(now);
    noon.setHours(12, 0, 0, 0);
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const currentWindowStart = now < noon ? startOfDay : noon;

    res.json({
      packages,
      dashboard: {
        new_in_window: packages.filter(
          (p) =>
            ["to_be_picked_up", "picked_up"].includes(p.status) &&
            p.created_at !== null &&
            p.created_at >= currentWindowStart,
        ),
        unbagged: packages.filter(
          (p) =>
            ["to_be_picked_up", "picked_up"].includes(p.status) &&
            (p.created_at === null || p.created_at < currentWindowStart),
        ),
        bagged: packages.filter((p) => p.status === "added_to_bag"),
        in_transit: packages.filter((p) =>
          ["en_route", "arrived"].includes(p.status),
        ),
        delayed: packages.filter((p) => p.delay_reason !== null),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const webhookCreatePackage = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      tracking_id,
      sender_name,
      sender_address,
      sender_pincode,
      receiver_name,
      receiver_address,
      receiver_pincode,
      destination_region_id,
      weight,
    } = req.body;

    if (!tracking_id) {
      res.status(400).json({ error: "tracking_id is required" });
      return;
    }

    const existing = await prisma.package.findUnique({
      where: { tracking_id },
    });
    if (existing) {
      res
        .status(200)
        .json({ message: "Package already exists", package: existing });
      return;
    }

    const pkg = await prisma.package.create({
      data: {
        tracking_id,
        sender_name,
        sender_address,
        sender_pincode: sender_pincode ?? null,
        receiver_name,
        receiver_address,
        receiver_pincode: receiver_pincode ?? null,
        destination_region_id: destination_region_id
          ? parseInt(destination_region_id)
          : null,
        status: "to_be_picked_up",
        weight,
      },
    });

    res
      .status(201)
      .json({ message: "Package received via webhook", package: pkg });
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
      tracking_id,
      sender_name,
      sender_address,
      sender_pincode,
      receiver_name,
      receiver_address,
      receiver_pincode,
      destination_region_id,
      weight,
    } = req.body;

    const pkg = await prisma.package.create({
      data: {
        tracking_id,
        sender_name,
        sender_address,
        sender_pincode: sender_pincode ?? null,
        receiver_name,
        receiver_address,
        receiver_pincode: receiver_pincode ?? null,
        destination_region_id: destination_region_id
          ? parseInt(destination_region_id)
          : null,
        weight,
        status: "to_be_picked_up",
      },
    });

    res.status(201).json(pkg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updatePackageStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const trackingId = req.params.trackingId as string;
    const { status, current_location, current_region_id, delay_reason } =
      req.body;

    const pkg = await prisma.package.update({
      where: { tracking_id: trackingId },
      data: {
        status,
        current_location: current_location ?? undefined,
        current_region_id: current_region_id
          ? parseInt(current_region_id)
          : undefined,
        delay_reason: delay_reason ?? null,
        updated_at: new Date(),
      },
    });

    res.json(pkg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
