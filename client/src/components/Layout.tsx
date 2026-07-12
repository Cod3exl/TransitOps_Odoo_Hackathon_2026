import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth, Role } from "../context/AuthContext";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles?: Role[]; // if set, only these roles see the link
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/dispatch", label: "Dispatch", icon: "🚚", roles: ["dispatcher", "fleet_manager"] },
  { to: "/vehicles", label: "Vehicles", icon: "🚛", roles: ["fleet_manager"] },
  { to: "/drivers", label: "Drivers", icon: "🧑‍✈️", roles: ["safety_officer", "fleet_manager"] },
  { to: "/maintenance", label: "Maintenance", icon: "🔧", roles: ["fleet_manager"] },
  { to: "/fuel-expenses", label: "Fuel & Expenses", icon: "⛽", roles: ["financial_analyst", "fleet_manager"] },
  { to: "/reports", label: "Reports", icon: "📈" },
];

const roleLabels: Record<Role, string> = {
  fleet_manager: "Fleet Manager",
  dispatcher: "Dispatcher",
  safety_officer: "Safety Officer",
  financial_analyst: "Financial Analyst",
};

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visible = NAV.filter((n) => !n.roles || (user && n.roles.includes(user.role)));

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-6 py-5">
          <span className="text-2xl">🛻</span>
          <span className="text-lg font-bold tracking-tight">TransitOps</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {visible.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
          <div className="text-sm text-slate-400">Fleet Operations Console</div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-medium text-slate-900">{user?.fullName}</div>
              <div className="text-xs text-slate-400">{user ? roleLabels[user.role] : ""}</div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
