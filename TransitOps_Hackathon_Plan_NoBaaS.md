
# TransitOps — 8-Hour Hackathon Plan (no backend-as-a-service)

This replaces the Supabase-based version with a self-written **Node/Express + PostgreSQL + Prisma + JWT** backend. Same database design, same business rules, same winning strategy (section 1 of the original doc still applies in full) — only the infrastructure layer changes.

---

## 1. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui | Unchanged from the original plan |
| Charts | Recharts | Unchanged |
| Forms | React Hook Form + Zod | Unchanged |
| Data fetching | TanStack Query, pointed at your own REST API instead of Supabase client | `invalidateQueries` after each mutation gives you the "live" feel without needing a realtime service |
| Backend | Node.js + Express + TypeScript | Thin, fast to scaffold, everyone on the team can read it under time pressure |
| ORM | Prisma | Schema-first, generates TypeScript types your frontend can share, migrations handled for you — the closest thing to Supabase's speed without the hosted platform |
| Database | PostgreSQL | Same relational structure as before — trip/vehicle/driver status machine genuinely needs joins and constraints, not a document store |
| Auth | JWT (`jsonwebtoken`) + `bcrypt` for password hashing | One login route, one `authenticate` middleware, one `authorize(roles)` middleware — replaces Supabase Auth + RLS |
| Deployment | Railway (Node + Postgres in one project) or Render | Single free-tier project holds your API and DB together; frontend can be served as static files from the same Express app to keep it to one deploy target |

**Bootstrap:**
```bash
mkdir transitops && cd transitops
mkdir server client

cd server
npm init -y
npm install express cors bcryptjs jsonwebtoken zod
npm install -D typescript ts-node-dev @types/express @types/node @types/cors @types/jsonwebtoken @types/bcryptjs prisma
npx tsc --init
npx prisma init --datasource-provider postgresql

cd ../client
npm create vite@latest . -- --template react-ts
npm install tailwindcss @tailwindcss/vite @tanstack/react-query react-router-dom react-hook-form zod recharts
npx shadcn@latest init
```

---

## 2. Database schema (Prisma)

Same entities as before, expressed as `prisma/schema.prisma`. Run `npx prisma migrate dev --name init` once this is written.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum AppRole {
  fleet_manager
  dispatcher
  safety_officer
  financial_analyst
}

enum VehicleStatus {
  available
  on_trip
  in_shop
  retired
}

enum DriverStatus {
  available
  on_trip
  off_duty
  suspended
}

enum TripStatus {
  draft
  dispatched
  completed
  cancelled
}

enum MaintenanceStatus {
  in_shop
  completed
}

model User {
  id           String   @id @default(uuid())
  fullName     String
  email        String   @unique
  passwordHash String
  role         AppRole
  createdAt    DateTime @default(now())
  trips        Trip[]           @relation("CreatedTrips")
  maintenance  MaintenanceLog[]
}

model Vehicle {
  id                 String        @id @default(uuid())
  registrationNumber String        @unique
  nameModel          String
  type               String
  maxLoadCapacityKg  Float
  odometerKm         Float         @default(0)
  acquisitionCost    Float
  region             String?
  status             VehicleStatus @default(available)
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt
  trips              Trip[]
  maintenanceLogs    MaintenanceLog[]
  fuelLogs           FuelLog[]
  expenses           Expense[]
}

model Driver {
  id              String       @id @default(uuid())
  name            String
  licenseNumber   String       @unique
  licenseCategory String
  licenseExpiry   DateTime
  contactNumber   String?
  safetyScore     Float        @default(100)
  status          DriverStatus @default(available)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  trips           Trip[]
}

model Trip {
  id                String     @id @default(uuid())
  tripCode          String     @unique
  source            String
  destination       String
  vehicleId         String?
  vehicle           Vehicle?   @relation(fields: [vehicleId], references: [id])
  driverId          String?
  driver            Driver?    @relation(fields: [driverId], references: [id])
  cargoWeightKg     Float
  plannedDistanceKm Float
  actualDistanceKm  Float?
  fuelConsumedL     Float?
  revenue           Float      @default(0)
  status            TripStatus @default(draft)
  dispatchedAt      DateTime?
  completedAt       DateTime?
  createdById       String?
  createdBy         User?      @relation("CreatedTrips", fields: [createdById], references: [id])
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  fuelLogs          FuelLog[]
  expenses          Expense[]
}

model MaintenanceLog {
  id          String             @id @default(uuid())
  vehicleId   String
  vehicle     Vehicle            @relation(fields: [vehicleId], references: [id])
  serviceType String
  cost        Float              @default(0)
  serviceDate DateTime           @default(now())
  status      MaintenanceStatus  @default(in_shop)
  notes       String?
  createdById String?
  createdBy   User?              @relation(fields: [createdById], references: [id])
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
}

model FuelLog {
  id        String   @id @default(uuid())
  vehicleId String
  vehicle   Vehicle  @relation(fields: [vehicleId], references: [id])
  tripId    String?
  trip      Trip?    @relation(fields: [tripId], references: [id])
  liters    Float
  cost      Float
  logDate   DateTime @default(now())
  createdAt DateTime @default(now())
}

model Expense {
  id          String   @id @default(uuid())
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id])
  tripId      String?
  trip        Trip?    @relation(fields: [tripId], references: [id])
  expenseType String
  amount      Float
  expenseDate DateTime @default(now())
  notes       String?
  createdAt   DateTime @default(now())
}
```

---

## 3. Auth & RBAC (replaces Supabase Auth + RLS)

**`middleware/auth.ts`:**
```ts
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export interface AuthedRequest extends Request {
  user?: { id: string; role: string };
}

export function authenticate(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as { sub: string; role: string };
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Not permitted for this role" });
    }
    next();
  };
}
```

**`routes/auth.ts`:**
```ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "8h" });
  res.json({ token, user: { id: user.id, fullName: user.fullName, role: user.role } });
});
```

**Role → route access** (same matrix as the spec's Target Users section):

```ts
router.get("/vehicles", authenticate, listVehicles);                                   // everyone reads
router.post("/vehicles", authenticate, authorize("fleet_manager"), createVehicle);
router.patch("/trips/:id/dispatch", authenticate, authorize("dispatcher", "fleet_manager"), dispatchTripHandler);
router.post("/drivers", authenticate, authorize("safety_officer", "fleet_manager"), createDriver);
router.post("/fuel-logs", authenticate, authorize("financial_analyst", "fleet_manager"), createFuelLog);
```

Gate the same roles in the frontend nav (hide/disable, don't just rely on a 403 toast) — the middleware is your real security, the UI gating is what makes it feel finished.

---

## 4. Business rules (replaces Postgres triggers)

Same rules, enforced in a service layer wrapped in a Prisma transaction — atomic, and still fully server-side, so a judge hitting your API directly with Postman still can't bypass them.

**`services/tripService.ts`:**
```ts
import { prisma } from "../lib/prisma";

class RuleError extends Error {
  status = 400;
}

export async function dispatchTrip(tripId: string) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUniqueOrThrow({
      where: { id: tripId },
      include: { vehicle: true, driver: true },
    });

    if (trip.status !== "draft") throw new RuleError("Trip is not in draft status");
    if (!trip.vehicle || trip.vehicle.status !== "available") throw new RuleError("Vehicle is not available");
    if (!trip.driver || trip.driver.status !== "available") throw new RuleError("Driver is not available");
    if (trip.driver.status === "suspended") throw new RuleError("Driver is suspended");
    if (trip.driver.licenseExpiry < new Date()) throw new RuleError("Driver license has expired");
    if (trip.cargoWeightKg > trip.vehicle.maxLoadCapacityKg) {
      throw new RuleError(`Cargo weight ${trip.cargoWeightKg}kg exceeds capacity ${trip.vehicle.maxLoadCapacityKg}kg`);
    }

    await tx.vehicle.update({ where: { id: trip.vehicleId! }, data: { status: "on_trip" } });
    await tx.driver.update({ where: { id: trip.driverId! }, data: { status: "on_trip" } });

    return tx.trip.update({
      where: { id: tripId },
      data: { status: "dispatched", dispatchedAt: new Date() },
    });
  });
}

export async function completeTrip(tripId: string, actualDistanceKm: number, fuelConsumedL: number) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUniqueOrThrow({ where: { id: tripId } });
    if (trip.status !== "dispatched") throw new RuleError("Trip is not dispatched");

    await tx.vehicle.update({
      where: { id: trip.vehicleId! },
      data: { status: "available", odometerKm: { increment: actualDistanceKm } },
    });
    await tx.driver.update({ where: { id: trip.driverId! }, data: { status: "available" } });

    return tx.trip.update({
      where: { id: tripId },
      data: { status: "completed", completedAt: new Date(), actualDistanceKm, fuelConsumedL },
    });
  });
}

export async function cancelTrip(tripId: string) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUniqueOrThrow({ where: { id: tripId } });
    if (trip.status !== "dispatched") throw new RuleError("Only a dispatched trip can be cancelled");

    await tx.vehicle.update({ where: { id: trip.vehicleId! }, data: { status: "available" } });
    await tx.driver.update({ where: { id: trip.driverId! }, data: { status: "available" } });

    return tx.trip.update({ where: { id: tripId }, data: { status: "cancelled" } });
  });
}
```

**`services/maintenanceService.ts`:**
```ts
export async function openMaintenance(vehicleId: string, serviceType: string, cost: number) {
  return prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.create({
      data: { vehicleId, serviceType, cost, status: "in_shop" },
    });
    await tx.vehicle.update({ where: { id: vehicleId }, data: { status: "in_shop" } });
    return log;
  });
}

export async function closeMaintenance(logId: string) {
  return prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.update({
      where: { id: logId },
      data: { status: "completed" },
    });
    await tx.vehicle.updateMany({
      where: { id: log.vehicleId, status: { not: "retired" } },
      data: { status: "available" },
    });
    return log;
  });
}
```

In your route handlers, catch `RuleError` and return its message as a 400 — that's what the frontend turns into the "capacity exceeded" toast in the dispatcher demo moment.

**Reports** — one aggregation function instead of a SQL view, called from a `/reports/vehicle-costs` route:
```ts
export async function getVehicleCosts() {
  const vehicles = await prisma.vehicle.findMany({
    include: { fuelLogs: true, maintenanceLogs: true, trips: { where: { status: "completed" } } },
  });
  return vehicles.map((v) => {
    const fuelCost = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
    const maintenanceCost = v.maintenanceLogs.reduce((s, m) => s + m.cost, 0);
    const distance = v.trips.reduce((s, t) => s + (t.actualDistanceKm ?? 0), 0);
    const liters = v.fuelLogs.reduce((s, f) => s + f.liters, 0);
    const revenue = v.trips.reduce((s, t) => s + t.revenue, 0);
    return {
      id: v.id,
      registrationNumber: v.registrationNumber,
      fuelEfficiency: liters ? distance / liters : 0,
      operationalCost: fuelCost + maintenanceCost,
      roi: v.acquisitionCost ? (revenue - (fuelCost + maintenanceCost)) / v.acquisitionCost : 0,
    };
  });
}
```

---

## 5. Team split — vertical domain ownership

Without an auto-generated API, giving one person all backend work doesn't balance across 3 people anymore. Instead, each person owns a full slice — route file, service logic, and UI page — for their domain. Different files per person means the same zero-conflict guarantee as before, just organized by domain instead of by frontend/backend.

**Member A — infra, auth, trips/dispatch**
Owns: `server/prisma/schema.prisma` (written together in hour 0, frozen after), `server/src/middleware/*`, `server/src/routes/auth.ts`, `server/src/routes/trips.ts`, `server/src/services/tripService.ts`, `client/src/pages/Dispatcher/*`, deployment config.

**Member B — vehicles, drivers, maintenance, settings**
Owns: `server/src/routes/vehicles.ts`, `server/src/routes/drivers.ts`, `server/src/routes/maintenance.ts`, `server/src/services/maintenanceService.ts`, `client/src/pages/Vehicles/*`, `client/src/pages/Drivers/*`, `client/src/pages/Maintenance/*`, `client/src/pages/Settings/*`.

**Member C — dashboard, fuel & expenses, reports**
Owns: `server/src/routes/dashboard.ts`, `server/src/routes/fuelExpenses.ts`, `server/src/routes/reports.ts`, `client/src/pages/Dashboard/*`, `client/src/pages/FuelExpenses/*`, `client/src/pages/Reports/*`.

**Shared, built together in the first 30–40 minutes, then frozen:** `schema.prisma`, `server/src/app.ts` bootstrap, `client/src/App.tsx` routing table, `client/src/components/ui/*` shared kit, `client/src/lib/apiClient.ts` (fetch wrapper with auth header + JSON parsing + error handling).

**Branching:** `main` protected → `feat/dispatch`, `feat/fleet`, `feat/operations`. Push every hour, PR, Member A merges all three at the top of the next hour (5 minutes) before anyone continues — same discipline as before.

---

## 6. Hour-by-hour plan

*(Visual grid shown in chat — this is the same plan with full task detail.)*

**Hour 0-1 — Foundation.** First 30-40 min together: finalize `schema.prisma`, scaffold both `server/` and `client/`. Then split:
- A: Express bootstrap, `prisma migrate dev`, JWT login route + `authenticate`/`authorize` middleware, seed script (4 role users + demo fleet). Commit: `chore: server infra + auth + seed`
- B: Vite + Tailwind v4 + shadcn scaffold, shared UI kit (Badge, DataTable, Card, Modal). Commit: `feat: frontend scaffold + ui kit`
- C: Router shell + sidebar/topbar layout matching the mockup, `apiClient.ts`, auth context. Commit: `feat: app shell + api client`

**Hour 1-2**
- A: `dispatchTrip`/`completeTrip`/`cancelTrip` service functions + `/trips` routes. Commit: `feat: trip service + routes`
- B: `/vehicles` routes + Vehicle Registry UI (table, add/edit modal, uniqueness validation). Commit: `feat: vehicle registry`
- C: Login page UI wired to `/auth/login`, protected route wrapper, role-based redirect. Commit: `feat: auth ui`

**Hour 2-3**
- A: Dispatcher UI — create trip form + Live Board (Draft/Dispatched/Completed/Cancelled columns). Commit: `feat: dispatcher ui`
- B: `/drivers` routes + Driver Management UI (license expiry badge, status toggle). Commit: `feat: driver management`
- C: `/dashboard` aggregation route + KPI cards wired live. Commit: `feat: dashboard live`

**Hour 3-4**
- A: Dispatch validation surfaced as toasts (capacity/license/status errors from `RuleError`), trip completion form (odometer, fuel, revenue). Commit: `feat: dispatch validation + completion`
- B: `openMaintenance`/`closeMaintenance` + Maintenance UI (log service form, service log table). Commit: `feat: maintenance workflow`
- C: Recent Trips table + Dashboard filters (type/status/region). Commit: `feat: dashboard filters`

**Checkpoint — hour 4: run the Van-05/Alex example workflow end to end before continuing.**

**Hour 4-5**
- A: CSV export utility (shared across Vehicles/Drivers/Trips) + Railway/Render project setup, env vars. Commit: `feat: csv export + deploy scaffold`
- B: Settings & RBAC matrix UI (static config matching the role table), retired-vehicle edge cases. Commit: `feat: settings + rbac matrix`
- C: `/fuel-logs` + `/expenses` routes + UI (fuel log form, expense form, auto operational cost). Commit: `feat: fuel expense tracking`

**Hour 5-6**
- A: Audit `authorize()` across every route against the role matrix, finalize JWT expiry handling. Commit: `feat: rbac enforcement pass`
- B: Search/filter/sort across Vehicle and Driver tables. Commit: `feat: search filter sort`
- C: `/reports/vehicle-costs` route + Recharts UI (Monthly Revenue, Top Costliest Vehicles, ROI/fuel-efficiency KPI cards). Commit: `feat: reports analytics`

**Hour 6-7**
- A: Full deploy — API + Postgres on Railway/Render, frontend built and served, live URL smoke-tested. Commit: `chore: production deploy`
- B: Dark mode toggle (Tailwind v4 theme variables). Commit: `feat: dark mode`
- C: Responsive pass + loading/error states on Dashboard, Fuel & Expenses, Reports. Commit: `polish: responsive + states`

**Hour 7-8**
- A: Manual test pass on every mandatory rule (section 4 of the spec) against the live deployed URL, fix anything that breaks. Commit: `fix: rule test pass`
- B: Loading/empty/error states on Vehicles, Drivers, Maintenance, Settings. Commit: `polish: loading and error states`
- C: Realistic demo dataset matching the example workflow + README with setup + demo script. Commit: `docs: demo data + readme`

24 commits, 8 merge checkpoints, nobody blocked mid-hour.

---

## 7. What's unchanged from the original plan

- Section 1 (winning strategy) and section 8 (demo script) apply exactly as written — judges are still testing rule enforcement and the live status chain, not which backend you picked.
- Bonus feature prioritization is the same, with one substitution: **email reminders for expiring licenses**, if you get to it, is now a `node-cron` job + `nodemailer`/Resend call inside your own Express app instead of a Supabase Edge Function — same low priority, same "only if hours 6-7 finish early" caveat.
- If you're behind schedule, cut in the same order: unplanned bonus features → dark mode → search/sort → CSV polish → UI polish. Never cut rule enforcement or the dispatch→complete→maintenance chain.
