import { Request, Response } from "express";
import prisma from "../db/prisma";

// GET /api/pincodes/:pincode
// Returns { pincode, city, region } or 404
export const lookupPincode = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { pincode } = req.params;

    const result = await prisma.pincode.findUnique({
      where: { pincode: pincode as string },
      include: { region: true },
    });

    if (!result) {
      res.status(404).json({ error: "Pincode not found" });
      return;
    }

    res.json({
      pincode: result.pincode,
      city: result.city,
      region_id: result.region_id,
      region_code: result.region.region_code,
      region_name: result.region.region_name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
