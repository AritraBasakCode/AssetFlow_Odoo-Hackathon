import { prisma } from "../lib/prisma";

// Generates sequential tags like AF-0001, AF-0002...
export async function generateAssetTag(): Promise<string> {
  const count = await prisma.asset.count();
  const next = count + 1;
  return `AF-${String(next).padStart(4, "0")}`;
}
