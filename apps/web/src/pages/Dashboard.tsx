import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import KpiCard from "../components/KpiCard";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: kpis, isLoading } = useQuery({
    queryKey: ["kpis"],
    queryFn: async () => (await api.get("/dashboard/kpis")).data,
  });

  const { data: overdueAllocations } = useQuery({
    queryKey: ["overdue-allocations"],
    queryFn: async () => (await api.get("/allocations/overdue")).data,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Welcome back, {user?.name?.split(" ")[0]}</h1>
        <p className="text-sm text-gray-500">Here's what's happening across the organization.</p>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">Loading KPIs...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label="Assets Available" value={kpis.assetsAvailable} />
          <KpiCard label="Assets Allocated" value={kpis.assetsAllocated} />
          <KpiCard label="Maintenance Today" value={kpis.maintenanceToday} />
          <KpiCard label="Active Bookings" value={kpis.activeBookings} />
          <KpiCard label="Pending Transfers" value={kpis.pendingTransfers} />
          <KpiCard label="Upcoming Returns (7d)" value={kpis.upcomingReturns} />
          <KpiCard label="Overdue Returns" value={kpis.overdueReturns} tone="danger" />
          <KpiCard label="Overdue Bookings" value={kpis.overdueBookings} tone="danger" />
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => navigate("/assets")} className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-md">
          Register Asset
        </button>
        <button onClick={() => navigate("/bookings")} className="bg-white border text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-50">
          Book Resource
        </button>
        <button onClick={() => navigate("/maintenance")} className="bg-white border text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-50">
          Raise Maintenance Request
        </button>
      </div>

      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-3 text-red-600">Overdue Returns</h2>
        {!overdueAllocations || overdueAllocations.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing overdue. Nice.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 border-b">
              <tr><th className="py-1">Asset</th><th>Holder</th><th>Expected Return</th></tr>
            </thead>
            <tbody>
              {overdueAllocations.map((a: any) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="py-1">{a.asset.assetTag} — {a.asset.name}</td>
                  <td>{a.employee?.name || "—"}</td>
                  <td className="text-red-600">{new Date(a.expectedReturnDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
