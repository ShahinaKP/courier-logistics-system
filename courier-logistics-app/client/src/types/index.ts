export interface Region {
  id: number;
  region_code: string;
  region_name: string;
}

export interface Package {
  id: number;
  tracking_id: string;
  sender_name: string;
  sender_address: string;
  sender_pincode: string | null;
  receiver_name: string;
  receiver_address: string;
  receiver_pincode: string | null;
  destination_region_id: number | null;
  destination_region: Region | null;
  current_region_id: number | null;
  current_region: Region | null;
  weight: number;
  status: string;
  current_location: string | null;
  delay_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Bag {
  id: number;
  bag_code: string;
  region_id: number | null;
  direction: string;
  status: string;
  package_count: number;
  created_at: string;
}

export interface Truck {
  id: number;
  truck_code: string;
  capacity: number;
  status: string;
}

export interface TruckSchedule {
  id: number;
  truck_id: number | null;
  region_id: number | null;
  scheduled_departure: string;
  actual_departure: string | null;
  status: string;
  delay_reason: string | null;
  bag_count: number;
}
