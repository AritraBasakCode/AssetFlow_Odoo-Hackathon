import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Activity() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canViewLogs = user?.role === "ADMIN" || user?.role === "ASSET_MANAGER" || user?.role === "DEPARTMENT_HEAD";

  const { data: notifications } = useQuery({ queryKey: ["notifications"], queryFn: async () => (await api.get("/notifications")).data });
  const { data: logs } = useQuery({ queryKey: ["activity-logs"], queryFn: async () => (await api.get("/activity-logs")).data, enabled: canViewLogs });

  const markAllRead = useMutation({
    mutationFn: async () => api.patch("/notifications/read-all", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Activity Logs & Notifications</h1>

      <div className="bg-white border rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">My Notifications</h2>
          <button onClick={() => markAllRead.mutate()} className="text-xs text-brand-600 hover:underline">Mark all read</button>
        </div>
        <div className="space-y-2">
          {notifications?.length ? notifications.map((n: any) => (
            <div key={n.id} className={`p-2 rounded-md text-sm ${n.isRead ? "bg-gray-50 text-gray-500" : "bg-blue-50 text-gray-800"}`}>
              <span className="font-medium">{n.type.replace(/_/g, " ")}</span> — {n.message}
              <span className="text-xs text-gray-400 block">{new Date(n.createdAt).toLocaleString()}</span>
            </div>
          )) : <p className="text-sm text-gray-400">No notifications yet.</p>}
        </div>
      </div>

      {canViewLogs && (
        <div className="bg-white border rounded-xl p-4">
          <h2 className="font-semibold mb-3">Full Activity Log</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 border-b"><tr><th className="py-1">Actor</th><th>Action</th><th>Entity</th><th>When</th></tr></thead>
            <tbody>
              {logs?.map((l: any) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="py-1">{l.actor?.name} ({l.actor?.role})</td>
                  <td>{l.action.replace(/_/g, " ")}</td>
                  <td>{l.entityType} #{l.entityId.slice(0, 6)}</td>
                  <td>{new Date(l.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
