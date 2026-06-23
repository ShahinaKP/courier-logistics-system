# Running the Courier Logistics System with Docker

Everything is orchestrated from the root `docker-compose.yml`. It builds and runs
both applications end to end:

| Service           | Container                 | Host URL / Port           |
| ----------------- | ------------------------- | ------------------------- |
| collection-client | courier_collection_client | http://localhost:3000     |
| collection-server | courier_collection_server | http://localhost:5000     |
| collection-db     | courier_collection_db     | localhost:5432 (Postgres) |
| logistics-client  | courier_logistics_client  | http://localhost:3001     |
| logistics-server  | courier_logistics_server  | http://localhost:5001     |
| logistics-db      | courier_logistics_db      | localhost:5433 (Postgres) |

## Prerequisites

- Docker Engine 24+ with the Compose v2 plugin (`docker compose`).

## Quick start

```bash
# (optional) override defaults
cp .env.example .env

# build images and start everything
docker compose up --build -d

# load demo data (regions, pincodes, users, ...) — run once
docker compose --profile seed run --rm collection-seed
docker compose --profile seed run --rm logistics-seed
```

Then open:

- Collection app UI: http://localhost:3000
- Logistics app UI: http://localhost:3001

Health checks: `curl http://localhost:5000/health` and `curl http://localhost:5001/health`.

## How it fits together

- Each app has its **own Postgres database**. The schema is created automatically
  from each app's `server/db/init.sql` the first time its data volume is created
  (no migrations to run).
- The **clients** are built with Vite and served as static files by nginx, with an
  SPA fallback so client-side routing works. Because the browser calls the APIs
  directly, `VITE_API_URL` is baked at build time and points at the host-published
  server ports (`COLLECTION_API_PUBLIC_URL` / `LOGISTICS_API_PUBLIC_URL`).
- The **logistics server's ETL job** pushes raw updates to the collection API over
  the internal Docker network via `COLLECTION_API_URL=http://collection-server:5000/api`
  (previously a hard-coded `localhost:5000`).

## Common commands

```bash
docker compose logs -f collection-server     # tail one service
docker compose ps                             # status
docker compose down                           # stop (keeps data volumes)
docker compose down -v                         # stop and WIPE the databases
docker compose build collection-client        # rebuild a single image
```

## Configuration

All ports, database credentials, the JWT secret, and the browser-facing API URLs
are overridable through environment variables — see `.env.example` for the full
list and defaults.

## Notes

- The pre-existing `courier-collection-app/docker-compose.yml` (a dev-container
  style "sleep infinity" setup) is left untouched; this root compose file is the
  one to use for running the full system.
