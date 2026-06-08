import { Request, Response } from "express";
import pool from "../db/db";

export const getAllRegions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await pool.query(
      "SELECT * FROM regions ORDER BY region_code",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
