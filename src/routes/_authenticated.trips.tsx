import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check, OctagonX, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFleet } from "@/lib/transit/store";
import { PageHeader, PrimaryButton, SecondaryButton } from "@/components/transit/PageHeader";
import { StatusChip } from "@/components/transit/StatusChip";
import { RuleNote } from "@/components/transit/RuleNote";

export const Route = createFileRoute("/_authenticated/trips")({
  head: () => ({
    meta: [
      { title: "Trip Dispatcher — TransitOps" },
      { name: "description", content: "Create, dispatch and track trips with capacity validation and a live board." },
    ],
  }),
  component: TripsPage,
});

const inputCls =
  "h-9 w-full rounded-md border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
const labelCls = "mb-1 block text-xs font-medium text-muted-foreground";

const TODAY = "2026-07-12";

const STAGES = ["Draft", "Dispatched", "Completed", "Cancelled"] as const;

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-1.5">
      {STAGES.map((stage, i) => (
        <li key={stage} className="flex items-center gap-1.5">
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
              i < current && "border-status-green/40 bg-status-green-soft text-status-green",
              i === current && "border-primary bg-accent text-accent-foreground",
              i > current && "bg-card text-muted-foreground",
            )}
          >
            {i < current && <Check className="size-3" />}
            {stage}
          </span>
          {i < STAGES.length - 1 && <ArrowRight className="size-3.5 text-muted-foreground/50" />}
        </li>
      ))}
    </ol>
  );
}

function TripsPage() {
  const { vehicles, drivers, trips, dispatchTrip, completeTrip, cancelTrip } = useFleet();

  const [form, setForm] = useState({
    source: "",
    destination: "",
    vehicleId: "",
    driverId: "",
    cargoWeightKg: "",
    plannedDistanceKm: "",
  });

  const availableVehicles = vehicles.filter((v) => v.status === "available");
  const availableDrivers = drivers.filter(
    (d) => d.status === "available" && d.licenseExpiry >= TODAY,
  );

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);
  const cargo = Number(form.cargoWeightKg) || 0;
  const overCapacity =
    !!selectedVehicle && cargo > 0 && cargo > selectedVehicle.maxCapacityKg;
  const excess = selectedVehicle ? cargo - selectedVehicle.maxCapacityKg : 0;

  const canDispatch =
    form.source.trim() &&
    form.destination.trim() &&
    form.vehicleId &&
    form.driverId &&
    cargo > 0 &&
    !overCapacity;

  const liveTrips = useMemo(
    () =>
      trips.filter((t) =>
        ["draft", "dispatched", "in_progress", "cancelled"].includes(t.status),
      ),
    [trips],
  );

  const vehicleLabel = (id: string | null) => vehicles.find((v) => v.id === id)?.name;
  const driverLabel = (id: string | null) => drivers.find((d) => d.id === id)?.name;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canDispatch) return;
    dispatchTrip({
      source: form.source.trim(),
      destination: form.destination.trim(),
      vehicleId: form.vehicleId,
      driverId: form.driverId,
      cargoWeightKg: cargo,
      plannedDistanceKm: Number(form.plannedDistanceKm) || 0,
    });
    setForm({ source: "", destination: "", vehicleId: "", driverId: "", cargoWeightKg: "", plannedDistanceKm: "" });
  };

  return (
    <div>
      <PageHeader title="Trip Dispatcher" subtitle="Create trips and monitor the live board" />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
        {/* Create Trip */}
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="mb-4">
            <Stepper current={0} />
          </div>
          <h2 className="mb-3 text-sm font-semibold">Create Trip</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Source</label>
                <input className={inputCls} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Rotterdam Depot" />
              </div>
              <div>
                <label className={labelCls}>Destination</label>
                <input className={inputCls} value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="Hamburg Hub" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Vehicle (available only)</label>
                <select className={inputCls} value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                  <option value="">Select vehicle…</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} · {v.maxCapacityKg.toLocaleString()} kg max
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Driver (available only)</label>
                <select className={inputCls} value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })}>
                  <option value="">Select driver…</option>
                  {availableDrivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Cargo Weight (kg)</label>
                <input
                  type="number"
                  className={cn(inputCls, overCapacity && "border-status-red focus:ring-status-red")}
                  value={form.cargoWeightKg}
                  onChange={(e) => setForm({ ...form, cargoWeightKg: e.target.value })}
                  placeholder="12000"
                />
              </div>
              <div>
                <label className={labelCls}>Planned Distance (km)</label>
                <input type="number" className={inputCls} value={form.plannedDistanceKm} onChange={(e) => setForm({ ...form, plannedDistanceKm: e.target.value })} placeholder="480" />
              </div>
            </div>

            {overCapacity && selectedVehicle && (
              <div className="rounded-md border border-status-red bg-status-red-soft px-3 py-2.5 text-sm text-status-red">
                <p className="font-semibold">Capacity exceeded — dispatch blocked</p>
                <p className="mt-0.5 text-xs">
                  Vehicle capacity {selectedVehicle.maxCapacityKg.toLocaleString()} kg / Cargo
                  weight {cargo.toLocaleString()} kg — exceeded by {excess.toLocaleString()} kg.
                </p>
              </div>
            )}

            <PrimaryButton type="submit" disabled={!canDispatch} className="w-full">
              <Send className="size-4" /> Dispatch Trip
            </PrimaryButton>
          </form>
        </div>

        {/* Live Board */}
        <div>
          <h2 className="mb-2 text-sm font-semibold">Live Board</h2>
          <div className="space-y-2.5">
            {liveTrips.map((t) => {
              const cancelled = t.status === "cancelled";
              return (
                <div
                  key={t.id}
                  className={cn(
                    "rounded-lg border bg-card p-3.5 shadow-sm",
                    cancelled && "opacity-60",
                    t.status === "draft" && "border-dashed",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold">{t.id}</span>
                    <StatusChip status={t.status} />
                  </div>
                  <p className={cn("mt-1.5 flex items-center gap-1.5 text-sm font-medium", cancelled && "line-through")}>
                    {t.source} <ArrowRight className="size-3.5 text-muted-foreground" /> {t.destination}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t.vehicleId
                      ? `${vehicleLabel(t.vehicleId)} · ${driverLabel(t.driverId) ?? "Unassigned"}`
                      : "Unassigned"}
                    {t.eta !== "—" && !cancelled && ` · ETA ${t.eta}`}
                  </p>
                  {cancelled && t.note && (
                    <p className="mt-1 text-xs text-status-red/80">{t.note}</p>
                  )}
                  {(t.status === "dispatched" || t.status === "in_progress") && (
                    <div className="mt-2.5 flex gap-2">
                      <SecondaryButton onClick={() => completeTrip(t.id)} className="h-7 px-2.5 text-xs">
                        <Check className="size-3.5 text-status-green" /> Complete
                      </SecondaryButton>
                      <SecondaryButton onClick={() => cancelTrip(t.id)} className="h-7 border-status-red/40 px-2.5 text-xs text-status-red">
                        <OctagonX className="size-3.5" /> Cancel
                      </SecondaryButton>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 border-t pt-3">
        <RuleNote>
          Completing a trip automatically returns its vehicle and driver to{" "}
          <strong>Available</strong>.
        </RuleNote>
      </div>
    </div>
  );
}