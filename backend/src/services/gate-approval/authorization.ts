import { prisma } from '../../config/database.js';
import { AdmissionGateStatus, UserRole } from '@prisma/client';

/**
 * Checks if the given user has a role that is allowed to approve the
 * specified gate step. ADMIN role always has access.
 */
export async function canDepartmentApprove(
  userId: string,
  gateStep: AdmissionGateStatus,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return false;

  // ADMIN always has approval rights
  if (user.role === 'ADMIN') return true;

  const configs = await prisma.gateStepConfig.findMany({
    where: { gateStep },
    select: { allowedRoles: true },
  });

  // If there are no configs for this gate step, deny by default
  if (configs.length === 0) return false;

  // User is allowed if their role appears in any config's allowedRoles
  return configs.some((cfg) =>
    cfg.allowedRoles.includes(user.role as UserRole),
  );
}
