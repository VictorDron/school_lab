import { prisma } from '../config/database.js';
import { CrmEventType, VisitStatus, VivenciaStatus } from '@prisma/client';
import * as AdmissionGateService from './admission-gate.service.js';
import * as GateApprovalService from './gate-approval.service.js';
import logger from '../utils/logger.js';
import { getNotificationRecipients } from '../utils/notification-contacts.js';

export interface CreateEventData {
  leadId: string;
  eventType: CrmEventType;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  color?: string;
  assignedTeacherId?: string;
  force?: boolean;
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  color?: string;
  assignedTeacherId?: string | null;
}

export interface EventFilters {
  startDate?: string;
  endDate?: string;
  eventType?: CrmEventType;
  leadId?: string;
}

// Custom error for schedule conflicts (warning, not blocking)
export class ScheduleConflictError extends Error {
  public conflicts: any[];
  constructor(conflicts: any[]) {
    super('SCHEDULE_CONFLICT');
    this.conflicts = conflicts;
  }
}

// Find overlapping events in the same time range (excludes CANCELLED/NO_SHOW)
async function findConflicts(
  startDate: Date,
  endDate: Date,
  excludeEventId?: string,
) {
  const where: any = {
    // Overlap: existing.start < new.end AND existing.end > new.start
    startDate: { lt: endDate },
    endDate: { gt: startDate },
    // Only active events
    OR: [
      { visitStatus: { in: ['SCHEDULED', 'COMPLETED'] } },
      { vivenciaStatus: { in: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] } },
    ],
  };

  if (excludeEventId) {
    where.id = { not: excludeEventId };
  }

  return prisma.crmEvent.findMany({
    where,
    include: {
      lead: { select: { id: true, code: true, familyName: true } },
    },
    orderBy: { startDate: 'asc' },
  });
}

const eventDetailInclude = {
  lead: { select: { id: true, code: true, familyName: true, primaryContactName: true } },
  createdBy: { select: { id: true, displayName: true } },
  assignedTeacher: { select: { id: true, displayName: true } },
  evaluations: {
    include: {
      child: { select: { id: true, fullName: true } },
      evaluatedBy: { select: { id: true, displayName: true } },
      decisionBy: { select: { id: true, displayName: true } },
    },
  },
};

const eventListInclude = {
  lead: { select: { id: true, code: true, familyName: true, primaryContactName: true } },
  createdBy: { select: { id: true, displayName: true } },
  assignedTeacher: { select: { id: true, displayName: true } },
  _count: { select: { evaluations: true } },
};


export async function findMany(filters: EventFilters) {
  const where: any = {};

  if (filters.eventType) where.eventType = filters.eventType;
  if (filters.leadId) where.leadId = filters.leadId;
  if (filters.startDate || filters.endDate) {
    where.startDate = {};
    if (filters.startDate) where.startDate.gte = new Date(filters.startDate);
    if (filters.endDate) where.startDate.lte = new Date(filters.endDate);
  }

  return prisma.crmEvent.findMany({
    where,
    include: eventListInclude,
    orderBy: { startDate: 'asc' },
  });
}

export async function findById(id: string) {
  return prisma.crmEvent.findUnique({
    where: { id },
    include: eventDetailInclude,
  });
}

export async function findByLeadId(leadId: string) {
  return prisma.crmEvent.findMany({
    where: { leadId },
    include: eventListInclude,
    orderBy: { startDate: 'desc' },
  });
}

export async function create(data: CreateEventData, userId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: data.leadId } });
  if (!lead) throw new Error('LEAD_NOT_FOUND');

  // Check for schedule conflicts unless force=true
  if (!data.force) {
    const conflicts = await findConflicts(new Date(data.startDate), new Date(data.endDate));
    if (conflicts.length > 0) {
      throw new ScheduleConflictError(conflicts);
    }
  }

  const eventData: any = {
    leadId: data.leadId,
    eventType: data.eventType,
    title: data.title,
    description: data.description,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    location: data.location,
    color: data.color,
    createdById: userId,
  };

  if (data.eventType === 'VISIT') {
    eventData.visitStatus = 'SCHEDULED';
  } else {
    eventData.vivenciaStatus = 'SCHEDULED';
    eventData.assignedTeacherId = data.assignedTeacherId;
  }

  const event = await prisma.crmEvent.create({
    data: eventData,
    include: eventDetailInclude,
  });

  // Advance gate status
  const targetGate = data.eventType === 'VISIT' ? 'VISIT_SCHEDULED' : 'VIVENCIA_SCHEDULED';
  try {
    await AdmissionGateService.transition(data.leadId, targetGate as any, userId, undefined, true);
  } catch (err) {
    logger.warn('Gate transition failed on event create', { leadId: data.leadId, targetGate, error: (err as Error).message });
  }

  // Send email when a visit is scheduled
  if (data.eventType === 'VISIT') {
    try {
      const recipients = await getNotificationRecipients(data.leadId);
      if (recipients.length > 0) {
        const leadInfo = await prisma.lead.findUnique({
          where: { id: data.leadId },
          select: { familyName: true },
        });
        const { sendVisitScheduledEmail } = await import('./email.service.js');
        await sendVisitScheduledEmail({
          to: recipients.map((r) => r.email),
          contactName: recipients[0].name,
          familyName: leadInfo?.familyName || '',
          visitDate: new Date(data.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          location: data.location || 'A confirmar',
        });
      }
    } catch (err) {
      logger.warn('Failed to send visit scheduled email', { leadId: data.leadId, error: (err as Error).message });
    }
  }

  return event;
}

export async function update(id: string, data: UpdateEventData, force?: boolean) {
  const event = await prisma.crmEvent.findUnique({ where: { id } });
  if (!event) throw new Error('EVENT_NOT_FOUND');

  // Check for schedule conflicts when dates change
  if (!force && (data.startDate || data.endDate)) {
    const start = data.startDate ? new Date(data.startDate) : event.startDate;
    const end = data.endDate ? new Date(data.endDate) : event.endDate;
    const conflicts = await findConflicts(start, end, id);
    if (conflicts.length > 0) {
      throw new ScheduleConflictError(conflicts);
    }
  }

  return prisma.crmEvent.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      location: data.location,
      color: data.color,
      assignedTeacherId: data.assignedTeacherId,
    },
    include: eventDetailInclude,
  });
}

export async function remove(id: string) {
  const event = await prisma.crmEvent.findUnique({ where: { id } });
  if (!event) throw new Error('EVENT_NOT_FOUND');

  await prisma.crmEvent.delete({ where: { id } });
  return event;
}

export async function updateStatus(
  id: string,
  status: string,
  notes: string | undefined,
  userId: string
) {
  const event = await prisma.crmEvent.findUnique({ where: { id } });
  if (!event) throw new Error('EVENT_NOT_FOUND');

  const updateData: any = {};

  if (event.eventType === 'VISIT') {
    updateData.visitStatus = status as VisitStatus;
    updateData.visitNotes = notes;
    if (status === 'COMPLETED') {
      updateData.visitCompletedAt = new Date();
    }
  } else {
    updateData.vivenciaStatus = status as VivenciaStatus;
    updateData.vivenciaNotes = notes;
    if (status === 'COMPLETED') {
      updateData.vivenciaCompletedAt = new Date();
    }
  }

  const updated = await prisma.crmEvent.update({
    where: { id },
    data: updateData,
    include: eventDetailInclude,
  });

  // Update gate status based on event completion/cancellation
  if (status === 'COMPLETED') {
    const targetGate = event.eventType === 'VISIT' ? 'VISIT_COMPLETED' : 'VIVENCIA_COMPLETED';
    try {
      await AdmissionGateService.transition(event.leadId, targetGate as any, userId, undefined, true);
      // If vivencia completed, also advance to EVALUATION_PENDING
      // (the preApprovalTrigger in transition() auto-creates approvals for EVALUATION_COMPLETED)
      if (event.eventType === 'VIVENCIA') {
        await AdmissionGateService.transition(event.leadId, 'EVALUATION_PENDING', userId, undefined, true);
      }
    } catch (err) {
      logger.warn('Gate transition failed on event completion', { leadId: event.leadId, error: (err as Error).message });
    }
  } else if (status === 'CANCELLED') {
    // Revert gate on cancellation
    const revertGate = event.eventType === 'VISIT' ? 'NOT_STARTED' : 'VISIT_APPROVED';
    try {
      await AdmissionGateService.transition(event.leadId, revertGate as any, userId, undefined, true);
    } catch (err) {
      logger.warn('Gate transition failed on event cancellation', { leadId: event.leadId, revertGate, error: (err as Error).message });
    }
  }

  return updated;
}
