import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@assetflow.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { name: "System Admin", email: adminEmail, passwordHash, role: "ADMIN" },
  });
  console.log(`Admin ready: ${admin.email} / ${adminPassword}`);

  const engineering = await prisma.department.upsert({
    where: { name: "Engineering" },
    update: {},
    create: { name: "Engineering" },
  });
  const operations = await prisma.department.upsert({
    where: { name: "Operations" },
    update: {},
    create: { name: "Operations" },
  });

  const electronics = await prisma.assetCategory.upsert({
    where: { name: "Electronics" },
    update: {},
    create: { name: "Electronics", extraFields: { warrantyMonths: 24 } },
  });
  const furniture = await prisma.assetCategory.upsert({
    where: { name: "Furniture" },
    update: {},
    create: { name: "Furniture" },
  });
  await prisma.assetCategory.upsert({
    where: { name: "Vehicles" },
    update: {},
    create: { name: "Vehicles", extraFields: { insuranceRenewalMonths: 12 } },
  });

  const priyaHash = await bcrypt.hash("Employee@123", 12);
  const priya = await prisma.user.upsert({
    where: { email: "priya@assetflow.com" },
    update: {},
    create: { name: "Priya Sharma", email: "priya@assetflow.com", passwordHash: priyaHash, role: "EMPLOYEE", departmentId: engineering.id },
  });
  const rajHash = await bcrypt.hash("Employee@123", 12);
  await prisma.user.upsert({
    where: { email: "raj@assetflow.com" },
    update: {},
    create: { name: "Raj Verma", email: "raj@assetflow.com", passwordHash: rajHash, role: "EMPLOYEE", departmentId: engineering.id },
  });

  const assetManagerHash = await bcrypt.hash("Manager@123", 12);
  await prisma.user.upsert({
    where: { email: "manager@assetflow.com" },
    update: {},
    create: { name: "Asha Manager", email: "manager@assetflow.com", passwordHash: assetManagerHash, role: "ASSET_MANAGER", departmentId: operations.id },
  });

  const laptop = await prisma.asset.upsert({
    where: { assetTag: "AF-0001" },
    update: {},
    create: {
      assetTag: "AF-0001",
      name: "Dell Latitude 5540",
      categoryId: electronics.id,
      serialNumber: "SN-LAPTOP-001",
      acquisitionDate: new Date("2024-01-15"),
      acquisitionCost: 85000,
      condition: "Good",
      location: "HQ - 3rd Floor",
      departmentId: engineering.id,
      status: "ALLOCATED",
    },
  });

  await prisma.assetAllocation.upsert({
    where: { id: "seed-allocation-1" },
    update: {},
    create: {
      id: "seed-allocation-1",
      assetId: laptop.id,
      employeeId: priya.id,
      expectedReturnDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    },
  });

  await prisma.asset.upsert({
    where: { assetTag: "AF-0002" },
    update: {},
    create: {
      assetTag: "AF-0002",
      name: "Conference Room B2",
      categoryId: furniture.id,
      serialNumber: "SN-ROOM-B2",
      acquisitionDate: new Date("2023-06-01"),
      condition: "Good",
      location: "HQ - 2nd Floor",
      isBookable: true,
      status: "AVAILABLE",
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
