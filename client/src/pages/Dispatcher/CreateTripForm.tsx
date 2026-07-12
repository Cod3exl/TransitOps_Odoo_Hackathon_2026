import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../lib/apiClient";
import { Card } from "../../components/ui";
import type { AvailableDriver, AvailableVehicle } from "./types";

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";
const labelCls = "block text-sm font-medium text-slate-700 mb-1";

interface FormValues {
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeightKg: string;
  plannedDistanceKm: string;
}

export function CreateTripForm() {
  const qc = useQueryClient();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const { register, handleSubmit, reset, formState } = useForm<FormValues>();

  const vehicles = useQuery<AvailableVehicle[]>({
    queryKey: ["dispatch-meta-vehicles"],
    queryFn: () => api.get<AvailableVehicle[]>("/trips/meta/vehicles"),
  });

  const drivers = useQuery<AvailableDriver[]>({
    queryKey: ["dispatch-meta-drivers"],
    queryFn: () => api.get<AvailableDriver[]>("/trips/meta/drivers"),
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      api.post("/trips", {
        source: data.source,
        destination: data.destination,
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        cargoWeightKg: Number(data.cargoWeightKg),
        plannedDistanceKm: Number(data.plannedDistanceKm),
      }),
    onSuccess: () => {
      setMsg({ ok: true, text: "Draft trip created." });
      reset();
      qc.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: (e) => setMsg({ ok: false, text: e instanceof ApiError ? e.message : "Failed to create trip" }),
  });

  return (
    <Card className="p-5">
      <div className="mb-4 text-sm font-semibold text-slate-700">Create Trip</div>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Source</label>
            <input {...register("source", { required: true })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Destination</label>
            <input {...register("destination", { required: true })} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Vehicle</label>
            <select {...register("vehicleId", { required: "Vehicle is required" })} className={inputCls}>
              <option value="">Select vehicle…</option>
              {(vehicles.data ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registrationNumber} — {v.nameModel} ({v.maxLoadCapacityKg}kg)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Driver</label>
            <select {...register("driverId", { required: "Driver is required" })} className={inputCls}>
              <option value="">Select driver…</option>
              {(drivers.data ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.licenseNumber})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Cargo weight (kg)</label>
            <input
              type="number"
              step="0.01"
              {...register("cargoWeightKg", { required: true })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Planned distance (km)</label>
            <input
              type="number"
              step="0.01"
              {...register("plannedDistanceKm", { required: true })}
              className={inputCls}
            />
          </div>
        </div>

        {msg && (
          <div
            className={`rounded-md px-3 py-2 text-sm ${
              msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            {msg.text}
          </div>
        )}

        <button
          disabled={formState.isSubmitting || mutation.isPending}
          className="w-full rounded-md bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {mutation.isPending ? "Creating…" : "Create draft trip"}
        </button>
      </form>
    </Card>
  );
}
