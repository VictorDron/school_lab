import { prisma } from '../config/database.js';
import { requireTenantId } from '../lib/tenant-context.js';
import { EmploymentType } from '@prisma/client';

// ==================== TYPES ====================

export interface CreateDepartmentData {
  name: string;
  description?: string;
  headUserId?: string;
  parentDepartmentId?: string;
}

export interface UpdateDepartmentData {
  name?: string;
  description?: string | null;
  headUserId?: string | null;
  parentDepartmentId?: string | null;
}

export interface CreatePositionData {
  name: string;
  description?: string;
  departmentId?: string;
}

export interface UpdatePositionData {
  name?: string;
  description?: string | null;
  departmentId?: string | null;
}

export interface UpdateEmployeeHRData {
  hireDate?: Date | null;
  employmentType?: EmploymentType | null;
  departmentId?: string | null;
  positionId?: string | null;
  managerId?: string | null;
  area?: string | null;
}

const departmentInclude = {
  head:     { select: { id: true, displayName: true, email: true, avatarUrl: true } },
  parent:   { select: { id: true, name: true } },
  _count:   { select: { employees: true, positions: true, children: true } },
} as const;

const positionInclude = {
  department: { select: { id: true, name: true } },
  _count:     { select: { employees: true } },
} as const;

const employeeSelect = {
  id: true,
  email: true,
  displayName: true,
  fullName: true,
  avatarUrl: true,
  role: true,
  status: true,
  area: true,
  hireDate: true,
  employmentType: true,
  departmentId: true,
  positionId: true,
  managerId: true,
  isPlatformAdmin: true,
  department: { select: { id: true, name: true } },
  position:   { select: { id: true, name: true } },
  manager:    { select: { id: true, displayName: true, avatarUrl: true } },
  _count:     { select: { reports: true } },
} as const;

// ==================== DEPARTMENTS ====================

export async function listDepartments() {
  const tenantId = requireTenantId();
  return prisma.department.findMany({
    where: { tenantId },
    include: departmentInclude,
    orderBy: { name: 'asc' },
  });
}

export async function createDepartment(data: CreateDepartmentData) {
  const tenantId = requireTenantId();
  return prisma.department.create({
    data: {
      tenantId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      headUserId: data.headUserId || null,
      parentDepartmentId: data.parentDepartmentId || null,
    },
    include: departmentInclude,
  });
}

export async function updateDepartment(id: string, data: UpdateDepartmentData) {
  const tenantId = requireTenantId();
  const existing = await prisma.department.findFirst({ where: { id, tenantId } });
  if (!existing) return null;

  return prisma.department.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.description !== undefined && { description: data.description?.trim() || null }),
      ...(data.headUserId !== undefined && { headUserId: data.headUserId || null }),
      ...(data.parentDepartmentId !== undefined && { parentDepartmentId: data.parentDepartmentId || null }),
    },
    include: departmentInclude,
  });
}

export async function deleteDepartment(id: string) {
  const tenantId = requireTenantId();
  const existing = await prisma.department.findFirst({ where: { id, tenantId } });
  if (!existing) return null;
  await prisma.department.delete({ where: { id } });
  return existing;
}

// ==================== POSITIONS ====================

export async function listPositions() {
  const tenantId = requireTenantId();
  return prisma.position.findMany({
    where: { tenantId },
    include: positionInclude,
    orderBy: { name: 'asc' },
  });
}

export async function createPosition(data: CreatePositionData) {
  const tenantId = requireTenantId();
  return prisma.position.create({
    data: {
      tenantId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      departmentId: data.departmentId || null,
    },
    include: positionInclude,
  });
}

export async function updatePosition(id: string, data: UpdatePositionData) {
  const tenantId = requireTenantId();
  const existing = await prisma.position.findFirst({ where: { id, tenantId } });
  if (!existing) return null;

  return prisma.position.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.description !== undefined && { description: data.description?.trim() || null }),
      ...(data.departmentId !== undefined && { departmentId: data.departmentId || null }),
    },
    include: positionInclude,
  });
}

export async function deletePosition(id: string) {
  const tenantId = requireTenantId();
  const existing = await prisma.position.findFirst({ where: { id, tenantId } });
  if (!existing) return null;
  await prisma.position.delete({ where: { id } });
  return existing;
}

// ==================== EMPLOYEES ====================

export async function listEmployees(filters: { search?: string; departmentId?: string; positionId?: string }) {
  const tenantId = requireTenantId();

  const where: any = { tenantId };
  if (filters.departmentId) where.departmentId = filters.departmentId;
  if (filters.positionId)   where.positionId = filters.positionId;
  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { displayName: { contains: q, mode: 'insensitive' } },
      { fullName:    { contains: q, mode: 'insensitive' } },
      { email:       { contains: q, mode: 'insensitive' } },
    ];
  }

  return prisma.user.findMany({
    where,
    select: employeeSelect,
    orderBy: { displayName: 'asc' },
  });
}

export async function getEmployee(id: string) {
  const tenantId = requireTenantId();
  return prisma.user.findFirst({
    where: { id, tenantId },
    select: {
      ...employeeSelect,
      reports: { select: { id: true, displayName: true, avatarUrl: true, position: { select: { name: true } } } },
    },
  });
}

export async function updateEmployeeHR(id: string, data: UpdateEmployeeHRData) {
  const tenantId = requireTenantId();
  const existing = await prisma.user.findFirst({ where: { id, tenantId } });
  if (!existing) return null;

  return prisma.user.update({
    where: { id },
    data: {
      ...(data.hireDate !== undefined && { hireDate: data.hireDate }),
      ...(data.employmentType !== undefined && { employmentType: data.employmentType }),
      ...(data.departmentId !== undefined && { departmentId: data.departmentId || null }),
      ...(data.positionId !== undefined && { positionId: data.positionId || null }),
      ...(data.managerId !== undefined && { managerId: data.managerId || null }),
      ...(data.area !== undefined && { area: data.area || null }),
    },
    select: employeeSelect,
  });
}

// ==================== ORG CHART ====================

/**
 * Builds a department-rooted tree with employees nested under each
 * department. Departments without a parent are top-level. Detached
 * employees (no department) are returned in the `unassigned` bucket.
 */
export async function getOrgChart() {
  const tenantId = requireTenantId();

  const [departments, employees] = await Promise.all([
    prisma.department.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        parentDepartmentId: true,
        headUserId: true,
        head: { select: { id: true, displayName: true, avatarUrl: true } },
      },
    }),
    prisma.user.findMany({
      where: { tenantId, status: { in: ['ACTIVE', 'PENDING'] } },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        departmentId: true,
        position: { select: { id: true, name: true } },
      },
      orderBy: { displayName: 'asc' },
    }),
  ]);

  const byDept = new Map<string, typeof employees>();
  const unassigned: typeof employees = [];
  for (const e of employees) {
    if (e.departmentId) {
      const arr = byDept.get(e.departmentId) ?? [];
      arr.push(e);
      byDept.set(e.departmentId, arr);
    } else {
      unassigned.push(e);
    }
  }

  type Node = (typeof departments)[number] & {
    employees: typeof employees;
    children: Node[];
  };

  const nodes: Node[] = departments.map((d) => ({
    ...d,
    employees: byDept.get(d.id) ?? [],
    children: [],
  }));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const roots: Node[] = [];
  for (const n of nodes) {
    if (n.parentDepartmentId && byId.has(n.parentDepartmentId)) {
      byId.get(n.parentDepartmentId)!.children.push(n);
    } else {
      roots.push(n);
    }
  }

  return { roots, unassigned };
}
