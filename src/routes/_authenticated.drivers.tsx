import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFleet } from "@/lib/transit/store";
import type { DriverStatus } from "@/lib/transit/types";
import { PageHeader, PrimaryButton } from "@/components/transit/PageHeader";
import { StatusChip } from "@/components/transit/StatusChip";
import { TableCard, Th, Td, Tr } from "@/components/transit/DataTable";
import { RuleNote } from "@/components/transit/RuleNote";
import { SlideOver } from "@/components/transit/SlideOver";
import { EmptyState } from "@/components/transit/EmptyState";

export const Route = createFileRoute("/_authenticated/drivers")({
  head: () => ({
    meta: [
      { title: "Drivers & Safety — TransitOps" },
      { name: "description", content: "Driver roster with license compliance, expiry tracking and safety scores." },
    ],
  }),
  component: DriversPage,
});

const FILTERS: { key: DriverStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "available", label: "Available" },
  { key: "on_trip", label: "On Trip" },
  { key: "off_duty", label: "Off Duty" },
  { key: "suspended", label: "Suspended" },
];

const inputCls =
  "h-9 w-full rounded-md border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
const labelCls = "mb-1 block text-xs font-medium text-muted-foreground";

const TODAY = "2026-07-12";

function SafetyScore({ score }: { score: number }) {
  const tone =
    score >= 90 ? "bg-status-green" : score >= 70 ? "bg-status-amber" : "bg-status-red";
  const text =
    score >= 90 ? "text-status-green" : score >= 70 ? "text-status-amber" : "text-status-red";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn("text-xs font-semibold tabular-nums", text)}>{score}</span>
    </div>
  );
}

function DriversPage() {
  const { drivers, addDriver } = useFleet();
  const [filter, setFilter] = useState<DriverStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    licenseNumber: "",
    licenseCategory: "C",
    licenseExpiry: "",
    contact: "",
  });

  const filtered = useMemo(
    () =>
      drivers.filter(
        (d) =>
          (filter === "all" || d.status === filter) &&
          d.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [drivers, filter, search],
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.licenseNumber.trim()) return;
    addDriver({
      name: form.name.trim(),
      licenseNumber: form.licenseNumber.trim(),
      licenseCategory: form.licenseCategory,
      licenseExpiry: form.licenseExpiry || "2028-01-01",
      contact: form.contact.trim() || "—",
      tripCompliance: 100,
      safetyScore: 100,
    });
    setDrawerOpen(false);
    setForm({ name: "", licenseNumber: "", licenseCategory: "C", licenseExpiry: "", contact: "" });
  };

  return (
    <div>
      <PageHeader
        title="Drivers & Safety"
        subtitle={`${drivers.length} drivers on roster`}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search drivers…"
        action={
          <PrimaryButton onClick={() => setDrawerOpen(true)}>
            <Plus className="size-4" /> Add Driver
          </PrimaryButton>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === f.key
                ? "border-primary bg-accent text-accent-foreground"
                : "bg-card text-muted-foreground hover:bg-secondary",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mb-2">
        <RuleNote>
          Expired license or <strong>Suspended</strong> status blocks trip assignment.
        </RuleNote>
      </div>

      <TableCard>
        {filtered.length === 0 ? (
          <tbody>
            <tr>
              <td>
                <EmptyState icon={Users} title="No drivers match" description="Try another filter or search term." />
              </td>
            </tr>
          </tbody>
        ) : (
          <>
            <thead>
              <tr>
                <Th>Driver</Th>
                <Th>License No.</Th>
                <Th>Category</Th>
                <Th>License Expiry</Th>
                <Th>Contact</Th>
                <Th numeric>Compliance</Th>
                <Th>Safety Score</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const expired = d.licenseExpiry < TODAY;
                return (
                  <Tr key={d.id}>
                    <Td className="font-medium">{d.name}</Td>
                    <Td className="font-mono text-xs">{d.licenseNumber}</Td>
                    <Td className="text-muted-foreground">{d.licenseCategory}</Td>
                    <Td
                      className={cn(
                        expired && "font-semibold text-status-red",
                      )}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {expired && <AlertTriangle className="size-3.5" />}
                        {d.licenseExpiry}
                        {expired && <span className="text-[10px] font-bold uppercase">Expired</span>}
                      </span>
                    </Td>
                    <Td className="text-muted-foreground">{d.contact}</Td>
                    <Td numeric>{d.tripCompliance}%</Td>
                    <Td><SafetyScore score={d.safetyScore} /></Td>
                    <Td><StatusChip status={d.status} /></Td>
                  </Tr>
                );
              })}
            </tbody>
          </>
        )}
      </TableCard>

      <SlideOver open={drawerOpen} title="Add Driver" onClose={() => setDrawerOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Full Name</label>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Driver" />
          </div>
          <div>
            <label className={labelCls}>License Number</label>
            <input className={`${inputCls} font-mono`} value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} placeholder="DL-00000-C" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Category</label>
              <select className={inputCls} value={form.licenseCategory} onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })}>
                <option>B</option>
                <option>C</option>
                <option>CE</option>
                <option>D</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>License Expiry</label>
              <input type="date" className={inputCls} value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Contact</label>
            <input className={inputCls} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="+1 555-0000" />
          </div>
          <PrimaryButton type="submit" disabled={!form.name.trim() || !form.licenseNumber.trim()} className="w-full">
            Save Driver
          </PrimaryButton>
        </form>
      </SlideOver>
    </div>
  );
}