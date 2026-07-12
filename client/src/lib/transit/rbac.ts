import type { Role } from "./types";
import {
  LayoutDashboard,
  Truck,
  Users,
  Route as RouteIcon,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export const ROLE_LABELS: Record<Role, string> = {
  fleet_manager: "Fleet Manager",
  dispatcher: "Dispatcher",
  safety_officer: "Safety Officer",
  financial_analyst: "Financial Analyst",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  fleet_manager: "Vehicles, maintenance and full fleet lifecycle",
  dispatcher: "Creates and dispatches trips, assigns vehicles & drivers",
  safety_officer: "Driver compliance, licensing and safety scores",
  financial_analyst: "Fuel, expenses, costs and ROI reporting",
};

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Vehicles", to: "/vehicles", icon: Truck },
  { label: "Drivers", to: "/drivers", icon: Users },
  { label: "Trips", to: "/trips", icon: RouteIcon },
  { label: "Maintenance", to: "/maintenance", icon: Wrench },
  { label: "Fuel & Expenses", to: "/finance", icon: Fuel },
  { label: "Reports", to: "/reports", icon: BarChart3 },
  { label: "Settings", to: "/settings", icon: Settings },
];

export type Access = "full" | "view" | "none";

/** section key = route path */
export const ROLE_ACCESS: Record<Role, Record<string, Access>> = {
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

export function navForRole(role: Role, dynamicConfig?: Record<Role, Record<string, Access>>): NavItem[] {
  const config = dynamicConfig || ROLE_ACCESS;
  return NAV_ITEMS.filter((item) => config[role]?.[item.to] !== "none");
}