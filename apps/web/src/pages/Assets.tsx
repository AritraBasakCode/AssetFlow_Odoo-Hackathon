import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

export default function Assets() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const canRegister = user?.role === "ASSET_MANAGER" || user?.role === "ADMIN";

  const { data: assets, refetch } = useQuery({
    queryKey: ["assets", q],
    queryFn: async () => (await api.get("/assets", { params: { q } })).data,
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Asset Registry</h1>
        {canRegister && (
          <button onClick={() => setShowForm((s) => !s)} className="bg-brand-600 text-white text-sm px-4 py-2 rounded-md">
            {showForm ? "Close" : "Register Asset"}
          </button>
        )}
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by tag, serial number, name, or QR code..."
        className="w-full border rounded-md px-3 py-2 text-sm"
      />

      {showForm && <RegisterAssetForm onDone={() => { setShowForm(false); refetch(); }} />}

      <table className="w-full text-sm bg-white border rounded-xl overflow-hidden">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr><th className="p-3">Tag</th><th>Name</th><th>Category</th><th>Location</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {assets?.map((a: any) => (
            <tr key={a.id} className="border-t">
              <td className="p-3 font-medium">{a.assetTag}</td>
              <td>{a.name}</td>
              <td>{a.category?.name}</td>
              <td>{a.location}</td>
              <td><StatusBadge status={a.status} /></td>
              <td><Link to={`/assets/${a.id}`} className="text-brand-600 text-xs hover:underline">View</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RegisterAssetForm({ onDone }: { onDone: () => void }) {
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: async () => (await api.get("/asset-categories")).data });
  const { data: departments } = useQuery({ queryKey: ["departments"], queryFn: async () => (await api.get("/departments")).data });

  const [form, setForm] = useState({
    name: "", categoryId: "", serialNumber: "", acquisitionDate: "", condition: "Good", location: "", isBookable: false, departmentId: "",
  });
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async () => api.post("/assets", { ...form, departmentId: form.departmentId || undefined }),
    onSuccess: onDone,
    onError: (e: any) => setError(e.response?.data?.error || "Failed to register asset"),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="bg-white border rounded-xl p-4 grid grid-cols-2 gap-3">
      <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
      <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="border rounded-md px-3 py-2 text-sm">
        <option value="">Category...</option>
        {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input required placeholder="Serial Number" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
      <input required type="date" value={form.acquisitionDate} onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
      <input required placeholder="Condition" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
      <input required placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="border rounded-md px-3 py-2 text-sm" />
      <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className="border rounded-md px-3 py-2 text-sm">
        <option value="">Department (optional)</option>
        {departments?.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.isBookable} onChange={(e) => setForm({ ...form, isBookable: e.target.checked })} />
        Shared / bookable resource
      </label>
      {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
      <button className="col-span-2 bg-brand-600 text-white text-sm py-2 rounded-md">Register Asset</button>
    </form>
  );
}
