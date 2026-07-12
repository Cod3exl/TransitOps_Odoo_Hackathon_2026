import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/apiClient";
import { Card, Spinner, ErrorState, EmptyState, money } from "../components/ui";

interface VehicleLite {
  id: string;
  registrationNumber: string;
  nameModel: string;
}
interface FuelLog {
  id: string;
  liters: number;
  cost: number;
  logDate: string;
  vehicle: { registrationNumber: string; nameModel: string } | null;
  trip: { tripCode: string } | null;
}
interface Expense {
  id: string;
  expenseType: string;
  amount: number;
  expenseDate: string;
  notes: string | null;
  vehicle: { registrationNumber: string; nameModel: string } | null;
  trip: { tripCode: string } | null;
}
interface OpCostRow {
  id: string;
  registrationNumber: string;
  nameModel: string;
  fuelCost: number;
  otherCost: number;
  totalLiters: number;
  operationalCost: number;
}

export default function FuelExpenses() {
  const [tab, setTab] = useState<"fuel" | "expense">("fuel");

  // Vehicles come from Member B's route; tolerate it being absent.
  const vehicles = useQuery<VehicleLite[]>({
    queryKey: ["vehicles-lite"],
    queryFn: () => api.get<VehicleLite[]>("/vehicles"),
    retry: false,
  });

  const opCost = useQuery<OpCostRow[]>({
    queryKey: ["operational-cost"],
    queryFn: () => api.get<OpCostRow[]>("/operational-cost"),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Fuel &amp; Expenses</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex gap-2">
            <TabButton active={tab === "fuel"} onClick={() => setTab("fuel")}>
              ⛽ Log Fuel
            </TabButton>
            <TabButton active={tab === "expense"} onClick={() => setTab("expense")}>
              💳 Log Expense
            </TabButton>
          </div>
          {vehicles.isError ? (
            <div className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Vehicle list unavailable (Member B's <code>/vehicles</code> route not mounted yet). You can still
              paste a vehicle ID manually.
            </div>
          ) : null}
          {tab === "fuel" ? (
            <FuelForm vehicles={vehicles.data ?? []} />
          ) : (
            <ExpenseForm vehicles={vehicles.data ?? []} />
          )}
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-700">
            Operational Cost by Vehicle
          </div>
          {opCost.isLoading ? (
            <Spinner />
          ) : opCost.isError ? (
            <ErrorState message="Failed to load costs" onRetry={opCost.refetch} />
          ) : (opCost.data ?? []).length === 0 ? (
            <EmptyState message="No cost data yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                    <th className="px-5 py-2 font-medium">Vehicle</th>
                    <th className="px-5 py-2 font-medium">Fuel</th>
                    <th className="px-5 py-2 font-medium">Other</th>
                    <th className="px-5 py-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {opCost.data!.map((r) => (
                    <tr key={r.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-2.5 font-medium text-slate-900">{r.registrationNumber}</td>
                      <td className="px-5 py-2.5 text-slate-600">{money(r.fuelCost)}</td>
                      <td className="px-5 py-2.5 text-slate-600">{money(r.otherCost)}</td>
                      <td className="px-5 py-2.5 font-semibold text-slate-900">{money(r.operationalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <FuelLogTable />
        <ExpenseTable />
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-sm font-medium ${
        active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function VehicleField({ vehicles, register, name }: { vehicles: VehicleLite[]; register: any; name: string }) {
  if (vehicles.length > 0) {
    return (
      <select
        {...register(name, { required: "Vehicle is required" })}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">Select vehicle…</option>
        {vehicles.map((v) => (
          <option key={v.id} value={v.id}>
            {v.registrationNumber} — {v.nameModel}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      {...register(name, { required: "Vehicle ID is required" })}
      placeholder="Vehicle UUID"
      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
    />
  );
}

const inputCls = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";
const labelCls = "block text-sm font-medium text-slate-700 mb-1";

function FuelForm({ vehicles }: { vehicles: VehicleLite[] }) {
  const qc = useQueryClient();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const { register, handleSubmit, reset, formState } = useForm();

  const mutation = useMutation({
    mutationFn: (data: any) =>
      api.post("/fuel-logs", {
        vehicleId: data.vehicleId,
        liters: Number(data.liters),
        cost: Number(data.cost),
      }),
    onSuccess: () => {
      setMsg({ ok: true, text: "Fuel log added." });
      reset();
      qc.invalidateQueries({ queryKey: ["fuel-logs"] });
      qc.invalidateQueries({ queryKey: ["operational-cost"] });
    },
    onError: (e) => setMsg({ ok: false, text: e instanceof ApiError ? e.message : "Failed to save" }),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3">
      <div>
        <label className={labelCls}>Vehicle</label>
        <VehicleField vehicles={vehicles} register={register} name="vehicleId" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Liters</label>
          <input type="number" step="0.01" {...register("liters", { required: true })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Cost ($)</label>
          <input type="number" step="0.01" {...register("cost", { required: true })} className={inputCls} />
        </div>
      </div>
      {msg && (
        <div className={`rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}
      <button
        disabled={formState.isSubmitting || mutation.isPending}
        className="w-full rounded-md bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {mutation.isPending ? "Saving…" : "Add Fuel Log"}
      </button>
    </form>
  );
}

function ExpenseForm({ vehicles }: { vehicles: VehicleLite[] }) {
  const qc = useQueryClient();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const { register, handleSubmit, reset, formState } = useForm();

  const mutation = useMutation({
    mutationFn: (data: any) =>
      api.post("/expenses", {
        vehicleId: data.vehicleId,
        expenseType: data.expenseType,
        amount: Number(data.amount),
        notes: data.notes || null,
      }),
    onSuccess: () => {
      setMsg({ ok: true, text: "Expense added." });
      reset();
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["operational-cost"] });
    },
    onError: (e) => setMsg({ ok: false, text: e instanceof ApiError ? e.message : "Failed to save" }),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3">
      <div>
        <label className={labelCls}>Vehicle</label>
        <VehicleField vehicles={vehicles} register={register} name="vehicleId" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Type</label>
          <select {...register("expenseType", { required: true })} className={inputCls}>
            <option value="">Select…</option>
            <option value="toll">Toll</option>
            <option value="parking">Parking</option>
            <option value="fine">Fine</option>
            <option value="insurance">Insurance</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Amount ($)</label>
          <input type="number" step="0.01" {...register("amount", { required: true })} className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Notes</label>
        <input {...register("notes")} className={inputCls} />
      </div>
      {msg && (
        <div className={`rounded-md px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}
      <button
        disabled={formState.isSubmitting || mutation.isPending}
        className="w-full rounded-md bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
      >
        {mutation.isPending ? "Saving…" : "Add Expense"}
      </button>
    </form>
  );
}

function FuelLogTable() {
  const { data, isLoading, isError, refetch } = useQuery<FuelLog[]>({
    queryKey: ["fuel-logs"],
    queryFn: () => api.get<FuelLog[]>("/fuel-logs"),
  });
  return (
    <Card>
      <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-700">Fuel Logs</div>
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorState message="Failed to load fuel logs" onRetry={refetch} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState message="No fuel logs yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                <th className="px-5 py-2 font-medium">Vehicle</th>
                <th className="px-5 py-2 font-medium">Liters</th>
                <th className="px-5 py-2 font-medium">Cost</th>
                <th className="px-5 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {data!.map((f) => (
                <tr key={f.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-2.5 text-slate-900">{f.vehicle?.registrationNumber ?? "—"}</td>
                  <td className="px-5 py-2.5 text-slate-600">{f.liters} L</td>
                  <td className="px-5 py-2.5 text-slate-600">{money(f.cost)}</td>
                  <td className="px-5 py-2.5 text-slate-400">{new Date(f.logDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function ExpenseTable() {
  const { data, isLoading, isError, refetch } = useQuery<Expense[]>({
    queryKey: ["expenses"],
    queryFn: () => api.get<Expense[]>("/expenses"),
  });
  return (
    <Card>
      <div className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-700">Expenses</div>
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorState message="Failed to load expenses" onRetry={refetch} />
      ) : (data ?? []).length === 0 ? (
        <EmptyState message="No expenses yet." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                <th className="px-5 py-2 font-medium">Vehicle</th>
                <th className="px-5 py-2 font-medium">Type</th>
                <th className="px-5 py-2 font-medium">Amount</th>
                <th className="px-5 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {data!.map((e) => (
                <tr key={e.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-2.5 text-slate-900">{e.vehicle?.registrationNumber ?? "—"}</td>
                  <td className="px-5 py-2.5 capitalize text-slate-600">{e.expenseType}</td>
                  <td className="px-5 py-2.5 text-slate-600">{money(e.amount)}</td>
                  <td className="px-5 py-2.5 text-slate-400">{new Date(e.expenseDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
