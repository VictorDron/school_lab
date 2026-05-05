import { prisma } from '../../config/database.js';

export async function updateParent(
  parentId: string,
  leadId: string,
  data: any,
  userId: string,
) {
  const parent = await prisma.leadParent.findFirst({
    where: { id: parentId, leadId },
  });
  if (!parent) throw new Error('PARENT_NOT_FOUND');

  const updated = await prisma.leadParent.update({
    where: { id: parentId },
    data,
  });

  await prisma.leadHistory.create({
    data: {
      leadId,
      action: 'PARENT_UPDATED',
      actorId: userId,
      details: { parentId: parent.id, parentType: parent.parentType },
    },
  });

  return updated;
}

export async function updateAddress(leadId: string, data: any, userId: string) {
  const updated = await prisma.leadAddress.upsert({
    where: { leadId },
    update: data,
    create: { leadId, ...data },
  });

  await prisma.leadHistory.create({
    data: {
      leadId,
      action: 'ADDRESS_UPDATED',
      actorId: userId,
      details: { changes: Object.keys(data) },
    },
  });

  return updated;
}

export async function createEmergencyContact(
  leadId: string,
  data: any,
  userId: string,
) {
  const created = await prisma.leadEmergencyContact.create({
    data: { leadId, ...data },
  });

  await prisma.leadHistory.create({
    data: {
      leadId,
      action: 'EMERGENCY_CONTACT_ADDED',
      actorId: userId,
      details: { contactId: created.id, name: data.name },
    },
  });

  return created;
}

export async function updateEmergencyContact(
  contactId: string,
  leadId: string,
  data: any,
  userId: string,
) {
  const updated = await prisma.leadEmergencyContact.update({
    where: { id: contactId },
    data,
  });

  await prisma.leadHistory.create({
    data: {
      leadId,
      action: 'EMERGENCY_CONTACT_UPDATED',
      actorId: userId,
      details: { contactId },
    },
  });

  return updated;
}

export async function deleteEmergencyContact(
  contactId: string,
  leadId: string,
  userId: string,
) {
  await prisma.leadEmergencyContact.delete({ where: { id: contactId } });

  await prisma.leadHistory.create({
    data: {
      leadId,
      action: 'EMERGENCY_CONTACT_REMOVED',
      actorId: userId,
      details: { contactId },
    },
  });
}

export async function updateFinancialResponsible(
  leadId: string,
  data: any,
  userId: string,
) {
  const updated = await prisma.leadFinancialResponsible.upsert({
    where: { leadId },
    update: data,
    create: { leadId, ...data },
  });

  await prisma.leadHistory.create({
    data: {
      leadId,
      action: 'FINANCIAL_RESPONSIBLE_UPDATED',
      actorId: userId,
      details: { changes: Object.keys(data) },
    },
  });

  return updated;
}

export async function updateHealthPlan(leadId: string, data: any, userId: string) {
  const updated = await prisma.leadHealthPlan.upsert({
    where: { leadId },
    update: data,
    create: { leadId, ...data },
  });

  await prisma.leadHistory.create({
    data: {
      leadId,
      action: 'HEALTH_PLAN_UPDATED',
      actorId: userId,
      details: { changes: Object.keys(data) },
    },
  });

  return updated;
}
