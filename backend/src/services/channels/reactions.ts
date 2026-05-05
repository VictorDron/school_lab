import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/errorHandler.js';

/**
 * Idempotent — re-adding the same reaction is a no-op via upsert. The
 * unique key is (messageId, userId, emoji) so each user gets one of each
 * emoji per message.
 */
export async function addReaction(
  messageId: string,
  channelId: string,
  userId: string,
  emoji: string,
) {
  const message = await prisma.message.findFirst({
    where: { id: messageId, channelId, isDeleted: false },
  });

  if (!message) {
    throw new AppError(404, 'Mensagem não encontrada', 'MESSAGE_NOT_FOUND');
  }

  return prisma.messageReaction.upsert({
    where: { messageId_userId_emoji: { messageId, userId, emoji } },
    create: { messageId, userId, emoji },
    update: {},
  });
}

export async function removeReaction(messageId: string, userId: string, emoji: string) {
  await prisma.messageReaction.deleteMany({
    where: { messageId, userId, emoji },
  });
}
