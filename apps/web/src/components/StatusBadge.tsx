const COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-700",
  ALLOCATED: "bg-blue-100 text-blue-700",
  RESERVED: "bg-yellow-100 text-yellow-700",
  UNDER_MAINTENANCE: "bg-orange-100 text-orange-700",
  LOST: "bg-red-100 text-red-700",
  RETIRED: "bg-gray-200 text-gray-600",
  DISPOSED: "bg-gray-300 text-gray-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  RESOLVED: "bg-green-100 text-green-700",
  UPCOMING: "bg-blue-100 text-blue-700",
  ONGOING: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-200 text-gray-600",
  ACTIVE: "bg-green-100 text-green-700",
  RETURNED: "bg-gray-200 text-gray-600",
  VERIFIED: "bg-green-100 text-green-700",
  MISSING: "bg-red-100 text-red-700",
  DAMAGED: "bg-orange-100 text-orange-700",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${COLORS[status] || "bg-gray-100 text-gray-700"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
