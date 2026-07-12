import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { exportCsv } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useVehicleCosts, useMonthlyRevenue, useTopCostliest, useVehicles } from "@/lib/useApi";
import { PageHeader, SecondaryButton } from "@/components/transit/PageHeader";
import { KpiCard } from "@/components/transit/KpiCard";
import { money } from "@/components/ui";
import { PendingComponent } from "@/components/transit/PendingComponent";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports & Analytics — TransitOps" },
      { name: "description", content: "Fleet efficiency, utilization, operational cost and vehicle ROI analytics." },
    ],
  }),
  component: ReportsPage,
});



function ReportsPage() {
  const { data: vehicleCosts, isLoading: isCostsLoading } = useVehicleCosts();
  const { data: monthlyRevenue, isLoading: isRevLoading } = useMonthlyRevenue();
  const { data: topCostliest, isLoading: isTopLoading } = useTopCostliest();
  const { data: vehicles, isLoading: isVehiclesLoading } = useVehicles();

  if (isCostsLoading || isRevLoading || isTopLoading || isVehiclesLoading) {
    return <PendingComponent />;
  }

  const vCosts = vehicleCosts ?? [];
  const mRevenue = monthlyRevenue ?? [];
  const costliest = topCostliest ?? [];
  const vList = vehicles ?? [];

  const operationalCost = vCosts.reduce((s, c) => s + (c.operationalCost || 0), 0);
  const totalDistance = vCosts.reduce((s, c) => s + (c.distanceKm || 0), 0);
  const totalLiters = vCosts.reduce((s, c) => s + (c.fuelEfficiency ? c.distanceKm / c.fuelEfficiency : 0), 0);
  const fuelEfficiency = totalLiters > 0 ? (totalDistance / totalLiters).toFixed(1) : "—";
  
  const activeVehicles = vList.filter((v) => v.status !== "retired").length;
  const utilization = Math.round(
    (vList.filter((v) => v.status === "on_trip").length / Math.max(activeVehicles, 1)) * 100,
  );
  
  const annualRevenue = vCosts.reduce((s, c) => s + (c.revenue || 0), 0);
  const totalAcquisition = vList.reduce((s, v) => s + (v.acquisitionCost || 0), 0);
  const roi = totalAcquisition > 0 ? Math.round(((annualRevenue - operationalCost) / totalAcquisition) * 100) : 0;

  const maxCost = Math.max(...costliest.map((c) => c.operationalCost || 0), 1);

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Read-only fleet performance overview"
        action={
          <SecondaryButton onClick={() => exportCsv(mRevenue, "transitops-monthly-revenue.csv")}>
            <Download className="size-4" /> Export CSV
          </SecondaryButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Fuel Efficiency" value={fuelEfficiency === "—" ? "—" : `${fuelEfficiency} km/l`} accent="green" trend="up" context="Fleet average" />
        <KpiCard label="Fleet Utilization" value={`${utilization}%`} accent="blue" trend="up" context="Current active dispatch" />
        <KpiCard label="Operational Cost" value={money(operationalCost)} accent="amber" trend="down" context="fuel + maintenance + expenses" />
        <KpiCard label="Vehicle ROI" value={`${roi}%`} accent="gray" trend="up" context="lifetime">
          <div className="mt-2 text-xs text-slate-500">
            ROI = (Revenue − Operational Cost) / Acquisition Cost
          </div>
        </KpiCard>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Monthly Revenue</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mRevenue} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} stroke="oklch(0.5 0.05 250)" />
                <YAxis 
                  fontSize={12} tickLine={false} axisLine={false} stroke="oklch(0.5 0.05 250)" 
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} 
                />
                <Tooltip 
                  formatter={(v) => [money(Number(v)), "Revenue"]} 
                  labelStyle={{ color: "black", fontWeight: 600 }}
                  itemStyle={{ color: "oklch(0.55 0.16 260)", fontWeight: 500 }}
                />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold">Top Costliest Vehicles</h2>
          <ul className="space-y-4">
            {costliest.length === 0 ? (
               <li className="text-sm text-muted-foreground">No cost data available.</li>
            ) : (
              costliest.map((c, i) => {
                const pct = ((c.operationalCost || 0) / maxCost) * 100;
                // red → amber gradient by rank
                const hue = 25 + i * 12;
                return (
                  <li key={c.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{c.nameModel} <span className="text-slate-400 font-normal">({c.registration})</span></span>
                      <span className="font-semibold tabular-nums">{money(c.operationalCost || 0)}</span>
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
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}