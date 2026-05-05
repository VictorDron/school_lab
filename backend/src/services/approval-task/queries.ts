import { prisma } from '../../config/database.js';

export async function getMyPendingApprovalTasks(userId: string) {
  const cards = await prisma.taskCard.findMany({
    where: {
      sourceModule: 'CRM',
      sourceType: 'GATE_APPROVAL',
      status: 'OPEN',
      assignees: {
        some: { userId },
      },
    },
    include: {
      gateApproval: {
        include: {
          lead: {
            select: {
              id: true,
              code: true,
              familyName: true,
              admissionGateStatus: true,
            },
          },
        },
      },
      assignees: {
        include: {
          user: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
      },
      column: {
        select: { id: true, name: true, color: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return cards;
}

export async function getPendingSummary(userId: string) {
  // All pending CRM approval task cards
  const pendingCards = await prisma.taskCard.findMany({
    where: {
      sourceModule: 'CRM',
      sourceType: 'GATE_APPROVAL',
      status: 'OPEN',
    },
    select: {
      id: true,
      createdAt: true,
      gateApproval: {
        select: { department: true },
      },
      assignees: {
        select: { userId: true },
      },
    },
  });

  const now = new Date();
  const overdueThresholdMs = 48 * 60 * 60 * 1000; // 48 hours

  let overdue = 0;
  let myPending = 0;
  const byDepartment: Record<string, number> = {};

  for (const card of pendingCards) {
    // Count by department
    const dept = card.gateApproval?.department;
    if (dept) {
      byDepartment[dept] = (byDepartment[dept] ?? 0) + 1;
    }

    // Count overdue (created more than 48h ago)
    if (now.getTime() - card.createdAt.getTime() > overdueThresholdMs) {
      overdue++;
    }

    // Count tasks assigned to current user
    if (card.assignees.some((a) => a.userId === userId)) {
      myPending++;
    }
  }

  return {
    totalPending: pendingCards.length,
    byDepartment,
    overdue,
    myPending,
  };
}
