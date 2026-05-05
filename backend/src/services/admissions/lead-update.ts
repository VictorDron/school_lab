import type { Lead, Prisma } from '@prisma/client';
import type { PublicAdmissionData, StudentDataWithDetails } from './index.js';
import { checkSiblingsAtSchool } from '../merge.service.js';

type Tx = Prisma.TransactionClient;

/**
 * Admins can pre-set desiredGrades on the lead before sending the form. We
 * union those with whatever the family submits so admin intent isn't lost
 * when the family submits a different/subset grade list.
 */
function mergeDesiredGrades(
  existing: string[] | null | undefined,
  students: StudentDataWithDetails[],
): string[] {
  const studentGrades = students.map(s => s.desiredGrade).filter(Boolean);
  return [...new Set([...(existing || []), ...studentGrades])];
}

/**
 * Update the Lead row with everything the submission changes — contact info
 * (mother as primary), counts, derived flags, workflow status, and the
 * kanban column advance to "Formulário Recebido" if that column exists.
 *
 * `schoolName` (from SystemSettings) feeds the sibling-school detection so
 * the match is per-tenant instead of hardcoded to a single brand.
 */
export async function applyLeadUpdate(
  tx: Tx,
  existingLead: Lead,
  data: PublicAdmissionData,
  students: StudentDataWithDetails[],
  schoolName: string,
): Promise<Lead> {
  const formReceivedColumn = await tx.kanbanColumn.findFirst({
    where: { slug: 'FORM_RECEIVED' },
  });

  return tx.lead.update({
    where: { id: existingLead.id },
    data: {
      primaryContactName: data.mother.name,
      primaryContactEmail: data.mother.email,
      primaryContactPhone: data.mother.phone,
      secondaryContactName: data.father.name,
      secondaryContactEmail: data.father.email,
      secondaryContactPhone: data.father.phone,
      numberOfChildren: students.length + data.siblings.length,
      desiredGrades: mergeDesiredGrades(existingLead.desiredGrades, students),
      hasSiblingsAtSchool: checkSiblingsAtSchool(data.siblings, schoolName),
      livesWith: data.livesWith,
      guardianInfo: data.guardianInfo || null,
      ...(data.notificationPreference ? { notificationPreference: data.notificationPreference } : {}),
      applicationStatus: 'FORM_RECEIVED',
      lastFormSubmittedAt: new Date(),
      formSubmissionCount: { increment: 1 },
      applicationDate: new Date(),
      ...(formReceivedColumn ? { columnId: formReceivedColumn.id } : {}),
    },
  });
}
