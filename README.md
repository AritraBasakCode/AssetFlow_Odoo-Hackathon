# AssetFlow — Enterprise Asset & Resource Management System

Full-stack implementation: **React + Vite + TypeScript + Tailwind** frontend,
**Node + Express + Prisma + PostgreSQL** backend, JWT auth in httpOnly cookies,
RBAC with no self-elevation, and DB-level conflict guarantees for allocation
and booking overlap.

## 1. Prerequisites
- Node.js 18+
- Docker (for local Postgres) — or your own Postgres instance

## 2. Start the database
```bash
docker compose up -d
```
This starts Postgres on `localhost:5432` (db `assetflow`, user/pass `postgres`/`postgres`).

## 3. Backend setup
```bash
cd apps/api
cp .env.example .env      # adjust secrets if you like
npm install
npm run prisma:generate
npm run prisma:migrate    # creates tables, prompts for a migration name
psql "$DATABASE_URL" -f prisma/manual_sql/001_constraints.sql   # DB-level guarantees (see blueprint)
npm run seed               # creates admin + demo departments/assets/employees
npm run dev                 # http://localhost:4000
```

Seeded logins (see `prisma/seed.ts`):
| Role | Email | Password |
|---|---|---|
| Admin | admin@assetflow.com | Admin@12345 |
| Asset Manager | manager@assetflow.com | Manager@123 |
| Employee (holds AF-0001) | priya@assetflow.com | Employee@123 |
| Employee | raj@assetflow.com | Employee@123 |

## 4. Frontend setup
```bash
cd apps/web
npm install
npm run dev    # http://localhost:5173 (proxies /api to :4000)
```

## 5. Demo script (headline features)
1. Log in as **Raj**, try to view/allocate **AF-0001** (the Dell Latitude) — it's
   held by Priya. Go to **Allocation & Transfer**, attempt to allocate it to Raj:
   the system blocks it with "currently held by Priya Sharma" and offers
   **Request Transfer Instead**.
2. Log in as **manager@assetflow.com**, approve the transfer request — allocation
   history updates automatically.
3. Mark **Conference Room B2** (AF-0002) as bookable (already seeded that way),
   book 9:00–10:00, then try 9:30–10:30 from another account — rejected as
   overlapping. Try 10:00–11:00 — accepted (matches the spec's example exactly).
4. Log in as **admin@assetflow.com** → Organization Setup → Employee Directory →
   promote Raj to **Asset Manager** — this is the only place any role is ever
   assigned; signup never grants elevated roles.
5. Raise a maintenance request as an employee, approve it as the Asset Manager —
   asset flips to "Under Maintenance" only after approval, not before.
6. Create an audit cycle as Admin, mark an item "Missing", close the cycle —
   the asset auto-flips to "Lost" and shows up in the discrepancy report.

## Project structure
```
apps/
  api/    Express + Prisma backend (see src/modules/*)
  web/    React + Vite frontend (see src/pages/*)
docker-compose.yml   local Postgres
```

Full system design rationale — architecture diagram, RBAC matrix, schema,
state machines, API surface — is in `AssetFlow_System_Design_Blueprint.md`
(shared alongside this codebase).
