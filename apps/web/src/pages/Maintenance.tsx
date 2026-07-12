import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

export default function Maintenance() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canApprove = user?.role === "ASSET_MANAGER" || user?.role === "ADMIN";

  const { data: requests } = useQuery({ queryKey: ["maintenance"], queryFn: async () => (await api.get("/maintenance-requests")).data });
  const { data: assets } = useQuery({ queryKey: ["assets", ""], queryFn: async () => (await api.get("/assets")).data });

  const [form, setForm] = useState({ assetId: "", issueDescription: "", priority: "MEDIUM" });

  const raise = useMutation({
    mutationFn: async () => api.post("/maintenance-requests", form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["maintenance"] }); setForm({ assetId: "", issueDescription: "", priority: "MEDIUM" }); },
  });

  const approve = useMutation({ mutationFn: async (id: string) => api.patch(`/maintenance-requests/${id}/approve`, {}), onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance"] }) });
  const reject = useMutation({ mutationFn: async (id: string) => api.patch(`/maintenance-requests/${id}/reject`, {}), onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance"] }) });
  const assignTech = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => api.patch(`/maintenance-requests/${id}/assign-technician`, { technicianName: name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance"] }),
  });
  const startProgress = useMutation({ mutationFn: async (id: string) => api.patch(`/maintenance-requests/${id}/start-progress`, {}), onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance"] }) });
  const resolve = useMutation({
    mutationFn: async (id: string) => api.patch(`/maintenance-requests/${id}/resolve`, { resolutionNotes: "Resolved via dashboard" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance"] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Maintenance Management</h1>

      <form onSubmit={(e) => { e.preventDefault(); raise.mutate(); }} className="bg-white border rounded-xl p-4 grid grid-cols-4 gap-3 items-end">
        <select required value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} className="border rounded-md px-3 py-2 text-sm">
          <option value="">Select asset...</option>
          {assets?.map((a: any) => <option key={a.id} value={a.id}>{a.assetTag} — {a.name}</option>)}
        </select>
        <input required placeholder="Describe the issue" value={form.issueDescription} onChange={(e) => setForm({ ...form, issueDescription: e.target.value })} className="border rounded-md px-3 py-2 text-sm col-span-2" />
        <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="border rounded-md px-3 py-2 text-sm">
          <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option>
        </select>
        <button className="bg-brand-600 text-white text-sm py-2 rounded-md col-span-4 md:col-span-1">Raise Request</button>
      </form>

      <table className="w-full text-sm bg-white border rounded-xl overflow-hidden">
        <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="p-3">Asset</th><th>Issue</th><th>Priority</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {requests?.map((r: any) => (
            <tr key={r.id} className="border-t">
              <td className="p-3">{r.asset.assetTag}</td>
              <td>{r.issueDescription}</td>
              <td>{r.priority}</td>
              <td><StatusBadge status={r.status} /></td>
              <td className="space-x-2">
                {canApprove && r.status === "PENDING" && (
                  <>
                    <button onClick={() => approve.mutate(r.id)} className="text-xs text-brand-600 hover:underline">Approve</button>
                    <button onClick={() => reject.mutate(r.id)} className="text-xs text-red-600 hover:underline">Reject</button>
                  </>
                )}
                {canApprove && r.status === "APPROVED" && (
                  <button onClick={() => { const name = prompt("Technician name?"); if (name) assignTech.mutate({ id: r.id, name }); }} className="text-xs text-brand-600 hover:underline">Assign Technician</button>
                )}
                {canApprove && r.status === "TECH_ASSIGNED" && (
                  <button onClick={() => startProgress.mutate(r.id)} className="text-xs text-brand-600 hover:underline">Start Progress</button>
                )}
                {canApprove && r.status === "IN_PROGRESS" && (
                  <button onClick={() => resolve.mutate(r.id)} className="text-xs text-green-600 hover:underline">Resolve</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
