import { Request, Response } from "express";
import pool from "../db/db";

// GET all packages
export const getAllPackages = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await pool.query(
      "SELECT * FROM packages ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// GET package by tracking ID
export const getPackageByTrackingId = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { trackingId } = req.params;
    const result = await pool.query(
      "SELECT * FROM packages WHERE tracking_id = $1",
      [trackingId],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Package not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// POST create new package
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
    }: {
      sender_name: string;
      sender_address: string;
      receiver_name: string;
      receiver_address: string;
      weight: number;
      region_id: number;
    } = req.body;

    const packageResult = await pool.query(
      `INSERT INTO packages 
        (sender_name, sender_address, receiver_name, receiver_address, weight, region_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        sender_name,
        sender_address,
        receiver_name,
        receiver_address,
        weight,
        region_id,
      ],
    );

    const newPackage = packageResult.rows[0];

    // Calculate bill amount (weight * 10)
    const amount = weight * 10;

    await pool.query(
      `INSERT INTO sales (package_id, tracking_id, amount) VALUES ($1, $2, $3)`,
      [newPackage.id, newPackage.tracking_id, amount],
    );

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
