import { prisma } from '../../config/database.js';
import { requireTenantId } from '../../lib/tenant-context.js';

const CRM_BOARD_NAME = 'Aprovações CRM';

const BOARD_COLUMNS = [
  { name: 'Pendente', order: 0, color: '#F59E0B' },
  { name: 'Em Análise', order: 1, color: '#3B82F6' },
  { name: 'Concluído', order: 2, color: '#10B981' },
] as const;

// Module-level cache keyed by tenant — was a single id pre-2f, which would
// have returned tenant A's board to a tenant B request. Phase 5 RLS will
// also block that at the DB level, but we want correct behavior here too.
// Cleared per-tenant when the cached board is archived or deleted.
const cachedBoardIdByTenant = new Map<string, string>();

export async function getCrmApprovalBoard(createdById: string) {
  const tenantId = requireTenantId();

  // Return from cache if available and still exists in THIS tenant.
  const cachedId = cachedBoardIdByTenant.get(tenantId);
  if (cachedId) {
    // findFirst (not findUnique) so the auto-scope middleware re-validates
    // the board belongs to the caller's tenant.
    const existing = await prisma.taskBoard.findFirst({
      where: { id: cachedId },
      include: { columns: { orderBy: { order: 'asc' } } },
    });
    if (existing && !existing.isArchived) {
      return existing;
    }
    cachedBoardIdByTenant.delete(tenantId);
  }

  // Try to find existing board by name (auto-scoped by tenant).
  const board = await prisma.taskBoard.findFirst({
    where: { name: CRM_BOARD_NAME },
    include: { columns: { orderBy: { order: 'asc' } } },
  });

  if (board) {
    cachedBoardIdByTenant.set(tenantId, board.id);
    return board;
  }

  // Create the board with its columns
  const newBoard = await prisma.taskBoard.create({
    data: {
      tenantId,
      name: CRM_BOARD_NAME,
      description: 'Quadro automático para aprovações do CRM de admissões',
      visibility: 'PUBLIC',
      createdById,
      columns: {
        create: BOARD_COLUMNS.map((col) => ({
          name: col.name,
          order: col.order,
          color: col.color,
        })),
      },
    },
    include: { columns: { orderBy: { order: 'asc' } } },
  });

  cachedBoardIdByTenant.set(tenantId, newBoard.id);
  return newBoard;
}
