import { prisma } from '../../config/database.js';

const CRM_BOARD_NAME = 'Aprovações CRM';

const BOARD_COLUMNS = [
  { name: 'Pendente', order: 0, color: '#F59E0B' },
  { name: 'Em Análise', order: 1, color: '#3B82F6' },
  { name: 'Concluído', order: 2, color: '#10B981' },
] as const;

// Module-level cache: avoids a board lookup on every approval task creation.
// Cleared if the cached board is found to be archived or deleted.
let cachedBoardId: string | null = null;

export async function getCrmApprovalBoard(createdById: string) {
  // Return from cache if available and still exists
  if (cachedBoardId) {
    const existing = await prisma.taskBoard.findUnique({
      where: { id: cachedBoardId },
      include: { columns: { orderBy: { order: 'asc' } } },
    });
    if (existing && !existing.isArchived) {
      return existing;
    }
    cachedBoardId = null;
  }

  // Try to find existing board by name
  const board = await prisma.taskBoard.findFirst({
    where: { name: CRM_BOARD_NAME },
    include: { columns: { orderBy: { order: 'asc' } } },
  });

  if (board) {
    cachedBoardId = board.id;
    return board;
  }

  // Create the board with its columns
  const newBoard = await prisma.taskBoard.create({
    data: {
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

  cachedBoardId = newBoard.id;
  return newBoard;
}
