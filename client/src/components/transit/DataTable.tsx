import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";

export function TableCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-lg border bg-card shadow-sm", className)}>
      <div className="max-h-[560px] overflow-auto">
        <table className="w-full min-w-max border-collapse text-sm">{children}</table>
      </div>
    </div>
  );
}

export function Th({
  className,
  numeric,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th
      className={cn(
        "sticky top-0 z-10 border-b bg-card px-3 py-2.5 text-left text-xs font-semibold tracking-wide whitespace-nowrap text-muted-foreground uppercase",
        numeric && "text-right",
        className,
      )}
      {...props}
    />
  );
}

export function Td({
  className,
  numeric,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td
      className={cn(
        "border-b px-3 py-2 whitespace-nowrap",
        numeric && "text-right tabular-nums",
        className,
      )}
      {...props}
    />
  );
}

export function Tr({ className, muted, ...props }: HTMLAttributes<HTMLTableRowElement> & { muted?: boolean }) {
  return (
    <tr
      className={cn(
        "transition-colors hover:bg-secondary/60",
        muted && "text-muted-foreground opacity-70",
        className,
      )}
      {...props}
    />
  );
}