export interface Package {
  id: number;
  tracking_id: string;
  sender_name: string;
  sender_address: string;
  receiver_name: string;
  receiver_address: string;
  weight: number;
  status: string;
  current_location: string | null;
  delay_reason: string | null;
  created_at: string;
}

export interface Bag {
  id: number;
  bag_code: string;
  region_id: number;
  region_code: string;
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
  truck_id: number;
  truck_code: string;
  region_id: number;
  region_code: string;
  scheduled_departure: string;
  actual_departure: string | null;
  status: string;
  delay_reason: string | null;
  bag_count: number;
}

export interface Region {
  id: number;
  region_code: string;
  region_name: string;
}
