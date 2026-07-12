import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Route as RouteIcon } from "lucide-react";
import { useDashboard, useVehicles } from "@/lib/useApi";
import { KpiCard, MetricChip } from "@/components/transit/KpiCard";
import { StatusChip } from "@/components/transit/StatusChip";
import { TableCard, Th, Td, Tr } from "@/components/transit/DataTable";
import { EmptyState } from "@/components/transit/EmptyState";
import { PageHeader, PrimaryButton } from "@/components/transit/PageHeader";
import { PendingComponent } from "@/components/transit/PendingComponent";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard — TransitOps" },
      { name: "description", content: "Operational overview: fleet KPIs, active trips and vehicle status at a glance." },
    ],
  }),
  component: Dashboard,
});

const STATUS_COLORS: Record<string, string> = {
  available: "var(--status-green)",
  on_trip: "var(--status-blue)",
  in_shop: "var(--status-amber)",
  retired: "var(--status-gray)",
};

function Dashboard() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");

  const params = useMemo(() => ({
    type: typeFilter !== "all" ? typeFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    region: regionFilter !== "all" ? regionFilter : undefined,
  }), [typeFilter, statusFilter, regionFilter]);

  const { data: dash, isLoading } = useDashboard(params);
  const { data: allVehicles = [] } = useVehicles();

  if (isLoading) return <PendingComponent />;

  const kpis = dash?.kpis;
  const recentTrips = dash?.recentTrips ?? [];
  const tripsByStatus = dash?.tripsByStatus ?? {};

  const activeVehicles = kpis ? kpis.totalVehicles - 0 : 0; // totalVehicles excludes nothing; use it
  const activeTrips = (kpis?.activeTrips ?? 0);
  const utilization = kpis && kpis.totalVehicles > 0
    ? Math.round((kpis.onTripVehicles / kpis.totalVehicles) * 100)
    : 0;
  const onDuty = kpis?.totalDrivers ?? 0;
  const availableCount = kpis?.availableVehicles ?? 0;
  const inShopCount = kpis?.inShopVehicles ?? 0;
  const pendingTrips = tripsByStatus["draft"] ?? 0;

  // For the donut chart, count vehicles from real data with current filters
  const donutData = (["available", "on_trip", "in_shop", "retired"] as const).map((s) => ({
    name: { available: "Available", on_trip: "On Trip", in_shop: "In Shop", retired: "Retired" }[s],
    key: s,
    value: allVehicles.filter((v) => v.status === s).length,
  }));


  const select =
    "h-9 rounded-md border bg-card px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Operational overview"
        action={
          <div className="flex flex-wrap gap-2">
            <select className={select} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All types</option>
              <option>Truck</option>
              <option>Van</option>
              <option>Bus</option>
              <option>Pickup</option>
            </select>
            <select className={select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All statuses</option>
              <option value="available">Available</option>
              <option value="on_trip">On Trip</option>
              <option value="in_shop">In Shop</option>
              <option value="retired">Retired</option>
            </select>
            <select className={select} value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
              <option value="all">All regions</option>
              <option>North</option>
              <option>South</option>
              <option>East</option>
              <option>West</option>
            </select>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active Vehicles" value={String(activeVehicles)} accent="amber" context="fleet excluding retired" />
        <KpiCard label="Active Trips" value={String(activeTrips)} accent="blue" trend="up" context="dispatched + in progress" />
        <KpiCard label="Fleet Utilization" value={`${utilization}%`} accent="green" trend="up" context="vs 54% last week" />
        <KpiCard label="Drivers On Duty" value={String(onDuty)} accent="gray" context={`${kpis?.totalDrivers ?? 0} total on roster`} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <MetricChip label="vehicles available" value={String(availableCount)} tone="green" />
        <MetricChip label="in maintenance" value={String(inShopCount)} tone="amber" />
        <MetricChip label="pending draft trips" value={String(pendingTrips)} tone="amber" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div>
          <h2 className="mb-2 text-sm font-semibold">Recent Trips</h2>
          <TableCard>
            {recentTrips.length === 0 ? (
              <tbody>
                <tr>
                  <td>
                    <EmptyState
                      icon={RouteIcon}
                      title="No trips yet"
                      description="When dispatchers create trips they'll show up here."
                      action={
                        <PrimaryButton onClick={() => navigate({ to: "/trips" })}>
                          Create your first trip
                        </PrimaryButton>
                      }
                    />
                  </td>
                </tr>
              </tbody>
            ) : (
              <>
                <thead>
                  <tr>
                    <Th>Trip ID</Th>
                    <Th>Vehicle</Th>
                    <Th>Driver</Th>
                    <Th>Status</Th>
                    <Th>ETA</Th>
                  </tr>
                </thead>
                <tbody>
                   {recentTrips.map((t) =>
                    t.status === "draft" ? (
                      <Tr key={t.id} muted className="border-l-2 border-l-status-amber border-dashed">
                        <Td className="font-mono text-xs">{t.tripCode}</Td>
                        <Td colSpan={2} className="text-xs italic">
                          Awaiting vehicle &amp; driver assignment
                        </Td>
                        <Td><StatusChip status="draft" /></Td>
                        <Td>—</Td>
                      </Tr>
                    ) : (
                      <Tr key={t.id}>
                        <Td className="font-mono text-xs">{t.tripCode}</Td>
                        <Td>{t.vehicle?.nameModel ?? "—"}</Td>
                        <Td>{t.driver?.name ?? "—"}</Td>
                        <Td><StatusChip status={t.status} /></Td>
                        <Td className="text-muted-foreground">{t.status === "completed" ? "Delivered" : "In transit"}</Td>
                      </Tr>
                    ),
                  )}
                </tbody>
              </>
            )}
          </TableCard>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold">Vehicle Status</h2>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2} strokeWidth={0}>
                    {donutData.map((d) => (
                      <Cell key={d.key} fill={STATUS_COLORS[d.key]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 grid grid-cols-2 gap-1.5">
              {donutData.map((d) => (
                <li key={d.key} className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-sm" style={{ backgroundColor: STATUS_COLORS[d.key] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="ml-auto font-semibold tabular-nums">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}