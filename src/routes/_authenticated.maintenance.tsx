import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Wrench } from "lucide-react";
import { useFleet } from "@/lib/transit/store";
import { PageHeader, PrimaryButton, SecondaryButton } from "@/components/transit/PageHeader";
import { StatusChip } from "@/components/transit/StatusChip";
import { TableCard, Th, Td, Tr } from "@/components/transit/DataTable";
import { EmptyState } from "@/components/transit/EmptyState";

export const Route = createFileRoute("/_authenticated/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance — TransitOps" },
      { name: "description", content: "Log service records and track the automatic Available ↔ In Shop status cascade." },
    ],
  }),
  component: MaintenancePage,
});

const inputCls =
  "h-9 w-full rounded-md border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
const labelCls = "mb-1 block text-xs font-medium text-muted-foreground";

function MaintenancePage() {
  const { vehicles, services, addService, closeService } = useFleet();
  const [form, setForm] = useState({
    vehicleId: "",
    serviceType: "",
    cost: "",
    date: "2026-07-12",
  });

  const serviceableVehicles = vehicles.filter(
    (v) => v.status === "available" || v.status === "on_trip",
  );
  const vehicleLabel = (id: string) => {
    const v = vehicles.find((x) => x.id === id);
    return v ? `${v.name} (${v.registration})` : "—";
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.vehicleId || !form.serviceType.trim()) return;
    addService({
      vehicleId: form.vehicleId,
      serviceType: form.serviceType.trim(),
      cost: Number(form.cost) || 0,
      date: form.date,
    });
    setForm({ vehicleId: "", serviceType: "", cost: "", date: "2026-07-12" });
  };

  return (
    <div>
      <PageHeader title="Maintenance" subtitle="Service records and vehicle shop status" />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div>
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold">Log Service Record</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls}>Vehicle</label>
                <select className={inputCls} value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
                  <option value="">Select vehicle…</option>
                  {serviceableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} · {v.registration}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Service Type</label>
                <input className={inputCls} value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} placeholder="Brake pad replacement" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Cost ($)</label>
                  <input type="number" className={inputCls} value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="640" />
                </div>
                <div>
                  <label className={labelCls}>Date</label>
                  <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <PrimaryButton type="submit" disabled={!form.vehicleId || !form.serviceType.trim()} className="w-full">
                Save Service Record
              </PrimaryButton>
            </form>
          </div>

          {/* Status transition diagram */}
          <div className="mt-4 rounded-lg border bg-card p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Automatic status transition
            </p>
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <StatusChip status="available" />
                <ArrowRight className="size-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">record created</span>
                <ArrowRight className="size-3.5 text-muted-foreground" />
                <StatusChip status="in_shop" />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <StatusChip status="in_shop" />
                <ArrowRight className="size-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">record closed</span>
                <ArrowRight className="size-3.5 text-muted-foreground" />
                <StatusChip status="available" />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold">Service Log</h2>
          <TableCard>
            {services.length === 0 ? (
              <tbody>
                <tr>
                  <td>
                    <EmptyState icon={Wrench} title="No service records" description="Log a service record to move a vehicle into the shop." />
                  </td>
                </tr>
              </tbody>
            ) : (
              <>
                <thead>
                  <tr>
                    <Th>Vehicle</Th>
                    <Th>Service</Th>
                    <Th>Date</Th>
                    <Th numeric>Cost</Th>
                    <Th>Status</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <Tr key={s.id}>
                      <Td className="font-medium">{vehicleLabel(s.vehicleId)}</Td>
                      <Td>{s.serviceType}</Td>
                      <Td className="text-muted-foreground">{s.date}</Td>
                      <Td numeric>${s.cost.toLocaleString()}</Td>
                      <Td><StatusChip status={s.status} /></Td>
                      <Td>
                        {s.status === "open" && (
                          <SecondaryButton onClick={() => closeService(s.id)} className="h-7 px-2.5 text-xs">
                            Close & release
                          </SecondaryButton>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </>
            )}
          </TableCard>
        </div>
      </div>
    </div>
  );
}