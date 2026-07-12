import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

export const dashboardRouter = Router();

// GET /dashboard — KPI cards + recent trips, with optional filters.
// Query params: type (vehicle type), status (trip status), region (vehicle region)
dashboardRouter.get("/", authenticate, async (req, res) => {
  const { type, status, region } = req.query as {
    type?: string;
    status?: string;
    region?: string;
  };

  // Vehicle filter (type / region) drives fleet + trip scoping.
  const vehicleWhere: Prisma.VehicleWhereInput = {};
  if (type) vehicleWhere.type = type;
  if (region) vehicleWhere.region = region;
  const hasVehicleFilter = Boolean(type || region);

  const tripWhere: Prisma.TripWhereInput = {};
  if (status) tripWhere.status = status as Prisma.TripWhereInput["status"];
  if (hasVehicleFilter) tripWhere.vehicle = { is: vehicleWhere };

  const [
    vehicleCount,
    availableVehicles,
    onTripVehicles,
    inShopVehicles,
    driverCount,
    availableDrivers,
    tripStatusGroups,
    completedTrips,
    recentTrips,
  ] = await Promise.all([
    prisma.vehicle.count({ where: vehicleWhere }),
    prisma.vehicle.count({ where: { ...vehicleWhere, status: "available" } }),
    prisma.vehicle.count({ where: { ...vehicleWhere, status: "on_trip" } }),
    prisma.vehicle.count({ where: { ...vehicleWhere, status: "in_shop" } }),
    prisma.driver.count(),
    prisma.driver.count({ where: { status: "available" } }),
    prisma.trip.groupBy({ by: ["status"], where: tripWhere, _count: { _all: true } }),
    prisma.trip.findMany({ where: { ...tripWhere, status: "completed" } }),
    prisma.trip.findMany({
      where: tripWhere,
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        vehicle: { select: { registrationNumber: true, nameModel: true, type: true, region: true } },
        driver: { select: { name: true } },
      },
    }),
  ]);

  const tripsByStatus = Object.fromEntries(
    tripStatusGroups.map((g) => [g.status, g._count._all]),
  ) as Record<string, number>;

  const totalRevenue = completedTrips.reduce((s, t) => s + t.revenue, 0);
  const totalDistance = completedTrips.reduce((s, t) => s + (t.actualDistanceKm ?? 0), 0);

  res.json({
    kpis: {
      totalVehicles: vehicleCount,
      availableVehicles,
      onTripVehicles,
      inShopVehicles,
      totalDrivers: driverCount,
      availableDrivers,
      activeTrips: tripsByStatus["dispatched"] ?? 0,
      completedTrips: tripsByStatus["completed"] ?? 0,
      totalRevenue,
      totalDistanceKm: totalDistance,
    },
    tripsByStatus: {
      draft: tripsByStatus["draft"] ?? 0,
      dispatched: tripsByStatus["dispatched"] ?? 0,
      completed: tripsByStatus["completed"] ?? 0,
      cancelled: tripsByStatus["cancelled"] ?? 0,
    },
    recentTrips: recentTrips.map((t) => ({
      id: t.id,
      tripCode: t.tripCode,
      source: t.source,
      destination: t.destination,
      status: t.status,
      revenue: t.revenue,
      cargoWeightKg: t.cargoWeightKg,
      plannedDistanceKm: t.plannedDistanceKm,
      actualDistanceKm: t.actualDistanceKm,
      createdAt: t.createdAt,
      vehicle: t.vehicle,
      driver: t.driver,
    })),
  });
});

// GET /dashboard/filters — distinct values to populate filter dropdowns
dashboardRouter.get("/filters", authenticate, async (_req, res) => {
  const vehicles = await prisma.vehicle.findMany({ select: { type: true, region: true } });
  const types = [...new Set(vehicles.map((v) => v.type).filter(Boolean))].sort();
  const regions = [...new Set(vehicles.map((v) => v.region).filter((r): r is string => Boolean(r)))].sort();
  res.json({
    types,
    regions,
    statuses: ["draft", "dispatched", "completed", "cancelled"],
  });
});
