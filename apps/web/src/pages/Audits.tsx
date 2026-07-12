import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

export default function Audits() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === "ADMIN";

  const { data: cycles } = useQuery({ queryKey: ["audit-cycles"], queryFn: async () => (await api.get("/audit-cycles")).data });
  const { data: employees } = useQuery({ queryKey: ["employees"], queryFn: async () => (await api.get("/employees")).data, enabled: isAdmin });
  const { data: departments } = useQuery({ queryKey: ["departments"], queryFn: async () => (await api.get("/departments")).data, enabled: isAdmin });

  const [selectedCycle, setSelectedCycle] = useState<string | null>(null);
  const { data: cycleDetail } = useQuery({
    queryKey: ["audit-cycle", selectedCycle],
    queryFn: async () => (await api.get(`/audit-cycles/${selectedCycle}`)).data,
    enabled: !!selectedCycle,
  });

  const [form, setForm] = useState({ name: "", scopeDepartmentId: "", startDate: "", endDate: "", auditorIds: [] as string[] });

  const create = useMutation({
    mutationFn: async () => api.post("/audit-cycles", { ...form, scopeDepartmentId: form.scopeDepartmentId || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["audit-cycles"] }); setForm({ name: "", scopeDepartmentId: "", startDate: "", endDate: "", auditorIds: [] }); },
  });

  const markItem = useMutation({
    mutationFn: async ({ itemId, result }: { itemId: string; result: string }) =>
      api.patch(`/audit-cycles/${selectedCycle}/items/${itemId}`, { result }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["audit-cycle", selectedCycle] }),
  });

  const closeCycle = useMutation({
    mutationFn: async () => api.patch(`/audit-cycles/${selectedCycle}/close`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["audit-cycles"] }); qc.invalidateQueries({ queryKey: ["audit-cycle", selectedCycle] }); },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Asset Audit Cycles</h1>

      {isAdmin && (
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="bg-white border rounded-xl p-4 grid grid-cols-3 gap-3 items-end">
          <input required placeholder="Cycle name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
          <select value={form.scopeDepartmentId} onChange={(e) => setForm({ ...form, scopeDepartmentId: e.target.value })} className="border rounded-md px-3 py-2 text-sm">
            <option value="">All departments</option>
            {departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select multiple value={form.auditorIds} onChange={(e) => setForm({ ...form, auditorIds: Array.from(e.target.selectedOptions).map((o) => o.value) })} className="border rounded-md px-3 py-2 text-sm h-20">
            {employees?.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
          <input required type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
          <button className="bg-brand-600 text-white text-sm py-2 rounded-md">Create Audit Cycle</button>
        </form>
      )}

      <table className="w-full text-sm bg-white border rounded-xl overflow-hidden">
        <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="p-3">Name</th><th>Items</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {cycles?.map((c: any) => (
            <tr key={c.id} className="border-t">
              <td className="p-3">{c.name}</td>
              <td>{c._count.items}</td>
              <td><StatusBadge status={c.status} /></td>
              <td><button onClick={() => setSelectedCycle(c.id)} className="text-xs text-brand-600 hover:underline">View</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      {cycleDetail && (
        <div className="bg-white border rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">{cycleDetail.name} — Items</h2>
            {isAdmin && cycleDetail.status === "OPEN" && (
              <button onClick={() => closeCycle.mutate()} className="bg-red-600 text-white text-xs px-3 py-1.5 rounded-md">Close Cycle</button>
            )}
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 border-b"><tr><th className="py-1">Asset</th><th>Result</th><th></th></tr></thead>
            <tbody>
              {cycleDetail.items.map((i: any) => (
                <tr key={i.id} className="border-b last:border-0">
                  <td className="py-1">{i.asset.assetTag} — {i.asset.name}</td>
                  <td><StatusBadge status={i.result} /></td>
                  <td className="space-x-2">
                    {cycleDetail.status === "OPEN" && (
                      <>
                        <button onClick={() => markItem.mutate({ itemId: i.id, result: "VERIFIED" })} className="text-xs text-green-600 hover:underline">Verified</button>
                        <button onClick={() => markItem.mutate({ itemId: i.id, result: "MISSING" })} className="text-xs text-red-600 hover:underline">Missing</button>
                        <button onClick={() => markItem.mutate({ itemId: i.id, result: "DAMAGED" })} className="text-xs text-orange-600 hover:underline">Damaged</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
