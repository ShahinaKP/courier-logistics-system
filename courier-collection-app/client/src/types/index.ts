export interface Region {
  id: number;
  region_code: string;
  region_name: string;
}

export interface PincodeResult {
  pincode: string;
  city: string;
  region_id: number;
  region_code: string;
  region_name: string;
}

export interface Package {
  id: number;
  tracking_id: string;
  sender_name: string;
  sender_address: string;
  sender_pincode: string;
  receiver_name: string;
  receiver_address: string;
  receiver_pincode: string;
  destination_region_id: number | null;
  destination_region: Region | null;
  weight: number;
  status: PackageStatus;
  current_location: string | null;
  delay_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type PackageStatus =
  | "to_be_picked_up"
  | "picked_up"
  | "added_to_bag"
  | "en_route"
  | "arrived"
  | "scheduled_for_delivery"
  | "out_for_delivery";

export interface Dashboard {
  to_be_picked_up: Package[];
  active: Package[];
  delayed: Package[];
}

export interface CreatePackagePayload {
  sender_name: string;
  sender_address: string;
  sender_pincode: string;
  receiver_name: string;
  receiver_address: string;
  receiver_pincode: string;
  weight: number;
}
