import { prisma } from '../../config/database.js';
import { createAppError } from '../../lib/error-messages.js';

async function resolveStudentLead(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { leadId: true, leadChildId: true },
  });
  if (!student) throw createAppError('STUDENT_NOT_FOUND');
  return student;
}

export async function updateStudentHealth(
  studentId: string,
  data: Record<string, unknown>,
  actorId: string,
) {
  const { leadId, leadChildId } = await resolveStudentLead(studentId);

  const updated = await prisma.leadChildHealth.upsert({
    where: { childId: leadChildId },
    update: data,
    create: { leadId, childId: leadChildId, ...data } as any,
  });

  await prisma.studentHistory.create({
    data: {
      studentId,
      action: 'HEALTH_DATA_UPDATED',
      details: { fields: Object.keys(data) },
      actorId,
    },
  });

  return updated;
}

export async function updateStudentTransport(
  studentId: string,
  data: Record<string, unknown>,
  actorId: string,
) {
  const { leadId, leadChildId } = await resolveStudentLead(studentId);

  const updated = await prisma.leadChildTransport.upsert({
    where: { childId: leadChildId },
    update: data,
    create: { leadId, childId: leadChildId, ...data } as any,
  });

  await prisma.studentHistory.create({
    data: {
      studentId,
      action: 'TRANSPORT_DATA_UPDATED',
      details: { fields: Object.keys(data) },
      actorId,
    },
  });

  return updated;
}

export async function updateStudentEnrollmentInfo(
  studentId: string,
  data: Record<string, unknown>,
  actorId: string,
) {
  const { leadId, leadChildId } = await resolveStudentLead(studentId);

  const updated = await prisma.leadEnrollmentInfo.upsert({
    where: { childId: leadChildId },
    update: data,
    create: { leadId, childId: leadChildId, ...data } as any,
  });

  await prisma.studentHistory.create({
    data: {
      studentId,
      action: 'ENROLLMENT_INFO_UPDATED',
      details: { fields: Object.keys(data) },
      actorId,
    },
  });

  return updated;
}

export async function updateStudentHealthPlan(
  studentId: string,
  data: Record<string, unknown>,
  actorId: string,
) {
  const { leadId } = await resolveStudentLead(studentId);

  const updated = await prisma.leadHealthPlan.upsert({
    where: { leadId },
    update: data,
    create: { leadId, ...data } as any,
  });

  await prisma.studentHistory.create({
    data: {
      studentId,
      action: 'HEALTH_PLAN_UPDATED',
      details: { fields: Object.keys(data) },
      actorId,
    },
  });

  return updated;
}

export async function updateStudentEmergencyContact(
  studentId: string,
  contactId: string,
  data: Record<string, unknown>,
  actorId: string,
) {
  await resolveStudentLead(studentId);

  const contact = await prisma.leadEmergencyContact.findUnique({
    where: { id: contactId },
  });
  if (!contact) {
    throw createAppError('NOT_FOUND', 'Contato de emergência não encontrado.');
  }

  const updated = await prisma.leadEmergencyContact.update({
    where: { id: contactId },
    data,
  });

  await prisma.studentHistory.create({
    data: {
      studentId,
      action: 'EMERGENCY_CONTACT_UPDATED',
      details: { contactId, fields: Object.keys(data) },
      actorId,
    },
  });

  return updated;
}

export async function updateStudentParent(
  studentId: string,
  parentId: string,
  data: Record<string, unknown>,
  actorId: string,
) {
  await resolveStudentLead(studentId);

  const parent = await prisma.leadParent.findUnique({ where: { id: parentId } });
  if (!parent) {
    throw createAppError('NOT_FOUND', 'Responsável não encontrado.');
  }

  const updated = await prisma.leadParent.update({
    where: { id: parentId },
    data,
  });

  await prisma.studentHistory.create({
    data: {
      studentId,
      action: 'PARENT_DATA_UPDATED',
      details: { parentId, fields: Object.keys(data) },
      actorId,
    },
  });

  return updated;
}
