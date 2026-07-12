/**
 * useApi.ts — React Query hooks that talk to the real Express/Prisma backend.
 * Each hook wraps a GET query or a mutation, mapping backend field names
 * (registrationNumber, nameModel, etc.) to the UI's expected shape.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  ApiVehicle,
  ApiDriver,
  ApiTrip,
  ApiMaintenanceLog,
  ApiFuelLog,
  ApiExpense,
  DashboardData,
  Vehicle,
  Driver,
} from "@/lib/transit/types";

// ──────────────────────────────────────────────
// Field-name adapters: backend → UI types
// ──────────────────────────────────────────────

export function adaptVehicle(v: ApiVehicle): Vehicle {
  return {
    id: v.id,
    registration: v.registrationNumber,
    name: v.nameModel,
    type: v.type as Vehicle["type"],
    maxCapacityKg: v.maxLoadCapacityKg,
    odometerKm: v.odometerKm,
    acquisitionCost: v.acquisitionCost,
    status: v.status,
    region: (v.region ?? "North") as Vehicle["region"],
  };
}

export function adaptDriver(d: ApiDriver): Driver {
  return {
    id: d.id,
    name: d.name,
    licenseNumber: d.licenseNumber,
    licenseCategory: d.licenseCategory,
    licenseExpiry: d.licenseExpiry,
    contact: d.contactNumber ?? "",
    tripCompliance: 100, // not stored on backend yet
    safetyScore: d.safetyScore,
    status: d.status,
  };
}

// ──────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────

export function useDashboard(params?: { type?: string; status?: string; region?: string }) {
  const qs = new URLSearchParams();
  if (params?.type) qs.set("type", params.type);
  if (params?.status) qs.set("status", params.status);
  if (params?.region) qs.set("region", params.region);
  const query = qs.toString() ? `?${qs}` : "";
  return useQuery<DashboardData>({
    queryKey: ["dashboard", params],
    queryFn: () => api.get<DashboardData>(`/dashboard${query}`),
  });
}

// ──────────────────────────────────────────────
// Vehicles
// ──────────────────────────────────────────────

export function useVehicles() {
  return useQuery<Vehicle[]>({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const raw = await api.get<ApiVehicle[]>("/vehicles");
      return raw.map(adaptVehicle);
    },
  });
}

export function useAddVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      registrationNumber: string;
      nameModel: string;
      type: string;
      maxLoadCapacityKg: number;
      odometerKm: number;
      acquisitionCost: number;
      region: string;
    }) => api.post<ApiVehicle>("/vehicles", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<ApiVehicle> & { id: string }) =>
      api.patch<ApiVehicle>(`/vehicles/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ──────────────────────────────────────────────
// Drivers
// ──────────────────────────────────────────────

export function useDrivers() {
  return useQuery<Driver[]>({
    queryKey: ["drivers"],
    queryFn: async () => {
      const raw = await api.get<ApiDriver[]>("/drivers");
      return raw.map(adaptDriver);
    },
  });
}

export function useAddDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      licenseNumber: string;
      licenseCategory: string;
      licenseExpiry: string;
      contactNumber?: string;
      safetyScore?: number;
    }) => api.post<ApiDriver>("/drivers", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  });
}

export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<ApiDriver> & { id: string }) =>
      api.patch<ApiDriver>(`/drivers/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drivers"] }),
  });
}

// ──────────────────────────────────────────────
// Trips
// ──────────────────────────────────────────────

export function useTrips() {
  return useQuery<ApiTrip[]>({
    queryKey: ["trips"],
    queryFn: () => api.get<ApiTrip[]>("/trips"),
  });
}

export function useDispatchTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      source: string;
      destination: string;
      vehicleId: string;
      driverId: string;
      cargoWeightKg: number;
      plannedDistanceKm: number;
      revenue: number;
    }) => api.post<ApiTrip>("/trips", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["drivers"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCompleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; actualDistanceKm: number; fuelConsumedL: number }) =>
      api.post<ApiTrip>(`/trips/${id}/complete`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["drivers"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useCancelTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<ApiTrip>(`/trips/${id}/cancel`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trips"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["drivers"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ──────────────────────────────────────────────
// Maintenance
// ──────────────────────────────────────────────

export function useMaintenance() {
  return useQuery<ApiMaintenanceLog[]>({
    queryKey: ["maintenance"],
    queryFn: () => api.get<ApiMaintenanceLog[]>("/maintenance"),
  });
}

export function useAddMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { vehicleId: string; serviceType: string; cost: number; serviceDate: string }) =>
      api.post<ApiMaintenanceLog>("/maintenance", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useCloseMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<ApiMaintenanceLog>(`/maintenance/${id}/close`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance"] });
      qc.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

// ──────────────────────────────────────────────
// Fuel Logs
// ──────────────────────────────────────────────

export function useFuelLogs() {
  return useQuery<ApiFuelLog[]>({
    queryKey: ["fuelLogs"],
    queryFn: () => api.get<ApiFuelLog[]>("/fuel-logs"),
  });
}

export function useAddFuelLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { vehicleId: string; liters: number; cost: number; logDate: string }) =>
      api.post<ApiFuelLog>("/fuel-logs", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fuelLogs"] }),
  });
}

// ──────────────────────────────────────────────
// Expenses
// ──────────────────────────────────────────────

export function useExpenses() {
  return useQuery<ApiExpense[]>({
    queryKey: ["expenses"],
    queryFn: () => api.get<ApiExpense[]>("/expenses"),
  });
}

export function useAddExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      vehicleId: string;
      amount: number;
      expenseType: string;
      expenseDate: string;
      tripId?: string;
      notes?: string;
    }) => api.post<ApiExpense>("/expenses", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expenses"] }),
  });
}

// ──────────────────────────────────────────────
// Reports
// ──────────────────────────────────────────────

export function useVehicleCosts() {
  return useQuery({
    queryKey: ["reports", "vehicle-costs"],
    queryFn: () => api.get<any[]>("/reports/vehicle-costs"),
  });
}

export function useMonthlyRevenue() {
  return useQuery({
    queryKey: ["reports", "monthly-revenue"],
    queryFn: () => api.get<{ month: string; revenue: number; trips: number }[]>("/reports/monthly-revenue"),
  });
}

export function useTopCostliest(limit = 5) {
  return useQuery({
    queryKey: ["reports", "top-costliest", limit],
    queryFn: () => api.get<any[]>(`/reports/top-costliest?limit=${limit}`),
  });
}

// ──────────────────────────────────────────────
// Settings
// ──────────────────────────────────────────────

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<{ depotName: string; currency: string; distanceUnit: string; rbacConfig: any }>("/settings"),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { depotName: string; currency: string; distanceUnit: string; rbacConfig?: any }) =>
      api.patch<{ depotName: string; currency: string; distanceUnit: string; rbacConfig: any }>("/settings", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
