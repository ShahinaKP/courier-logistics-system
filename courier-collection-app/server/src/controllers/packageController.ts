import { Request, Response } from "express";
import prisma from "../db/prisma";

const LOGISTICS_WEBHOOK_URL = process.env.LOGISTICS_APP_URL
  ? `${process.env.LOGISTICS_APP_URL}/api/packages/webhook`
  : "http://localhost:5001/api/packages/webhook";

// Push a single package to the logistics (Stage 2) webhook.
async function sendPackageToLogistics(pkg: {
  tracking_id: string;
  sender_name: string;
  sender_address: string;
  sender_pincode: string;
  receiver_name: string;
  receiver_address: string;
  receiver_pincode: string;
  destination_region_id: number | null;
  weight: unknown;
}) {
  const res = await fetch(LOGISTICS_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tracking_id: pkg.tracking_id,
      sender_name: pkg.sender_name,
      sender_address: pkg.sender_address,
      sender_pincode: pkg.sender_pincode,
      receiver_name: pkg.receiver_name,
      receiver_address: pkg.receiver_address,
      receiver_pincode: pkg.receiver_pincode,
      destination_region_id: pkg.destination_region_id,
      weight: pkg.weight,
    }),
  });
  if (!res.ok) {
    throw new Error(`Logistics webhook responded ${res.status}`);
  }
  return res;
}

export const getAllPackages = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const packages = await prisma.package.findMany({
      include: { destination_region: true },
      orderBy: { created_at: "desc" },
    });

    const dashboard = {
      to_be_picked_up: packages.filter((p) => p.status === "to_be_picked_up"),
      // Collected by logistics, being processed at a hub, not yet dispatched.
      collected: packages.filter((p) =>
        ["picked_up", "added_to_bag"].includes(p.status),
      ),
      active: packages.filter((p) =>
        [
          "en_route",
          "arrived",
          "scheduled_for_delivery",
          "out_for_delivery",
        ].includes(p.status),
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
      include: { destination_region: true },
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
      sender_pincode,
      receiver_name,
      receiver_address,
      receiver_pincode,
      weight,
    } = req.body;

    // Resolve destination region from receiver pincode
    let destination_region_id: number | null = null;
    const pincodeRecord = await prisma.pincode.findUnique({
      where: { pincode: receiver_pincode },
    });
    if (pincodeRecord) {
      destination_region_id = pincodeRecord.region_id;
    }

    const newPackage = await prisma.package.create({
      data: {
        sender_name,
        sender_address,
        sender_pincode,
        receiver_name,
        receiver_address,
        receiver_pincode,
        destination_region_id,
        weight,
        status: "to_be_picked_up",
      },
      include: { destination_region: true },
    });

    const amount = Number(weight) * 10;

    await prisma.sale.create({
      data: {
        package_id: newPackage.id,
        tracking_id: newPackage.tracking_id,
        amount,
      },
    });

    // Call Stage 2 webhook — pass pincodes and destination region
    try {
      await sendPackageToLogistics(newPackage);
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

// POST /api/packages/raw-updates — receive ETL bulk push from Stage 2
export const receiveRawUpdates = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const updates = req.body;

    await prisma.rawUpdate.create({
      data: { payload: updates, processed: false },
    });

    res.json({ message: "Raw updates received", count: updates.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Background job — process raw updates every 60s
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

    if (rawUpdates.length > 0) {
      console.log(`ETL: Processed ${rawUpdates.length} raw update batch(es)`);
    }
  } catch (err) {
    console.error("Error processing raw updates:", err);
  }
};

// POST /api/packages/resync — backfill: re-push every package to the logistics
export const resyncToLogistics = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const packages = await prisma.package.findMany({
      orderBy: { created_at: "asc" },
    });

    let synced = 0;
    const failed: string[] = [];

    for (const pkg of packages) {
      try {
        await sendPackageToLogistics(pkg);
        synced++;
      } catch (err) {
        console.error(`Resync failed for ${pkg.tracking_id}:`, err);
        failed.push(pkg.tracking_id);
      }
    }

    res.json({
      message: "Resync complete",
      total: packages.length,
      synced,
      failed,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
