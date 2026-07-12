import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useVehicles, useTrips, useFuelLogs, useExpenses, useAddFuelLog, useAddExpense } from "@/lib/useApi";
import { PageHeader, PrimaryButton, SecondaryButton } from "@/components/transit/PageHeader";
import { StatusChip } from "@/components/transit/StatusChip";
import { TableCard, Th, Td, Tr } from "@/components/transit/DataTable";
import { SlideOver } from "@/components/transit/SlideOver";
import { PendingComponent } from "@/components/transit/PendingComponent";

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

const today = new Date().toISOString().split("T")[0];

function FinancePage() {
  const { data: vehicles = [] } = useVehicles();
  const { data: trips = [] } = useTrips();
  const { data: fuelLogs = [], isLoading: flLoading } = useFuelLogs();
  const { data: expenses = [], isLoading: expLoading } = useExpenses();
  const addFuelMutation = useAddFuelLog();
  const addExpenseMutation = useAddExpense();

  const [drawer, setDrawer] = useState<"fuel" | "expense" | null>(null);
  const [fuelForm, setFuelForm] = useState({ vehicleId: "", date: today, liters: "", cost: "" });
  const [expForm, setExpForm] = useState({ tripId: "", vehicleId: "", amount: "", expenseType: "Toll" });

  const vehicleLabel = (id: string) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? v.name : "—";
  };

  const totalFuel = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalOperational = totalFuel + totalExpenses;

  const submitFuel = (e: FormEvent) => {
    e.preventDefault();
    if (!fuelForm.vehicleId) return;
    addFuelMutation.mutate({
      vehicleId: fuelForm.vehicleId,
      logDate: new Date(fuelForm.date).toISOString(),
      liters: Number(fuelForm.liters) || 0,
      cost: Number(fuelForm.cost) || 0,
    }, {
      onSuccess: () => {
        setDrawer(null);
        setFuelForm({ vehicleId: "", date: today, liters: "", cost: "" });
      },
    });
  };

  const submitExpense = (e: FormEvent) => {
    e.preventDefault();
    if (!expForm.vehicleId) return;
    addExpenseMutation.mutate({
      vehicleId: expForm.vehicleId,
      amount: Number(expForm.amount) || 0,
      expenseType: expForm.expenseType,
      expenseDate: new Date().toISOString(),
      tripId: expForm.tripId || undefined,
    }, {
      onSuccess: () => {
        setDrawer(null);
        setExpForm({ tripId: "", vehicleId: "", amount: "", expenseType: "Toll" });
      },
    });
  };

  if (flLoading || expLoading) return <PendingComponent />;

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
                  <Td className="font-medium">{f.vehicle?.nameModel ?? vehicleLabel(f.vehicleId)}</Td>
                  <Td className="text-muted-foreground">{f.logDate?.split("T")[0] ?? "—"}</Td>
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
                <Th>Type</Th>
                <Th>Date</Th>
                <Th numeric>Amount</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <Tr key={e.id}>
                  <Td className="font-mono text-xs">{e.trip?.tripCode ?? "—"}</Td>
                  <Td className="font-medium">{e.vehicle?.nameModel ?? vehicleLabel(e.vehicleId)}</Td>
                  <Td className="text-muted-foreground">{e.expenseType}</Td>
                  <Td className="text-muted-foreground">{e.expenseDate?.split("T")[0] ?? "—"}</Td>
                  <Td numeric className="font-semibold">${e.amount.toLocaleString()}</Td>
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
                Total Operational Cost = <span className="font-mono">Fuel + Expenses</span>
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
                <p className="text-xs text-muted-foreground">Other Expenses</p>
                <p className="font-semibold tabular-nums">${totalExpenses.toLocaleString()}</p>
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
          <PrimaryButton type="submit" disabled={!fuelForm.vehicleId || addFuelMutation.isPending} className="w-full">
            {addFuelMutation.isPending ? "Saving…" : "Save Fuel Log"}
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
                <option key={t.id} value={t.id}>{t.tripCode} · {t.source} → {t.destination}</option>
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
          <div>
            <label className={labelCls}>Expense Type</label>
            <select className={inputCls} value={expForm.expenseType} onChange={(e) => setExpForm({ ...expForm, expenseType: e.target.value })}>
              <option>Toll</option>
              <option>Maintenance</option>
              <option>Other</option>
              <option>Parking</option>
              <option>Repair</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Amount ($)</label>
            <input type="number" className={inputCls} value={expForm.amount} onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })} placeholder="86" />
          </div>
          <PrimaryButton type="submit" disabled={!expForm.vehicleId || addExpenseMutation.isPending} className="w-full">
            {addExpenseMutation.isPending ? "Saving…" : "Save Expense"}
          </PrimaryButton>
        </form>
      </SlideOver>
    </div>
  );
}