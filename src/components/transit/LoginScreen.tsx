import { useState, type FormEvent } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/transit/types";
import { ROLE_LABELS, ROLE_DESCRIPTIONS, navForRole } from "@/lib/transit/rbac";
import { useSession } from "@/lib/transit/session";
import { LogoMark } from "./Logo";
import { PrimaryButton } from "./PageHeader";

const ROLES: Role[] = ["fleet_manager", "dispatcher", "safety_officer", "financial_analyst"];

export function LoginScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("fleet_manager");
  const [failedAttempts, setFailedAttempts] = useState(0);

  const locked = failedAttempts >= 3;
  const showError = failedAttempts > 0 && !locked;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (locked) return;
    if (!email.trim() || !password.trim()) {
      setFailedAttempts((n) => n + 1);
      return;
    }
    signIn(email.trim(), role);
  };

  const preview = navForRole(role);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <LogoMark />
          <span className="text-lg font-bold text-sidebar-accent-foreground">TransitOps</span>
        </div>
        <div>
          <h1 className="max-w-md text-3xl font-bold text-sidebar-accent-foreground">
            Smart Transport Operations Platform
          </h1>
          <p className="mt-3 max-w-md text-sm text-sidebar-foreground/80">
            One console for the four roles that run your fleet:
          </p>
          <ul className="mt-6 space-y-4">
            {ROLES.map((r) => (
              <li key={r} className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-semibold text-sidebar-accent-foreground">
                    {ROLE_LABELS[r]}
                  </p>
                  <p className="text-xs text-sidebar-foreground/70">{ROLE_DESCRIPTIONS[r]}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-sidebar-foreground/50">
          Role-based access control is enforced across every module.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <LogoMark />
            <span className="text-lg font-bold">TransitOps</span>
          </div>
          <h2 className="text-xl font-bold">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Demo build — pick a role to explore its console.
          </p>

          {locked && (
            <div className="mt-4 flex items-start gap-2 rounded-md border border-status-red/40 bg-status-amber-soft px-3 py-2.5 text-sm">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-status-red" />
              <div>
                <p className="font-semibold text-status-red">Account temporarily locked</p>
                <p className="text-xs text-muted-foreground">
                  Too many failed attempts. Contact your administrator or{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => setFailedAttempts(0)}
                  >
                    reset the demo
                  </button>
                  .
                </p>
              </div>
            </div>
          )}
          {showError && (
            <div className="mt-4 flex items-center gap-2 rounded-md border border-status-red/40 bg-status-red-soft px-3 py-2.5 text-sm text-status-red">
              <AlertTriangle className="size-4 shrink-0" />
              Invalid credentials — email and password are required.
            </div>
          )}

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="h-10 w-full rounded-md border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 w-full rounded-md border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>

            <div>
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Role</span>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      "rounded-md border px-3 py-2 text-left text-xs font-medium transition-colors",
                      role === r
                        ? "border-primary bg-accent"
                        : "bg-card hover:bg-secondary",
                    )}
                  >
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                <span className="font-medium">{ROLE_LABELS[role]}</span> sees:{" "}
                {preview.map((n) => n.label).join(" · ")}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 text-muted-foreground">
                <input type="checkbox" className="accent-primary" defaultChecked /> Remember me
              </label>
              <button type="button" className="text-muted-foreground underline">
                Forgot password?
              </button>
            </div>

            <PrimaryButton type="submit" disabled={locked} className="w-full">
              Sign In
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}