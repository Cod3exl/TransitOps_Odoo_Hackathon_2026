import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding TransitOps demo data…");

  // Clean slate (order matters for FKs)
  await prisma.fuelLog.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const [manager] = await Promise.all([
    prisma.user.create({
      data: { fullName: "Priya Manager", email: "manager@transitops.dev", role: "fleet_manager", passwordHash },
    }),
    prisma.user.create({
      data: { fullName: "Dan Dispatcher", email: "dispatcher@transitops.dev", role: "dispatcher", passwordHash },
    }),
    prisma.user.create({
      data: { fullName: "Sara Safety", email: "safety@transitops.dev", role: "safety_officer", passwordHash },
    }),
    prisma.user.create({
      data: { fullName: "Finn Finance", email: "finance@transitops.dev", role: "financial_analyst", passwordHash },
    }),
  ]);

  // Vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        registrationNumber: "VAN-05",
        nameModel: "Ford Transit",
        type: "van",
        maxLoadCapacityKg: 1200,
        acquisitionCost: 45000,
        odometerKm: 82000,
        region: "North",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "TRK-11",
        nameModel: "Volvo FH16",
        type: "truck",
        maxLoadCapacityKg: 18000,
        acquisitionCost: 140000,
        odometerKm: 210000,
        region: "West",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "TRK-12",
        nameModel: "Scania R500",
        type: "truck",
        maxLoadCapacityKg: 16000,
        acquisitionCost: 132000,
        odometerKm: 150000,
        region: "West",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "VAN-08",
        nameModel: "Mercedes Sprinter",
        type: "van",
        maxLoadCapacityKg: 1500,
        acquisitionCost: 52000,
        odometerKm: 34000,
        region: "South",
        status: "in_shop",
      },
    }),
  ]);

  // Drivers
  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        name: "Alex Rivera",
        licenseNumber: "DL-9001",
        licenseCategory: "C",
        licenseExpiry: new Date("2027-06-01"),
        safetyScore: 95,
      },
    }),
    prisma.driver.create({
      data: {
        name: "Jordan Kim",
        licenseNumber: "DL-9002",
        licenseCategory: "CE",
        licenseExpiry: new Date("2026-11-15"),
        safetyScore: 88,
      },
    }),
    prisma.driver.create({
      data: {
        name: "Morgan Lee",
        licenseNumber: "DL-9003",
        licenseCategory: "CE",
        licenseExpiry: new Date("2025-01-01"), // expired — good for demo validation
        safetyScore: 70,
      },
    }),
  ]);

  // Completed trips (drive dashboard + reports numbers)
  const monthsAgo = (n: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() - n);
    return d;
  };

  const completed = [
    { code: "T-1001", v: 1, d: 1, src: "Depot", dst: "Riverside", dist: 320, fuel: 78, rev: 2400, ago: 4 },
    { code: "T-1002", v: 1, d: 0, src: "Depot", dst: "Hilltown", dist: 210, fuel: 96, rev: 3100, ago: 3 },
    { code: "T-1003", v: 2, d: 1, src: "Port", dst: "Riverside", dist: 540, fuel: 165, rev: 5200, ago: 2 },
    { code: "T-1004", v: 0, d: 0, src: "Depot", dst: "Seaside", dist: 180, fuel: 22, rev: 1400, ago: 1 },
    { code: "T-1005", v: 2, d: 1, src: "Port", dst: "Hilltown", dist: 410, fuel: 140, rev: 4300, ago: 0 },
  ];

  for (const t of completed) {
    await prisma.trip.create({
      data: {
        tripCode: t.code,
        source: t.src,
        destination: t.dst,
        vehicleId: vehicles[t.v].id,
        driverId: drivers[t.d].id,
        cargoWeightKg: 900,
        plannedDistanceKm: t.dist,
        actualDistanceKm: t.dist,
        fuelConsumedL: t.fuel,
        revenue: t.rev,
        status: "completed",
        dispatchedAt: monthsAgo(t.ago),
        completedAt: monthsAgo(t.ago),
        createdById: manager.id,
      },
    });
  }

  // A draft trip ready for the live dispatch demo (Van-05 + Alex)
  await prisma.trip.create({
    data: {
      tripCode: "T-1006",
      source: "Depot",
      destination: "Northgate",
      vehicleId: vehicles[0].id,
      driverId: drivers[0].id,
      cargoWeightKg: 800,
      plannedDistanceKm: 260,
      revenue: 2100,
      status: "draft",
      createdById: manager.id,
    },
  });

  // Fuel logs
  await prisma.fuelLog.createMany({
    data: [
      { vehicleId: vehicles[0].id, liters: 78, cost: 140 },
      { vehicleId: vehicles[0].id, liters: 96, cost: 172 },
      { vehicleId: vehicles[1].id, liters: 165, cost: 300 },
      { vehicleId: vehicles[2].id, liters: 140, cost: 255 },
      { vehicleId: vehicles[0].id, liters: 22, cost: 40 },
    ],
  });

  // Expenses
  await prisma.expense.createMany({
    data: [
      { vehicleId: vehicles[1].id, expenseType: "toll", amount: 85 },
      { vehicleId: vehicles[2].id, expenseType: "parking", amount: 30 },
      { vehicleId: vehicles[0].id, expenseType: "insurance", amount: 200 },
      { vehicleId: vehicles[1].id, expenseType: "fine", amount: 120 },
    ],
  });

  // Maintenance
  await prisma.maintenanceLog.createMany({
    data: [
      { vehicleId: vehicles[3].id, serviceType: "Brake overhaul", cost: 900, status: "in_shop" },
      { vehicleId: vehicles[1].id, serviceType: "Oil change", cost: 220, status: "completed" },
      { vehicleId: vehicles[2].id, serviceType: "Tire replacement", cost: 640, status: "completed" },
    ],
  });

  console.log("Seed complete.");
  console.log("Login with any of: manager@ / dispatcher@ / safety@ / finance@ transitops.dev — password: demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
