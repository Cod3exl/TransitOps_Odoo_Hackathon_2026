export type TripStatus = "draft" | "dispatched" | "completed" | "cancelled";

export interface Trip {
  id: string;
  tripCode: string;
  source: string;
  destination: string;
  vehicleId: string | null;
  driverId: string | null;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  actualDistanceKm: number | null;
  fuelConsumedL: number | null;
  revenue: number;
  status: TripStatus;
  vehicle?: { registrationNumber: string; nameModel: string } | null;
  driver?: { name: string } | null;
}

export interface AvailableVehicle {
  id: string;
  registrationNumber: string;
  nameModel: string;
  maxLoadCapacityKg: number;
  status: string;
}

export interface AvailableDriver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: string;
}
