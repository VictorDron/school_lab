import { api } from '@/lib/api';

export type EmploymentType = 'CLT' | 'PJ' | 'ESTAGIO' | 'TERCEIRIZADO' | 'AUTONOMO' | 'TEMPORARIO';

export interface Department {
  id: string;
  name: string;
  description: string | null;
  headUserId: string | null;
  parentDepartmentId: string | null;
  createdAt: string;
  updatedAt: string;
  head: { id: string; displayName: string; email: string; avatarUrl: string | null } | null;
  parent: { id: string; name: string } | null;
  _count: { employees: number; positions: number; children: number };
}

export interface Position {
  id: string;
  name: string;
  description: string | null;
  departmentId: string | null;
  createdAt: string;
  updatedAt: string;
  department: { id: string; name: string } | null;
  _count: { employees: number };
}

export interface EmployeeSummary {
  id: string;
  email: string;
  displayName: string;
  fullName: string;
  avatarUrl: string | null;
  role: string;
  status: string;
  area: string | null;
  hireDate: string | null;
  employmentType: EmploymentType | null;
  departmentId: string | null;
  positionId: string | null;
  managerId: string | null;
  isPlatformAdmin: boolean;
  department: { id: string; name: string } | null;
  position: { id: string; name: string } | null;
  manager: { id: string; displayName: string; avatarUrl: string | null } | null;
  _count: { reports: number };
}

export interface OrgChartNode {
  id: string;
  name: string;
  description: string | null;
  parentDepartmentId: string | null;
  headUserId: string | null;
  head: { id: string; displayName: string; avatarUrl: string | null } | null;
  employees: Array<{
    id: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
    departmentId: string | null;
    position: { id: string; name: string } | null;
  }>;
  children: OrgChartNode[];
}

export interface OrgChart {
  roots: OrgChartNode[];
  unassigned: OrgChartNode['employees'];
}

// ==================== DEPARTMENTS ====================
export const teamApi = {
  listDepartments: () =>
    api.get<{ success: true; data: Department[] }>('/team/departments').then((r) => r.data.data),
  createDepartment: (body: { name: string; description?: string; headUserId?: string | null; parentDepartmentId?: string | null }) =>
    api.post<{ success: true; data: Department }>('/team/departments', body).then((r) => r.data.data),
  updateDepartment: (id: string, body: Partial<{ name: string; description: string | null; headUserId: string | null; parentDepartmentId: string | null }>) =>
    api.patch<{ success: true; data: Department }>(`/team/departments/${id}`, body).then((r) => r.data.data),
  deleteDepartment: (id: string) =>
    api.delete<{ success: true }>(`/team/departments/${id}`).then((r) => r.data),

  // ==================== POSITIONS ====================
  listPositions: () =>
    api.get<{ success: true; data: Position[] }>('/team/positions').then((r) => r.data.data),
  createPosition: (body: { name: string; description?: string; departmentId?: string | null }) =>
    api.post<{ success: true; data: Position }>('/team/positions', body).then((r) => r.data.data),
  updatePosition: (id: string, body: Partial<{ name: string; description: string | null; departmentId: string | null }>) =>
    api.patch<{ success: true; data: Position }>(`/team/positions/${id}`, body).then((r) => r.data.data),
  deletePosition: (id: string) =>
    api.delete<{ success: true }>(`/team/positions/${id}`).then((r) => r.data),

  // ==================== EMPLOYEES ====================
  listEmployees: (filters: { search?: string; departmentId?: string; positionId?: string } = {}) =>
    api
      .get<{ success: true; data: EmployeeSummary[] }>('/team/employees', { params: filters })
      .then((r) => r.data.data),
  getEmployee: (id: string) =>
    api
      .get<{ success: true; data: EmployeeSummary & { reports: Array<{ id: string; displayName: string; avatarUrl: string | null; position: { name: string } | null }> } }>(`/team/employees/${id}`)
      .then((r) => r.data.data),
  updateEmployee: (
    id: string,
    body: Partial<{
      hireDate: string | null;
      employmentType: EmploymentType | null;
      departmentId: string | null;
      positionId: string | null;
      managerId: string | null;
      area: string | null;
    }>,
  ) => api.patch<{ success: true; data: EmployeeSummary }>(`/team/employees/${id}`, body).then((r) => r.data.data),

  // ==================== ORG CHART ====================
  getOrgChart: () =>
    api.get<{ success: true; data: OrgChart }>('/team/org-chart').then((r) => r.data.data),
};

export const employmentTypeLabel: Record<EmploymentType, string> = {
  CLT:           'CLT',
  PJ:            'PJ',
  ESTAGIO:       'Estágio',
  TERCEIRIZADO:  'Terceirizado',
  AUTONOMO:      'Autônomo',
  TEMPORARIO:    'Temporário',
};
