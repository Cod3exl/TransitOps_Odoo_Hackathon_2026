import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

export const reportsRouter = Router();

// GET /reports/vehicle-costs — per-vehicle fuel efficiency, operational cost, ROI
reportsRouter.get("/vehicle-costs", authenticate, async (_req, res) => {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      fuelLogs: true,
      maintenanceLogs: true,
      expenses: true,
      trips: { where: { status: "completed" } },
    },
  });

  const rows = vehicles.map((v) => {
    const fuelCost = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
    const maintenanceCost = v.maintenanceLogs.reduce((s, m) => s + m.cost, 0);
    const expenseCost = v.expenses.reduce((s, e) => s + e.amount, 0);
    const operationalCost = fuelCost + maintenanceCost + expenseCost;
    const distance = v.trips.reduce((s, t) => s + (t.actualDistanceKm ?? 0), 0);
    const liters = v.fuelLogs.reduce((s, f) => s + f.liters, 0);
    const revenue = v.trips.reduce((s, t) => s + t.revenue, 0);
    return {
      id: v.id,
      registrationNumber: v.registrationNumber,
      nameModel: v.nameModel,
      type: v.type,
      fuelCost,
      maintenanceCost,
      expenseCost,
      operationalCost,
      revenue,
      distanceKm: distance,
      fuelEfficiency: liters ? distance / liters : 0,
      roi: v.acquisitionCost ? (revenue - operationalCost) / v.acquisitionCost : 0,
    };
  });

  res.json(rows);
});

// GET /reports/monthly-revenue — revenue + cost grouped by month (completed trips)
reportsRouter.get("/monthly-revenue", authenticate, async (_req, res) => {
  const trips = await prisma.trip.findMany({
    where: { status: "completed", completedAt: { not: null } },
    select: { revenue: true, completedAt: true },
  });

  const buckets = new Map<string, { month: string; revenue: number; trips: number }>();
  for (const t of trips) {
    const d = t.completedAt!;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key) ?? { month: key, revenue: 0, trips: 0 };
    bucket.revenue += t.revenue;
    bucket.trips += 1;
    buckets.set(key, bucket);
  }

  const result = [...buckets.values()].sort((a, b) => a.month.localeCompare(b.month));
  res.json(result);
});

// GET /reports/top-costliest — vehicles ranked by operational cost (desc)
reportsRouter.get("/top-costliest", authenticate, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 5, 50);
  const vehicles = await prisma.vehicle.findMany({
    include: { fuelLogs: true, maintenanceLogs: true, expenses: true },
  });

  const rows = vehicles
    .map((v) => {
      const fuelCost = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
      const maintenanceCost = v.maintenanceLogs.reduce((s, m) => s + m.cost, 0);
      const expenseCost = v.expenses.reduce((s, e) => s + e.amount, 0);
      return {
        id: v.id,
        registrationNumber: v.registrationNumber,
        nameModel: v.nameModel,
        fuelCost,
        maintenanceCost,
        expenseCost,
        operationalCost: fuelCost + maintenanceCost + expenseCost,
      };
    })
    .sort((a, b) => b.operationalCost - a.operationalCost)
    .slice(0, limit);

  res.json(rows);
});
