-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Package status enum
CREATE TYPE package_status AS ENUM (
  'to_be_picked_up',
  'picked_up',
  'added_to_bag',
  'en_route',
  'arrived',
  'scheduled_for_delivery',
  'out_for_delivery'
);


-- Packages table
CREATE TABLE packages (
  id SERIAL PRIMARY KEY,
  tracking_id UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  sender_name VARCHAR(100) NOT NULL,
  sender_address TEXT NOT NULL,
  receiver_name VARCHAR(100) NOT NULL,
  receiver_address TEXT NOT NULL,
  weight DECIMAL(10, 2) NOT NULL,
  status package_status NOT NULL DEFAULT 'to_be_picked_up',
  current_location TEXT,
  delay_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sales table
CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  package_id INT REFERENCES packages(id) ON DELETE CASCADE,
  tracking_id UUID REFERENCES packages(tracking_id),
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
