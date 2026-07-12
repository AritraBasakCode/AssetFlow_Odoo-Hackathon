import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import StatusBadge from "../components/StatusBadge";

type Tab = "departments" | "categories" | "employees";

export default function Organization() {
  const [tab, setTab] = useState<Tab>("departments");

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Organization Setup</h1>
      <div className="flex gap-2 mb-6 border-b">
        {(["departments", "categories", "employees"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? "border-brand-600 text-brand-600" : "border-transparent text-gray-500"}`}>
            {t === "departments" ? "Departments" : t === "categories" ? "Asset Categories" : "Employee Directory"}
          </button>
        ))}
      </div>
      {tab === "departments" && <DepartmentsTab />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "employees" && <EmployeesTab />}
    </div>
  );
}

function DepartmentsTab() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const { data: departments } = useQuery({ queryKey: ["departments"], queryFn: async () => (await api.get("/departments")).data });

  const createDept = useMutation({
    mutationFn: async () => api.post("/departments", { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["departments"] }); setName(""); },
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => api.patch(`/departments/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  });

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); createDept.mutate(); }} className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New department name" className="border rounded-md px-3 py-2 text-sm w-64" />
        <button className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm">Add Department</button>
      </form>
      <table className="w-full text-sm bg-white border rounded-xl overflow-hidden">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr><th className="p-3">Name</th><th>Head</th><th>Members</th><th>Assets</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {departments?.map((d: any) => (
            <tr key={d.id} className="border-t">
              <td className="p-3 font-medium">{d.name}</td>
              <td>{d.head?.name || "—"}</td>
              <td>{d._count.members}</td>
              <td>{d._count.assets}</td>
              <td><StatusBadge status={d.status} /></td>
              <td>
                <button onClick={() => toggleStatus.mutate({ id: d.id, status: d.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })}
                  className="text-xs text-brand-600 hover:underline">
                  {d.status === "ACTIVE" ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoriesTab() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: async () => (await api.get("/asset-categories")).data });

  const createCategory = useMutation({
    mutationFn: async () => api.post("/asset-categories", { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["categories"] }); setName(""); },
  });

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); createCategory.mutate(); }} className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" className="border rounded-md px-3 py-2 text-sm w-64" />
        <button className="bg-brand-600 text-white px-4 py-2 rounded-md text-sm">Add Category</button>
      </form>
      <div className="grid grid-cols-3 gap-3">
        {categories?.map((c: any) => (
          <div key={c.id} className="bg-white border rounded-xl p-4">
            <div className="font-medium">{c.name}</div>
            {c.extraFields && <pre className="text-xs text-gray-400 mt-1">{JSON.stringify(c.extraFields)}</pre>}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmployeesTab() {
  const qc = useQueryClient();
  const { data: employees } = useQuery({ queryKey: ["employees"], queryFn: async () => (await api.get("/employees")).data });

  const promote = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => api.patch(`/employees/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => api.patch(`/employees/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });

  return (
    <table className="w-full text-sm bg-white border rounded-xl overflow-hidden">
      <thead className="bg-gray-50 text-left text-gray-500">
        <tr><th className="p-3">Name</th><th>Email</th><th>Department</th><th>Role</th><th>Status</th><th>Actions</th></tr>
      </thead>
      <tbody>
        {employees?.map((e: any) => (
          <tr key={e.id} className="border-t">
            <td className="p-3 font-medium">{e.name}</td>
            <td>{e.email}</td>
            <td>{e.department?.name || "—"}</td>
            <td><StatusBadge status={e.role} /></td>
            <td><StatusBadge status={e.status} /></td>
            <td className="space-x-2">
              <select
                className="text-xs border rounded px-1 py-0.5"
                value={e.role}
                onChange={(ev) => promote.mutate({ id: e.id, role: ev.target.value })}
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="ASSET_MANAGER">Asset Manager</option>
                <option value="DEPARTMENT_HEAD">Department Head</option>
              </select>
              <button onClick={() => toggleStatus.mutate({ id: e.id, status: e.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" })}
                className="text-xs text-brand-600 hover:underline">
                {e.status === "ACTIVE" ? "Deactivate" : "Activate"}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
