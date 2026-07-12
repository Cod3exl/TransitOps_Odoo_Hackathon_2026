import { Router, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, authorize, AuthedRequest } from "../middleware/auth";
import { dispatchTrip, completeTrip, cancelTrip, RuleError } from "../services/tripService";

export const tripsRouter = Router();

const createTripSchema = z.object({
  source: z.string().min(1),
  destination: z.string().min(1),
  vehicleId: z.string().min(1),
  driverId: z.string().min(1),
  cargoWeightKg: z.coerce.number().positive(),
  plannedDistanceKm: z.coerce.number().positive(),
});

const updateTripSchema = createTripSchema.partial();

const completeTripSchema = z.object({
  actualDistanceKm: z.coerce.number().positive(),
  fuelConsumedL: z.coerce.number().nonnegative(),
});

function handleRuleError(err: unknown, res: Response) {
  if (err instanceof RuleError) return res.status(err.status).json({ error: err.message });
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}

tripsRouter.get(
  "/",
  authenticate,
  authorize("dispatcher", "fleet_manager", "financial_analyst"),
  async (_req, res) => {
    const trips = await prisma.trip.findMany({
      include: { vehicle: true, driver: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(trips);
  }
);


tripsRouter.get(
  "/:id",
  authenticate,
  authorize("dispatcher", "fleet_manager", "financial_analyst"),
  async (req, res) => {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: { vehicle: true, driver: true },
    });
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    res.json(trip);
  }
);

tripsRouter.post("/", authenticate, authorize("dispatcher"), async (req: AuthedRequest, res) => {
  const parsed = createTripSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const trip = await prisma.trip.create({
    data: {
      ...parsed.data,
      tripCode: `TR-${Date.now()}`,
      createdById: req.user!.id,
    },
  });
  res.status(201).json(trip);
});

tripsRouter.patch("/:id", authenticate, authorize("dispatcher"), async (req, res) => {
  const parsed = updateTripSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  if (trip.status !== "draft") return res.status(400).json({ error: "Only a draft trip can be edited" });

  const updated = await prisma.trip.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(updated);
});

tripsRouter.delete("/:id", authenticate, authorize("dispatcher"), async (req, res) => {
  const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  if (trip.status !== "draft") return res.status(400).json({ error: "Only a draft trip can be deleted" });

  await prisma.trip.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

tripsRouter.post("/:id/dispatch", authenticate, authorize("dispatcher", "fleet_manager"), async (req, res) => {
  try {
    const trip = await dispatchTrip(req.params.id);
    res.json(trip);
  } catch (err) {
    handleRuleError(err, res);
  }
});

tripsRouter.post("/:id/complete", authenticate, authorize("dispatcher", "fleet_manager"), async (req, res) => {
  const parsed = completeTripSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const trip = await completeTrip(req.params.id, parsed.data.actualDistanceKm, parsed.data.fuelConsumedL);
    res.json(trip);
  } catch (err) {
    handleRuleError(err, res);
  }
});

tripsRouter.post("/:id/cancel", authenticate, authorize("dispatcher", "fleet_manager"), async (req, res) => {
  try {
    const trip = await cancelTrip(req.params.id);
    res.json(trip);
  } catch (err) {
    handleRuleError(err, res);
  }
});
