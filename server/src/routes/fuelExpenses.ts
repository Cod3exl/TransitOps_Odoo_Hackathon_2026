import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, authorize } from "../middleware/auth";

export const fuelExpensesRouter = Router();

const fuelLogSchema = z.object({
  vehicleId: z.string().uuid(),
  tripId: z.string().uuid().optional().nullable(),
  liters: z.number().positive(),
  cost: z.number().nonnegative(),
  logDate: z.coerce.date().optional(),
});

const expenseSchema = z.object({
  vehicleId: z.string().uuid(),
  tripId: z.string().uuid().optional().nullable(),
  expenseType: z.string().min(1),
  amount: z.number().nonnegative(),
  expenseDate: z.coerce.date().optional(),
  notes: z.string().optional().nullable(),
});

/* ---------------- Fuel logs ---------------- */

fuelExpensesRouter.get("/fuel-logs", authenticate, async (req, res) => {
  const { vehicleId } = req.query as { vehicleId?: string };
  const logs = await prisma.fuelLog.findMany({
    where: vehicleId ? { vehicleId } : {},
    orderBy: { logDate: "desc" },
    include: {
      vehicle: { select: { registrationNumber: true, nameModel: true } },
      trip: { select: { tripCode: true } },
    },
  });
  res.json(logs);
});

fuelExpensesRouter.post(
  "/fuel-logs",
  authenticate,
  authorize("financial_analyst", "fleet_manager"),
  async (req, res) => {
    const parsed = fuelLogSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const log = await prisma.fuelLog.create({ data: parsed.data });
    res.status(201).json(log);
  },
);

/* ---------------- Expenses ---------------- */

fuelExpensesRouter.get("/expenses", authenticate, async (req, res) => {
  const { vehicleId } = req.query as { vehicleId?: string };
  const expenses = await prisma.expense.findMany({
    where: vehicleId ? { vehicleId } : {},
    orderBy: { expenseDate: "desc" },
    include: {
      vehicle: { select: { registrationNumber: true, nameModel: true } },
      trip: { select: { tripCode: true } },
    },
  });
  res.json(expenses);
});

fuelExpensesRouter.post(
  "/expenses",
  authenticate,
  authorize("financial_analyst", "fleet_manager"),
  async (req, res) => {
    const parsed = expenseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const expense = await prisma.expense.create({ data: parsed.data });
    res.status(201).json(expense);
  },
);

/* --------- Operational cost summary (fuel + expenses per vehicle) --------- */

fuelExpensesRouter.get("/operational-cost", authenticate, async (_req, res) => {
  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      registrationNumber: true,
      nameModel: true,
      fuelLogs: { select: { cost: true, liters: true } },
      expenses: { select: { amount: true } },
    },
  });
  res.json(
    vehicles.map((v) => {
      const fuelCost = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
      const otherCost = v.expenses.reduce((s, e) => s + e.amount, 0);
      const liters = v.fuelLogs.reduce((s, f) => s + f.liters, 0);
      return {
        id: v.id,
        registrationNumber: v.registrationNumber,
        nameModel: v.nameModel,
        fuelCost,
        otherCost,
        totalLiters: liters,
        operationalCost: fuelCost + otherCost,
      };
    }),
  );
});
