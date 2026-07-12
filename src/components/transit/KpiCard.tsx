import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  context,
  trend,
  accent = "amber",
  children,
}: {
  label: string;
  value: string;
  context?: string;
  trend?: "up" | "down";
  accent?: "amber" | "green" | "blue" | "gray" | "red";
  children?: ReactNode;
}) {
  const border = {
    amber: "border-l-primary",
    green: "border-l-status-green",
    blue: "border-l-status-blue",
    gray: "border-l-status-gray",
    red: "border-l-status-red",
  }[accent];

  return (
    <div className={cn("rounded-lg border border-l-4 bg-card p-4 shadow-sm", border)}>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className="mt-1.5 text-3xl font-bold tabular-nums">{value}</p>
      {(context || trend) && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
          {trend === "up" && <TrendingUp className="size-3.5 text-status-green" />}
          {trend === "down" && <TrendingDown className="size-3.5 text-status-red" />}
          {context}
        </p>
      )}
      {children}
    </div>
  );
}

export function MetricChip({ label, value, tone = "gray" }: { label: string; value: string; tone?: "gray" | "amber" | "green" | "blue" }) {
  const toneClass = {
    gray: "text-foreground",
    amber: "text-status-amber",
    green: "text-status-green",
    blue: "text-status-blue",
  }[tone];
  return (
    <div className="flex items-baseline gap-2 rounded-md border bg-card px-3 py-2">
      <span className={cn("text-lg font-semibold tabular-nums", toneClass)}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}