import { prisma } from '../../config/database.js';
import logger from '../../utils/logger.js';

export async function completeApprovalTask(
  approvalId: string,
  decision: string,
): Promise<void> {
  try {
    const approval = await prisma.admissionGateApproval.findUnique({
      where: { id: approvalId },
      select: { taskCardId: true, taskCard: true },
    });

    if (!approval?.taskCardId || !approval.taskCard) {
      return;
    }

    // Find the "Concluído" column on the same board
    const currentColumn = await prisma.taskColumn.findUnique({
      where: { id: approval.taskCard.columnId },
      select: { boardId: true },
    });

    if (!currentColumn) return;

    const completedColumn = await prisma.taskColumn.findFirst({
      where: {
        boardId: currentColumn.boardId,
        name: 'Concluído',
      },
      select: { id: true },
    });

    if (!completedColumn) {
      logger.error('Approval task: "Concluído" column not found');
      return;
    }

    await prisma.taskCard.update({
      where: { id: approval.taskCardId },
      data: {
        columnId: completedColumn.id,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    logger.info(
      `Approval task completed: card=${approval.taskCardId} decision=${decision}`,
    );
  } catch (error) {
    logger.error('Failed to complete approval task:', error);
  }
}

export async function cancelApprovalTasks(leadId: string): Promise<void> {
  try {
    const approvals = await prisma.admissionGateApproval.findMany({
      where: {
        leadId,
        decision: 'PENDING',
        taskCardId: { not: null },
      },
      select: {
        id: true,
        taskCardId: true,
        taskCard: {
          select: { columnId: true },
        },
      },
    });

    if (approvals.length === 0) return;

    // Get board ID from the first approval's card column
    const firstCardColumn = approvals[0].taskCard
      ? await prisma.taskColumn.findUnique({
          where: { id: approvals[0].taskCard.columnId },
          select: { boardId: true },
        })
      : null;

    if (!firstCardColumn) return;

    const completedColumn = await prisma.taskColumn.findFirst({
      where: {
        boardId: firstCardColumn.boardId,
        name: 'Concluído',
      },
      select: { id: true },
    });

    if (!completedColumn) {
      logger.error('Cancel approval tasks: "Concluído" column not found');
      return;
    }

    // Move all linked cards to Concluído and mark as COMPLETED
    const cardIds = approvals
      .map((a) => a.taskCardId)
      .filter((id): id is string => id !== null);

    if (cardIds.length > 0) {
      await prisma.taskCard.updateMany({
        where: { id: { in: cardIds } },
        data: {
          columnId: completedColumn.id,
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }

    logger.info(
      `Cancelled ${cardIds.length} approval tasks for lead=${leadId}`,
    );
  } catch (error) {
    logger.error('Failed to cancel approval tasks:', error);
  }
}
