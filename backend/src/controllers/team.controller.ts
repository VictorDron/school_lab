import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/index.js';
import * as TeamService from '../services/team.service.js';
import { createAuditLog } from '../services/audit.service.js';
import { EmploymentType } from '@prisma/client';

const employmentTypes = ['CLT', 'PJ', 'ESTAGIO', 'TERCEIRIZADO', 'AUTONOMO', 'TEMPORARIO'] as const;

// ==================== DEPARTMENTS ====================

const createDepartmentSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  headUserId: z.string().uuid().nullish(),
  parentDepartmentId: z.string().uuid().nullish(),
});

const updateDepartmentSchema = createDepartmentSchema.partial();

export async function listDepartments(_req: AuthenticatedRequest, res: Response) {
  const data = await TeamService.listDepartments();
  res.json({ success: true, data });
}

export async function createDepartment(req: AuthenticatedRequest, res: Response) {
  const parsed = createDepartmentSchema.parse(req.body);
  const dept = await TeamService.createDepartment({
    name: parsed.name,
    description: parsed.description,
    headUserId: parsed.headUserId ?? undefined,
    parentDepartmentId: parsed.parentDepartmentId ?? undefined,
  });
  await createAuditLog(
    {
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'DEPARTMENT_CREATED',
      entityType: 'DEPARTMENT',
      entityId: dept.id,
      metadata: { name: dept.name },
    },
    req,
  );
  res.status(201).json({ success: true, data: dept });
}

export async function updateDepartment(req: AuthenticatedRequest, res: Response) {
  const parsed = updateDepartmentSchema.parse(req.body);
  const dept = await TeamService.updateDepartment(req.params.id, parsed);
  if (!dept) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog(
    {
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'DEPARTMENT_UPDATED',
      entityType: 'DEPARTMENT',
      entityId: dept.id,
      metadata: parsed,
    },
    req,
  );
  res.json({ success: true, data: dept });
}

export async function deleteDepartment(req: AuthenticatedRequest, res: Response) {
  const dept = await TeamService.deleteDepartment(req.params.id);
  if (!dept) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog(
    {
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'DEPARTMENT_DELETED',
      entityType: 'DEPARTMENT',
      entityId: dept.id,
      metadata: { name: dept.name },
    },
    req,
  );
  res.json({ success: true });
}

// ==================== POSITIONS ====================

const createPositionSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  departmentId: z.string().uuid().nullish(),
});
const updatePositionSchema = createPositionSchema.partial();

export async function listPositions(_req: AuthenticatedRequest, res: Response) {
  const data = await TeamService.listPositions();
  res.json({ success: true, data });
}

export async function createPosition(req: AuthenticatedRequest, res: Response) {
  const parsed = createPositionSchema.parse(req.body);
  const pos = await TeamService.createPosition({
    name: parsed.name,
    description: parsed.description,
    departmentId: parsed.departmentId ?? undefined,
  });
  await createAuditLog(
    {
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'POSITION_CREATED',
      entityType: 'POSITION',
      entityId: pos.id,
      metadata: { name: pos.name },
    },
    req,
  );
  res.status(201).json({ success: true, data: pos });
}

export async function updatePosition(req: AuthenticatedRequest, res: Response) {
  const parsed = updatePositionSchema.parse(req.body);
  const pos = await TeamService.updatePosition(req.params.id, parsed);
  if (!pos) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog(
    {
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'POSITION_UPDATED',
      entityType: 'POSITION',
      entityId: pos.id,
      metadata: parsed,
    },
    req,
  );
  res.json({ success: true, data: pos });
}

export async function deletePosition(req: AuthenticatedRequest, res: Response) {
  const pos = await TeamService.deletePosition(req.params.id);
  if (!pos) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  await createAuditLog(
    {
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'POSITION_DELETED',
      entityType: 'POSITION',
      entityId: pos.id,
      metadata: { name: pos.name },
    },
    req,
  );
  res.json({ success: true });
}

// ==================== EMPLOYEES ====================

const employeeFiltersSchema = z.object({
  search:       z.string().optional(),
  departmentId: z.string().uuid().optional(),
  positionId:   z.string().uuid().optional(),
});

const updateEmployeeSchema = z.object({
  hireDate:       z.string().datetime().nullish(),
  employmentType: z.enum(employmentTypes).nullish(),
  departmentId:   z.string().uuid().nullish(),
  positionId:     z.string().uuid().nullish(),
  managerId:      z.string().uuid().nullish(),
  area:           z.string().max(120).nullish(),
});

export async function listEmployees(req: AuthenticatedRequest, res: Response) {
  const filters = employeeFiltersSchema.parse(req.query);
  const data = await TeamService.listEmployees(filters);
  res.json({ success: true, data });
}

export async function getEmployee(req: AuthenticatedRequest, res: Response) {
  const data = await TeamService.getEmployee(req.params.id);
  if (!data) return res.status(404).json({ success: false, error: 'NOT_FOUND' });
  res.json({ success: true, data });
}

export async function updateEmployee(req: AuthenticatedRequest, res: Response) {
  const parsed = updateEmployeeSchema.parse(req.body);
  const employee = await TeamService.updateEmployeeHR(req.params.id, {
    hireDate: parsed.hireDate ? new Date(parsed.hireDate) : parsed.hireDate as null | undefined,
    employmentType: parsed.employmentType as EmploymentType | null | undefined,
    departmentId: parsed.departmentId,
    positionId: parsed.positionId,
    managerId: parsed.managerId,
    area: parsed.area,
  });
  if (!employee) return res.status(404).json({ success: false, error: 'NOT_FOUND' });

  await createAuditLog(
    {
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      action: 'EMPLOYEE_HR_UPDATED',
      entityType: 'USER',
      entityId: employee.id,
      metadata: parsed,
    },
    req,
  );
  res.json({ success: true, data: employee });
}

// ==================== ORG CHART ====================

export async function getOrgChart(_req: AuthenticatedRequest, res: Response) {
  const data = await TeamService.getOrgChart();
  res.json({ success: true, data });
}
