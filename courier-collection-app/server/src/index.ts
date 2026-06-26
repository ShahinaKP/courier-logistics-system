import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import cors from "cors";
import packageRoutes from "./routes/packageRoutes";
import { processRawUpdates } from "./controllers/packageController";
import authRoutes from "./routes/authRoutes";
import pincodeRoutes from "./routes/pincodeRoutes";
import { captureRawBody } from "./middleware/verifySignature";

// Run ETL processor every 1 minute
setInterval(processRawUpdates, 60 * 1000);
console.log("ETL processor started — running every 1 minute");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ verify: captureRawBody }));

app.use("/api/auth", authRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/pincodes", pincodeRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Courier Collection API is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
