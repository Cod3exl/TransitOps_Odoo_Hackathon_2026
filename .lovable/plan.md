# TransitOps — UI-Only Build Plan

Build the 9 screens described in the playbook as a fully navigable React app with mock/seed data. No Lovable Cloud, no real auth, no persistence — role and "session" live in memory (and localStorage for reload survival).

## Design system (src/styles.css)

Encode tokens once so every screen inherits:

- Surfaces: dark charcoal slate sidebar, off-white canvas, white cards.
- Accent: single warm amber/gold — used only for primary buttons, active nav, logo, focus rings, key numbers.
- Status chip tokens (used everywhere a status appears):
  - `available` green, `on-trip` / `dispatched` / `in-progress` blue, `in-shop` / `draft` / `pending` amber, `retired` / `off-duty` neutral gray, `suspended` / `expired` / `cancelled` red.
- Typography: Inter (loaded via `<link>` in `__root.tsx`), tabular numerals utility for tables/KPIs.
- Radius, spacing rhythm, subtle border color, table row height — all as tokens.

Shared primitives in `src/components/transit/`:
- `StatusChip` (single source of truth for status color mapping)
- `KpiCard` (headline + secondary variants)
- `DataTable` wrapper (sticky header, compact rows, right-aligned numeric)
- `PageHeader` (title + search + primary action slot)
- `SlideOver` (right drawer for Add Vehicle / Add Driver forms)
- `RuleNote` (low-emphasis info line under table headers)

## App shell

- `src/routes/__root.tsx`: set real title/description ("TransitOps — Smart Transport Operations Platform"), load Inter, keep existing error/notfound boundaries.
- Auth-less "session" via a tiny `useSession` hook backed by localStorage: `{ email, role }`. Roles: `fleet_manager | dispatcher | safety_officer | financial_analyst`.
- `_authenticated` layout route: if no session, render the login screen inline (no redirect gymnastics needed for a demo). Otherwise render the app shell:
  - Left sidebar (dark charcoal): logo, nav items filtered by role, user + role badge pinned at bottom, collapses to icon rail under 1024px.
  - Top bar per page: page title, global search, right-aligned primary action slot.
- Role → nav visibility map drives the sidebar so RBAC is visible, not just gated.

## Routes (one file per screen)

```
src/routes/
  _authenticated.tsx        layout + sidebar/topbar, inline login when signed out
  _authenticated.index.tsx  Dashboard (Screen 1)
  _authenticated.vehicles.tsx
  _authenticated.drivers.tsx
  _authenticated.trips.tsx
  _authenticated.maintenance.tsx
  _authenticated.finance.tsx
  _authenticated.reports.tsx
  _authenticated.settings.tsx
  index.tsx                 redirects into _authenticated (or login panel)
```

Each route sets its own `head()` with a distinct title/description.

## Seed data (src/data/seed.ts)

Typed mock data sized for a realistic demo:
- ~12 vehicles across all 5 statuses (incl. one Retired, two In Shop).
- ~10 drivers incl. one with an expired license and one Suspended.
- ~15 trips across Draft / Dispatched / In Progress / Completed / Cancelled, incl. one Draft with "Awaiting vehicle".
- Service records, fuel logs, expenses, monthly revenue series, top costliest vehicles.
- KPIs derived from the seed at module load — no fake random numbers per render.

All mutations (Add Vehicle, Log Fuel, Dispatch Trip, etc.) update an in-memory store exposed via a small Zustand-like context so the demo feels live within a session.

## Screen-by-screen deliverables

**Screen 0 — Login**: split layout, dark brand panel left (logo, tagline, 4-role summary), form right with role selector that previews which nav sections that role will see; inline invalid-credentials banner and a distinct locked-account warning state. Any email + any password works; role selector sets the session role.

**Screen 1 — Dashboard**: filter bar, 4 headline KPI cards, secondary metric chip row, two-column body (Recent Trips table with visibly muted Draft row + fleet-status donut with legend). Designed empty state for zero trips.

**Screen 2 — Vehicle Registry**: data table with monospace registration column, filters, `+ Add Vehicle` slide-over with live "already exists" duplicate-registration validation, low-emphasis rule note about Retired/In Shop exclusion from dispatch.

**Screen 3 — Drivers & Safety**: table with expired-license cell flagged red independent of status, safety score rendered as inline colored bar (green/amber/red thresholds), pill-toggle status filter, rule note about expired/suspended blocking assignment.

**Screen 4 — Trip Dispatcher**: two-panel layout. Left: lifecycle stepper (Draft → Dispatched → Completed → Cancelled) + create-trip form filtered to Available vehicles/drivers, with the explicit capacity-exceeded error card ("Vehicle capacity 500 kg / Cargo 700 kg — exceeded by 200 kg, dispatch blocked") disabling Dispatch. Right: Live Board of trip cards with muted/strikethrough cancelled cards and a note on what happened to their vehicle/driver. Footer note on the completion → Available cascade.

**Screen 5 — Maintenance**: log-service form (left) + service history table (right), plus the horizontal Available ↔ In Shop transition diagram using status chip colors.

**Screen 6 — Fuel & Expense**: two stacked tables with their own action buttons in a shared header row; elevated totals card at the bottom showing `Total Operational Cost = Fuel + Maintenance` as a labeled formula above the amber-accented total.

**Screen 7 — Reports**: 4 headline KPIs with sparklines/trend arrows, Monthly Revenue bar chart + Top Costliest Vehicles ranked horizontal bars (red→amber gradient), ROI formula footnote, top-right outline `Export CSV` button (generates CSV from seed).

**Screen 8 — Settings & RBAC**: left general-settings form, right RBAC matrix (roles × sections) using check / eye / dash icons in muted colors, generous cell padding, amber `Save changes` bottom-right.

## Cross-screen consistency pass

Before finishing, one review pass to confirm sidebar, top bar, `StatusChip`, buttons, and type scale are identical across all 9 screens — anything that drifted gets pulled back to the shared primitives.

## Technical notes

- Charts: `recharts` (already fine on this stack) for the donut, bar chart, sparklines, and ranked bars.
- Icons: `lucide-react` for controls only — logo mark is a custom small SVG so the brand doesn't read as a stock icon.
- Fully responsive: sidebar → icon rail <1024px, tables → stacked cards <768px via a `ResponsiveTable` helper.
- No backend calls, no `createServerFn`, no Supabase. Everything is client-side seed + in-memory store.

## Out of scope (call out for later)

- Real authentication, RLS, and persistence (would require enabling Lovable Cloud).
- Dark mode variant of the Dashboard (playbook lists it as optional — can add on request).
- Real CSV/PDF export beyond a client-side CSV blob for the Reports screen.