import { Request, Response } from "express";
import prisma from "../db/prisma";

export const getRegions = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const regions = await prisma.region.findMany({
      orderBy: { region_code: "asc" },
    });
    res.json(regions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
