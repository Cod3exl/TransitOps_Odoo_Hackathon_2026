-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "depotName" TEXT NOT NULL DEFAULT 'Rotterdam Central Depot',
    "currency" TEXT NOT NULL DEFAULT 'USD ($)',
    "distanceUnit" TEXT NOT NULL DEFAULT 'Kilometers',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);
