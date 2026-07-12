import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Eye, Minus } from "lucide-react";
import { PageHeader, PrimaryButton } from "@/components/transit/PageHeader";
import { ROLE_ACCESS, ROLE_LABELS, type Access } from "@/lib/transit/rbac";
import type { Role } from "@/lib/transit/types";
import { useSettings, useUpdateSettings } from "@/lib/useApi";
import { PendingComponent } from "@/components/transit/PendingComponent";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings & Access Control — TransitOps" },
      { name: "description", content: "General settings and the role-based access control matrix." },
    ],
  }),
  component: SettingsPage,
});

const inputCls =
  "h-9 w-full rounded-md border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
const labelCls = "mb-1 block text-xs font-medium text-muted-foreground";

const SECTIONS: { key: string; label: string }[] = [
  { key: "/vehicles", label: "Fleet" },
  { key: "/drivers", label: "Drivers" },
  { key: "/trips", label: "Trips" },
  { key: "/finance", label: "Fuel / Expenses" },
  { key: "/reports", label: "Analytics" },
];

const ROLES: Role[] = ["fleet_manager", "dispatcher", "safety_officer", "financial_analyst"];

function AccessIcon({ access }: { access: Access }) {
  if (access === "full")
    return (
      <span className="inline-flex items-center gap-1 text-status-green" title="Full access">
        <Check className="size-4" strokeWidth={3} />
      </span>
    );
  if (access === "view")
    return (
      <span className="inline-flex items-center gap-1 text-status-gray" title="View only">
        <Eye className="size-4" />
      </span>
    );
  return (
    <span className="text-muted-foreground/40" title="No access">
      <Minus className="size-4" />
    </span>
  );
}

function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [general, setGeneral] = useState({
    depot: "",
    currency: "",
    unit: "",
  });
  const [rbac, setRbac] = useState<Record<Role, Record<string, Access>>>(ROLE_ACCESS);

  const { data: settingsData, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  useEffect(() => {
    if (settingsData) {
      setGeneral({
        depot: settingsData.depotName,
        currency: settingsData.currency,
        unit: settingsData.distanceUnit,
      });
      if (settingsData.rbacConfig) {
        setRbac(settingsData.rbacConfig);
      }
    }
  }, [settingsData]);

  const handleSave = () => {
    updateSettings.mutate({
      depotName: general.depot,
      currency: general.currency,
      distanceUnit: general.unit,
      rbacConfig: rbac,
    }, {
      onSuccess: () => {
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2000);
      }
    });
  };

  if (isLoading) return <PendingComponent />;

  return (
    <div>
      <PageHeader title="Settings" subtitle="General configuration and access control" />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">General</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Depot Name</label>
              <input className={inputCls} value={general.depot} onChange={(e) => setGeneral({ ...general, depot: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <select className={inputCls} value={general.currency} onChange={(e) => setGeneral({ ...general, currency: e.target.value })}>
                <option>USD ($)</option>
                <option>EUR (€)</option>
                <option>GBP (£)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Distance Unit</label>
              <select className={inputCls} value={general.unit} onChange={(e) => setGeneral({ ...general, unit: e.target.value })}>
                <option>Kilometers</option>
                <option>Miles</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Role-Based Access Control</h2>
          <p className="mt-0.5 mb-4 text-xs text-muted-foreground">
            Permission levels per role and module.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Role
                  </th>
                  {SECTIONS.map((s) => (
                    <th key={s.key} className="px-4 py-3 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {s.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROLES.map((role) => (
                  <tr key={role} className="border-b last:border-b-0">
                    <td className="px-4 py-3.5 font-medium">{ROLE_LABELS[role]}</td>
                    {SECTIONS.map((s) => (
                      <td key={s.key} className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => {
                            const current = rbac[role][s.key];
                            const next: Access = current === "full" ? "view" : current === "view" ? "none" : "full";
                            setRbac((prev) => ({
                              ...prev,
                              [role]: { ...prev[role], [s.key]: next },
                            }));
                          }}
                          className="hover:opacity-75 transition-opacity"
                        >
                          <AccessIcon access={rbac[role][s.key]} />
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-3.5 text-status-green" strokeWidth={3} /> Full access
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-3.5 text-status-gray" /> View only
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Minus className="size-3.5 text-muted-foreground/40" /> No access
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        {saved && <span className="text-xs text-status-green">Changes saved</span>}
        <PrimaryButton onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? "Saving..." : "Save changes"}
        </PrimaryButton>
      </div>
    </div>
  );
}