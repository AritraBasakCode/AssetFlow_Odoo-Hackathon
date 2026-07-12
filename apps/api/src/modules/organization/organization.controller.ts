import { Response } from "express";
import { AuthedRequest } from "../../middleware/auth";
import { prisma } from "../../lib/prisma";
import { Prisma } from "@prisma/client";
import { logActivity, notify } from "../../services/notification.service";

// ---------- Departments ----------
export async function listDepartments(req: AuthedRequest, res: Response) {
  const departments = await prisma.department.findMany({
    include: { head: { select: { id: true, name: true } }, parent: true, _count: { select: { members: true, assets: true } } },
    orderBy: { name: "asc" },
  });
  res.json(departments);
}

export async function createDepartment(req: AuthedRequest, res: Response) {
  const dept = await prisma.department.create({ data: req.body });
  await logActivity(prisma, req.user!.id, "DEPARTMENT_CREATED", "Department", dept.id);
  res.status(201).json(dept);
}

export async function updateDepartment(req: AuthedRequest, res: Response) {
  const dept = await prisma.department.update({ where: { id: req.params.id }, data: req.body });
  await logActivity(prisma, req.user!.id, "DEPARTMENT_UPDATED", "Department", dept.id, req.body);
  res.json(dept);
}

// ---------- Asset Categories ----------
export async function listCategories(req: AuthedRequest, res: Response) {
  const categories = await prisma.assetCategory.findMany({ orderBy: { name: "asc" } });
  res.json(categories);
}

export async function createCategory(req: AuthedRequest, res: Response) {
  const category = await prisma.assetCategory.create({ data: req.body });
  await logActivity(prisma, req.user!.id, "CATEGORY_CREATED", "AssetCategory", category.id);
  res.status(201).json(category);
}

export async function updateCategory(req: AuthedRequest, res: Response) {
  const category = await prisma.assetCategory.update({ where: { id: req.params.id }, data: req.body });
  await logActivity(prisma, req.user!.id, "CATEGORY_UPDATED", "AssetCategory", category.id, req.body);
  res.json(category);
}

// ---------- Employee Directory ----------
export async function listEmployees(req: AuthedRequest, res: Response) {
  const employees = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, status: true, departmentId: true, department: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  res.json(employees);
}

// The ONLY endpoint in the system that can assign ASSET_MANAGER / DEPARTMENT_HEAD.
// Guarded by requireRole(ADMIN) at the route level.
export async function promoteEmployee(req: AuthedRequest, res: Response) {
  const { role } = req.body;
  const targetId = req.params.id;

  const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updated = await tx.user.update({ where: { id: targetId }, data: { role } });
    await logActivity(tx, req.user!.id, "EMPLOYEE_ROLE_CHANGED", "User", targetId, { newRole: role });
    await notify(tx, targetId, "ROLE_CHANGED", `Your role was updated to ${role.replace("_", " ")}.`);
    return updated;
  });

  res.json(user);
}

export async function updateEmployeeStatus(req: AuthedRequest, res: Response) {
  const { status } = req.body;
  const targetId = req.params.id;

  const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updated = await tx.user.update({ where: { id: targetId }, data: { status } });
    // Deactivation revokes all active sessions immediately.
    if (status === "INACTIVE") {
      await tx.session.deleteMany({ where: { userId: targetId } });
    }
    await logActivity(tx, req.user!.id, "EMPLOYEE_STATUS_CHANGED", "User", targetId, { status });
    return updated;
  });

  res.json(user);
}
