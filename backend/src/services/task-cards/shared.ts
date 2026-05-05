import { prisma } from '../../config/database.js';

export const CARD_LIST_INCLUDE = {
  assignees: {
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  },
  labels: { include: { label: true } },
  column: { select: { name: true, boardId: true } },
} as const;

/**
 * Find which board a card lives on. Used by the realtime publisher to
 * route updates to the right board room — broadcasting to a board the
 * card no longer belongs to would leak to unrelated subscribers.
 */
export async function getBoardIdFromCard(cardId: string): Promise<string | null> {
  const card = await prisma.taskCard.findUnique({
    where: { id: cardId },
    include: { column: { select: { boardId: true } } },
  });
  return card?.column?.boardId ?? null;
}
