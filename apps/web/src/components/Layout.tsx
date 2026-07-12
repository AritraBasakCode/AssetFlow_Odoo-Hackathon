import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/dashboard", label: "Dashboard", roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"] },
  { to: "/organization", label: "Organization Setup", roles: ["ADMIN"] },
  { to: "/assets", label: "Assets", roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"] },
  { to: "/allocations", label: "Allocation & Transfer", roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"] },
  { to: "/bookings", label: "Resource Booking", roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"] },
  { to: "/maintenance", label: "Maintenance", roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"] },
  { to: "/audits", label: "Audits", roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"] },
  { to: "/reports", label: "Reports", roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"] },
  { to: "/activity", label: "Logs & Notifications", roles: ["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"] },
];

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-brand-900 text-white flex flex-col shrink-0">
        <div className="px-5 py-5 text-xl font-bold border-b border-white/10">AssetFlow</div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV.filter((n) => !user || n.roles.includes(user.role)).map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive ? "bg-brand-600 text-white" : "text-blue-100 hover:bg-white/10"
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10 text-sm">
          <div className="font-medium">{user?.name}</div>
          <div className="text-blue-200 text-xs mb-2">{user?.role.replace("_", " ")}</div>
          <button onClick={() => logout()} className="text-blue-100 hover:text-white underline text-xs">
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
