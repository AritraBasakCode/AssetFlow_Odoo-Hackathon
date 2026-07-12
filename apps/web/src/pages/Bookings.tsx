import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import StatusBadge from "../components/StatusBadge";

export default function Bookings() {
  const qc = useQueryClient();
  const { data: assets } = useQuery({ queryKey: ["bookable-assets"], queryFn: async () => (await api.get("/assets")).data });
  const bookableAssets = assets?.filter((a: any) => a.isBookable) || [];

  const [assetId, setAssetId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: assetBookings } = useQuery({
    queryKey: ["asset-bookings", assetId],
    queryFn: async () => (await api.get(`/bookings/asset/${assetId}`)).data,
    enabled: !!assetId,
  });

  const { data: myBookings } = useQuery({ queryKey: ["my-bookings"], queryFn: async () => (await api.get("/bookings/mine")).data });

  const book = useMutation({
    mutationFn: async () => api.post("/bookings", { assetId, startTime: start, endTime: end }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-bookings"] }); qc.invalidateQueries({ queryKey: ["asset-bookings", assetId] }); setError(null); },
    onError: (e: any) => setError(e.response?.data?.error || "Booking failed"),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => api.patch(`/bookings/${id}/cancel`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-bookings"] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Resource Booking</h1>

      <form onSubmit={(e) => { e.preventDefault(); book.mutate(); }} className="bg-white border rounded-xl p-4 grid grid-cols-4 gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Resource</label>
          <select required value={assetId} onChange={(e) => setAssetId(e.target.value)} className="border rounded-md px-3 py-2 text-sm w-full">
            <option value="">Select resource...</option>
            {bookableAssets.map((a: any) => <option key={a.id} value={a.id}>{a.name} ({a.location})</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Start</label>
          <input required type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="border rounded-md px-3 py-2 text-sm w-full" />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">End</label>
          <input required type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="border rounded-md px-3 py-2 text-sm w-full" />
        </div>
        <button className="bg-brand-600 text-white text-sm py-2 rounded-md">Book</button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {assetId && (
        <div className="bg-white border rounded-xl p-4">
          <h2 className="font-semibold mb-3">Existing Bookings for Selected Resource</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 border-b"><tr><th className="py-1">Booked By</th><th>Start</th><th>End</th><th>Status</th></tr></thead>
            <tbody>
              {assetBookings?.map((b: any) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="py-1">{b.bookedBy?.name}</td>
                  <td>{new Date(b.startTime).toLocaleString()}</td>
                  <td>{new Date(b.endTime).toLocaleString()}</td>
                  <td><StatusBadge status={b.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold mb-3">My Bookings</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500 border-b"><tr><th className="py-1">Resource</th><th>Start</th><th>End</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {myBookings?.map((b: any) => (
              <tr key={b.id} className="border-b last:border-0">
                <td className="py-1">{b.asset.name}</td>
                <td>{new Date(b.startTime).toLocaleString()}</td>
                <td>{new Date(b.endTime).toLocaleString()}</td>
                <td><StatusBadge status={b.status} /></td>
                <td>{b.status === "UPCOMING" && (
                  <button onClick={() => cancel.mutate(b.id)} className="text-xs text-red-600 hover:underline">Cancel</button>
                )}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
