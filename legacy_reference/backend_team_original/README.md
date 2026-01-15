# Backend (API)

## Tech Stack
- Node.js (requires `>= 20`)
- TypeScript
- Express
- Prisma
- PostgreSQL

## Location
- Source: `backend/src/`
- Main entry: `backend/src/server.ts`

## Setup
### 1) Install
```bash
npm install
```

### 2) Environment
Copy:
- `backend/.env.example` -> `backend/.env`

Minimum values to run locally:
- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`
- `CORS_ORIGIN`

Notes:
- `.env.example` currently contains some duplicate keys (e.g. `JWT_SECRET`, `CORS_ORIGIN`). In `.env`, keep only one value per key.

### 3) Prisma / Database
Generate Prisma client:
```bash
npm run prisma:generate
```

Run migrations (dev):
```bash
npm run prisma:migrate
```

(Optional) Prisma Studio:
```bash
npm run prisma:studio
```

## Run
Development:
```bash
npm run dev
```

Production build:
```bash
npm run build
npm run start
```

## API Prefix
Default API prefix is controlled by `API_PREFIX` (example: `/api/v1`).

## Authentication
- JWT-based authentication.
- Ensure `JWT_SECRET` is set.

## Scheduled Sync (Automation)
The backend starts a scheduled sync job when the server starts.

- Job: `backend/src/jobs/sync.job.ts`
- Trigger: called from `backend/src/server.ts`
- Schedule: hourly

Sync behavior:
- Runs per active integration.
- Updates `integrations.lastSyncAt` after successful sync.

## Integrations / Data Sync
There are 2 patterns used in the codebase:
- **Service API clients** (for fetching data via API endpoints)
  - Example: `backend/src/services/facebook.service.ts`
- **Sync jobs** (for writing normalized data into DB)
  - Example: `backend/src/services/googleAds.ts`, `backend/src/services/facebook.ts`

## Common Endpoints (high-level)
Exact routes are defined under `backend/src/routes/`.

Common areas:
- Health check endpoints (server)
- Integrations CRUD + manual sync
- Data pipeline run/sync providers
- Metrics dashboard endpoints

## Tests
```bash
npm test
```

## Lint / Format
```bash
npm run lint
npm run format
```
