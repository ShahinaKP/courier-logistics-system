# Courier Logistics System — Project Documentation

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Local Development Setup](#4-local-development-setup)
5. [Stage 1 — Courier Collection App](#5-stage-1--courier-collection-app)
6. [Stage 2 — Courier Logistics App](#6-stage-2--courier-logistics-app)
7. [Stage 3 — Integration](#7-stage-3--integration)
8. [Database Schemas](#8-database-schemas)
9. [API Reference](#9-api-reference)
10. [Package Status Flow](#10-package-status-flow)
11. [Bag Lifecycle](#11-bag-lifecycle)
12. [Truck Schedule Lifecycle](#12-truck-schedule-lifecycle)

---

## 1. System Overview

The Courier Logistics System is a two-application platform that manages the full lifecycle of a courier package — from the moment a customer drops it off at a front-office collection point, through regional logistics hubs, to final delivery.

```
Customer drops off package
        ↓
[Stage 1] Courier Collection App   ← front office staff + public tracking
        ↓ webhook
[Stage 2] Courier Logistics App    ← back office, internal only
        ↓ ETL push (every 1 min)
[Stage 1] status synced back to customer-facing tracking
```

The two applications have **separate databases** and communicate only through:

- A **webhook** (Stage 1 → Stage 2) when a new package is created
- An **ETL push job** (Stage 2 → Stage 1) that syncs status updates every minute

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────┐
│           Stage 1 — Courier Collection App           │
│  React + Vite (port 5173)   Express API (port 5000)  │
│  PostgreSQL DB: courier_collection (port 5432)        │
└───────────────────────┬──────────────────────────────┘
                        │  POST /api/packages/webhook (new package)
                        │  POST /api/packages/raw-updates (ETL push)
                        ▼
┌──────────────────────────────────────────────────────┐
│           Stage 2 — Courier Logistics App            │
│  React + Vite (port 5174)   Express API (port 5001)  │
│  PostgreSQL DB: courier_logistics (port 5433)         │
└──────────────────────────────────────────────────────┘
```

Both apps run inside Docker dev containers and are independent — you can run them separately.

---

## 3. Tech Stack

| Layer     | Technology                          |
| --------- | ----------------------------------- |
| Frontend  | React 19, TypeScript, Vite 8        |
| Styling   | Tailwind CSS 4, shadcn/ui, Radix UI |
| Icons     | Lucide React                        |
| Routing   | React Router DOM v7                 |
| Backend   | Node.js 20, Express 5, TypeScript   |
| ORM       | Prisma 6.x                          |
| Database  | PostgreSQL 16                       |
| Auth      | JWT (`jsonwebtoken`), bcryptjs      |
| Container | Docker, Dev Containers              |

---

## 4. Local Development Setup

Both apps follow the same setup pattern. Run each in its own VS Code dev container.

### Start Stage 1 (Collection App)

```bash
# Open in VS Code
code courier-collection-app

# VS Code will prompt: "Reopen in Container" → click it
# Once inside the container:

cd server
npm install
npx prisma generate
npx prisma migrate dev   # or: npx prisma db push
npm run dev              # starts on port 5000

# In a second terminal:
cd client
npm install
npm run dev              # starts on port 3000
```

### Start Stage 2 (Logistics App)

```bash
# Open in a separate VS Code window
code courier-logistics-app

# Reopen in Container → then:

cd server
npm install
npx prisma generate
npx prisma migrate dev
npm run dev              # starts on port 5001

cd client
npm install
npm run dev              # starts on port 5173
```

### Environment Variables

Both apps have a `.env.example` at the root. Copy it to `.env`:

```bash
cp .env.example .env
```

**Stage 1 `.env`:**

```
DATABASE_URL=postgresql://postgres:password@db:5432/courier_collection
JWT_SECRET=courier_secret_key
PORT=5000
```

**Stage 2 `.env`:**

```
DATABASE_URL=postgresql://postgres:password@db:5433/courier_logistics
PORT=5001
COLLECTION_APP_URL=http://localhost:5000
```

### Viewing Databases with Prisma Studio

```bash
# Stage 1 DB (inside collection app container)
cd server && npx prisma studio --port 5555

# Stage 2 DB (inside logistics app container, separate terminal)
cd server && npx prisma studio --port 5556
```

Open in browser: `http://localhost:5555` and `http://localhost:5556`

### Clearing the Database (dev only)

```bash
# Keep regions, clear everything else
npx prisma db execute --stdin <<EOF
TRUNCATE TABLE raw_updates, truck_bags, package_bags,
truck_schedules, trucks, bags, packages RESTART IDENTITY CASCADE;
EOF

# Full reset including regions
npx prisma migrate reset
```

---

## 5. Stage 1 — Courier Collection App

### Purpose

Front-office application used by staff to create packages and by customers to track them. This is the only application accessible to the general public.

### Pages

#### `/login` — Staff Login (public)

- Email + password authentication
- JWT stored in `localStorage`
- Redirects to dashboard on success

#### `/` — Dashboard (staff only)

Packages grouped into three sections:

- **To Be Picked Up** — new packages not yet collected
- **Active** — packages in transit (`picked_up`, `added_to_bag`, `en_route`, `arrived`)
- **Delayed** — any package with a `delay_reason`

#### `/new-package` — New Package Entry (staff only)

- Creates a package with sender, receiver, weight, region
- Automatically generates a `tracking_id` (UUID)
- Calculates sale amount (`weight × 10`)
- Fires webhook to Stage 2 immediately after creation

#### `/track` — Public Package Tracking (public)

- Takes tracking ID + CAPTCHA as input
- CAPTCHA: 6-character alphanumeric, regenerated on each failed attempt
- Shows a 7-step visual status timeline
- Displays current location, region, and delay reason if applicable

### Server API Endpoints

| Method | Path                              | Auth        | Description                          |
| ------ | --------------------------------- | ----------- | ------------------------------------ |
| POST   | `/api/auth/register`              | None        | Create a new staff user              |
| POST   | `/api/auth/login`                 | None        | Login, returns JWT                   |
| GET    | `/api/auth/me`                    | JWT         | Get current user info                |
| GET    | `/api/packages`                   | JWT + staff | All packages with dashboard sections |
| POST   | `/api/packages`                   | JWT + staff | Create new package + sale + webhook  |
| GET    | `/api/packages/track/:trackingId` | None        | Public package tracking              |
| POST   | `/api/packages/raw-updates`       | None        | Receive ETL updates from Stage 2     |
| GET    | `/api/regions`                    | None        | List all regions                     |

### Auth Flow

```
POST /api/auth/login
  → returns { token, user }
  → client stores token in localStorage
  → all staff requests send: Authorization: Bearer <token>
  → middleware verifies JWT and attaches user to req.user
```

Token expiry: **8 hours**. Role: `staff` (default) or `admin`.

---

## 6. Stage 2 — Courier Logistics App

### Purpose

Internal back-office application for regional logistics hub operators. Not accessible to the public or front-office staff. Manages the physical movement of packages through sealed bags and truck schedules.

### Pages

#### `/` — Logistics Dashboard

Four time-aware sections:

- **New in Current Window** — packages arrived in the current time slot (morning: midnight–noon, afternoon: noon–6pm) not yet bagged
- **Unbagged** — packages with status `picked_up`, awaiting bag assignment
- **Bagged** — packages with status `added_to_bag` currently in sealed bags
- **Delayed** — any package with a `delay_reason`

#### `/bags` — Bag Management

Full workflow for grouping packages into sealed bags:

1. **Create Bag** — select outgoing direction + hub region
2. **Add Package to Bag** — assign eligible packages (`to_be_picked_up` or `picked_up`) to an open bag. Adding a package automatically advances its status to `added_to_bag`
3. **Seal Bag** — locks the bag; no more packages can be added. Empty bags cannot be sealed (enforced on both UI and server)
4. **Mark Delayed** — marks the bag delayed and propagates `delay_reason` to all packages inside
5. **Reopen** — reopens a delayed bag and clears delay reason from packages

#### `/trucks` — Truck Schedules

Manage the truck fleet and scheduled departures:

1. **Create Schedule** — assign a truck to a region with a departure time
2. **Load Bag** — load a sealed bag onto a scheduled departure
3. **Mark Departed** — truck leaves; all packages in all loaded bags automatically move to `en_route`, delay reasons cleared
4. **Delay Schedule** — truck can't depart; propagates `delay_reason: "Truck delayed: <reason>"` to all packages on board

### Server API Endpoints

| Method | Path                               | Description                                   |
| ------ | ---------------------------------- | --------------------------------------------- |
| GET    | `/api/packages`                    | All packages + dashboard sections             |
| POST   | `/api/packages`                    | Manual package entry at hub                   |
| POST   | `/api/packages/webhook`            | Receive new package from Stage 1 (idempotent) |
| PATCH  | `/api/packages/:trackingId/status` | Update status, location, delay                |
| GET    | `/api/bags`                        | All bags with nested packages                 |
| POST   | `/api/bags`                        | Create new bag                                |
| POST   | `/api/bags/:bagId/packages`        | Add package to bag                            |
| PATCH  | `/api/bags/:bagId/status`          | Seal / delay / reopen bag                     |
| GET    | `/api/trucks`                      | All trucks                                    |
| GET    | `/api/trucks/schedules`            | All schedules with bags and packages          |
| POST   | `/api/trucks/schedules`            | Create new schedule                           |
| PATCH  | `/api/trucks/schedules/:id`        | Update schedule status                        |
| POST   | `/api/trucks/schedules/:id/bags`   | Load sealed bag onto schedule                 |
| GET    | `/api/regions`                     | List all regions                              |
| POST   | `/api/regions`                     | Create new region                             |

### Bag Direction vs Region

- **Direction** = which way the bag is heading _out of_ this hub. e.g. a bag going `north` contains all packages destined for northern hubs. Options: `north`, `south`, `east`, `west`, `central`
- **Region** = which hub _owns_ this bag — the current hub's region code (e.g. `RG-N`)

These two together tag each sealed bag so the receiving hub knows where it came from and where it was headed.

### ETL Push Job

Runs automatically every 1 minute inside the Stage 2 server process:

```
Stage 2 server (every 60s)
  → finds all packages updated in the last 60s
  → POST http://localhost:5000/api/packages/raw-updates
     body: [{ tracking_id, status, current_location, delay_reason }]

Stage 1 (background processor, every 60s)
  → finds unprocessed raw_updates rows
  → updates matching packages in Stage 1 DB
  → marks raw_update as processed
```

---

## 7. Stage 3 — Integration

Integration between the two apps is fully implemented:

### Webhook (Stage 1 → Stage 2)

Triggered automatically when a new package is created in Stage 1:

```
POST http://localhost:5001/api/packages/webhook
Body: {
  tracking_id, sender_name, sender_address,
  receiver_name, receiver_address, weight, region_id
}
```

- **Idempotent** — if the same `tracking_id` arrives twice, it is ignored (no duplicate created)
- Initial status in Stage 2: `to_be_picked_up`

### ETL Push (Stage 2 → Stage 1)

```
POST http://localhost:5000/api/packages/raw-updates
Body: [{ tracking_id, status, current_location, delay_reason }, ...]
```

- Stage 1 saves the bulk payload to `raw_updates` table as-is
- A background processor in Stage 1 runs every 60s, reads unprocessed rows, updates the `packages` table, marks the row as `processed`
- This ensures the public tracking page always reflects the latest logistics status

---

## 8. Database Schemas

### Stage 1 — courier_collection

```
regions         id, region_code (unique), region_name, created_at
packages        id, tracking_id (uuid, unique), sender_name, sender_address,
                receiver_name, receiver_address, weight, region_id (fk),
                status (enum), current_location, delay_reason,
                created_at, updated_at
sales           id, package_id (fk), tracking_id (fk), amount, created_at
raw_updates     id, payload (json), processed, received_at, processed_at
users           id, email (unique), password_hash, role, created_at
```

### Stage 2 — courier_logistics

```
regions         id, region_code (unique), region_name, created_at
packages        id, tracking_id (uuid, unique), sender_name, sender_address,
                receiver_name, receiver_address, weight, region_id (fk),
                status (enum), current_location, delay_reason,
                created_at, updated_at
bags            id, bag_code (unique), region_id (fk), direction,
                status (open|sealed|delayed|loaded), created_at, updated_at
package_bags    id, package_id (fk), bag_id (fk), added_at
trucks          id, truck_code (unique), capacity, status, created_at
truck_schedules id, truck_id (fk), region_id (fk), scheduled_departure,
                actual_departure, status, delay_reason, created_at
truck_bags      id, truck_schedule_id (fk), bag_id (fk), loaded_at
raw_updates     id, payload (jsonb), processed, received_at, processed_at
```

### Seeded Data (both DBs)

Regions seeded automatically via `init.sql`:

| Code | Name           |
| ---- | -------------- |
| RG-N | North Region   |
| RG-S | South Region   |
| RG-E | East Region    |
| RG-W | West Region    |
| RG-C | Central Region |

Stage 2 also seeds three trucks: `TRK-001` (cap 20), `TRK-002` (cap 15), `TRK-003` (cap 10).

---

## 9. API Reference

### Package Status Enum

Used in both databases as a PostgreSQL enum `package_status`:

| Value                    | Meaning                                        |
| ------------------------ | ---------------------------------------------- |
| `to_be_picked_up`        | Created at front office, not yet collected     |
| `picked_up`              | Collected by logistics hub from front office   |
| `added_to_bag`           | Placed inside a sealed bag at the hub          |
| `en_route`               | Truck has departed, package is moving          |
| `arrived`                | Package arrived at destination region hub      |
| `scheduled_for_delivery` | Assigned to a local delivery run               |
| `out_for_delivery`       | On a delivery vehicle heading to the recipient |

### Bag Status

| Value     | Meaning                                        |
| --------- | ---------------------------------------------- |
| `open`    | Accepting packages                             |
| `sealed`  | Locked, ready to load onto a truck             |
| `delayed` | Held back, delay reason propagated to packages |
| `loaded`  | On a truck schedule                            |

### Truck Schedule Status

| Value       | Meaning                                           |
| ----------- | ------------------------------------------------- |
| `scheduled` | Departure planned                                 |
| `delayed`   | Truck cannot depart, delay propagated to packages |
| `departed`  | Truck left, packages moved to `en_route`          |
| `arrived`   | Truck reached destination                         |
| `cancelled` | Schedule cancelled                                |

---

## 10. Package Status Flow

```
[Stage 1 creates package]
         ↓
  to_be_picked_up  ←── webhook also creates in Stage 2
         ↓
     picked_up     ←── implicit when hub bags the package
         ↓
   added_to_bag    ←── package assigned to a bag
         ↓
     en_route      ←── truck departs (auto-updated in bulk)
         ↓
      arrived      ←── truck arrives at destination hub
         ↓
scheduled_for_delivery
         ↓
  out_for_delivery
```

At any point a package can have `delay_reason` set — this comes from either a delayed bag or a delayed truck schedule.

---

## 11. Bag Lifecycle

```
         create
            ↓
          open  ──── add packages ────┐
            │                         │ (can add multiple)
            │◄────────────────────────┘
            │
       ┌────┴────┐
       ↓         ↓
    sealed    delayed
  (≥1 pkg)      │
       │      reopen
       │         │
       │◄────────┘
       ↓
    loaded (onto truck schedule)
```

**Rules:**

- Cannot seal an empty bag (enforced on server + UI)
- Cannot add packages to a non-open bag
- Cannot load a bag that isn't sealed
- A bag cannot be unsealed — if something is wrong, mark it delayed, reopen, fix it, then seal again

---

## 12. Truck Schedule Lifecycle

```
    create schedule
          ↓
       scheduled ──── load sealed bags ────┐
          │                                │
          │◄──────────────────────────────┘
          │
     ┌────┴────┐
     ↓         ↓
  departed   delayed ──── reschedule ────► scheduled
  (packages       │
  → en_route)   (packages get delay_reason)
```

**Departing a truck:**

- All bags on the truck → status `loaded`
- All packages across all bags → status `en_route`, `delay_reason` cleared

**Delaying a truck:**

- `delay_reason` prefixed with `"Truck delayed: "` propagated to all packages on board

---
