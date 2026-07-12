import { AssetStatus } from "@prisma/client";

// Explicit allow-list of asset lifecycle transitions.
// Every status-changing service call must go through canTransition() first,
// keeping the business rule in one place and easy to test/demo.
const ALLOWED_TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
  AVAILABLE: ["ALLOCATED", "RESERVED", "UNDER_MAINTENANCE", "LOST", "RETIRED"],
  ALLOCATED: ["AVAILABLE", "UNDER_MAINTENANCE", "LOST"],
  RESERVED: ["AVAILABLE", "ALLOCATED"],
  UNDER_MAINTENANCE: ["AVAILABLE", "RETIRED", "DISPOSED"],
  LOST: ["RETIRED", "DISPOSED"],
  RETIRED: ["DISPOSED"],
  DISPOSED: [],
};

export function canTransition(from: AssetStatus, to: AssetStatus): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: AssetStatus, to: AssetStatus) {
  if (!canTransition(from, to)) {
    const err: any = new Error(`Invalid asset status transition: ${from} -> ${to}`);
    err.statusCode = 409;
    throw err;
  }
}
