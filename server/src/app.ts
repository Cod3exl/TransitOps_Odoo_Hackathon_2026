import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { tripsRouter } from "./routes/trips";
import { dashboardRouter } from "./routes/dashboard";
import { fuelExpensesRouter } from "./routes/fuelExpenses";
import { reportsRouter } from "./routes/reports";
import { settingsRouter } from "./routes/settings";
import { vehiclesRouter } from "./routes/vehicles";
import { driversRouter } from "./routes/drivers";
import { maintenanceRouter } from "./routes/maintenance";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/auth", authRouter);
  app.use("/trips", tripsRouter);
  app.use("/dashboard", dashboardRouter);
  app.use("/", fuelExpensesRouter); // exposes /fuel-logs, /expenses, /operational-cost
  app.use("/reports", reportsRouter);
  app.use("/settings", settingsRouter);

  app.use("/vehicles", vehiclesRouter);
  app.use("/drivers", driversRouter);
  app.use("/maintenance", maintenanceRouter);

  // Fallback error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    const status = err?.status ?? 500;
    res.status(status).json({ error: err?.message ?? "Internal server error" });
  });

  return app;
}
