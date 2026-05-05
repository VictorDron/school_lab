import { prisma } from '../config/database.js';
import { AdmissionDepartment, AdmissionGateStatus, EscalationSeverity } from '@prisma/client';

const escalationInclude = {
  lead: { select: { id: true, code: true, familyName: true } },
  raisedBy: { select: { id: true, displayName: true } },
  resolvedBy: { select: { id: true, displayName: true } },
};

export async function createEscalation(
  data: {
    leadId: string;
    childId?: string;
    department: AdmissionDepartment;
    gateStep: AdmissionGateStatus;
    description: string;
    severity?: EscalationSeverity;
  },
  userId: string
) {
  const lead = await prisma.lead.findUnique({ where: { id: data.leadId } });
  if (!lead) throw new Error('LEAD_NOT_FOUND');

  return prisma.criticalIssueEscalation.create({
    data: {
      leadId: data.leadId,
      childId: data.childId,
      raisedById: userId,
      department: data.department,
      gateStep: data.gateStep,
      description: data.description,
      severity: data.severity,
    },
    include: {
      lead: { select: { id: true, code: true, familyName: true } },
      raisedBy: { select: { id: true, displayName: true } },
    },
  });
}

export async function resolveEscalation(id: string, notes: string, userId: string) {
  const escalation = await prisma.criticalIssueEscalation.findUnique({ where: { id } });
  if (!escalation) throw new Error('ESCALATION_NOT_FOUND');

  return prisma.criticalIssueEscalation.update({
    where: { id },
    data: {
      isResolved: true,
      resolvedById: userId,
      resolvedAt: new Date(),
      resolutionNotes: notes,
    },
    include: escalationInclude,
  });
}

export async function getActiveEscalations() {
  return prisma.criticalIssueEscalation.findMany({
    where: { isResolved: false },
    include: {
      lead: { select: { id: true, code: true, familyName: true } },
      raisedBy: { select: { id: true, displayName: true } },
    },
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function getLeadEscalations(leadId: string) {
  return prisma.criticalIssueEscalation.findMany({
    where: { leadId },
    include: {
      raisedBy: { select: { id: true, displayName: true } },
      resolvedBy: { select: { id: true, displayName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findById(id: string) {
  const escalation = await prisma.criticalIssueEscalation.findUnique({
    where: { id },
    include: escalationInclude,
  });
  if (!escalation) throw new Error('ESCALATION_NOT_FOUND');

  return escalation;
}
