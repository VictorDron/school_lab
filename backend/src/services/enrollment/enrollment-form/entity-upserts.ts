import type { Prisma } from '@prisma/client';
import type {
  PublicEnrollmentData,
  RequestMetadata,
} from '../../../types/enrollment.types.js';
import { buildTransportPayload } from './child-upserts.js';

type Tx = Prisma.TransactionClient;

/**
 * Replace, don't merge: the public form posts the family's authoritative
 * emergency-contact list. Drop whatever's stored, then createMany the new set.
 * Skipped entirely when the form posts an empty list — preserves any contacts
 * that may have been entered through other channels.
 */
export async function replaceEmergencyContacts(
  tx: Tx,
  leadId: string,
  data: PublicEnrollmentData,
): Promise<void> {
  if (!data.emergencyContacts || data.emergencyContacts.length === 0) return;

  await tx.leadEmergencyContact.deleteMany({ where: { leadId } });
  await tx.leadEmergencyContact.createMany({
    data: data.emergencyContacts.map(c => ({
      leadId,
      name: c.name,
      phone: c.phone,
      email: c.email,
      relationship: c.relationship,
      isPrimary: c.isPrimary,
    })),
  });
}

/**
 * Upsert the family's health plan. The "any field present" guard guarantees
 * we never create an empty plan record from a blank submission — only when the
 * family actually filled at least one of the four fields.
 */
export async function upsertHealthPlan(
  tx: Tx,
  leadId: string,
  data: PublicEnrollmentData,
): Promise<void> {
  const plan = data.healthPlan;
  if (!plan) return;
  const hasAny = plan.operator || plan.beneficiaryCode || plan.planType || plan.preferredHospital;
  if (!hasAny) return;

  const payload = {
    operator: plan.operator?.trim() ?? '',
    beneficiaryCode: plan.beneficiaryCode?.trim() ?? '',
    planType: plan.planType?.trim() ?? '',
    preferredHospital: plan.preferredHospital?.trim() ?? '',
  };

  await tx.leadHealthPlan.upsert({
    where: { leadId },
    create: { leadId, ...payload },
    update: payload,
  });
}

/**
 * Lead-level transport record. Same payload shape as the per-child record —
 * we share buildTransportPayload so future field additions stay in sync.
 */
export async function upsertLeadTransport(
  tx: Tx,
  leadId: string,
  data: PublicEnrollmentData,
): Promise<void> {
  if (!data.transport) return;
  const payload = buildTransportPayload(data.transport);
  await tx.leadTransport.upsert({
    where: { leadId },
    create: { leadId, ...payload },
    update: payload,
  });
}

export async function upsertFinancialResponsible(
  tx: Tx,
  leadId: string,
  data: PublicEnrollmentData,
): Promise<void> {
  const fin = data.financialResponsible;
  if (!fin) return;

  const payload = {
    responsibleType: fin.responsibleType || 'FATHER',
    relationship: fin.relationship,
    personType: fin.personType,
    fullName: fin.fullName,
    cpf: fin.cpf,
    email: fin.email,
    phone: fin.phone,
    companyName: fin.companyName,
    cnpj: fin.cnpj,
    tradeName: fin.tradeName,
    contactPerson: fin.contactPerson,
    contactEmail: fin.contactEmail,
    contactPhone: fin.contactPhone,
    country: fin.address?.country,
    state: fin.address?.state,
    city: fin.address?.city,
    neighborhood: fin.address?.neighborhood,
    street: fin.address?.street,
    number: fin.address?.number,
    complement: fin.address?.complement,
    zipCode: fin.address?.zipCode,
  };

  await tx.leadFinancialResponsible.upsert({
    where: { leadId },
    create: { leadId, ...payload },
    update: payload,
  });
}

/**
 * Append the lead-history audit row + the application-token usage log.
 * The history details capture which optional sections were filled so the
 * admin team can spot under-populated submissions without opening the lead.
 */
export async function recordSubmissionHistory(
  tx: Tx,
  leadId: string,
  studentName: string,
  data: PublicEnrollmentData,
  previousSubmissionCount: number,
  metadata?: RequestMetadata,
): Promise<void> {
  await tx.leadHistory.create({
    data: {
      leadId,
      action: 'ENROLLMENT_FORM_SUBMITTED',
      details: {
        source: 'PUBLIC_FORM',
        enrollmentToken: data.enrollmentToken,
        submissionNumber: previousSubmissionCount + 1,
        studentName,
        hasHealth: !!data.health,
        hasTransport: !!data.transport,
        hasFinancialResponsible: !!data.financialResponsible,
        emergencyContactsCount: data.emergencyContacts?.length || 0,
        termsAccepted: data.termsAccepted,
      },
    },
  });

  await tx.applicationTokenLog.create({
    data: {
      leadId,
      token: data.enrollmentToken,
      action: 'ENROLLMENT_SUBMITTED',
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    },
  });
}
