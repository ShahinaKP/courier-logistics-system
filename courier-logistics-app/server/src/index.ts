import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import cors from "cors";
import packageRoutes from "./routes/packageRoutes";
import bagRoutes from "./routes/bagRoutes";
import truckRoutes from "./routes/truckRoutes";
import regionRoutes from "./routes/regionRoutes";

import prisma from "./db/prisma";
import { captureRawBody } from "./middleware/verifySignature";
import { signedPost } from "./lib/signedPost";

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ verify: captureRawBody }));

app.use("/api/packages", packageRoutes);
app.use("/api/bags", bagRoutes);
app.use("/api/trucks", truckRoutes);
app.use("/api/regions", regionRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Courier Logistics API is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// ETL job — push updates to Stage 1 every 1 minute
const COLLECTION_API_URL =
  process.env.COLLECTION_API_URL || "http://localhost:5000/api";

let lastSyncedAt = new Date(0);

const runETLJob = async () => {
  try {
    const packages = await prisma.package.findMany({
      where: {
        updated_at: { gt: lastSyncedAt },
      },
      orderBy: { updated_at: "asc" },
    });

    if (packages.length === 0) {
      console.log("ETL: No updates to push");
      return;
    }

    const updates = packages.map((p) => ({
      tracking_id: p.tracking_id,
      status: p.status,
      current_location: p.current_location,
      delay_reason: p.delay_reason,
    }));

    const response = await signedPost(
      `${COLLECTION_API_URL}/packages/raw-updates`,
      updates,
      process.env.ETL_API_KEY || "",
      process.env.ETL_API_SECRET || "",
    );

    if (!response.ok) {
      // Leave the watermark untouched so the next run retries these records.
      console.error(
        `ETL: collection app responded ${response.status} — will retry next run`,
      );
      return;
    }

    // Advance the watermark only after a confirmed successful push.
    const newest = packages[packages.length - 1].updated_at;
    if (newest) lastSyncedAt = newest;

    console.log(
      `ETL: Pushed ${updates.length} update(s) to Stage 1 at ${COLLECTION_API_URL}`,
    );
  } catch (err) {
    // Network/other failure — keep the watermark so the next run retries.
    console.error("ETL job failed (will retry next run):", err);
  }
};

setInterval(runETLJob, 60 * 1000);
console.log(
  `ETL job started — pushing updates every 1 minute to ${COLLECTION_API_URL}`,
);
