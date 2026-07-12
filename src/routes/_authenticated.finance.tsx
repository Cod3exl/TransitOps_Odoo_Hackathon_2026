import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useFleet } from "@/lib/transit/store";
import { PageHeader, PrimaryButton, SecondaryButton } from "@/components/transit/PageHeader";
import { StatusChip } from "@/components/transit/StatusChip";
import { TableCard, Th, Td, Tr } from "@/components/transit/DataTable";
import { SlideOver } from "@/components/transit/SlideOver";

export const Route = createFileRoute("/_authenticated/finance")({
  head: () => ({
    meta: [
      { title: "Fuel & Expenses — TransitOps" },
      { name: "description", content: "Fuel logs, trip expenses and total operational cost for the fleet." },
    ],
  }),
  component: FinancePage,
});

const inputCls =
  "h-9 w-full rounded-md border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
const labelCls = "mb-1 block text-xs font-medium text-muted-foreground";

function FinancePage() {
  const { vehicles, trips, fuelLogs, expenses, services, addFuelLog, addExpense } = useFleet();
  const [drawer, setDrawer] = useState<"fuel" | "expense" | null>(null);
  const [fuelForm, setFuelForm] = useState({ vehicleId: "", date: "2026-07-12", liters: "", cost: "" });
  const [expForm, setExpForm] = useState({ tripId: "", vehicleId: "", toll: "", other: "" });

  const vehicleLabel = (id: string) => vehicles.find((v) => v.id === id)?.name ?? "—";

  const totalFuel = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const totalMaintenance = services.reduce((sum, s) => sum + s.cost, 0);
  const totalOperational = totalFuel + totalMaintenance;

  const submitFuel = (e: FormEvent) => {
    e.preventDefault();
    if (!fuelForm.vehicleId) return;
    addFuelLog({
      vehicleId: fuelForm.vehicleId,
      date: fuelForm.date,
      liters: Number(fuelForm.liters) || 0,
      cost: Number(fuelForm.cost) || 0,
    });
    setDrawer(null);
    setFuelForm({ vehicleId: "", date: "2026-07-12", liters: "", cost: "" });
  };

  const submitExpense = (e: FormEvent) => {
    e.preventDefault();
    if (!expForm.vehicleId) return;
    addExpense({
      tripId: expForm.tripId || null,
      vehicleId: expForm.vehicleId,
      toll: Number(expForm.toll) || 0,
      other: Number(expForm.other) || 0,
      maintenanceLinked: 0,
    });
    setDrawer(null);
    setExpForm({ tripId: "", vehicleId: "", toll: "", other: "" });
  };

  return (
    <div>
      <PageHeader
        title="Fuel & Expenses"
        subtitle="Operational cost tracking"
        action={
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setDrawer("fuel")}>
              <Plus className="size-4" /> Log Fuel
            </SecondaryButton>
            <PrimaryButton onClick={() => setDrawer("expense")}>
              <Plus className="size-4" /> Add Expense
            </PrimaryButton>
          </div>
        }
      />

      <div className="space-y-6">
        <div>
          <h2 className="mb-2 text-sm font-semibold">Fuel Logs</h2>
          <TableCard>
            <thead>
              <tr>
                <Th>Vehicle</Th>
                <Th>Date</Th>
                <Th numeric>Liters</Th>
                <Th numeric>Fuel Cost</Th>
              </tr>
            </thead>
            <tbody>
              {fuelLogs.map((f) => (
                <Tr key={f.id}>
                  <Td className="font-medium">{vehicleLabel(f.vehicleId)}</Td>
                  <Td className="text-muted-foreground">{f.date}</Td>
                  <Td numeric>{f.liters.toLocaleString()} L</Td>
                  <Td numeric>${f.cost.toLocaleString()}</Td>
                </Tr>
              ))}
            </tbody>
          </TableCard>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold">Other Expenses</h2>
          <TableCard>
            <thead>
              <tr>
                <Th>Trip</Th>
                <Th>Vehicle</Th>
                <Th numeric>Toll</Th>
                <Th numeric>Other</Th>
                <Th numeric>Maintenance</Th>
                <Th numeric>Total</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <Tr key={e.id}>
                  <Td className="font-mono text-xs">{e.tripId ?? "—"}</Td>
                  <Td className="font-medium">{vehicleLabel(e.vehicleId)}</Td>
                  <Td numeric>${e.toll.toLocaleString()}</Td>
                  <Td numeric>${e.other.toLocaleString()}</Td>
                  <Td numeric>${e.maintenanceLinked.toLocaleString()}</Td>
                  <Td numeric className="font-semibold">
                    ${(e.toll + e.other + e.maintenanceLinked).toLocaleString()}
                  </Td>
                  <Td><StatusChip status={e.status} /></Td>
                </Tr>
              ))}
            </tbody>
          </TableCard>
        </div>

        {/* Totals bar */}
        <div className="rounded-lg border bg-card p-5 shadow-md">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">
                Total Operational Cost = <span className="font-mono">Fuel + Maintenance</span>
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-status-amber">
                ${totalOperational.toLocaleString()}
              </p>
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Fuel</p>
                <p className="font-semibold tabular-nums">${totalFuel.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Maintenance</p>
                <p className="font-semibold tabular-nums">${totalMaintenance.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SlideOver open={drawer === "fuel"} title="Log Fuel" onClose={() => setDrawer(null)}>
        <form onSubmit={submitFuel} className="space-y-4">
          <div>
            <label className={labelCls}>Vehicle</label>
            <select className={inputCls} value={fuelForm.vehicleId} onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}>
              <option value="">Select vehicle…</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.name} · {v.registration}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" className={inputCls} value={fuelForm.date} onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Liters</label>
              <input type="number" className={inputCls} value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} placeholder="380" />
            </div>
            <div>
              <label className={labelCls}>Cost ($)</label>
              <input type="number" className={inputCls} value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} placeholder="646" />
            </div>
          </div>
          <PrimaryButton type="submit" disabled={!fuelForm.vehicleId} className="w-full">
            Save Fuel Log
          </PrimaryButton>
        </form>
      </SlideOver>

      <SlideOver open={drawer === "expense"} title="Add Expense" onClose={() => setDrawer(null)}>
        <form onSubmit={submitExpense} className="space-y-4">
          <div>
            <label className={labelCls}>Trip (optional)</label>
            <select className={inputCls} value={expForm.tripId} onChange={(e) => setExpForm({ ...expForm, tripId: e.target.value })}>
              <option value="">No linked trip</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>{t.id} · {t.source} → {t.destination}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Vehicle</label>
            <select className={inputCls} value={expForm.vehicleId} onChange={(e) => setExpForm({ ...expForm, vehicleId: e.target.value })}>
              <option value="">Select vehicle…</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.name} · {v.registration}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Toll ($)</label>
              <input type="number" className={inputCls} value={expForm.toll} onChange={(e) => setExpForm({ ...expForm, toll: e.target.value })} placeholder="86" />
            </div>
            <div>
              <label className={labelCls}>Other ($)</label>
              <input type="number" className={inputCls} value={expForm.other} onChange={(e) => setExpForm({ ...expForm, other: e.target.value })} placeholder="40" />
            </div>
          </div>
          <PrimaryButton type="submit" disabled={!expForm.vehicleId} className="w-full">
            Save Expense
          </PrimaryButton>
        </form>
      </SlideOver>
    </div>
  );
}