import { prisma } from '../../config/database.js';
import logger from '../../utils/logger.js';
import type { SubmitFormData } from './types.js';

// Strip database-only fields from editable sections to prevent Prisma errors
function stripDbFields(obj: Record<string, any>): Record<string, any> {
  const { id, leadId: _l, childId: _c, createdAt, updatedAt, ...clean } = obj;
  return clean;
}

export type SectionChanges = Record<string, { before: any; after: any }>;

export async function applySectionUpdates(
  data: SubmitFormData,
  leadId: string,
  childId: string,
): Promise<SectionChanges> {
  const changes: SectionChanges = {};

  if (data.health && Object.keys(data.health).length > 0) {
    const cleanHealth = stripDbFields(data.health);
    const existing = await prisma.leadChildHealth.findUnique({ where: { childId } });
    if (existing) {
      await prisma.leadChildHealth.update({ where: { childId }, data: cleanHealth });
    } else {
      await prisma.leadChildHealth.create({
        data: {
          leadId,
          childId,
          hasHospitalizations: false,
          hasSeizures: false,
          hasEatingDisorder: false,
          medicalConditions: [],
          allergies: [],
          feverMedications: [],
          painMedications: [],
          ...cleanHealth,
        },
      });
    }
    changes.health = { before: existing, after: cleanHealth };
  }

  if (data.transport && Object.keys(data.transport).length > 0) {
    const cleanTransport = stripDbFields(data.transport);
    const existing = await prisma.leadChildTransport.findUnique({ where: { childId } });
    if (existing) {
      await prisma.leadChildTransport.update({ where: { childId }, data: cleanTransport });
    } else if (cleanTransport.transportMethod) {
      await prisma.leadChildTransport.create({
        data: {
          leadId,
          childId,
          transportMethod: 'CAR',
          canLeaveAlone: false,
          isAthlete: false,
          hasLegalRestrictions: false,
          allowThirdPartyPickup: false,
          ...cleanTransport,
        },
      });
    }
    changes.transport = { before: existing, after: cleanTransport };
  }

  if (data.emergencyContacts && data.emergencyContacts.length > 0) {
    const existing = await prisma.leadEmergencyContact.findMany({ where: { leadId } });
    await prisma.leadEmergencyContact.deleteMany({ where: { leadId } });
    await prisma.leadEmergencyContact.createMany({
      data: data.emergencyContacts.map((c) => ({
        leadId,
        name: c.name,
        phone: c.phone,
        email: c.email ?? undefined,
        relationship: c.relationship ?? undefined,
        isPrimary: c.isPrimary ?? false,
      })),
    });
    changes.emergencyContacts = { before: existing.length, after: data.emergencyContacts.length };
  }

  if (data.financialResponsible && Object.keys(data.financialResponsible).length > 0) {
    const cleanFinancial = stripDbFields(data.financialResponsible);
    const existing = await prisma.leadFinancialResponsible.findUnique({ where: { leadId } });
    if (existing) {
      await prisma.leadFinancialResponsible.update({ where: { leadId }, data: cleanFinancial });
    } else if (cleanFinancial.responsibleType) {
      await prisma.leadFinancialResponsible.create({
        data: { leadId, responsibleType: 'FATHER', ...cleanFinancial },
      });
    }
    changes.financialResponsible = { before: existing, after: cleanFinancial };
  }

  if (data.healthPlan && Object.keys(data.healthPlan).length > 0) {
    const cleanHealthPlan = stripDbFields(data.healthPlan);
    const existing = await prisma.leadHealthPlan.findUnique({ where: { leadId } });
    if (existing) {
      await prisma.leadHealthPlan.update({ where: { leadId }, data: cleanHealthPlan });
    } else if (cleanHealthPlan.operator) {
      await prisma.leadHealthPlan.create({
        data: {
          leadId,
          operator: '',
          beneficiaryCode: '',
          planType: '',
          preferredHospital: '',
          ...cleanHealthPlan,
        },
      });
    }
    changes.healthPlan = { before: existing, after: data.healthPlan };
  }

  if (data.parentUpdates && data.parentUpdates.length > 0) {
    for (const update of data.parentUpdates) {
      try {
        await prisma.leadParent.update({
          where: { id: update.parentId },
          data: {
            email: update.email,
            ...(update.phone ? { phone: update.phone } : {}),
          },
        });
      } catch (parentErr) {
        logger.warn('Failed to update parent data', { parentId: update.parentId, error: (parentErr as Error).message });
      }
    }
    changes.parentUpdates = { before: null, after: data.parentUpdates.length };
  }

  if (data.additionalResponsible && data.additionalResponsible.fullName?.trim()) {
    try {
      await prisma.leadEmergencyContact.create({
        data: {
          leadId,
          name: data.additionalResponsible.fullName,
          phone: data.additionalResponsible.phone || '',
          email: data.additionalResponsible.email || undefined,
          relationship: data.additionalResponsible.relationship || 'OTHER',
          isPrimary: false,
        },
      });
    } catch (addRespErr) {
      logger.warn('Failed to create additional responsible', { error: (addRespErr as Error).message });
    }
  }

  return changes;
}
