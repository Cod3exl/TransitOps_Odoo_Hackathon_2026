import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, authorize, AuthedRequest } from "../middleware/auth";

export const maintenanceRouter = Router();

const serviceSchema = z.object({
  vehicleId: z.string().min(1),
  serviceType: z.string().min(1),
  cost: z.coerce.number().min(0),
  serviceDate: z.string().datetime(),
});

maintenanceRouter.get(
  "/",
  authenticate,
  authorize("fleet_manager", "dispatcher", "safety_officer", "financial_analyst"),
  async (_req, res) => {
    const logs = await prisma.maintenanceLog.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(logs);
  }
);

maintenanceRouter.post("/", authenticate, authorize("fleet_manager"), async (req: AuthedRequest, res) => {
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // Use a transaction to create the log AND cascade the vehicle status to in_shop
  const result = await prisma.$transaction(async (tx) => {
    const log = await tx.maintenanceLog.create({
      data: {
        ...parsed.data,
        status: "in_shop",
        createdById: req.user!.id,
      },
    });

    await tx.vehicle.update({
      where: { id: parsed.data.vehicleId },
      data: { status: "in_shop" },
    });

    return log;
  });

  res.status(201).json(result);
});

maintenanceRouter.post("/:id/close", authenticate, authorize("fleet_manager"), async (req, res) => {
  const log = await prisma.maintenanceLog.findUnique({ where: { id: req.params.id } });
  if (!log) return res.status(404).json({ error: "Maintenance log not found" });

  if (log.status === "completed") {
    return res.status(400).json({ error: "Maintenance log is already closed" });
  }

  // Transaction: close log and cascade vehicle to available
  const result = await prisma.$transaction(async (tx) => {
    const updatedLog = await tx.maintenanceLog.update({
      where: { id: req.params.id },
      data: { status: "completed" },
    });

    await tx.vehicle.update({
      where: { id: log.vehicleId },
      data: { status: "available" },
    });

    return updatedLog;
  });

  res.json(result);
});
