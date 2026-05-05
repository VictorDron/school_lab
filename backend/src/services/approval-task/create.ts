import { prisma } from '../../config/database.js';
import logger from '../../utils/logger.js';
import { generateTaskCode } from '../task-boards.service.js';
import { createBulkNotifications } from '../notification.service.js';
import { sendGateApprovalEmail } from '../email.service.js';
import {
  FRONTEND_URL,
  EMAIL_THROTTLE_MS,
  delay,
  DEPARTMENT_LABELS,
  GATE_STEP_LABELS,
} from './constants.js';
import { getCrmApprovalBoard } from './board.js';

export async function createApprovalTask(
  approval: {
    id: string;
    leadId: string;
    gateStep: string;
    department: string;
    isRequired: boolean;
  },
  lead: {
    id: string;
    familyName: string;
    code: string;
  },
  createdById: string,
): Promise<void> {
  try {
    const board = await getCrmApprovalBoard(createdById);

    // Find the "Pendente" column
    const pendingColumn = board.columns.find((c) => c.name === 'Pendente');
    if (!pendingColumn) {
      logger.error('Approval task: "Pendente" column not found on CRM board');
      return;
    }

    // Determine next card order in column
    const lastCard = await prisma.taskCard.findFirst({
      where: { columnId: pendingColumn.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = lastCard ? lastCard.order + 1 : 0;

    const departmentLabel = DEPARTMENT_LABELS[approval.department] ?? approval.department;
    const gateStepLabel = GATE_STEP_LABELS[approval.gateStep] ?? approval.gateStep;

    // Find users whose roles match the department's allowedRoles
    const configs = await prisma.gateStepConfig.findMany({
      where: { gateStep: approval.gateStep as any },
      select: { allowedRoles: true },
    });

    const allowedRoles = [...new Set(configs.flatMap((c) => c.allowedRoles))];

    // Find users with matching roles or ADMIN role
    const assignableUsers = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { role: { in: allowedRoles as any[] } },
          { role: 'ADMIN' },
        ],
      },
      select: { id: true, email: true, displayName: true, emailNotificationsEnabled: true },
    });

    // Deduplicate user IDs
    const userIds = [...new Set(assignableUsers.map((u) => u.id))];

    // Create the task card
    const card = await prisma.taskCard.create({
      data: {
        code: generateTaskCode(),
        columnId: pendingColumn.id,
        title: `Aprovação: ${departmentLabel} - ${lead.familyName}`,
        description: `Aprovação pendente do departamento ${departmentLabel} para a família ${lead.familyName} (${lead.code}) na etapa ${gateStepLabel}.`,
        priority: 'HIGH',
        status: 'OPEN',
        order: nextOrder,
        createdById,
        sourceModule: 'CRM',
        sourceLeadId: lead.id,
        sourceType: 'GATE_APPROVAL',
        assignees: {
          create: userIds.map((userId) => ({ userId })),
        },
      },
    });

    // Link the card to the approval
    await prisma.admissionGateApproval.update({
      where: { id: approval.id },
      data: { taskCardId: card.id },
    });

    // Send notifications to assigned users
    if (userIds.length > 0) {
      await createBulkNotifications(userIds, {
        type: 'gate_approval_required',
        title: `Aprovação Pendente: ${departmentLabel}`,
        message: `Uma nova aprovação do departamento ${departmentLabel} está pendente para a família ${lead.familyName} (${lead.code}).`,
        data: {
          approvalId: approval.id,
          leadId: lead.id,
          taskCardId: card.id,
          department: approval.department,
          gateStep: approval.gateStep,
        },
      });
    }

    // Send email notifications to users who have it enabled (fire-and-forget)
    const usersWithEmailEnabled = assignableUsers.filter(
      (u) => u.emailNotificationsEnabled && u.email,
    );

    if (usersWithEmailEnabled.length > 0) {
      const leadUrl = `${FRONTEND_URL}/crm?lead=${lead.id}`;

      (async () => {
        for (let i = 0; i < usersWithEmailEnabled.length; i++) {
          if (i > 0) await delay(EMAIL_THROTTLE_MS);
          const user = usersWithEmailEnabled[i];
          try {
            await sendGateApprovalEmail({
              to: user.email,
              userName: user.displayName,
              departmentLabel,
              gateStepLabel,
              familyName: lead.familyName,
              leadCode: lead.code,
              leadUrl,
            });
          } catch (err) {
            logger.error('Failed to send gate approval email', { userId: user.id, error: err instanceof Error ? err.message : String(err) });
          }
        }
        logger.info(
          `Sent gate approval emails to ${usersWithEmailEnabled.length} user(s) for approval=${approval.id}`,
        );
      })().catch((err) => {
        logger.error('Error in gate approval email batch:', err);
      });
    }

    logger.info(
      `Approval task created: card=${card.id} approval=${approval.id} assignees=${userIds.length}`,
    );
  } catch (error) {
    logger.error('Failed to create approval task:', error);
  }
}
