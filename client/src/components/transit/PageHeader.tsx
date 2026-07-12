import { Search } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  search,
  onSearch,
  searchPlaceholder = "Search…",
  action,
}: {
  title: string;
  subtitle?: string;
  search?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="col-span-2 flex items-center gap-3 sm:ml-auto">
        {onSearch && (
          <div className="relative flex-1 sm:flex-none">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search ?? ""}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-md border bg-card pr-3 pl-8 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-64"
            />
          </div>
        )}
        {action}
      </div>
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={
        "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus:ring-2 focus:ring-ring focus:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground " +
        (className ?? "")
      }
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  type = "button",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={
        "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border bg-card px-4 text-sm font-medium transition-colors hover:bg-secondary focus:ring-2 focus:ring-ring focus:outline-none " +
        (className ?? "")
      }
    >
      {children}
    </button>
  );
}