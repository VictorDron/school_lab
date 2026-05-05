import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { requireAnyModuleAccess } from '../middlewares/auth.js';

type ModuleEntry = { module: string; accessLevel: string };

function runMiddleware(user: { role: string; moduleAccess: ModuleEntry[] } | null, modules: Parameters<typeof requireAnyModuleAccess>[0], level: Parameters<typeof requireAnyModuleAccess>[1] = 'VIEW') {
  const req = { user } as unknown as Request;
  const status = vi.fn().mockReturnThis();
  const json = vi.fn().mockReturnThis();
  const res = { status, json } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;

  requireAnyModuleAccess(modules, level)(req, res, next);

  return { status, json, next };
}

describe('requireAnyModuleAccess', () => {
  it('401s when user is not authenticated', () => {
    const { status, json, next } = runMiddleware(null, ['STUDENT_MANAGEMENT', 'CRM']);
    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('grants access when user is ADMIN regardless of moduleAccess', () => {
    const { next, status } = runMiddleware(
      { role: 'ADMIN', moduleAccess: [] },
      ['STUDENT_MANAGEMENT', 'CRM'],
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(status).not.toHaveBeenCalled();
  });

  it('grants access when user has only CRM (dual-permit accepts either module)', () => {
    const { next, status } = runMiddleware(
      { role: 'USER', moduleAccess: [{ module: 'CRM', accessLevel: 'VIEW' }] },
      ['STUDENT_MANAGEMENT', 'CRM'],
      'VIEW',
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(status).not.toHaveBeenCalled();
  });

  it('grants access when user has only STUDENT_MANAGEMENT (legacy path still works)', () => {
    const { next, status } = runMiddleware(
      { role: 'USER', moduleAccess: [{ module: 'STUDENT_MANAGEMENT', accessLevel: 'VIEW' }] },
      ['STUDENT_MANAGEMENT', 'CRM'],
      'VIEW',
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(status).not.toHaveBeenCalled();
  });

  it('denies when user has neither required module', () => {
    const { next, status, json } = runMiddleware(
      { role: 'USER', moduleAccess: [{ module: 'COMMUNICATION', accessLevel: 'ADMIN' }] },
      ['STUDENT_MANAGEMENT', 'CRM'],
      'VIEW',
    );
    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('denies when user has the module but not the minimum level', () => {
    const { next, status } = runMiddleware(
      { role: 'USER', moduleAccess: [{ module: 'CRM', accessLevel: 'VIEW' }] },
      ['STUDENT_MANAGEMENT', 'CRM'],
      'EDIT',
    );
    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
  });

  it('grants access when the user meets the level on one module even if the other is below', () => {
    const { next, status } = runMiddleware(
      {
        role: 'USER',
        moduleAccess: [
          { module: 'STUDENT_MANAGEMENT', accessLevel: 'VIEW' },
          { module: 'CRM', accessLevel: 'EDIT' },
        ],
      },
      ['STUDENT_MANAGEMENT', 'CRM'],
      'EDIT',
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(status).not.toHaveBeenCalled();
  });

  it('ADMIN access level on any of the modules satisfies VIEW requirement', () => {
    const { next } = runMiddleware(
      { role: 'USER', moduleAccess: [{ module: 'CRM', accessLevel: 'ADMIN' }] },
      ['STUDENT_MANAGEMENT', 'CRM'],
      'VIEW',
    );
    expect(next).toHaveBeenCalledTimes(1);
  });
});
