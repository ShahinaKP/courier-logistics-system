import { getToken } from "./authApi";
import type { CreatePackagePayload, Package } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export const fetchPackages = async () => {
  const res = await fetch(`${BASE_URL}/packages`, { headers: authHeaders() });
  return res.json();
};

export const fetchPackageByTrackingId = async (
  trackingId: string,
): Promise<Package> => {
  const res = await fetch(`${BASE_URL}/packages/track/${trackingId}`);
  if (!res.ok) throw new Error("Package not found");
  return res.json();
};

export const createPackage = async (payload: CreatePackagePayload) => {
  const res = await fetch(`${BASE_URL}/packages`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create package");
  return res.json();
};
