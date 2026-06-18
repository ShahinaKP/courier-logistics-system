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

-- Regions
CREATE TABLE regions (
  id          SERIAL PRIMARY KEY,
  region_code VARCHAR(10)  NOT NULL UNIQUE,
  region_name VARCHAR(100) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Pincodes → Region mapping
CREATE TABLE pincodes (
  id        SERIAL PRIMARY KEY,
  pincode   VARCHAR(10)  NOT NULL UNIQUE,
  city      VARCHAR(100) NOT NULL,
  region_id INT REFERENCES regions(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Packages
CREATE TABLE packages (
  id                    SERIAL PRIMARY KEY,
  tracking_id           UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  sender_name           VARCHAR(100) NOT NULL,
  sender_address        TEXT NOT NULL,
  sender_pincode        VARCHAR(10)  NOT NULL,
  receiver_name         VARCHAR(100) NOT NULL,
  receiver_address      TEXT NOT NULL,
  receiver_pincode      VARCHAR(10)  NOT NULL,
  destination_region_id INT REFERENCES regions(id),
  weight                DECIMAL(10, 2) NOT NULL,
  status                package_status NOT NULL DEFAULT 'to_be_picked_up',
  current_location      TEXT,
  delay_reason          TEXT,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

-- Sales
CREATE TABLE sales (
  id          SERIAL PRIMARY KEY,
  package_id  INT REFERENCES packages(id) ON DELETE CASCADE,
  tracking_id UUID REFERENCES packages(tracking_id),
  amount      DECIMAL(10, 2) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Raw updates (ETL from Stage 2)
CREATE TABLE raw_updates (
  id           SERIAL PRIMARY KEY,
  payload      JSONB NOT NULL,
  processed    BOOLEAN DEFAULT FALSE,
  received_at  TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- Users
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) DEFAULT 'staff',
  created_at    TIMESTAMP DEFAULT NOW()
);
