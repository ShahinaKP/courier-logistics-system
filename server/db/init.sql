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

-- Regions table
CREATE TABLE regions (
  id SERIAL PRIMARY KEY,
  region_code VARCHAR(10) NOT NULL UNIQUE,
  region_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
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
  region_id INT REFERENCES regions(id),
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

-- Seed regions
INSERT INTO regions (region_code, region_name) VALUES
  ('RG-N', 'North Region'),
  ('RG-S', 'South Region'),
  ('RG-E', 'East Region'),
  ('RG-W', 'West Region'),
  ('RG-C', 'Central Region');