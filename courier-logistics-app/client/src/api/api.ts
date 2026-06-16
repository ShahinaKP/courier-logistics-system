const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export const fetchPackages = () =>
  fetch(`${BASE_URL}/packages`).then((r) => r.json());
export const updatePackageStatus = (
  trackingId: string,
  data: { status: string; current_location?: string; delay_reason?: string },
) =>
  fetch(`${BASE_URL}/packages/${trackingId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => r.json());

export const fetchBags = () => fetch(`${BASE_URL}/bags`).then((r) => r.json());

export const createBag = (data: { region_id: number; direction: string }) =>
  fetch(`${BASE_URL}/bags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => r.json());

export const addPackageToBag = (bagId: number, package_id: number) =>
  fetch(`${BASE_URL}/bags/${bagId}/packages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ package_id }),
  }).then((r) => r.json());

export const updateBagStatus = (
  bagId: number,
  data: { status: string; delay_reason?: string },
) =>
  fetch(`${BASE_URL}/bags/${bagId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => r.json());
// export const fetchTrucks = () =>
//   fetch(`${BASE_URL}/trucks`).then((r) => r.json());
// export const fetchSchedules = () =>
//   fetch(`${BASE_URL}/trucks/schedules`).then((r) => r.json());
// export const createSchedule = (data: {
//   truck_id: number;
//   region_id: number;
//   scheduled_departure: string;
// }) =>
//   fetch(`${BASE_URL}/trucks/schedules`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(data),
//   }).then((r) => r.json());

// export const updateSchedule = (
//   scheduleId: number,
//   data: { status: string; delay_reason?: string; actual_departure?: string },
// ) =>
//   fetch(`${BASE_URL}/trucks/schedules/${scheduleId}`, {
//     method: "PATCH",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(data),
//   }).then((r) => r.json());

export const fetchRegions = () =>
  fetch(`${BASE_URL}/regions`).then((r) => r.json());

// Trucks
export const fetchTrucks = () =>
  fetch(`${BASE_URL}/trucks`).then((r) => r.json());

export const createTruck = (data: { truck_code: string; capacity: number }) =>
  fetch(`${BASE_URL}/trucks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => r.json());

export const fetchSchedules = () =>
  fetch(`${BASE_URL}/trucks/schedules`).then((r) => r.json());

export const createSchedule = (data: {
  truck_id: number;
  region_id: number;
  scheduled_departure: string;
}) =>
  fetch(`${BASE_URL}/trucks/schedules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => r.json());

export const updateSchedule = (
  scheduleId: number,
  data: { status: string; delay_reason?: string; actual_departure?: string },
) =>
  fetch(`${BASE_URL}/trucks/schedules/${scheduleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((r) => r.json());

export const loadBagOntoTruck = (scheduleId: number, bag_id: number) =>
  fetch(`${BASE_URL}/trucks/schedules/${scheduleId}/bags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bag_id }),
  }).then((r) => r.json());
