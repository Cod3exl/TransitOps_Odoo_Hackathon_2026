import type {
  Vehicle,
  Driver,
  Trip,
  ServiceRecord,
  FuelLog,
  ExpenseRecord,
} from "./types";

export const SEED_VEHICLES: Vehicle[] = [
  { id: "v1", registration: "TR-4821-KL", name: "Volvo FH16", type: "Truck", maxCapacityKg: 18000, odometerKm: 182450, acquisitionCost: 148000, status: "on_trip", region: "North" },
  { id: "v2", registration: "TR-1093-MN", name: "Mercedes Actros", type: "Truck", maxCapacityKg: 16500, odometerKm: 96210, acquisitionCost: 132500, status: "available", region: "North" },
  { id: "v3", registration: "VN-2284-PQ", name: "Ford Transit L3", type: "Van", maxCapacityKg: 1400, odometerKm: 64890, acquisitionCost: 42000, status: "available", region: "East" },
  { id: "v4", registration: "VN-7719-RS", name: "Renault Master", type: "Van", maxCapacityKg: 1600, odometerKm: 118330, acquisitionCost: 39500, status: "in_shop", region: "East" },
  { id: "v5", registration: "TR-5540-XY", name: "Scania R500", type: "Truck", maxCapacityKg: 19000, odometerKm: 240115, acquisitionCost: 155000, status: "on_trip", region: "South" },
  { id: "v6", registration: "BS-0912-AB", name: "MAN Lion's Coach", type: "Bus", maxCapacityKg: 4500, odometerKm: 310400, acquisitionCost: 210000, status: "available", region: "West" },
  { id: "v7", registration: "PK-3376-CD", name: "Toyota Hilux", type: "Pickup", maxCapacityKg: 1000, odometerKm: 45120, acquisitionCost: 31000, status: "available", region: "South" },
  { id: "v8", registration: "TR-8864-EF", name: "DAF XF 480", type: "Truck", maxCapacityKg: 17800, odometerKm: 152780, acquisitionCost: 141000, status: "in_shop", region: "North" },
  { id: "v9", registration: "VN-6205-GH", name: "Iveco Daily", type: "Van", maxCapacityKg: 1900, odometerKm: 88940, acquisitionCost: 44800, status: "available", region: "West" },
  { id: "v10", registration: "TR-2251-IJ", name: "Volvo FM 420", type: "Truck", maxCapacityKg: 15000, odometerKm: 398200, acquisitionCost: 118000, status: "retired", region: "South" },
  { id: "v11", registration: "PK-9047-KL", name: "Ford Ranger", type: "Pickup", maxCapacityKg: 1100, odometerKm: 30215, acquisitionCost: 34500, status: "on_trip", region: "East" },
  { id: "v12", registration: "BS-4433-MN", name: "Mercedes Tourismo", type: "Bus", maxCapacityKg: 5000, odometerKm: 264080, acquisitionCost: 198000, status: "available", region: "West" },
];

export const SEED_DRIVERS: Driver[] = [
  { id: "d1", name: "Marcus Reid", licenseNumber: "DL-88213-C", licenseCategory: "CE", licenseExpiry: "2027-03-14", contact: "+1 555-0132", tripCompliance: 98, safetyScore: 94, status: "on_trip" },
  { id: "d2", name: "Elena Vasquez", licenseNumber: "DL-40967-C", licenseCategory: "CE", licenseExpiry: "2026-11-02", contact: "+1 555-0177", tripCompliance: 96, safetyScore: 91, status: "available" },
  { id: "d3", name: "Tomas Berg", licenseNumber: "DL-71354-B", licenseCategory: "B", licenseExpiry: "2026-01-19", contact: "+1 555-0119", tripCompliance: 89, safetyScore: 82, status: "available" },
  { id: "d4", name: "Aisha Okafor", licenseNumber: "DL-29841-D", licenseCategory: "D", licenseExpiry: "2028-06-30", contact: "+1 555-0165", tripCompliance: 99, safetyScore: 97, status: "available" },
  { id: "d5", name: "Piotr Nowak", licenseNumber: "DL-55672-C", licenseCategory: "C", licenseExpiry: "2025-09-21", contact: "+1 555-0148", tripCompliance: 84, safetyScore: 76, status: "off_duty" },
  { id: "d6", name: "Sofia Marino", licenseNumber: "DL-83420-CE", licenseCategory: "CE", licenseExpiry: "2027-08-11", contact: "+1 555-0190", tripCompliance: 95, safetyScore: 90, status: "on_trip" },
  { id: "d7", name: "James Otieno", licenseNumber: "DL-11758-C", licenseCategory: "C", licenseExpiry: "2025-12-04", contact: "+1 555-0123", tripCompliance: 71, safetyScore: 63, status: "suspended" },
  { id: "d8", name: "Hannah Lindqvist", licenseNumber: "DL-66203-B", licenseCategory: "B", licenseExpiry: "2027-01-28", contact: "+1 555-0158", tripCompliance: 93, safetyScore: 88, status: "available" },
  { id: "d9", name: "Rafael Sousa", licenseNumber: "DL-97315-D", licenseCategory: "D", licenseExpiry: "2026-05-16", contact: "+1 555-0104", tripCompliance: 90, safetyScore: 85, status: "off_duty" },
  { id: "d10", name: "Chen Wei", licenseNumber: "DL-30488-CE", licenseCategory: "CE", licenseExpiry: "2028-02-09", contact: "+1 555-0181", tripCompliance: 97, safetyScore: 93, status: "on_trip" },
];

export const SEED_TRIPS: Trip[] = [
  { id: "TR-1042", source: "Rotterdam Depot", destination: "Hamburg Hub", vehicleId: "v1", driverId: "d1", cargoWeightKg: 14200, plannedDistanceKm: 480, status: "in_progress", eta: "Today 17:40" },
  { id: "TR-1041", source: "Antwerp Port", destination: "Lyon South", vehicleId: "v5", driverId: "d6", cargoWeightKg: 16800, plannedDistanceKm: 792, status: "dispatched", eta: "Tomorrow 09:15" },
  { id: "TR-1040", source: "Lille Depot", destination: "Brussels Ring", vehicleId: "v11", driverId: "d10", cargoWeightKg: 850, plannedDistanceKm: 118, status: "in_progress", eta: "Today 15:05" },
  { id: "TR-1039", source: "Ghent Yard", destination: "Paris North", vehicleId: null, driverId: null, cargoWeightKg: 1200, plannedDistanceKm: 305, status: "draft", eta: "—" },
  { id: "TR-1038", source: "Utrecht Hub", destination: "Frankfurt West", vehicleId: "v2", driverId: "d2", cargoWeightKg: 15100, plannedDistanceKm: 440, status: "completed", eta: "Delivered 11:20" },
  { id: "TR-1037", source: "Bremen Port", destination: "Prague East", vehicleId: "v8", driverId: "d3", cargoWeightKg: 9400, plannedDistanceKm: 615, status: "cancelled", eta: "—", note: "Vehicle sent to shop" },
  { id: "TR-1036", source: "Munich Depot", destination: "Vienna Hub", vehicleId: "v6", driverId: "d4", cargoWeightKg: 3200, plannedDistanceKm: 435, status: "completed", eta: "Delivered Fri 16:48" },
  { id: "TR-1035", source: "Berlin Yard", destination: "Warsaw Central", vehicleId: "v3", driverId: "d8", cargoWeightKg: 1100, plannedDistanceKm: 573, status: "completed", eta: "Delivered Thu 19:02" },
  { id: "TR-1034", source: "Zurich Depot", destination: "Milan South", vehicleId: null, driverId: null, cargoWeightKg: 2400, plannedDistanceKm: 280, status: "draft", eta: "—" },
  { id: "TR-1033", source: "Copenhagen Hub", destination: "Gothenburg Port", vehicleId: "v9", driverId: "d9", cargoWeightKg: 1700, plannedDistanceKm: 312, status: "completed", eta: "Delivered Wed 14:30" },
];

export const SEED_SERVICES: ServiceRecord[] = [
  { id: "s1", vehicleId: "v4", serviceType: "Brake pad replacement", cost: 640, date: "2026-07-10", status: "open" },
  { id: "s2", vehicleId: "v8", serviceType: "Gearbox overhaul", cost: 3850, date: "2026-07-08", status: "open" },
  { id: "s3", vehicleId: "v1", serviceType: "Routine service B", cost: 920, date: "2026-06-27", status: "closed" },
  { id: "s4", vehicleId: "v6", serviceType: "Tire rotation + alignment", cost: 480, date: "2026-06-21", status: "closed" },
  { id: "s5", vehicleId: "v5", serviceType: "Turbo inspection", cost: 1250, date: "2026-06-12", status: "closed" },
  { id: "s6", vehicleId: "v2", serviceType: "Oil + filters", cost: 310, date: "2026-05-30", status: "closed" },
];

export const SEED_FUEL: FuelLog[] = [
  { id: "f1", vehicleId: "v1", date: "2026-07-11", liters: 410, cost: 697 },
  { id: "f2", vehicleId: "v5", date: "2026-07-10", liters: 465, cost: 790 },
  { id: "f3", vehicleId: "v2", date: "2026-07-09", liters: 380, cost: 646 },
  { id: "f4", vehicleId: "v11", date: "2026-07-09", liters: 62, cost: 105 },
  { id: "f5", vehicleId: "v6", date: "2026-07-07", liters: 290, cost: 493 },
  { id: "f6", vehicleId: "v3", date: "2026-07-05", liters: 58, cost: 99 },
  { id: "f7", vehicleId: "v9", date: "2026-07-03", liters: 71, cost: 121 },
  { id: "f8", vehicleId: "v12", date: "2026-07-01", liters: 305, cost: 519 },
];

export const SEED_EXPENSES: ExpenseRecord[] = [
  { id: "e1", tripId: "TR-1042", vehicleId: "v1", toll: 86, other: 40, maintenanceLinked: 0, status: "approved" },
  { id: "e2", tripId: "TR-1041", vehicleId: "v5", toll: 132, other: 25, maintenanceLinked: 0, status: "pending" },
  { id: "e3", tripId: "TR-1038", vehicleId: "v2", toll: 74, other: 0, maintenanceLinked: 310, status: "approved" },
  { id: "e4", tripId: "TR-1036", vehicleId: "v6", toll: 95, other: 60, maintenanceLinked: 480, status: "approved" },
  { id: "e5", tripId: null, vehicleId: "v4", toll: 0, other: 120, maintenanceLinked: 640, status: "pending" },
  { id: "e6", tripId: "TR-1035", vehicleId: "v3", toll: 48, other: 15, maintenanceLinked: 0, status: "approved" },
];

export const MONTHLY_REVENUE = [
  { month: "Aug", revenue: 84200 },
  { month: "Sep", revenue: 91500 },
  { month: "Oct", revenue: 88300 },
  { month: "Nov", revenue: 97800 },
  { month: "Dec", revenue: 105400 },
  { month: "Jan", revenue: 92100 },
  { month: "Feb", revenue: 96700 },
  { month: "Mar", revenue: 103900 },
  { month: "Apr", revenue: 110200 },
  { month: "May", revenue: 108600 },
  { month: "Jun", revenue: 116400 },
  { month: "Jul", revenue: 61200 },
];

export const COSTLIEST_VEHICLES = [
  { vehicleId: "v8", name: "DAF XF 480", registration: "TR-8864-EF", cost: 6120 },
  { vehicleId: "v5", name: "Scania R500", registration: "TR-5540-XY", cost: 4870 },
  { vehicleId: "v1", name: "Volvo FH16", registration: "TR-4821-KL", cost: 4310 },
  { vehicleId: "v6", name: "MAN Lion's Coach", registration: "BS-0912-AB", cost: 3540 },
  { vehicleId: "v4", name: "Renault Master", registration: "VN-7719-RS", cost: 2260 },
];