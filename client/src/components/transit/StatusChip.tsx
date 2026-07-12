import { cn } from "@/lib/utils";

type Tone = "green" | "blue" | "amber" | "gray" | "red";

const TONE_CLASSES: Record<Tone, string> = {
  green: "bg-status-green-soft text-status-green",
  blue: "bg-status-blue-soft text-status-blue",
  amber: "bg-status-amber-soft text-status-amber",
  gray: "bg-status-gray-soft text-status-gray",
  red: "bg-status-red-soft text-status-red",
};

const STATUS_MAP: Record<string, { label: string; tone: Tone }> = {
  available: { label: "Available", tone: "green" },
  active: { label: "Active", tone: "green" },
  approved: { label: "Approved", tone: "green" },
  closed: { label: "Closed", tone: "green" },
  completed: { label: "Completed", tone: "green" },
  on_trip: { label: "On Trip", tone: "blue" },
  dispatched: { label: "Dispatched", tone: "blue" },
  in_progress: { label: "In Progress", tone: "blue" },
  in_shop: { label: "In Shop", tone: "amber" },
  draft: { label: "Draft", tone: "amber" },
  pending: { label: "Pending", tone: "amber" },
  open: { label: "Open", tone: "amber" },
  retired: { label: "Retired", tone: "gray" },
  off_duty: { label: "Off Duty", tone: "gray" },
  suspended: { label: "Suspended", tone: "red" },
  expired: { label: "Expired", tone: "red" },
  cancelled: { label: "Cancelled", tone: "red" },
};

export function StatusChip({ status, className }: { status: string; className?: string }) {
  const entry = STATUS_MAP[status] ?? { label: status, tone: "gray" as Tone };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[entry.tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {entry.label}
    </span>
  );
}