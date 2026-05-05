import { Prisma } from '@prisma/client';
import type { LeadChild } from '@prisma/client';
import type {
  EnrollmentInfoData,
  HealthData,
  PublicEnrollmentData,
  TransportData,
} from '../../../types/enrollment.types.js';

type Tx = Prisma.TransactionClient;

/**
 * desiredGrade is the only student-level field the family can edit at the
 * enrollment step. Multi-child submissions carry one value per child; the
 * legacy single-child shape applies only to the first applicant child.
 */
export async function applyDesiredGradeUpdates(
  tx: Tx,
  applicantChild: LeadChild,
  data: PublicEnrollmentData,
): Promise<void> {
  if (data.childrenData && data.childrenData.length > 0) {
    for (const childData of data.childrenData) {
      if (childData.desiredGrade) {
        await tx.leadChild.update({
          where: { id: childData.childId },
          data: { desiredGrade: childData.desiredGrade },
        });
      }
    }
    return;
  }

  if (data.student?.desiredGrade) {
    await tx.leadChild.update({
      where: { id: applicantChild.id },
      data: { desiredGrade: data.student.desiredGrade },
    });
  }
}

/**
 * Upsert per-child enrollment info. The terms acceptance flag travels on the
 * submission as a single value, so the caller passes it through and we re-stamp
 * termsAcceptedAt on every write — re-submissions bump the timestamp.
 */
export async function upsertEnrollmentInfoForChild(
  tx: Tx,
  leadId: string,
  childId: string,
  info: EnrollmentInfoData,
  termsAccepted: boolean,
): Promise<void> {
  const payload = {
    academicCalendar: info.academicCalendar,
    campus: info.campus,
    course: info.course,
    module: info.module,
    classGroup: info.classGroup,
    personType: info.personType,
    studentCpf: info.studentCpf,
    studentIdNumber: info.studentIdNumber,
    studentIdIssueDate: info.studentIdIssueDate,
    studentIdIssuer: info.studentIdIssuer,
    termsAccepted,
    termsAcceptedAt: new Date(),
  };

  await tx.leadEnrollmentInfo.upsert({
    where: { childId },
    create: { leadId, childId, ...payload },
    update: payload,
  });
}

export async function upsertHealthForChild(
  tx: Tx,
  leadId: string,
  childId: string,
  health: HealthData,
): Promise<void> {
  const payload = {
    weight: health.weight,
    height: health.height,
    bloodType: health.bloodType,
    medicalConditions: health.medicalConditions || [],
    medicalConditionsNotes: health.medicalConditionsNotes,
    hasHospitalizations: health.hasHospitalizations || false,
    hospitalizationsNotes: health.hospitalizationsNotes,
    hasSeizures: health.hasSeizures || false,
    seizuresNotes: health.seizuresNotes,
    allergies: health.allergies || [],
    allergiesNotes: health.allergiesNotes,
    feverMedications: health.feverMedications || [],
    feverMedicationOther: health.feverMedicationOther,
    painMedications: health.painMedications || [],
    painMedicationOther: health.painMedicationOther,
    medicationRestrictions: health.medicationRestrictions,
    regularMedications: health.regularMedications,
    hasEatingDisorder: health.hasEatingDisorder || false,
    eatingDisorderNotes: health.eatingDisorderNotes,
    additionalHealthInfo: health.additionalHealthInfo,
  };

  await tx.leadChildHealth.upsert({
    where: { childId },
    create: { leadId, childId, ...payload },
    update: payload,
  });
}

/**
 * Build the storage shape for a transport record. Used both for the per-child
 * (LeadChildTransport) and the lead-level (LeadTransport) upserts — the four
 * JSON columns need the explicit Prisma.JsonNull sentinel when missing,
 * otherwise Prisma rejects `undefined` for required scalars.
 */
export function buildTransportPayload(transport: TransportData) {
  return {
    dropoffPickupPersons: transport.dropoffPickupPersons
      ? (transport.dropoffPickupPersons as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    dropoffPickupOther: transport.dropoffPickupOther,
    transportMethod: transport.transportMethod || '',
    transportMethodOther: transport.transportMethodOther,
    familyVehicles: transport.familyVehicles
      ? (transport.familyVehicles as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    canLeaveAlone: transport.canLeaveAlone || false,
    isAthlete: transport.isAthlete || false,
    athleteSchedule: transport.athleteSchedule
      ? (transport.athleteSchedule as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    athleteNotes: transport.athleteNotes || null,
    schoolBusCompany: transport.schoolBusCompany,
    schoolBusContactName: transport.schoolBusContactName,
    schoolBusContactPhone: transport.schoolBusContactPhone,
    schoolBusContactEmail: transport.schoolBusContactEmail,
    hasLegalRestrictions: transport.hasLegalRestrictions || false,
    legalRestrictionsNotes: transport.legalRestrictionsNotes,
    allowThirdPartyPickup: transport.allowThirdPartyPickup || false,
    authorizedPersons: transport.authorizedPersons
      ? (transport.authorizedPersons as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull,
  };
}

export async function upsertTransportForChild(
  tx: Tx,
  leadId: string,
  childId: string,
  transport: TransportData,
): Promise<void> {
  const payload = buildTransportPayload(transport);
  await tx.leadChildTransport.upsert({
    where: { childId },
    create: { leadId, childId, ...payload },
    update: payload,
  });
}

/**
 * Apply enrollmentInfo/health/transport for every child on the submission.
 * The new multi-child shape takes precedence; the legacy single-child shape
 * is treated as data for the first applicant child. Each of the three records
 * upserts independently — the form may submit any subset.
 */
export async function applyPerChildSubmissionData(
  tx: Tx,
  leadId: string,
  applicantChild: LeadChild,
  data: PublicEnrollmentData,
): Promise<void> {
  const entries = data.childrenData && data.childrenData.length > 0
    ? data.childrenData.map(c => ({
        childId: c.childId,
        enrollmentInfo: c.enrollmentInfo,
        health: c.health,
        transport: c.transport,
      }))
    : [{
        childId: applicantChild.id,
        enrollmentInfo: data.enrollmentInfo,
        health: data.health,
        transport: data.transport,
      }];

  for (const entry of entries) {
    if (entry.enrollmentInfo) {
      await upsertEnrollmentInfoForChild(tx, leadId, entry.childId, entry.enrollmentInfo, data.termsAccepted);
    }
    if (entry.health) {
      await upsertHealthForChild(tx, leadId, entry.childId, entry.health);
    }
    if (entry.transport) {
      await upsertTransportForChild(tx, leadId, entry.childId, entry.transport);
    }
  }
}
