import express from "express";
import cors from "cors";
import path from "path";
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

  app.use("/api/auth", authRouter);
  app.use("/api/trips", tripsRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/", fuelExpensesRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/settings", settingsRouter);

  app.use("/api/vehicles", vehiclesRouter);
  app.use("/api/drivers", driversRouter);
  app.use("/api/maintenance", maintenanceRouter);

  // Fallback error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    const status = err?.status ?? 500;
    res.status(status).json({ error: err?.message ?? "Internal server error" });
  });

  // Serve frontend static files
  const clientPath = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientPath));
  
  // Catch-all route to serve index.html for client-side routing
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });

  return app;
}
