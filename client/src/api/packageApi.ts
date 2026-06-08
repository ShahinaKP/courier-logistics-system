import type { CreatePackagePayload, Package, Region } from "../types";

const BASE_URL = "http://localhost:5000/api";

export const fetchPackages = async () => {
  const res = await fetch(`${BASE_URL}/packages`);
  return res.json();
};

export const fetchPackageByTrackingId = async (
  trackingId: string,
): Promise<Package> => {
  const res = await fetch(`${BASE_URL}/packages/${trackingId}`);
  if (!res.ok) throw new Error("Package not found");
  return res.json();
};

export const createPackage = async (payload: CreatePackagePayload) => {
  const res = await fetch(`${BASE_URL}/packages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create package");
  return res.json();
};

export const fetchRegions = async (): Promise<Region[]> => {
  const res = await fetch(`${BASE_URL}/regions`);
  return res.json();
};
