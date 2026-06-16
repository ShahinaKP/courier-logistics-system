import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import express from "express";
import cors from "cors";
import packageRoutes from "./routes/packageRoutes";
import bagRoutes from "./routes/bagRoutes";
import truckRoutes from "./routes/truckRoutes";
import regionRoutes from "./routes/regionRoutes";

import prisma from "./db/prisma";

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

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
const runETLJob = async () => {
  try {
    const { PrismaClient } = await import("@prisma/client");
    const packages = await prisma.package.findMany({
      where: {
        updated_at: {
          gte: new Date(Date.now() - 60 * 1000), // last 1 minute
        },
      },
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

    const response = await fetch(
      "http://localhost:5000/api/packages/raw-updates",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      },
    );

    console.log(`ETL: Pushed ${updates.length} updates to Stage 1`);
  } catch (err) {
    console.error("ETL job failed:", err);
  }
};

setInterval(runETLJob, 60 * 1000);
console.log("ETL job started — pushing updates every 1 minute");
