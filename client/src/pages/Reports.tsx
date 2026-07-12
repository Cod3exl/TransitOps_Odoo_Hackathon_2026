import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "../lib/apiClient";
import { Card, StatCard, Spinner, ErrorState, EmptyState, money } from "../components/ui";

interface VehicleCost {
  id: string;
  registrationNumber: string;
  nameModel: string;
  type: string;
  fuelCost: number;
  maintenanceCost: number;
  expenseCost: number;
  operationalCost: number;
  revenue: number;
  distanceKm: number;
  fuelEfficiency: number;
  roi: number;
}
interface MonthlyRevenue {
  month: string;
  revenue: number;
  trips: number;
}
interface TopCostliest {
  registrationNumber: string;
  operationalCost: number;
}

export default function Reports() {
  const vehicleCosts = useQuery<VehicleCost[]>({
    queryKey: ["vehicle-costs"],
    queryFn: () => api.get<VehicleCost[]>("/reports/vehicle-costs"),
  });
  const monthly = useQuery<MonthlyRevenue[]>({
    queryKey: ["monthly-revenue"],
    queryFn: () => api.get<MonthlyRevenue[]>("/reports/monthly-revenue"),
  });
  const topCostliest = useQuery<TopCostliest[]>({
    queryKey: ["top-costliest"],
    queryFn: () => api.get<TopCostliest[]>("/reports/top-costliest?limit=5"),
  });

  if (vehicleCosts.isLoading) return <Spinner label="Building reports…" />;
  if (vehicleCosts.isError)
    return <ErrorState message="Failed to load reports" onRetry={vehicleCosts.refetch} />;

  const rows = vehicleCosts.data ?? [];
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalOpCost = rows.reduce((s, r) => s + r.operationalCost, 0);
  const avgEfficiency = rows.length
    ? rows.reduce((s, r) => s + r.fuelEfficiency, 0) / rows.filter((r) => r.fuelEfficiency > 0).length || 0
    : 0;
  const bestRoi = rows.reduce<VehicleCost | null>((best, r) => (!best || r.roi > best.roi ? r : best), null);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Reports &amp; Analytics</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={money(totalRevenue)} accent="green" />
        <StatCard label="Operational Cost" value={money(totalOpCost)} accent="red" />
        <StatCard label="Net Margin" value={money(totalRevenue - totalOpCost)} accent="blue" />
        <StatCard
          label="Avg Fuel Efficiency"
          value={`${avgEfficiency.toFixed(1)} km/L`}
          sub={bestRoi ? `Best ROI: ${bestRoi.registrationNumber}` : undefined}
          accent="amber"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Monthly Revenue</h2>
          {(monthly.data ?? []).length === 0 ? (
            <EmptyState message="No completed trips yet." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthly.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip formatter={(v: number) => money(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Top 5 Costliest Vehicles</h2>
          {(topCostliest.data ?? []).length === 0 ? (
            <EmptyState message="No cost data yet." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topCostliest.data} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis
                  type="category"
                  dataKey="registrationNumber"
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                  width={80}
                />
                <Tooltip formatter={(v: number) => money(v)} />
                <Bar dataKey="operationalCost" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-700">
          Per-Vehicle Cost &amp; ROI
        </div>
        {rows.length === 0 ? (
          <EmptyState message="No vehicles yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                  <th className="px-5 py-2 font-medium">Vehicle</th>
                  <th className="px-5 py-2 font-medium">Revenue</th>
                  <th className="px-5 py-2 font-medium">Op. Cost</th>
                  <th className="px-5 py-2 font-medium">Fuel Eff.</th>
                  <th className="px-5 py-2 font-medium">ROI</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">
                      {r.registrationNumber}
                      <span className="ml-2 text-xs text-slate-400">{r.nameModel}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{money(r.revenue)}</td>
                    <td className="px-5 py-3 text-slate-600">{money(r.operationalCost)}</td>
                    <td className="px-5 py-3 text-slate-600">{r.fuelEfficiency.toFixed(1)} km/L</td>
                    <td className={`px-5 py-3 font-semibold ${r.roi >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {(r.roi * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
