import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middleware/auth";

const DEFAULT_RBAC = {
  fleet_manager: {
    "/": "full",
    "/vehicles": "full",
    "/drivers": "full",
    "/trips": "full",
    "/maintenance": "full",
    "/finance": "view",
    "/reports": "full",
    "/settings": "full",
  },
  dispatcher: {
    "/": "full",
    "/vehicles": "view",
    "/drivers": "view",
    "/trips": "full",
    "/maintenance": "none",
    "/finance": "none",
    "/reports": "none",
    "/settings": "none",
  },
  safety_officer: {
    "/": "full",
    "/vehicles": "none",
    "/drivers": "full",
    "/trips": "view",
    "/maintenance": "none",
    "/finance": "none",
    "/reports": "none",
    "/settings": "none",
  },
  financial_analyst: {
    "/": "full",
    "/vehicles": "view",
    "/drivers": "none",
    "/trips": "none",
    "/maintenance": "view",
    "/finance": "full",
    "/reports": "full",
    "/settings": "none",
  },
};

export const settingsRouter = Router();

// GET /settings - get current settings
settingsRouter.get("/", authenticate, async (_req, res) => {
  let settings = await (prisma as any).systemSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await (prisma as any).systemSettings.create({
      data: { id: "default", rbacConfig: DEFAULT_RBAC },
    });
  }

  res.json(settings);
});

// PATCH /settings - update settings
settingsRouter.patch("/", authenticate, async (req, res) => {
  const { depotName, currency, distanceUnit, rbacConfig } = req.body;

  const settings = await (prisma as any).systemSettings.upsert({
    where: { id: "default" },
    update: { depotName, currency, distanceUnit, rbacConfig },
    create: { id: "default", depotName, currency, distanceUnit, rbacConfig: rbacConfig || DEFAULT_RBAC },
  });

  res.json(settings);
});
