export default function KpiCard({ label, value, tone }: { label: string; value: number | string; tone?: "default" | "danger" }) {
  return (
    <div className={`rounded-xl border p-4 bg-white shadow-sm ${tone === "danger" ? "border-red-300" : "border-gray-200"}`}>
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${tone === "danger" ? "text-red-600" : "text-gray-900"}`}>{value}</div>
    </div>
  );
}
