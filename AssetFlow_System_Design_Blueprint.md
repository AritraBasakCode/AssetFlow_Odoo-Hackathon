# AssetFlow — Enterprise Asset & Resource Management System
### System Design Blueprint (Hackathon Build)

---

## 1. Vision & Mission

**Vision:** Give organizations a single source of truth for every physical asset and shared resource they own — from procurement to disposal — replacing spreadsheets and email threads with a governed, auditable workflow engine.

**Mission:** Deliver a lightweight but architecturally correct ERP module that demonstrates real enterprise patterns — RBAC with no self-elevation, state machines for lifecycle-bound entities, conflict-safe booking/allocation, and closed-loop audit cycles — while staying buildable in a hackathon timeframe.

**Problem Statement:** Organizations lose track of who holds what asset, double-book shared resources, let maintenance happen without approval, and run audits manually with no discrepancy trail. AssetFlow centralizes departments, employees, assets, bookings, maintenance, and audits into one relational system with enforced business rules.

---

## 2. Recommended Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React (Vite) + TypeScript + TailwindCSS | Fast dev loop, type safety for a data-heavy app |
| State/Data fetching | React Query (TanStack Query) | Caching, background refetch — great for KPI/notification polling |
| Backend | Node.js + Express (or NestJS if team knows it) | Fast to scaffold REST APIs; NestJS gives structure for free if you have time |
| Database | PostgreSQL | Native support for `EXCLUDE` constraints (booking overlap), enums, JSONB for flexible category fields, row-level locking |
| ORM | Prisma | Type-safe schema, migrations, fast iteration — ideal for hackathon speed |
| Auth | JWT (access + refresh) via httpOnly cookies + bcrypt | Stateless, scalable, standard |
| Realtime/Notifications | Server-Sent Events (SSE) or simple polling; WebSockets (Socket.IO) if time allows | Push overdue/booking/maintenance alerts without full re-fetch |
| File storage | Local disk / S3-compatible bucket (e.g. Supabase Storage, Cloudinary) | Asset photos, maintenance photos, documents |
| Deployment | Frontend on Vercel/Netlify, backend + DB on Render/Railway/Supabase | Fastest path to a live demo URL |

> If the team wants a single-repo, single-deploy option for speed: **Next.js (App Router) with API routes/Route Handlers + Prisma + Postgres**, deployed on Vercel + a managed Postgres (Neon/Supabase). This collapses frontend+backend into one deployable and is often faster for hackathons.

---

## 3. High-Level Architecture

```
                         ┌─────────────────────────┐
                         │        Client (SPA)      │
                         │  React + Tailwind + RQ   │
                         └────────────┬──────────────┘
                                      │ HTTPS (JWT in httpOnly cookie)
                         ┌────────────▼──────────────┐
                         │        API Gateway Layer   │
                         │   Express/NestJS Router     │
                         │  - Auth middleware (JWT)    │
                         │  - RBAC middleware          │
                         │  - Request validation (zod) │
                         └────────────┬──────────────┘
                                      │
        ┌─────────────┬──────────────┼──────────────┬──────────────┐
        ▼             ▼              ▼              ▼              ▼
   AuthService   OrgService    AssetService   BookingService  AuditService
   (login/       (dept, cat,   (register,     (slot booking,  (cycles,
   signup,       employees,    allocate,      overlap check)  discrepancy)
   sessions)     role promo)   transfer,
                                maintenance)
        │             │              │              │              │
        └─────────────┴──────────────┴──────┬───────┴──────────────┘
                                             ▼
                              ┌───────────────────────────┐
                              │   PostgreSQL (via Prisma)   │
                              │  Transactions + row locks   │
                              │  Unique/Exclude constraints │
                              └───────────────────────────┘
                                             │
                              ┌───────────────────────────┐
                              │  NotificationService        │
                              │  (event-driven, on write)   │
                              │  + Scheduled Job Runner     │
                              │  (overdue checks, reminders)│
                              └───────────────────────────┘
```

**Key architectural decisions:**

1. **Service-per-module, single API process.** For a hackathon, avoid real microservices — use a modular monolith (separate service/controller files per domain) so it deploys as one unit but stays organized like an ERP.
2. **Business rules enforced at two layers**: application-level checks (fast feedback, friendly error messages like "currently held by Priya") *and* database-level constraints (source of truth, race-condition safe). Never trust the app layer alone for conflict rules.
3. **Event-driven notifications**: every state-changing write (allocate, approve, book, resolve) emits an internal event that the NotificationService consumes to create in-app notifications. A scheduled job (cron, e.g. `node-cron`) sweeps for overdue returns/bookings/maintenance every few minutes.
4. **Audit trail via append-only ActivityLog table**, written by a single logging middleware/interceptor rather than scattered manual calls — guarantees nothing gets missed.

---

## 4. Authentication & Authorization Design

### 4.1 Account creation flow (no self-elevation)
- `POST /auth/signup` → creates a `User` row with `role = EMPLOYEE` always. Role is **not** a client-supplied field — server hardcodes it.
- Admin is seeded once at deploy time (env-based bootstrap script), never created via public signup.
- `PATCH /admin/employees/:id/role` (Admin-only, from Organization Setup → Employee Directory) is the **only** endpoint that can set `DEPARTMENT_HEAD` or `ASSET_MANAGER`. This endpoint is protected by RBAC middleware requiring `role === ADMIN`.

### 4.2 Login & session handling
- Passwords hashed with **bcrypt** (cost factor ~10–12), never stored plain.
- On login: issue a short-lived **access token** (JWT, ~15 min) and a longer-lived **refresh token** (~7 days), both set as `httpOnly`, `Secure`, `SameSite=Strict` cookies (avoids XSS token theft vs localStorage).
- `POST /auth/refresh` rotates the access token using the refresh token; refresh tokens are stored (hashed) in a `Session` table so they can be revoked (logout, password change, admin deactivation).
- `POST /auth/logout` deletes the session row and clears cookies.
- `POST /auth/forgot-password` → generates a one-time reset token (hashed, short expiry) emailed to the user; `POST /auth/reset-password` validates and updates the hash.
- Every protected route runs a `requireAuth` middleware that verifies the JWT and attaches `req.user`, then a `requireRole([...])` middleware for RBAC.

### 4.3 Role-Based Access Control (RBAC) matrix

| Action | Admin | Asset Manager | Department Head | Employee |
|---|:---:|:---:|:---:|:---:|
| Manage departments/categories | ✅ | ❌ | ❌ | ❌ |
| Promote employee to role | ✅ | ❌ | ❌ | ❌ |
| Register asset | ❌ | ✅ | ❌ | ❌ |
| Allocate/approve transfer | ❌ | ✅ | ✅ (own dept) | ❌ |
| Approve maintenance | ❌ | ✅ | ❌ | ❌ |
| Book shared resource | ✅ | ✅ | ✅ | ✅ |
| Raise maintenance request | ✅ | ✅ | ✅ | ✅ |
| Create/close audit cycle | ✅ | ❌ | ❌ | ❌ |
| Act as auditor (verify items) | if assigned | if assigned | if assigned | if assigned |
| View org-wide analytics | ✅ | partial | dept-only | own-only |

Enforce this as a declarative table (`permissions.ts`) consumed by middleware, not scattered `if` statements — keeps it demo-able and easy to explain to judges.

### 4.4 Password & data safety basics
- Rate-limit `/auth/login` and `/auth/forgot-password` (e.g. `express-rate-limit`) to blunt brute force.
- Validate all input with a schema library (zod/Joi) before it touches the DB layer.
- CORS locked to the frontend origin only; CSRF token or `SameSite=Strict` cookies since auth is cookie-based.

---

## 5. Database Schema (PostgreSQL, via Prisma)

### 5.1 Entity-Relationship overview

```
User ──< Department (head_id)         Department ──< Department (parent_id, self-referencing)
User ──< AssetAllocation               AssetCategory ──< Asset
Asset ──< AssetAllocation              Asset ──< Booking
Asset ──< MaintenanceRequest           Asset ──< AuditItem
Department ──< AssetAllocation         AuditCycle ──< AuditItem
User ──< TransferRequest               AuditCycle ──< User (auditors, many-to-many)
User ──< Booking                       User ──< Notification
User ──< ActivityLog
```

### 5.2 Core tables (simplified Prisma-style schema)

```prisma
enum Role {
  ADMIN
  ASSET_MANAGER
  DEPARTMENT_HEAD
  EMPLOYEE
}

enum AssetStatus {
  AVAILABLE
  ALLOCATED
  RESERVED
  UNDER_MAINTENANCE
  LOST
  RETIRED
  DISPOSED
}

enum AllocationStatus { ACTIVE RETURNED }
enum TransferStatus   { REQUESTED APPROVED REJECTED COMPLETED }
enum BookingStatus     { UPCOMING ONGOING COMPLETED CANCELLED }
enum MaintenanceStatus { PENDING APPROVED REJECTED TECH_ASSIGNED IN_PROGRESS RESOLVED }
enum AuditItemResult    { PENDING VERIFIED MISSING DAMAGED }
enum AuditCycleStatus   { OPEN CLOSED }

model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  passwordHash  String
  role          Role     @default(EMPLOYEE)
  departmentId  String?
  department    Department? @relation("DeptMembers", fields: [departmentId], references: [id])
  status        String   @default("ACTIVE") // ACTIVE / INACTIVE
  createdAt     DateTime @default(now())

  headOfDept    Department[] @relation("DeptHead")
  allocations   AssetAllocation[]
  bookings      Booking[]
  maintenanceRequests MaintenanceRequest[]
  auditAssignments  AuditCycleAuditor[]
  notifications Notification[]
  sessions      Session[]
}

model Session {
  id            String   @id @default(cuid())
  userId        String
  refreshTokenHash String
  expiresAt     DateTime
  user          User     @relation(fields: [userId], references: [id])
}

model Department {
  id            String   @id @default(cuid())
  name          String   @unique
  parentId      String?
  parent        Department? @relation("DeptHierarchy", fields: [parentId], references: [id])
  children      Department[] @relation("DeptHierarchy")
  headId        String?
  head          User?    @relation("DeptHead", fields: [headId], references: [id])
  status        String   @default("ACTIVE")
  members       User[]   @relation("DeptMembers")
  assets        Asset[]
}

model AssetCategory {
  id            String   @id @default(cuid())
  name          String   @unique
  extraFields   Json?    // e.g. { "warrantyMonths": 24 } — flexible per-category schema
  assets        Asset[]
}

model Asset {
  id              String   @id @default(cuid())
  assetTag        String   @unique   // auto-generated AF-0001
  name            String
  categoryId      String
  category        AssetCategory @relation(fields: [categoryId], references: [id])
  serialNumber    String   @unique
  acquisitionDate DateTime
  acquisitionCost Decimal?
  condition       String
  location        String
  status          AssetStatus @default(AVAILABLE)
  isBookable      Boolean  @default(false)
  departmentId    String?
  department      Department? @relation(fields: [departmentId], references: [id])
  photoUrl        String?
  qrCode          String?  @unique

  allocations     AssetAllocation[]
  bookings        Booking[]
  maintenanceRequests MaintenanceRequest[]
  auditItems      AuditItem[]
  createdAt       DateTime @default(now())
}

model AssetAllocation {
  id            String   @id @default(cuid())
  assetId       String
  asset         Asset    @relation(fields: [assetId], references: [id])
  employeeId    String?
  employee      User?    @relation(fields: [employeeId], references: [id])
  departmentId  String?
  allocatedAt   DateTime @default(now())
  expectedReturnDate DateTime?
  returnedAt    DateTime?
  checkInNotes  String?
  status        AllocationStatus @default(ACTIVE)

  // Enforces: only one ACTIVE allocation per asset at a time (partial unique index, see 5.3)
}

model TransferRequest {
  id            String   @id @default(cuid())
  assetId       String
  fromUserId    String?
  toUserId      String
  requestedById String
  status        TransferStatus @default(REQUESTED)
  approvedById  String?
  createdAt     DateTime @default(now())
  resolvedAt    DateTime?
}

model Booking {
  id            String   @id @default(cuid())
  assetId       String
  asset         Asset    @relation(fields: [assetId], references: [id])
  bookedById    String
  bookedBy      User     @relation(fields: [bookedById], references: [id])
  startTime     DateTime
  endTime       DateTime
  status        BookingStatus @default(UPCOMING)
  createdAt     DateTime @default(now())

  // Overlap prevention enforced via Postgres EXCLUDE constraint, see 5.3
}

model MaintenanceRequest {
  id            String   @id @default(cuid())
  assetId       String
  asset         Asset    @relation(fields: [assetId], references: [id])
  raisedById    String
  raisedBy      User     @relation(fields: [raisedById], references: [id])
  issueDescription String
  priority      String   // LOW / MEDIUM / HIGH / CRITICAL
  photoUrl      String?
  status        MaintenanceStatus @default(PENDING)
  approvedById  String?
  technicianName String?
  resolutionNotes String?
  createdAt     DateTime @default(now())
  resolvedAt    DateTime?
}

model AuditCycle {
  id            String   @id @default(cuid())
  name          String
  scopeDepartmentId String?
  scopeLocation String?
  startDate     DateTime
  endDate       DateTime
  status        AuditCycleStatus @default(OPEN)
  auditors      AuditCycleAuditor[]
  items         AuditItem[]
  createdAt     DateTime @default(now())
}

model AuditCycleAuditor {
  id            String   @id @default(cuid())
  auditCycleId  String
  auditCycle    AuditCycle @relation(fields: [auditCycleId], references: [id])
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  @@unique([auditCycleId, userId])
}

model AuditItem {
  id            String   @id @default(cuid())
  auditCycleId  String
  auditCycle    AuditCycle @relation(fields: [auditCycleId], references: [id])
  assetId       String
  asset         Asset    @relation(fields: [assetId], references: [id])
  result        AuditItemResult @default(PENDING)
  notes         String?
  verifiedById  String?
  verifiedAt    DateTime?
}

model Notification {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  type          String   // ASSET_ASSIGNED, MAINTENANCE_APPROVED, BOOKING_REMINDER, etc.
  message       String
  isRead        Boolean  @default(false)
  createdAt     DateTime @default(now())
}

model ActivityLog {
  id            String   @id @default(cuid())
  actorId       String
  action        String   // e.g. "ASSET_ALLOCATED", "MAINTENANCE_APPROVED"
  entityType    String   // "Asset", "Booking", etc.
  entityId      String
  metadata      Json?
  createdAt     DateTime @default(now())
}
```

### 5.3 Critical database-level integrity rules

These are the details that separate a "toy CRUD app" from something that demonstrates real system design — worth calling out explicitly in your demo/pitch:

1. **No double allocation** — a partial unique index ensures only one `ACTIVE` allocation exists per asset at any time:
   ```sql
   CREATE UNIQUE INDEX one_active_allocation_per_asset
   ON "AssetAllocation" ("assetId")
   WHERE status = 'ACTIVE';
   ```
   The app layer still does a friendly pre-check ("currently held by Priya") before attempting the write, but the DB constraint is the real guarantee under concurrent requests.

2. **No overlapping bookings** — Postgres `btree_gist` extension + an `EXCLUDE` constraint on a time-range column guarantees no two bookings for the same asset overlap, even under race conditions:
   ```sql
   CREATE EXTENSION IF NOT EXISTS btree_gist;
   ALTER TABLE "Booking" ADD COLUMN period tsrange
     GENERATED ALWAYS AS (tsrange("startTime", "endTime", '[)')) STORED;
   ALTER TABLE "Booking" ADD CONSTRAINT no_overlapping_bookings
     EXCLUDE USING gist ("assetId" WITH =, period WITH &&)
     WHERE (status IN ('UPCOMING','ONGOING'));
   ```
   The `[)` bound means a booking ending at 10:00 does not conflict with one starting at 10:00 — matches the spec example exactly.

3. **Asset status transitions are constrained**, not free-text — model them as a small state machine table or enforce via application service layer:
   ```
   AVAILABLE      → ALLOCATED, RESERVED, UNDER_MAINTENANCE, LOST, RETIRED
   ALLOCATED      → AVAILABLE (on return), UNDER_MAINTENANCE, LOST
   RESERVED       → AVAILABLE, ALLOCATED
   UNDER_MAINTENANCE → AVAILABLE, RETIRED, DISPOSED
   LOST           → RETIRED, DISPOSED (after audit confirms)
   RETIRED        → DISPOSED
   DISPOSED       → (terminal)
   ```
   Implement as a `canTransition(from, to)` guard in `AssetService`, called before every status update — keeps the rule in one place and testable.

4. **All multi-step writes wrapped in DB transactions** (`prisma.$transaction`) — e.g. approving a maintenance request must atomically: update request status, flip asset to `UNDER_MAINTENANCE`, write ActivityLog, create Notification. If any step fails, all roll back.

---

## 6. Core Workflows as State Machines

### 6.1 Asset Lifecycle
```
Available ⇄ Under Maintenance
Available → Allocated → Available (return)
Available → Reserved → Allocated/Available
Allocated → Lost
Lost → Retired → Disposed
Under Maintenance → Retired/Disposed (write-off)
```

### 6.2 Transfer Request
```
Requested → Approved → Re-allocated (allocation row closed + new one opened, atomically)
Requested → Rejected (terminal)
```

### 6.3 Maintenance Request
```
Pending → Approved (asset → UNDER_MAINTENANCE) → Technician Assigned → In Progress → Resolved (asset → AVAILABLE)
Pending → Rejected (terminal, asset status unchanged)
```

### 6.4 Booking
```
Upcoming → Ongoing (auto, when startTime reached) → Completed (auto, when endTime passed)
Upcoming → Cancelled (manual, by booker or admin)
```
A scheduled job promotes `Upcoming → Ongoing → Completed` based on current time; keeps status accurate without manual updates.

### 6.5 Audit Cycle
```
OPEN (auditors assigned, items pending) → auditors mark each item Verified/Missing/Damaged
→ CLOSED (locks cycle; MISSING items flip asset status to LOST; auto-generates discrepancy report for MISSING+DAMAGED items)
```

---

## 7. API Surface (REST, grouped by module)

```
Auth
  POST   /api/auth/signup
  POST   /api/auth/login
  POST   /api/auth/refresh
  POST   /api/auth/logout
  POST   /api/auth/forgot-password
  POST   /api/auth/reset-password

Organization (Admin only unless noted)
  GET/POST/PATCH   /api/departments
  GET/POST/PATCH   /api/asset-categories
  GET              /api/employees                 (Admin/Asset Manager)
  PATCH            /api/employees/:id/role         (Admin only — the only role-assignment route)
  PATCH            /api/employees/:id/status

Assets
  GET/POST         /api/assets
  GET               /api/assets/:id                (incl. allocation + maintenance history)
  PATCH            /api/assets/:id
  GET               /api/assets/search?tag=&category=&status=&location=

Allocation & Transfer
  POST             /api/allocations                (blocks if asset already ACTIVE-allocated)
  POST             /api/allocations/:id/return
  POST             /api/transfers                  (requested)
  PATCH            /api/transfers/:id/approve
  PATCH            /api/transfers/:id/reject

Bookings
  GET               /api/assets/:id/bookings         (calendar view)
  POST             /api/bookings                    (server validates overlap; DB constraint backstops)
  PATCH            /api/bookings/:id/cancel

Maintenance
  POST             /api/maintenance-requests
  PATCH            /api/maintenance-requests/:id/approve
  PATCH            /api/maintenance-requests/:id/reject
  PATCH            /api/maintenance-requests/:id/assign-technician
  PATCH            /api/maintenance-requests/:id/resolve

Audits
  POST             /api/audit-cycles                (Admin)
  POST             /api/audit-cycles/:id/auditors
  PATCH            /api/audit-cycles/:id/items/:itemId   (Verified/Missing/Damaged)
  PATCH            /api/audit-cycles/:id/close

Dashboard / Reports
  GET               /api/dashboard/kpis
  GET               /api/reports/utilization
  GET               /api/reports/maintenance-frequency
  GET               /api/reports/department-summary
  GET               /api/reports/booking-heatmap
  GET               /api/reports/export?type=csv|pdf

Notifications & Logs
  GET               /api/notifications
  PATCH            /api/notifications/:id/read
  GET               /api/activity-logs               (Admin/Manager, filterable)
```

---

## 8. Screen ↔ Backend Mapping (quick reference)

| Screen | Primary endpoints | Role gate |
|---|---|---|
| Login/Signup | `/auth/*` | public |
| Dashboard | `/dashboard/kpis`, `/notifications` | all roles |
| Organization Setup | `/departments`, `/asset-categories`, `/employees` | Admin |
| Asset Registry | `/assets*` | Asset Manager write, all read |
| Allocation & Transfer | `/allocations*`, `/transfers*` | Asset Manager / Dept Head |
| Resource Booking | `/bookings*` | all roles |
| Maintenance | `/maintenance-requests*` | all raise, Asset Manager approves |
| Audit | `/audit-cycles*` | Admin creates, assigned auditors act |
| Reports | `/reports/*` | Admin full, others scoped |
| Logs/Notifications | `/activity-logs`, `/notifications` | Admin/Manager for logs, all for own notifications |

---

## 9. Notification & Scheduled Jobs Design

- **Event-driven notifications**: fired synchronously inside the same transaction as the triggering write (e.g. approving a transfer creates a `Notification` row for the new holder). Keeps demo reliable — no message queue needed at hackathon scale.
- **Scheduled sweep job** (`node-cron`, runs every 5–15 min):
  - Flag allocations past `expectedReturnDate` → Notification + Dashboard overdue count.
  - Flag bookings starting in next N minutes → reminder Notification.
  - Promote booking statuses (`Upcoming→Ongoing→Completed`) based on current time.
  - Flag maintenance requests open beyond an SLA threshold (nice-to-have).
- Keep this job idempotent (only notify once per condition) by tracking a `notifiedAt` flag or checking for an existing unread notification of that type before creating another.

---

## 10. Suggested Folder Structure

```
assetflow/
├── apps/
│   ├── web/                      # React frontend
│   │   ├── src/
│   │   │   ├── pages/            # one folder per screen (Dashboard, Assets, Bookings...)
│   │   │   ├── components/
│   │   │   ├── api/               # typed API client (fetch/axios wrappers)
│   │   │   ├── hooks/             # React Query hooks per module
│   │   │   ├── context/           # AuthContext (user, role)
│   │   │   └── routes/            # role-guarded routes
│   └── api/                      # Express/NestJS backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── organization/
│       │   │   ├── assets/
│       │   │   ├── allocations/
│       │   │   ├── bookings/
│       │   │   ├── maintenance/
│       │   │   ├── audits/
│       │   │   ├── notifications/
│       │   │   └── reports/
│       │   ├── middleware/       # auth, rbac, validation, error handler
│       │   ├── jobs/              # cron sweeps
│       │   └── prisma/
│       │       └── schema.prisma
├── packages/
│   └── shared-types/             # shared TS types/enums between web & api
└── docker-compose.yml            # postgres + api + web for local/demo
```

---

## 11. MVP Build Order (for hackathon time constraints)

1. **Foundation**: Prisma schema + migrations, seed script (1 admin, 2 departments, 2 categories, few employees).
2. **Auth**: signup/login/JWT/RBAC middleware — everything else depends on this.
3. **Organization Setup**: departments, categories, employee directory + role promotion.
4. **Asset Registry**: register + search + status display.
5. **Allocation & Transfer**: the double-allocation block is your headline demo moment — build and test it early.
6. **Booking**: overlap validation (DB constraint) — second headline demo moment.
7. **Maintenance workflow**: approval gate before status flips.
8. **Dashboard KPIs**: once the above write real data, KPIs become trivial aggregate queries.
9. **Notifications + scheduled overdue sweep.**
10. **Audit cycles** (often the most complex; do last if time is tight — can demo as a simplified version).
11. **Reports/analytics** — nice-to-have polish; charts from data you already have.
12. **Activity log viewer** — mostly a read-only table over `ActivityLog`, cheap to add at the end.

**If time runs out**, cut Audit Cycles or Reports/Analytics before cutting Auth/RBAC, the allocation-conflict rule, or the booking-overlap rule — those three are what demonstrate real system design to judges.

---

## 12. Talking Points for Judges (why this design is "proper ERP architecture")

- Role assignment is server-controlled, never client-supplied — closes the classic "self-promote to admin" hole.
- Conflict rules (allocation, booking) are enforced at the **database** level, not just in application code — correct under concurrent access, not just in the happy path.
- Every entity with a lifecycle (Asset, Booking, Transfer, Maintenance, Audit) is modeled as an explicit **state machine**, not a free-text status field.
- Multi-step operations are wrapped in **transactions**, so partial failures can't leave the system in an inconsistent state (e.g. asset marked allocated but no allocation row).
- Notifications and activity logs are **event-driven**, generated from the same write path as the business action — nothing gets logged after the fact or forgotten.
