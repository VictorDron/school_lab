import type { Lead, Prisma } from '@prisma/client';
import type { PublicAdmissionData, SiblingData, StudentDataWithDetails } from './index.js';

type Tx = Prisma.TransactionClient;

/**
 * The CRM tags a sibling as already enrolled when their school string mentions
 * RIS (the brand) or "internacional" — both signal the same school. Used to
 * surface the sibling-discount flag on the lead without manual triage.
 */
function detectSiblingsAtSchool(siblings: SiblingData[]): boolean {
  return siblings.some(s => {
    const school = (s.school || s.grade || '').toLowerCase();
    return /\bris\b/i.test(school) || /internacional/i.test(school);
  });
}

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
 */
export async function applyLeadUpdate(
  tx: Tx,
  existingLead: Lead,
  data: PublicAdmissionData,
  students: StudentDataWithDetails[],
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
      hasSiblingsAtSchool: detectSiblingsAtSchool(data.siblings),
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
