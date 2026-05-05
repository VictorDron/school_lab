import { prisma } from '../../config/database.js';
import { syncLeadChildToStudents } from '../students/students-sync.service.js';
import logger from '../../utils/logger.js';
import type { CreateChildData, UpdateChildData } from './types.js';

export async function addChild(leadId: string, data: CreateChildData) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });

  if (!lead) {
    throw new Error('LEAD_NOT_FOUND');
  }

  return prisma.leadChild.create({
    data: {
      leadId,
      fullName: data.fullName,
      dateOfBirth: new Date(data.dateOfBirth),
      gender: data.gender,
      nationality: data.nationality,
      desiredGrade: data.desiredGrade,
      currentSchool: data.currentSchool,
      specialNeeds: data.specialNeeds,
      primaryLanguage: data.primaryLanguage,
      isApplicant: false,
    },
  });
}

export async function updateChild(
  childId: string,
  leadId: string,
  data: UpdateChildData,
  userId: string,
) {
  const child = await prisma.leadChild.findFirst({
    where: { id: childId, leadId },
  });

  if (!child) {
    throw new Error('CHILD_NOT_FOUND');
  }

  const updated = await prisma.leadChild.update({
    where: { id: childId },
    data: {
      ...data,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    },
  });

  await prisma.leadHistory.create({
    data: {
      leadId,
      action: 'CHILD_UPDATED',
      actorId: userId,
      details: { childId: child.id, childName: updated.fullName },
    },
  });

  try {
    const syncPayload: Record<string, unknown> = {};
    if (data.fullName !== undefined) syncPayload.fullName = data.fullName;
    if (data.dateOfBirth !== undefined)
      syncPayload.dateOfBirth = new Date(data.dateOfBirth);
    if (data.gender !== undefined) syncPayload.gender = data.gender;
    if (data.nationality !== undefined) syncPayload.nationality = data.nationality;
    if (Object.keys(syncPayload).length > 0) {
      await syncLeadChildToStudents(childId, syncPayload);
    }
  } catch (err) {
    logger.warn('Failed to sync LeadChild → Students after child update', {
      childId,
      error: (err as Error).message,
    });
  }

  return updated;
}

export async function deleteChild(
  childId: string,
  leadId: string,
  userId: string,
) {
  const child = await prisma.leadChild.findFirst({
    where: { id: childId, leadId },
  });

  if (!child) {
    throw new Error('CHILD_NOT_FOUND');
  }

  await prisma.leadChild.delete({ where: { id: childId } });

  await prisma.leadHistory.create({
    data: {
      leadId,
      action: 'CHILD_REMOVED',
      actorId: userId,
      details: { childName: child.fullName },
    },
  });

  return child;
}

export async function updateChildHealth(
  childId: string,
  leadId: string,
  data: any,
  userId: string,
) {
  const updated = await prisma.leadChildHealth.upsert({
    where: { childId },
    update: data,
    create: { leadId, childId, ...data },
  });

  await prisma.leadHistory.create({
    data: {
      leadId,
      action: 'CHILD_HEALTH_UPDATED',
      actorId: userId,
      details: { childId },
    },
  });

  return updated;
}

export async function updateChildTransport(
  childId: string,
  leadId: string,
  data: any,
  userId: string,
) {
  const updated = await prisma.leadChildTransport.upsert({
    where: { childId },
    update: data,
    create: { leadId, childId, ...data },
  });

  await prisma.leadHistory.create({
    data: {
      leadId,
      action: 'CHILD_TRANSPORT_UPDATED',
      actorId: userId,
      details: { childId },
    },
  });

  return updated;
}
