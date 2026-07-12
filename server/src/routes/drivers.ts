import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, authorize } from "../middleware/auth";

export const driversRouter = Router();

const driverSchema = z.object({
  name: z.string().min(1),
  licenseNumber: z.string().min(1),
  licenseCategory: z.string().min(1),
  licenseExpiry: z.string().datetime(),
  contactNumber: z.string().optional().nullable(),
  safetyScore: z.coerce.number().min(0).max(100).default(100),
  status: z.enum(["available", "on_trip", "off_duty", "suspended"]).default("available"),
});

const updateDriverSchema = driverSchema.partial();

driversRouter.get(
  "/",
  authenticate,
  authorize("fleet_manager", "safety_officer", "dispatcher"),
  async (_req, res) => {
    const drivers = await prisma.driver.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(drivers);
  }
);

driversRouter.post("/", authenticate, authorize("fleet_manager", "safety_officer"), async (req, res) => {
  const parsed = driverSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const driver = await prisma.driver.create({
    data: parsed.data,
  });
  res.status(201).json(driver);
});

driversRouter.patch("/:id", authenticate, authorize("fleet_manager", "safety_officer"), async (req, res) => {
  const parsed = updateDriverSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const driver = await prisma.driver.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(driver);
});
