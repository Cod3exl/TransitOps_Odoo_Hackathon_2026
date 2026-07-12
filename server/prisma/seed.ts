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
        registrationNumber: "MH-01-AB-1234",
        nameModel: "Tata Ace",
        type: "van",
        maxLoadCapacityKg: 1200,
        acquisitionCost: 850000,
        odometerKm: 82000,
        region: "West",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "DL-04-TR-9901",
        nameModel: "Ashok Leyland 1920",
        type: "truck",
        maxLoadCapacityKg: 18000,
        acquisitionCost: 2800000,
        odometerKm: 210000,
        region: "North",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "KA-01-MJ-4567",
        nameModel: "Tata Prima 2830",
        type: "truck",
        maxLoadCapacityKg: 16000,
        acquisitionCost: 2500000,
        odometerKm: 150000,
        region: "South",
      },
    }),
    prisma.vehicle.create({
      data: {
        registrationNumber: "MH-02-XY-8899",
        nameModel: "Mahindra Bolero Maxi",
        type: "van",
        maxLoadCapacityKg: 1500,
        acquisitionCost: 950000,
        odometerKm: 34000,
        region: "West",
        status: "in_shop",
      },
    }),
  ]);

  // Drivers
  const drivers = await Promise.all([
    prisma.driver.create({
      data: {
        name: "Rahul Sharma",
        licenseNumber: "DL-142023001",
        licenseCategory: "HMV",
        licenseExpiry: new Date("2027-06-01"),
        safetyScore: 95,
      },
    }),
    prisma.driver.create({
      data: {
        name: "Amit Patel",
        licenseNumber: "GJ-012022450",
        licenseCategory: "HMV",
        licenseExpiry: new Date("2026-11-15"),
        safetyScore: 88,
      },
    }),
    prisma.driver.create({
      data: {
        name: "Vijay Kumar",
        licenseNumber: "TN-072021888",
        licenseCategory: "LMV",
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
    { code: "T-1001", v: 1, d: 1, src: "Mumbai", dst: "Pune", dist: 150, fuel: 35, rev: 12000, ago: 4 },
    { code: "T-1002", v: 1, d: 0, src: "Mumbai", dst: "Surat", dist: 280, fuel: 65, rev: 25000, ago: 3 },
    { code: "T-1003", v: 2, d: 1, src: "Delhi", dst: "Jaipur", dist: 290, fuel: 70, rev: 28000, ago: 2 },
    { code: "T-1004", v: 0, d: 0, src: "Bangalore", dst: "Mysore", dist: 140, fuel: 18, rev: 8000, ago: 1 },
    { code: "T-1005", v: 2, d: 1, src: "Chennai", dst: "Vellore", dist: 140, fuel: 35, rev: 15000, ago: 0 },
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
      source: "Mumbai Depot",
      destination: "Nashik Hub",
      vehicleId: vehicles[0].id,
      driverId: drivers[0].id,
      cargoWeightKg: 800,
      plannedDistanceKm: 170,
      revenue: 12000,
      status: "draft",
      createdById: manager.id,
    },
  });

  // Fuel logs (Approx 90 INR / Liter)
  await prisma.fuelLog.createMany({
    data: [
      { vehicleId: vehicles[0].id, liters: 35, cost: 3150 },
      { vehicleId: vehicles[0].id, liters: 65, cost: 5850 },
      { vehicleId: vehicles[1].id, liters: 70, cost: 6300 },
      { vehicleId: vehicles[2].id, liters: 18, cost: 1620 },
      { vehicleId: vehicles[0].id, liters: 35, cost: 3150 },
    ],
  });

  // Expenses
  await prisma.expense.createMany({
    data: [
      { vehicleId: vehicles[1].id, expenseType: "toll", amount: 1500 },
      { vehicleId: vehicles[2].id, expenseType: "parking", amount: 500 },
      { vehicleId: vehicles[0].id, expenseType: "insurance", amount: 12000 },
      { vehicleId: vehicles[1].id, expenseType: "fine", amount: 2000 },
    ],
  });

  // Maintenance
  await prisma.maintenanceLog.createMany({
    data: [
      { vehicleId: vehicles[3].id, serviceType: "Brake overhaul", cost: 18000, status: "in_shop" },
      { vehicleId: vehicles[1].id, serviceType: "Oil change", cost: 4500, status: "completed" },
      { vehicleId: vehicles[2].id, serviceType: "Tire replacement", cost: 24000, status: "completed" },
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
