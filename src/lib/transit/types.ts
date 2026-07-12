export type VehicleStatus = "available" | "on_trip" | "in_shop" | "retired";
export type DriverStatus = "available" | "on_trip" | "off_duty" | "suspended";
export type TripStatus = "draft" | "dispatched" | "in_progress" | "completed" | "cancelled";
export type ServiceStatus = "open" | "closed";

export interface Vehicle {
  id: string;
  registration: string;
  name: string;
  type: "Truck" | "Van" | "Bus" | "Pickup";
  maxCapacityKg: number;
  odometerKm: number;
  acquisitionCost: number;
  status: VehicleStatus;
  region: "North" | "South" | "East" | "West";
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string; // ISO date
  contact: string;
  tripCompliance: number; // %
  safetyScore: number; // 0-100
  status: DriverStatus;
}

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string | null;
  driverId: string | null;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  status: TripStatus;
  eta: string;
  note?: string;
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  serviceType: string;
  cost: number;
  date: string;
  status: ServiceStatus;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string;
  liters: number;
  cost: number;
}

export interface ExpenseRecord {
  id: string;
  tripId: string | null;
  vehicleId: string;
  toll: number;
  other: number;
  maintenanceLinked: number;
  status: "pending" | "approved";
}

export type Role = "fleet_manager" | "dispatcher" | "safety_officer" | "financial_analyst";

export interface Session {
  email: string;
  role: Role;
}