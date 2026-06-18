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
  tracking_id           UUID NOT NULL UNIQUE,
  sender_name           VARCHAR(100) NOT NULL,
  sender_address        TEXT NOT NULL,
  sender_pincode        VARCHAR(10),
  receiver_name         VARCHAR(100) NOT NULL,
  receiver_address      TEXT NOT NULL,
  receiver_pincode      VARCHAR(10),
  destination_region_id INT REFERENCES regions(id),
  current_region_id     INT REFERENCES regions(id),
  weight                DECIMAL(10, 2) NOT NULL,
  status                package_status NOT NULL DEFAULT 'to_be_picked_up',
  current_location      TEXT,
  delay_reason          TEXT,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
);

-- Bags
CREATE TABLE bags (
  id         SERIAL PRIMARY KEY,
  bag_code   VARCHAR(20) NOT NULL UNIQUE,
  region_id  INT REFERENCES regions(id),
  direction  VARCHAR(20) NOT NULL,
  status     VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Package-Bag join
CREATE TABLE package_bags (
  id         SERIAL PRIMARY KEY,
  package_id INT REFERENCES packages(id),
  bag_id     INT REFERENCES bags(id),
  added_at   TIMESTAMP DEFAULT NOW()
);

-- Trucks
CREATE TABLE trucks (
  id         SERIAL PRIMARY KEY,
  truck_code VARCHAR(20) NOT NULL UNIQUE,
  capacity   INT NOT NULL DEFAULT 10,
  status     VARCHAR(20) NOT NULL DEFAULT 'available',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Truck schedules
CREATE TABLE truck_schedules (
  id                  SERIAL PRIMARY KEY,
  truck_id            INT REFERENCES trucks(id),
  region_id           INT REFERENCES regions(id),
  scheduled_departure TIMESTAMP NOT NULL,
  actual_departure    TIMESTAMP,
  status              VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  delay_reason        TEXT,
  created_at          TIMESTAMP DEFAULT NOW()
);

-- Truck-Bag join
CREATE TABLE truck_bags (
  id                SERIAL PRIMARY KEY,
  truck_schedule_id INT REFERENCES truck_schedules(id),
  bag_id            INT REFERENCES bags(id),
  loaded_at         TIMESTAMP DEFAULT NOW()
);

-- Raw updates (incoming from Stage 2 ETL — not used in Stage 2 itself)
CREATE TABLE raw_updates (
  id           SERIAL PRIMARY KEY,
  payload      JSONB NOT NULL,
  processed    BOOLEAN DEFAULT FALSE,
  received_at  TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);
