import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, authorize } from "../middleware/auth";

export const vehiclesRouter = Router();

const vehicleSchema = z.object({
  registrationNumber: z.string().min(1),
  nameModel: z.string().min(1),
  type: z.string().min(1),
  maxLoadCapacityKg: z.coerce.number().min(0),
  odometerKm: z.coerce.number().min(0),
  acquisitionCost: z.coerce.number().min(0),
  region: z.string().optional(),
  status: z.enum(["available", "on_trip", "in_shop", "retired"]).default("available"),
});

const updateVehicleSchema = vehicleSchema.partial();

vehiclesRouter.get(
  "/",
  authenticate,
  authorize("fleet_manager", "dispatcher", "safety_officer", "financial_analyst"),
  async (_req, res) => {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(vehicles);
  }
);

vehiclesRouter.post("/", authenticate, authorize("fleet_manager"), async (req, res) => {
  const parsed = vehicleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const vehicle = await prisma.vehicle.create({
    data: parsed.data,
  });
  res.status(201).json(vehicle);
});

vehiclesRouter.patch("/:id", authenticate, authorize("fleet_manager"), async (req, res) => {
  const parsed = updateVehicleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const vehicle = await prisma.vehicle.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(vehicle);
});
