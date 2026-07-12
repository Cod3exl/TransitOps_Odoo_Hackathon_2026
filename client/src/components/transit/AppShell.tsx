import { Link, useRouterState } from "@tanstack/react-router";
import { LogOut, Moon, Sun } from "lucide-react";
import { cn, useTheme } from "@/lib/utils";
import { navForRole, ROLE_LABELS } from "@/lib/transit/rbac";
import { useSession } from "@/lib/transit/session";
import { useSettings } from "@/lib/useApi";
import { LogoMark } from "./Logo";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { session, signOut } = useSession();
  const { data: settingsData } = useSettings();
  const { dark, toggle: toggleDark } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!session) return null;
  const items = navForRole(session.role, settingsData?.rbacConfig);

  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:w-60">
        <div className="flex items-center gap-2.5 px-3 py-4 lg:px-5">
          <LogoMark className="size-7 shrink-0" />
          <span className="hidden text-base font-bold text-sidebar-accent-foreground lg:block">
            TransitOps
          </span>
        </div>
        <nav className="flex-1 space-y-0.5 px-2 py-2 lg:px-3">
          {items.map((item) => {
            const active =
              item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors lg:px-3",
                  active
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="size-4.5 shrink-0" />
                <span className="hidden lg:block">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border px-3 py-3 lg:px-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-sidebar-accent text-xs font-bold text-primary">
              {session.email.slice(0, 1).toUpperCase()}
            </div>
            <div className="hidden min-w-0 flex-1 lg:block">
              <p className="truncate text-xs font-medium text-sidebar-accent-foreground">
                {session.email}
              </p>
              <span className="mt-0.5 inline-block rounded-full bg-sidebar-accent px-1.5 py-px text-[10px] font-semibold text-primary">
                {ROLE_LABELS[session.role]}
              </span>
            </div>
            <button
              onClick={toggleDark}
              title="Toggle theme"
              className="hidden rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:block"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <button
              onClick={signOut}
              title="Sign out"
              className="hidden rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground lg:block"
            >
              <LogOut className="size-4" />
            </button>
          </div>
          <div className="mt-2 flex gap-2 lg:hidden">
            <button
              onClick={toggleDark}
              title="Toggle theme"
              className="grid flex-1 place-items-center rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <button
              onClick={signOut}
              title="Sign out"
              className="grid flex-1 place-items-center rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}