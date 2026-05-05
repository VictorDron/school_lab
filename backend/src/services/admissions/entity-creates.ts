import type { Prisma } from '@prisma/client';
import { normalizeCPF } from '../../utils/formatters.js';
import type { CreatedStudent } from './child-creates.js';
import type { AddressData, ParentData, PublicAdmissionData } from './index.js';

type Tx = Prisma.TransactionClient;

interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Smart-merge cleanup before re-creating form-submitted entities. We wipe
 * only what the family controls (applicant students, siblings, the address,
 * both parents, and the per-applicant edu/additional-info rows) and preserve
 * admin-added children. Edu/additional-info with `childId: null` are also
 * removed — those are stale legacy rows from before per-child support.
 */
export async function cleanupFormSubmittedEntities(
  tx: Tx,
  leadId: string,
): Promise<void> {
  const childrenToDelete = await tx.leadChild.findMany({
    where: {
      leadId,
      OR: [{ isApplicant: true }, { relationship: 'SIBLING' }],
    },
    select: { id: true },
  });
  const childIdsToDelete = childrenToDelete.map(c => c.id);

  await Promise.all([
    tx.leadChild.deleteMany({ where: { id: { in: childIdsToDelete } } }),
    tx.leadAddress.deleteMany({ where: { leadId } }),
    tx.leadParent.deleteMany({ where: { leadId } }),
    tx.leadEducationHistory.deleteMany({
      where: { leadId, OR: [{ childId: { in: childIdsToDelete } }, { childId: null }] },
    }),
    tx.leadAdditionalInfo.deleteMany({
      where: { leadId, OR: [{ childId: { in: childIdsToDelete } }, { childId: null }] },
    }),
  ]);
}

export async function createAddress(
  tx: Tx,
  leadId: string,
  address: AddressData,
): Promise<void> {
  await tx.leadAddress.create({
    data: {
      leadId,
      country: address.country,
      state: address.state || null,
      city: address.city,
      neighborhood: address.neighborhood || null,
      street: address.street || null,
      number: address.number || null,
      complement: address.complement || null,
      zipCode: address.zipCode || null,
    },
  });
}

function buildParentData(
  leadId: string,
  parentType: 'FATHER' | 'MOTHER',
  parent: ParentData,
) {
  return {
    leadId,
    parentType,
    fullName: parent.name,
    email: parent.email,
    phone: parent.phone,
    cpf: normalizeCPF(parent.cpf),
    occupation: parent.occupation || null,
    nativeLanguage: parent.nativeLanguage || null,
  };
}

export async function createParents(
  tx: Tx,
  leadId: string,
  father: ParentData,
  mother: ParentData,
): Promise<void> {
  await tx.leadParent.createMany({
    data: [
      buildParentData(leadId, 'FATHER', father),
      buildParentData(leadId, 'MOTHER', mother),
    ],
  });
}

/**
 * Write the audit trail for the submission: a leadHistory row describing
 * what was submitted, plus an applicationTokenLog SUBMITTED entry. Both run
 * inside the submission transaction so a downstream rollback discards them.
 */
export async function recordSubmissionHistory(
  tx: Tx,
  leadId: string,
  data: PublicAdmissionData,
  createdStudents: CreatedStudent[],
  previousSubmissionCount: number,
  metadata: RequestMetadata | undefined,
): Promise<void> {
  const studentNames = createdStudents.map(s => s.studentData.fullName);

  await tx.leadHistory.create({
    data: {
      leadId,
      action: 'FORM_SUBMITTED',
      details: {
        source: 'PUBLIC_FORM',
        applicationToken: data.applicationToken,
        submissionNumber: previousSubmissionCount + 1,
        studentNames,
        studentsCount: createdStudents.length,
        siblingsCount: data.siblings.length,
        hasAddress: true,
        hasEducationHistory: createdStudents.some(s => (s.studentData.educationHistory || []).length > 0),
        hasAdditionalInfo: createdStudents.some(s => !!s.studentData.additionalInfo),
      },
    },
  });

  await tx.applicationTokenLog.create({
    data: {
      leadId,
      token: data.applicationToken!,
      action: 'SUBMITTED',
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    },
  });
}
