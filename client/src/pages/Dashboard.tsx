import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/apiClient";
import { Card, StatCard, Badge, Spinner, ErrorState, EmptyState, money } from "../components/ui";

interface DashboardData {
  kpis: {
    totalVehicles: number;
    availableVehicles: number;
    onTripVehicles: number;
    inShopVehicles: number;
    totalDrivers: number;
    availableDrivers: number;
    activeTrips: number;
    completedTrips: number;
    totalRevenue: number;
    totalDistanceKm: number;
  };
  tripsByStatus: Record<string, number>;
  recentTrips: {
    id: string;
    tripCode: string;
    source: string;
    destination: string;
    status: string;
    revenue: number;
    plannedDistanceKm: number;
    actualDistanceKm: number | null;
    vehicle: { registrationNumber: string; nameModel: string; type: string; region: string | null } | null;
    driver: { name: string } | null;
  }[];
}

interface Filters {
  types: string[];
  regions: string[];
  statuses: string[];
}

export default function Dashboard() {
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [region, setRegion] = useState("");

  const filterOptions = useQuery<Filters>({
    queryKey: ["dashboard-filters"],
    queryFn: () => api.get<Filters>("/dashboard/filters"),
  });

  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (status) params.set("status", status);
  if (region) params.set("region", region);
  const qs = params.toString();

  const { data, isLoading, isError, error, refetch } = useQuery<DashboardData>({
    queryKey: ["dashboard", type, status, region],
    queryFn: () => api.get<DashboardData>(`/dashboard${qs ? `?${qs}` : ""}`),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="flex gap-2">
          <Select value={type} onChange={setType} placeholder="All types" options={filterOptions.data?.types ?? []} />
          <Select
            value={region}
            onChange={setRegion}
            placeholder="All regions"
            options={filterOptions.data?.regions ?? []}
          />
          <Select
            value={status}
            onChange={setStatus}
            placeholder="All statuses"
            options={filterOptions.data?.statuses ?? []}
          />
          {(type || status || region) && (
            <button
              onClick={() => {
                setType("");
                setStatus("");
                setRegion("");
              }}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-50"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorState message={(error as Error)?.message ?? "Failed to load dashboard"} onRetry={refetch} />
      ) : data ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total Revenue" value={money(data.kpis.totalRevenue)} accent="green" sub="Completed trips" />
            <StatCard label="Active Trips" value={data.kpis.activeTrips} accent="blue" sub="Dispatched now" />
            <StatCard
              label="Fleet Available"
              value={`${data.kpis.availableVehicles}/${data.kpis.totalVehicles}`}
              sub={`${data.kpis.onTripVehicles} on trip · ${data.kpis.inShopVehicles} in shop`}
            />
            <StatCard
              label="Drivers Available"
              value={`${data.kpis.availableDrivers}/${data.kpis.totalDrivers}`}
              accent="amber"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {(["draft", "dispatched", "completed", "cancelled"] as const).map((s) => (
              <Card key={s} className="flex items-center justify-between p-4">
                <Badge status={s} />
                <span className="text-2xl font-bold text-slate-900">{data.tripsByStatus[s] ?? 0}</span>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-700">
              Recent Trips
            </div>
            {data.recentTrips.length === 0 ? (
              <EmptyState message="No trips match these filters." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                      <th className="px-5 py-2 font-medium">Trip</th>
                      <th className="px-5 py-2 font-medium">Route</th>
                      <th className="px-5 py-2 font-medium">Vehicle</th>
                      <th className="px-5 py-2 font-medium">Driver</th>
                      <th className="px-5 py-2 font-medium">Distance</th>
                      <th className="px-5 py-2 font-medium">Revenue</th>
                      <th className="px-5 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentTrips.map((t) => (
                      <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-900">{t.tripCode}</td>
                        <td className="px-5 py-3 text-slate-600">
                          {t.source} → {t.destination}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {t.vehicle ? t.vehicle.registrationNumber : "—"}
                        </td>
                        <td className="px-5 py-3 text-slate-600">{t.driver?.name ?? "—"}</td>
                        <td className="px-5 py-3 text-slate-600">
                          {(t.actualDistanceKm ?? t.plannedDistanceKm).toLocaleString()} km
                        </td>
                        <td className="px-5 py-3 text-slate-600">{money(t.revenue)}</td>
                        <td className="px-5 py-3">
                          <Badge status={t.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 focus:border-blue-500 focus:outline-none"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o} className="capitalize">
          {o.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}
