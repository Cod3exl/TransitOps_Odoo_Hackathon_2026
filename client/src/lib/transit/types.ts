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
  token: string;
  fullName?: string;
}

// ---- Backend API response shapes (different field names from Prisma) ----

export interface ApiVehicle {
  id: string;
  registrationNumber: string;
  nameModel: string;
  type: string;
  maxLoadCapacityKg: number;
  odometerKm: number;
  acquisitionCost: number;
  status: VehicleStatus;
  region: string | null;
}

export interface ApiDriver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  contactNumber: string | null;
  safetyScore: number;
  status: DriverStatus;
}

export interface ApiTrip {
  id: string;
  tripCode: string;
  source: string;
  destination: string;
  vehicleId: string | null;
  driverId: string | null;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  actualDistanceKm: number | null;
  status: TripStatus;
  revenue: number;
  createdAt: string;
  vehicle?: { registrationNumber: string; nameModel: string } | null;
  driver?: { name: string } | null;
}

export interface ApiMaintenanceLog {
  id: string;
  vehicleId: string;
  serviceType: string;
  cost: number;
  serviceDate: string;
  status: "in_shop" | "completed";
}

export interface ApiFuelLog {
  id: string;
  vehicleId: string;
  logDate: string;
  liters: number;
  cost: number;
  vehicle?: { registrationNumber: string; nameModel: string } | null;
}

export interface ApiExpense {
  id: string;
  vehicleId: string;
  tripId: string | null;
  amount: number;
  expenseType: string;
  expenseDate: string;
  status: string;
  vehicle?: { registrationNumber: string; nameModel: string } | null;
  trip?: { tripCode: string } | null;
}

export interface DashboardData {
  kpis: {
    totalVehicles: number;
    availableVehicles: number;
    onTripVehicles: number;
    inShopVehicles: number;
    totalDrivers: number;
    availableDrivers: number;
    activeTrips: number;
    completedTrips: number;
    totalRevenue: number;
    totalDistanceKm: number;
  };
  tripsByStatus: Record<string, number>;
  recentTrips: ApiTrip[];
}