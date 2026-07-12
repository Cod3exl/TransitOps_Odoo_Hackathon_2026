import { prisma } from "../lib/prisma";

export class RuleError extends Error {
  status = 400;
}

export async function dispatchTrip(tripId: string) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUniqueOrThrow({
      where: { id: tripId },
      include: { vehicle: true, driver: true },
    });

    if (trip.status !== "draft") throw new RuleError("Trip is not in draft status");
    if (!trip.vehicle || trip.vehicle.status !== "available") throw new RuleError("Vehicle is not available");
    if (!trip.driver) throw new RuleError("Driver is not available");
    if (trip.driver.status === "suspended") throw new RuleError("Driver is suspended");
    if (trip.driver.status !== "available") throw new RuleError("Driver is not available");
    if (trip.driver.licenseExpiry < new Date()) throw new RuleError("Driver license has expired");
    if (trip.cargoWeightKg > trip.vehicle.maxLoadCapacityKg) {
      throw new RuleError(`Cargo weight ${trip.cargoWeightKg}kg exceeds capacity ${trip.vehicle.maxLoadCapacityKg}kg`);
    }

    await tx.vehicle.update({ where: { id: trip.vehicleId! }, data: { status: "on_trip" } });
    await tx.driver.update({ where: { id: trip.driverId! }, data: { status: "on_trip" } });

    return tx.trip.update({
      where: { id: tripId },
      data: { status: "dispatched", dispatchedAt: new Date() },
    });
  });
}

export async function completeTrip(tripId: string, actualDistanceKm: number, fuelConsumedL: number) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUniqueOrThrow({ where: { id: tripId } });
    if (trip.status !== "dispatched") throw new RuleError("Trip is not dispatched");

    await tx.vehicle.update({
      where: { id: trip.vehicleId! },
      data: { status: "available", odometerKm: { increment: actualDistanceKm } },
    });
    await tx.driver.update({ where: { id: trip.driverId! }, data: { status: "available" } });

    return tx.trip.update({
      where: { id: tripId },
      data: { status: "completed", completedAt: new Date(), actualDistanceKm, fuelConsumedL },
    });
  });
}

export async function cancelTrip(tripId: string) {
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUniqueOrThrow({ where: { id: tripId } });
    if (trip.status !== "dispatched") throw new RuleError("Only a dispatched trip can be cancelled");

    await tx.vehicle.update({ where: { id: trip.vehicleId! }, data: { status: "available" } });
    await tx.driver.update({ where: { id: trip.driverId! }, data: { status: "available" } });

    return tx.trip.update({ where: { id: tripId }, data: { status: "cancelled" } });
  });
}
