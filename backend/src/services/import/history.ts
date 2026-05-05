import { prisma } from '../../config/database.js';
import { requireTenantId } from '../../lib/tenant-context.js';
import type { RowError } from '../../types/import.types.js';

export async function createImportHistory(data: {
  userId: string;
  fileName: string;
  fileSize: number | null;
  totalRows: number;
}) {
  return prisma.importHistory.create({
    data: {
      tenantId: requireTenantId(),
      userId: data.userId,
      fileName: data.fileName,
      fileSize: data.fileSize,
      totalRows: data.totalRows,
      status: 'PROCESSING',
    },
  });
}

/**
 * Patch ImportHistory with progress counts, accumulated errors, and final
 * status. The bulk-import worker calls this every few rows so the UI can
 * poll a live counter — keep the payload partial so callers can update
 * just the deltas they care about.
 */
export async function updateImportHistory(
  id: string,
  data: {
    created?: number;
    updated?: number;
    failed?: number;
    skipped?: number;
    errors?: RowError[];
    createdStudentIds?: string[];
    status?: string;
  },
) {
  return prisma.importHistory.update({
    where: { id },
    data: {
      created: data.created,
      updated: data.updated,
      failed: data.failed,
      skipped: data.skipped,
      errors: data.errors as any,
      createdStudentIds: data.createdStudentIds as any,
      status: data.status,
    },
  });
}

export async function getImportHistory(id: string) {
  return prisma.importHistory.findUnique({ where: { id } });
}

export async function listImportHistories(
  userId?: string,
  page = 1,
  limit = 20,
): Promise<{
  data: any[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}> {
  const where = userId ? { userId } : {};
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.importHistory.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, email: true, displayName: true },
        },
      },
    }),
    prisma.importHistory.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
