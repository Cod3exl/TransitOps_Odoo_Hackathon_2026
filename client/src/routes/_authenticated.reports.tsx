import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useFleet } from "@/lib/transit/store";
import { MONTHLY_REVENUE, COSTLIEST_VEHICLES } from "@/lib/transit/seed";
import { PageHeader, SecondaryButton } from "@/components/transit/PageHeader";
import { KpiCard } from "@/components/transit/KpiCard";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Analytics — TransitOps" },
      { name: "description", content: "Fleet efficiency, utilization, operational cost and vehicle ROI analytics." },
    ],
  }),
  component: ReportsPage,
});

function exportCsv() {
  const rows = [
    ["Month", "Revenue"],
    ...MONTHLY_REVENUE.map((m) => [m.month, String(m.revenue)]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "transitops-monthly-revenue.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function ReportsPage() {
  const { vehicles, fuelLogs, services } = useFleet();

  const totalFuelCost = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalMaintenance = services.reduce((s, x) => s + x.cost, 0);
  const operationalCost = totalFuelCost + totalMaintenance;
  const totalLiters = fuelLogs.reduce((s, f) => s + f.liters, 0);
  const fuelEfficiency = totalLiters ? (18450 / totalLiters).toFixed(1) : "—";
  const activeVehicles = vehicles.filter((v) => v.status !== "retired").length;
  const utilization = Math.round(
    (vehicles.filter((v) => v.status === "on_trip").length / Math.max(activeVehicles, 1)) * 100,
  );
  const annualRevenue = MONTHLY_REVENUE.reduce((s, m) => s + m.revenue, 0);
  const totalAcquisition = vehicles.reduce((s, v) => s + v.acquisitionCost, 0);
  const roi = Math.round(((annualRevenue - operationalCost) / totalAcquisition) * 100);

  const maxCost = Math.max(...COSTLIEST_VEHICLES.map((c) => c.cost));

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Read-only fleet performance overview"
        action={
          <SecondaryButton onClick={exportCsv}>
            <Download className="size-4" /> Export CSV
          </SecondaryButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Fuel Efficiency" value={`${fuelEfficiency} km/l`} accent="green" trend="up" context="+0.4 vs last month" />
        <KpiCard label="Fleet Utilization" value={`${utilization}%`} accent="blue" trend="up" context="+6 pts vs last month" />
        <KpiCard label="Operational Cost" value={`$${operationalCost.toLocaleString()}`} accent="amber" trend="down" context="fuel + maintenance, MTD" />
        <KpiCard label="Vehicle ROI" value={`${roi}%`} accent="gray" trend="up" context="trailing 12 months">
          <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
            ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost
          </p>
        </KpiCard>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Monthly Revenue</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_REVENUE} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Top Costliest Vehicles</h2>
          <ul className="space-y-4">
            {COSTLIEST_VEHICLES.map((c, i) => {
              const pct = (c.cost / maxCost) * 100;
              // red → amber gradient by rank
              const hue = 25 + i * 12;
              return (
                <li key={c.vehicleId}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium">
                      {c.name}{" "}
                      <span className="font-mono text-xs text-muted-foreground">{c.registration}</span>
                    </span>
                    <span className="font-semibold tabular-nums">${c.cost.toLocaleString()}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: `oklch(0.6 0.16 ${hue})`,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}