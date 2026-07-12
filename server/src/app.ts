import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { dashboardRouter } from "./routes/dashboard";
import { fuelExpensesRouter } from "./routes/fuelExpenses";
import { reportsRouter } from "./routes/reports";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/auth", authRouter);
  app.use("/dashboard", dashboardRouter);
  app.use("/", fuelExpensesRouter); // exposes /fuel-logs, /expenses, /operational-cost
  app.use("/reports", reportsRouter);

  // Teammates mount their routers here:
  // app.use("/trips", tripsRouter);        // Member A
  // app.use("/vehicles", vehiclesRouter);  // Member B
  // app.use("/drivers", driversRouter);    // Member B
  // app.use("/maintenance", maintenanceRouter); // Member B

  // Fallback error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    const status = err?.status ?? 500;
    res.status(status).json({ error: err?.message ?? "Internal server error" });
  });

  return app;
}
