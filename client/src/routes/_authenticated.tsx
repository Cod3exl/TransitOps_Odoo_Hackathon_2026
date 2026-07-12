import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SessionProvider, useSession } from "@/lib/transit/session";
import { FleetProvider } from "@/lib/transit/store";
import { LoginScreen } from "@/components/transit/LoginScreen";
import { AppShell } from "@/components/transit/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function Gate() {
  const { session, ready } = useSession();
  if (!ready) return <div className="min-h-screen bg-background" />;
  if (!session) return <LoginScreen />;
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function AuthenticatedLayout() {
  return (
    <SessionProvider>
      <FleetProvider>
        <Gate />
      </FleetProvider>
    </SessionProvider>
  );
}