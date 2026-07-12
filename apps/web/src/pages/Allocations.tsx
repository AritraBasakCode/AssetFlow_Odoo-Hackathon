import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import StatusBadge from "../components/StatusBadge";

export default function Allocations() {
  const qc = useQueryClient();
  const { data: allocations } = useQuery({ queryKey: ["allocations"], queryFn: async () => (await api.get("/allocations")).data });
  const { data: transfers } = useQuery({ queryKey: ["transfers"], queryFn: async () => (await api.get("/transfers")).data });
  const { data: assets } = useQuery({ queryKey: ["assets", ""], queryFn: async () => (await api.get("/assets")).data });
  const { data: employees } = useQuery({ queryKey: ["employees"], queryFn: async () => (await api.get("/employees")).data });

  const [form, setForm] = useState({ assetId: "", employeeId: "", expectedReturnDate: "" });
  const [conflict, setConflict] = useState<{ error: string; currentAllocationId?: string } | null>(null);

  const allocate = useMutation({
    mutationFn: async () => api.post("/allocations", form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["allocations"] }); setConflict(null); setForm({ assetId: "", employeeId: "", expectedReturnDate: "" }); },
    onError: (e: any) => {
      if (e.response?.status === 409) setConflict(e.response.data);
      else alert(e.response?.data?.error || "Failed");
    },
  });

  const requestTransfer = useMutation({
    mutationFn: async () => api.post("/transfers", { assetId: form.assetId, toUserId: form.employeeId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["transfers"] }); setConflict(null); },
  });

  const returnAsset = useMutation({
    mutationFn: async (id: string) => api.post(`/allocations/${id}/return`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allocations"] }),
  });

  const approveTransfer = useMutation({
    mutationFn: async (id: string) => api.patch(`/transfers/${id}/approve`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transfers"] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Asset Allocation & Transfer</h1>

      <form onSubmit={(e) => { e.preventDefault(); setConflict(null); allocate.mutate(); }} className="bg-white border rounded-xl p-4 grid grid-cols-4 gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Asset</label>
          <select required value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} className="border rounded-md px-3 py-2 text-sm w-full">
            <option value="">Select asset...</option>
            {assets?.map((a: any) => <option key={a.id} value={a.id}>{a.assetTag} — {a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Employee</label>
          <select required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="border rounded-md px-3 py-2 text-sm w-full">
            <option value="">Select employee...</option>
            {employees?.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Expected Return (optional)</label>
          <input type="date" value={form.expectedReturnDate} onChange={(e) => setForm({ ...form, expectedReturnDate: e.target.value })} className="border rounded-md px-3 py-2 text-sm w-full" />
        </div>
        <button className="bg-brand-600 text-white text-sm py-2 rounded-md">Allocate</button>
      </form>

      {conflict && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-red-700">{conflict.error}</p>
          <button onClick={() => requestTransfer.mutate()} className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-md">
            Request Transfer Instead
          </button>
        </div>
      )}

      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Active Allocations</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500 border-b"><tr><th className="py-1">Asset</th><th>Holder</th><th>Expected Return</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {allocations?.map((a: any) => (
              <tr key={a.id} className="border-b last:border-0">
                <td className="py-1">{a.asset.assetTag} — {a.asset.name}</td>
                <td>{a.employee?.name || a.department?.name || "—"}</td>
                <td>{a.expectedReturnDate ? new Date(a.expectedReturnDate).toLocaleDateString() : "—"}</td>
                <td><StatusBadge status={a.status} /></td>
                <td>{a.status === "ACTIVE" && (
                  <button onClick={() => returnAsset.mutate(a.id)} className="text-xs text-brand-600 hover:underline">Mark Returned</button>
                )}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Transfer Requests</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500 border-b"><tr><th className="py-1">Asset</th><th>To</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {transfers?.map((t: any) => (
              <tr key={t.id} className="border-b last:border-0">
                <td className="py-1">{t.asset.assetTag}</td>
                <td>{t.toUser?.name}</td>
                <td><StatusBadge status={t.status} /></td>
                <td>{t.status === "REQUESTED" && (
                  <button onClick={() => approveTransfer.mutate(t.id)} className="text-xs text-brand-600 hover:underline">Approve</button>
                )}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
