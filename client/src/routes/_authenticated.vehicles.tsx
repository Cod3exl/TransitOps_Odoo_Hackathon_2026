import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Plus, Truck, Download } from "lucide-react";
import { exportCsv } from "@/lib/utils";
import { useVehicles, useAddVehicle } from "@/lib/useApi";
import type { Vehicle } from "@/lib/transit/types";
import { PageHeader, PrimaryButton } from "@/components/transit/PageHeader";
import { StatusChip } from "@/components/transit/StatusChip";
import { money } from "@/components/ui";
import { TableCard, Th, Td, Tr } from "@/components/transit/DataTable";
import { RuleNote } from "@/components/transit/RuleNote";
import { SlideOver } from "@/components/transit/SlideOver";
import { EmptyState } from "@/components/transit/EmptyState";
import { PendingComponent } from "@/components/transit/PendingComponent";

export const Route = createFileRoute("/_authenticated/vehicles")({
  head: () => ({
    meta: [
      { title: "Vehicle Registry — TransitOps" },
      { name: "description", content: "Full fleet registry with capacity, odometer, cost and live status." },
    ],
  }),
  component: VehiclesPage,
});

const inputCls =
  "h-9 w-full rounded-md border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
const labelCls = "mb-1 block text-xs font-medium text-muted-foreground";

function VehiclesPage() {
  const { data: vehicles = [], isLoading, isError } = useVehicles();
  const addVehicleMutation = useAddVehicle();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("none");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [form, setForm] = useState({
    registration: "",
    name: "",
    type: "Truck" as Vehicle["type"],
    maxCapacityKg: "",
    odometerKm: "",
    cost: "",
    region: "North" as Vehicle["region"],
  });

  const duplicate = vehicles.some(
    (v) => v.registration.toLowerCase() === form.registration.trim().toLowerCase(),
  );

  const filtered = useMemo(() => {
    let result = vehicles.filter(
      (v) =>
        v.registration.toLowerCase().includes(search.toLowerCase()) &&
        (typeFilter === "all" || v.type === typeFilter) &&
        (statusFilter === "all" || v.status === statusFilter),
    );

    if (sortBy === "capacityDesc") {
      result = result.sort((a, b) => b.maxCapacityKg - a.maxCapacityKg);
    } else if (sortBy === "odometerDesc") {
      result = result.sort((a, b) => b.odometerKm - a.odometerKm);
    } else if (sortBy === "costDesc") {
      result = result.sort((a, b) => b.acquisitionCost - a.acquisitionCost);
    }

    return result;
  }, [vehicles, search, typeFilter, statusFilter, sortBy]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (duplicate || !form.registration.trim() || !form.name.trim()) return;
    addVehicleMutation.mutate({
      registrationNumber: form.registration.trim().toUpperCase(),
      nameModel: form.name.trim(),
      type: form.type,
      maxLoadCapacityKg: Number(form.maxCapacityKg) || 0,
      odometerKm: Number(form.odometerKm) || 0,
      acquisitionCost: Number(form.cost) || 0,
      region: form.region,
    }, {
      onSuccess: () => {
        setDrawerOpen(false);
        setForm({ registration: "", name: "", type: "Truck", maxCapacityKg: "", odometerKm: "", cost: "", region: "North" });
      },
    });
  };

  if (isLoading) return <PendingComponent />;
  if (isError) return <div className="text-destructive p-4">Failed to load vehicles. Is the server running?</div>;


  const select =
    "h-9 rounded-md border bg-card px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div>
      <PageHeader
        title="Vehicle Registry"
        subtitle={`${vehicles.length} vehicles in fleet`}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search registration no…"
        action={
          <div className="flex flex-wrap items-center gap-2">
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
            <select className={select} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="none">Sort by</option>
              <option value="capacityDesc">Capacity (High to Low)</option>
              <option value="odometerDesc">Odometer (High to Low)</option>
              <option value="costDesc">Cost (High to Low)</option>
            </select>
            <PrimaryButton onClick={() => setDrawerOpen(true)}>
              <Plus className="size-4" /> Add Vehicle
            </PrimaryButton>
            <button
              onClick={() => exportCsv(filtered, "vehicles.csv", [
                { key: "registration", label: "Registration" },
                { key: "name", label: "Name" },
                { key: "type", label: "Type" },
                { key: "maxCapacityKg", label: "Max Capacity (kg)" },
                { key: "odometerKm", label: "Odometer (km)" },
                { key: "status", label: "Status" },
              ])}
              title="Export CSV"
              className="flex h-9 items-center justify-center rounded-md border bg-card px-3 hover:bg-secondary text-sm font-medium transition-colors"
            >
              <Download className="size-4" />
            </button>
          </div>
        }
      />

      <div className="mb-2">
        <RuleNote>
          Vehicles with <strong>Retired</strong> or <strong>In Shop</strong> status are automatically
          excluded from trip dispatch.
        </RuleNote>
      </div>

      <TableCard>
        {filtered.length === 0 ? (
          <tbody>
            <tr>
              <td>
                <EmptyState icon={Truck} title="No vehicles match" description="Try clearing the search or filters." />
              </td>
            </tr>
          </tbody>
        ) : (
          <>
            <thead>
              <tr>
                <Th>Registration</Th>
                <Th>Name / Model</Th>
                <Th>Type</Th>
                <Th numeric>Max Capacity</Th>
                <Th numeric>Odometer</Th>
                <Th numeric>Acquisition Cost</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <Tr key={v.id}>
                  <Td className="font-mono text-xs font-medium">{v.registration}</Td>
                  <Td>{v.name}</Td>
                  <Td className="text-muted-foreground">{v.type}</Td>
                  <Td numeric>{v.maxCapacityKg.toLocaleString()} kg</Td>
                  <Td numeric>{v.odometerKm.toLocaleString()} km</Td>
                  <Td numeric>{money(v.acquisitionCost)}</Td>
                  <Td><StatusChip status={v.status} /></Td>
                </Tr>
              ))}
            </tbody>
          </>
        )}
      </TableCard>

      <SlideOver open={drawerOpen} title="Add Vehicle" onClose={() => setDrawerOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Registration No.</label>
            <input
              className={`${inputCls} font-mono ${form.registration && duplicate ? "border-status-red focus:ring-status-red" : ""}`}
              value={form.registration}
              onChange={(e) => setForm({ ...form, registration: e.target.value })}
              placeholder="TR-0000-XX"
            />
            {form.registration && duplicate && (
              <p className="mt-1 flex items-center gap-1 text-xs text-status-red">
                <AlertCircle className="size-3.5" /> This registration number already exists — it must be unique.
              </p>
            )}
          </div>
          <div>
            <label className={labelCls}>Name / Model</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Volvo FH16" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Type</label>
              <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Vehicle["type"] })}>
                <option>Truck</option>
                <option>Van</option>
                <option>Bus</option>
                <option>Pickup</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Region</label>
              <select className={inputCls} value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value as Vehicle["region"] })}>
                <option>North</option>
                <option>South</option>
                <option>East</option>
                <option>West</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Max Capacity (kg)</label>
            <input type="number" className={inputCls} value={form.maxCapacityKg} onChange={(e) => setForm({ ...form, maxCapacityKg: e.target.value })} placeholder="18000" />
          </div>
          <div>
            <label className={labelCls}>Odometer (km)</label>
            <input type="number" className={inputCls} value={form.odometerKm} onChange={(e) => setForm({ ...form, odometerKm: e.target.value })} placeholder="0" />
          </div>
          <div>
            <label className={labelCls}>Acquisition Cost</label>
            <input type="number" className={inputCls} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="45000" />
          </div>
          <PrimaryButton type="submit" disabled={duplicate || !form.registration.trim() || !form.name.trim()} className="w-full">
            Save Vehicle
          </PrimaryButton>
        </form>
      </SlideOver>
    </div>
  );
}