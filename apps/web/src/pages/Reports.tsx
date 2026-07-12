import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export default function Reports() {
  const { data: utilization } = useQuery({ queryKey: ["report-utilization"], queryFn: async () => (await api.get("/reports/utilization")).data });
  const { data: maintenanceFreq } = useQuery({ queryKey: ["report-maintenance"], queryFn: async () => (await api.get("/reports/maintenance-frequency")).data });
  const { data: deptSummary } = useQuery({ queryKey: ["report-dept"], queryFn: async () => (await api.get("/reports/department-summary")).data });
  const { data: heatmap } = useQuery({ queryKey: ["report-heatmap"], queryFn: async () => (await api.get("/reports/booking-heatmap")).data });
  const { data: retiring } = useQuery({ queryKey: ["report-retiring"], queryFn: async () => (await api.get("/reports/nearing-retirement")).data });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Reports & Analytics</h1>
        <button onClick={() => window.print()} className="bg-white border text-sm px-4 py-2 rounded-md hover:bg-gray-50">Export (Print/PDF)</button>
      </div>

      <Section title="Most-Used Assets (utilization)">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500 border-b"><tr><th className="py-1">Asset</th><th>Usage Count</th></tr></thead>
          <tbody>
            {utilization?.slice(0, 10).map((a: any) => (
              <tr key={a.id} className="border-b last:border-0"><td className="py-1">{a.assetTag} — {a.name}</td><td>{a.usageCount}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Maintenance Frequency">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500 border-b"><tr><th className="py-1">Asset</th><th>Requests</th></tr></thead>
          <tbody>
            {maintenanceFreq?.map((m: any) => (
              <tr key={m.asset?.id} className="border-b last:border-0"><td className="py-1">{m.asset?.assetTag} — {m.asset?.name}</td><td>{m.requestCount}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Department-wise Allocation Summary">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500 border-b"><tr><th className="py-1">Department</th><th>Assets</th><th>Members</th></tr></thead>
          <tbody>
            {deptSummary?.map((d: any) => (
              <tr key={d.id} className="border-b last:border-0"><td className="py-1">{d.name}</td><td>{d.assetCount}</td><td>{d.memberCount}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Resource Booking Heatmap (by hour of day)">
        <div className="flex gap-1 items-end h-24">
          {Array.from({ length: 24 }).map((_, hour) => {
            const count = heatmap?.[hour] || 0;
            const max = Math.max(1, ...Object.values(heatmap || {}).map(Number));
            return (
              <div key={hour} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-brand-500 rounded-t" style={{ height: `${(count / max) * 80}px` }} title={`${count} bookings`} />
                <span className="text-[9px] text-gray-400">{hour}</span>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Assets Nearing Retirement (4+ years old)">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500 border-b"><tr><th className="py-1">Asset</th><th>Acquired</th></tr></thead>
          <tbody>
            {retiring?.map((a: any) => (
              <tr key={a.id} className="border-b last:border-0"><td className="py-1">{a.assetTag} — {a.name}</td><td>{new Date(a.acquisitionDate).toLocaleDateString()}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <h2 className="font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}
