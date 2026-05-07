import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';

const NOT_IMPLEMENTED = (res: Response) =>
  res.status(501).json({ success: false, error: 'NOT_IMPLEMENTED', message: 'Endpoint scaffolded — implementation pending.' });

// ==================== DEPARTMENTS ====================
export async function listDepartments(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function createDepartment(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function updateDepartment(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function deleteDepartment(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }

// ==================== POSITIONS ====================
export async function listPositions(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function createPosition(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function updatePosition(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function deletePosition(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }

// ==================== EMPLOYEES ====================
export async function listEmployees(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function getEmployee(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
export async function updateEmployee(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }

// ==================== ORG CHART ====================
export async function getOrgChart(_req: AuthenticatedRequest, res: Response) { return NOT_IMPLEMENTED(res); }
