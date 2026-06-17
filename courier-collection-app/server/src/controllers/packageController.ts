import { Request, Response } from "express";
import prisma from "../db/prisma";
import type { Package } from "@prisma/client";

export const getAllPackages = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const packages: Package[] = await prisma.package.findMany({
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
    console.error("err", err);
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
    } = req.body;

    const newPackage = await prisma.package.create({
      data: {
        sender_name,
        sender_address,
        receiver_name,
        receiver_address,
        weight,
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

    // Call Stage 2 webhook
    try {
      await fetch("http://localhost:5001/api/packages/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tracking_id: newPackage.tracking_id,
          sender_name: newPackage.sender_name,
          sender_address: newPackage.sender_address,
          receiver_name: newPackage.receiver_name,
          receiver_address: newPackage.receiver_address,
          weight: newPackage.weight,
        }),
      });
      console.log("Webhook sent to Stage 2 successfully");
    } catch (webhookErr) {
      console.error("Webhook to Stage 2 failed:", webhookErr);
    }

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

// POST receive raw updates from Stage 2 ETL
export const receiveRawUpdates = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const updates = req.body; // array of package updates

    await prisma.rawUpdate.create({
      data: {
        payload: updates,
        processed: false,
      },
    });

    res.json({ message: "Raw updates received", count: updates.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Background job — process raw updates
export const processRawUpdates = async () => {
  try {
    const rawUpdates = await prisma.rawUpdate.findMany({
      where: { processed: false },
    });

    for (const raw of rawUpdates) {
      const updates = raw.payload as Array<{
        tracking_id: string;
        status: string;
        current_location?: string;
        delay_reason?: string;
      }>;

      for (const update of updates) {
        await prisma.package.updateMany({
          where: { tracking_id: update.tracking_id },
          data: {
            status: update.status as any,
            current_location: update.current_location || null,
            delay_reason: update.delay_reason || null,
            updated_at: new Date(),
          },
        });
      }

      await prisma.rawUpdate.update({
        where: { id: raw.id },
        data: { processed: true, processed_at: new Date() },
      });
    }

    console.log(`Processed ${rawUpdates.length} raw updates`);
  } catch (err) {
    console.error("Error processing raw updates:", err);
  }
};
