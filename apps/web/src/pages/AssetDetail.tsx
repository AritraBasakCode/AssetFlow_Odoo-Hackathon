import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import StatusBadge from "../components/StatusBadge";

export default function AssetDetail() {
  const { id } = useParams();
  const { data: asset } = useQuery({ queryKey: ["asset", id], queryFn: async () => (await api.get(`/assets/${id}`)).data });

  if (!asset) return <p className="text-gray-400 text-sm">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{asset.assetTag} — {asset.name}</h1>
          <p className="text-sm text-gray-500">{asset.category?.name} · {asset.location}</p>
        </div>
        <StatusBadge status={asset.status} />
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <Info label="Serial Number" value={asset.serialNumber} />
        <Info label="Condition" value={asset.condition} />
        <Info label="Acquisition Date" value={new Date(asset.acquisitionDate).toLocaleDateString()} />
        <Info label="Department" value={asset.department?.name || "—"} />
        <Info label="Bookable" value={asset.isBookable ? "Yes" : "No"} />
      </div>

      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Allocation History</h2>
        {asset.allocations?.length ? (
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 border-b"><tr><th className="py-1">Employee</th><th>Allocated</th><th>Returned</th><th>Status</th></tr></thead>
            <tbody>
              {asset.allocations.map((a: any) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="py-1">{a.employee?.name || "—"}</td>
                  <td>{new Date(a.allocatedAt).toLocaleDateString()}</td>
                  <td>{a.returnedAt ? new Date(a.returnedAt).toLocaleDateString() : "—"}</td>
                  <td><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-sm text-gray-400">No allocation history yet.</p>}
      </div>

      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Maintenance History</h2>
        {asset.maintenanceRequests?.length ? (
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 border-b"><tr><th className="py-1">Issue</th><th>Priority</th><th>Status</th><th>Raised</th></tr></thead>
            <tbody>
              {asset.maintenanceRequests.map((m: any) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="py-1">{m.issueDescription}</td>
                  <td>{m.priority}</td>
                  <td><StatusBadge status={m.status} /></td>
                  <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-sm text-gray-400">No maintenance history yet.</p>}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border rounded-xl p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
