# TransitOps — Fleet Operations Console

currently pushing on branches: member-a, member-b and member-c.

Fleet management for the Odoo Hackathon 2026. Node/Express + PostgreSQL + Prisma + JWT backend, Vite + React 19 + Tailwind v4 frontend.

## Repo layout

```
server/   Express + Prisma API
client/   Vite + React SPA
```

## Prerequisites

- Node 20+
- A PostgreSQL database (local, or a hosted URL from Railway/Render/Neon)

## Setup

### 1. Server

```bash
cd server
npm install
cp .env.example .env          # then set DATABASE_URL + JWT_SECRET
npx prisma migrate dev --name init
npm run seed                  # loads demo fleet + 4 role accounts
npm run dev                   # → http://localhost:4000
```

### 2. Client

```bash
cd client
npm install
npm run dev                   # → http://localhost:5173
```

The Vite dev server proxies `/api/*` to the backend on port 4000, so no client env is needed for local dev. For a deployed build set `VITE_API_URL` to the API's base URL.

## Demo accounts (password `demo1234`)

| Role | Email |
|---|---|
| Fleet Manager | manager@transitops.dev |
| Dispatcher | dispatcher@transitops.dev |
| Safety Officer | safety@transitops.dev |
| Financial Analyst | finance@transitops.dev |

The login screen has one-click buttons that fill these in.

## Member C surface (Dashboard, Fuel & Expenses, Reports)

**Backend routes**
- `GET /dashboard` — KPI cards, trips-by-status, recent trips. Filters: `?type=&status=&region=`
- `GET /dashboard/filters` — distinct filter values
- `GET /fuel-logs`, `POST /fuel-logs` — fuel logging (analyst / manager write)
- `GET /expenses`, `POST /expenses` — expense logging (analyst / manager write)
- `GET /operational-cost` — fuel + expense totals per vehicle
- `GET /reports/vehicle-costs` — per-vehicle fuel efficiency, op cost, ROI
- `GET /reports/monthly-revenue` — revenue grouped by month
- `GET /reports/top-costliest?limit=5` — costliest vehicles

**Frontend pages** — `/dashboard`, `/fuel-expenses`, `/reports` (Recharts).

## Demo script

1. **Sign in** as Fleet Manager — land on the Dashboard. Point out live KPIs (total revenue, active trips, fleet/driver availability) and the trips-by-status row.
2. **Filter** the Dashboard by region `West` / type `truck` — KPIs and Recent Trips update live (TanStack Query, no reload).
3. Open **Reports** — Monthly Revenue line chart, Top 5 Costliest Vehicles bar chart, and the per-vehicle ROI / fuel-efficiency table. Highlight that ROI turns red when a vehicle is underwater.
4. Sign in as **Financial Analyst**, open **Fuel & Expenses** — log a fuel entry and an expense; the Operational Cost table and the Reports numbers update immediately.
5. (Team) Run the **Van-05 / Alex dispatch → complete** chain from the Dispatch board (trip `T-1006` is seeded in draft) to show the status machine end to end.

## Team ownership

- **Member A** — infra, auth, trips/dispatch
- **Member B** — vehicles, drivers, maintenance, settings
- **Member C** — dashboard, fuel & expenses, reports *(this slice)*

See `TransitOps_Hackathon_Plan_NoBaaS.md` for the full plan.
