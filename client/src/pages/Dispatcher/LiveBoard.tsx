import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../../lib/apiClient";
import { Card, Badge, Spinner, ErrorState, EmptyState } from "../../components/ui";
import type { Trip, TripStatus } from "./types";

const COLUMNS: { status: TripStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "dispatched", label: "Dispatched" },
  { status: "completed", label: "Completed" },
  { status: "cancelled", label: "Cancelled" },
];

export function LiveBoard() {
  const [banner, setBanner] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [actualDistanceKm, setActualDistanceKm] = useState("");
  const [fuelConsumedL, setFuelConsumedL] = useState("");
  const qc = useQueryClient();

  const { data: trips = [], isLoading, isError, refetch } = useQuery<Trip[]>({
    queryKey: ["trips"],
    queryFn: () => api.get<Trip[]>("/trips"),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["trips"] });
  const showError = (e: unknown) => setBanner(e instanceof ApiError ? e.message : "Something went wrong");

  const dispatchMutation = useMutation({
    mutationFn: (id: string) => api.post(`/trips/${id}/dispatch`),
    onSuccess: () => {
      setBanner(null);
      invalidate();
    },
    onError: showError,
  });

  const completeMutation = useMutation({
    mutationFn: (vars: { id: string; actualDistanceKm: number; fuelConsumedL: number }) =>
      api.post(`/trips/${vars.id}/complete`, {
        actualDistanceKm: vars.actualDistanceKm,
        fuelConsumedL: vars.fuelConsumedL,
      }),
    onSuccess: () => {
      setBanner(null);
      setCompletingId(null);
      setActualDistanceKm("");
      setFuelConsumedL("");
      invalidate();
    },
    onError: showError,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.post(`/trips/${id}/cancel`),
    onSuccess: () => {
      setBanner(null);
      invalidate();
    },
    onError: showError,
  });

  if (isLoading) return <Spinner label="Loading trips…" />;
  if (isError) return <ErrorState message="Failed to load trips" onRetry={refetch} />;

  return (
    <div className="space-y-3">
      {banner && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{banner}</div>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {COLUMNS.map((col) => {
          const columnTrips = trips.filter((t) => t.status === col.status);
          return (
            <Card key={col.status}>
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <Badge status={col.status} />
                <span className="text-sm font-semibold text-slate-900">{columnTrips.length}</span>
              </div>
              <div className="space-y-2 p-3">
                {columnTrips.length === 0 && <EmptyState message="No trips" />}
                {columnTrips.map((trip) => (
                  <div key={trip.id} className="space-y-1.5 rounded-md border border-slate-200 p-2.5 text-xs">
                    <div className="font-medium text-slate-900">{trip.tripCode}</div>
                    <div className="text-slate-600">
                      {trip.source} → {trip.destination}
                    </div>
                    <div className="text-slate-400">
                      {trip.vehicle?.registrationNumber ?? "—"} / {trip.driver?.name ?? "—"} · {trip.cargoWeightKg}kg
                    </div>

                    {trip.status === "draft" && (
                      <button
                        disabled={dispatchMutation.isPending}
                        onClick={() => dispatchMutation.mutate(trip.id)}
                        className="w-full rounded-md bg-slate-900 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                      >
                        Dispatch
                      </button>
                    )}

                    {trip.status === "dispatched" && completingId !== trip.id && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setCompletingId(trip.id)}
                          className="flex-1 rounded-md bg-slate-900 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                        >
                          Complete
                        </button>
                        <button
                          disabled={cancelMutation.isPending}
                          onClick={() => cancelMutation.mutate(trip.id)}
                          className="flex-1 rounded-md border border-slate-300 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {trip.status === "dispatched" && completingId === trip.id && (
                      <div className="space-y-1.5">
                        <input
                          placeholder="Actual distance (km)"
                          value={actualDistanceKm}
                          onChange={(e) => setActualDistanceKm(e.target.value)}
                          className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        />
                        <input
                          placeholder="Fuel consumed (L)"
                          value={fuelConsumedL}
                          onChange={(e) => setFuelConsumedL(e.target.value)}
                          className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs"
                        />
                        <button
                          disabled={completeMutation.isPending}
                          onClick={() =>
                            completeMutation.mutate({
                              id: trip.id,
                              actualDistanceKm: Number(actualDistanceKm),
                              fuelConsumedL: Number(fuelConsumedL),
                            })
                          }
                          className="w-full rounded-md bg-slate-900 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                        >
                          Confirm completion
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
