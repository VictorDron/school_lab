import type {
  Lead,
  LeadAddress,
  LeadAdditionalInfo,
  LeadChild,
  LeadChildHealth,
  LeadChildTransport,
  LeadEmergencyContact,
  LeadEnrollmentDocument,
  LeadEnrollmentInfo,
  LeadFinancialResponsible,
  LeadHealthPlan,
  LeadParent,
  LeadTransport,
} from '@prisma/client';
import type {
  AuthorizedPersonData,
  VehicleData,
} from '../../../types/enrollment.types.js';

/**
 * Lead shape used for shaping the public enrollment response.
 * Matches what validateEnrollmentToken returns (children/parents/address included).
 */
export type LeadWithRelations = Lead & {
  children: LeadChild[];
  parents: LeadParent[];
  address: LeadAddress | null;
};

export interface EnrollmentRelatedData {
  additionalInfoList: LeadAdditionalInfo[];
  childrenHealth: LeadChildHealth[];
  emergencyContacts: LeadEmergencyContact[];
  healthPlan: LeadHealthPlan | null;
  transport: LeadTransport | null;
  enrollmentInfoList: LeadEnrollmentInfo[];
  financialResponsible: LeadFinancialResponsible | null;
  enrollmentDocuments: LeadEnrollmentDocument[];
  childrenTransport: LeadChildTransport[];
}

function buildEnrollmentInfoProjection(info: LeadEnrollmentInfo) {
  return {
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
    termsAccepted: info.termsAccepted,
  };
}

export function buildStudentFromChild(
  child: LeadChild,
  related: EnrollmentRelatedData,
) {
  const childHealth = related.childrenHealth.find(h => h.childId === child.id) ?? null;
  const childTransport = related.childrenTransport.find(t => t.childId === child.id) ?? null;
  const childEnrollmentInfo = related.enrollmentInfoList.find(ei => ei.childId === child.id);
  const childAdditionalInfo = related.additionalInfoList.find(ai => ai.childId === child.id);

  return {
    id: child.id,
    fullName: child.fullName,
    dateOfBirth: child.dateOfBirth?.toISOString().split('T')[0],
    gender: child.gender,
    nationality: child.nationality,
    desiredGrade: child.desiredGrade,
    currentGrade: child.currentGrade,
    primaryLanguage: child.primaryLanguage,
    health: childHealth,
    childTransport,
    enrollmentInfo: childEnrollmentInfo ? buildEnrollmentInfoProjection(childEnrollmentInfo) : null,
    additionalInfo: childAdditionalInfo ? {
      hasHealthIssues: childAdditionalInfo.hasHealthIssues,
      healthIssuesDetails: childAdditionalInfo.healthIssuesDetails,
    } : null,
  };
}

export function buildLegacyStudent(child: LeadChild | null) {
  if (!child) return null;
  return {
    id: child.id,
    fullName: child.fullName,
    dateOfBirth: child.dateOfBirth?.toISOString().split('T')[0],
    gender: child.gender,
    nationality: child.nationality,
    desiredGrade: child.desiredGrade,
    currentGrade: child.currentGrade,
    primaryLanguage: child.primaryLanguage,
  };
}

export function buildParentProjection(parent: LeadParent | undefined, leadAddress: LeadAddress | null) {
  if (!parent) return null;
  return {
    fullName: parent.fullName,
    email: parent.email,
    phone: parent.phone,
    cpf: parent.cpf,
    occupation: parent.occupation,
    idNumber: parent.idNumber,
    idIssueDate: parent.idIssueDate,
    idIssuer: parent.idIssuer,
    dateOfBirth: parent.dateOfBirth?.toISOString().split('T')[0],
    education: parent.education,
    religion: parent.religion,
    nationality: parent.nationality,
    maritalStatus: parent.maritalStatus,
    // Address: parent's own data wins, falls back to family address from Form 1.
    address: {
      zipCode: parent.zipCode ?? leadAddress?.zipCode ?? null,
      country: parent.country ?? leadAddress?.country ?? null,
      state: parent.state ?? leadAddress?.state ?? null,
      city: parent.city ?? leadAddress?.city ?? null,
      neighborhood: parent.neighborhood ?? leadAddress?.neighborhood ?? null,
      street: parent.street ?? leadAddress?.street ?? null,
      number: parent.number ?? leadAddress?.number ?? null,
      complement: parent.complement ?? leadAddress?.complement ?? null,
    },
    sameAddressAsOtherParent: parent.sameAddressAsOtherParent ?? false,
  };
}

export function buildAddressProjection(address: LeadAddress | null) {
  if (!address) return null;
  return {
    country: address.country,
    state: address.state,
    city: address.city,
    neighborhood: address.neighborhood,
    street: address.street,
    number: address.number,
    complement: address.complement,
    zipCode: address.zipCode,
  };
}

export function buildLegacyAdditionalInfo(list: LeadAdditionalInfo[]) {
  const first = list[0];
  if (!first) return null;
  return {
    hasHealthIssues: first.hasHealthIssues,
    healthIssuesDetails: first.healthIssuesDetails,
  };
}

export function buildLegacyEnrollmentInfo(list: LeadEnrollmentInfo[]) {
  const first = list[0];
  return first ? buildEnrollmentInfoProjection(first) : null;
}

export function buildLegacyChildHealth(
  applicantChild: LeadChild | null,
  childrenHealth: LeadChildHealth[],
) {
  if (!applicantChild || childrenHealth.length === 0) return null;
  return childrenHealth.find(h => h.childId === applicantChild.id) ?? null;
}

export function mapEmergencyContacts(list: LeadEmergencyContact[]) {
  return list.map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    relationship: c.relationship,
    isPrimary: c.isPrimary,
  }));
}

export function buildHealthPlanProjection(healthPlan: LeadHealthPlan | null) {
  if (!healthPlan) return null;
  return {
    operator: healthPlan.operator,
    beneficiaryCode: healthPlan.beneficiaryCode,
    planType: healthPlan.planType,
    preferredHospital: healthPlan.preferredHospital,
  };
}

export function buildTransportProjection(transport: LeadTransport | null) {
  if (!transport) return null;
  return {
    dropoffPickupPersons: transport.dropoffPickupPersons,
    dropoffPickupOther: transport.dropoffPickupOther,
    transportMethod: transport.transportMethod,
    transportMethodOther: transport.transportMethodOther,
    familyVehicles: transport.familyVehicles as VehicleData[] | null,
    canLeaveAlone: transport.canLeaveAlone,
    isAthlete: transport.isAthlete,
    athleteSchedule: transport.athleteSchedule,
    athleteNotes: transport.athleteNotes || null,
    schoolBusCompany: transport.schoolBusCompany,
    schoolBusContactName: transport.schoolBusContactName,
    schoolBusContactPhone: transport.schoolBusContactPhone,
    schoolBusContactEmail: transport.schoolBusContactEmail,
    hasLegalRestrictions: transport.hasLegalRestrictions,
    legalRestrictionsNotes: transport.legalRestrictionsNotes,
    allowThirdPartyPickup: transport.allowThirdPartyPickup,
    authorizedPersons: transport.authorizedPersons as AuthorizedPersonData[] | null,
  };
}

export function buildFinancialResponsibleProjection(fin: LeadFinancialResponsible | null) {
  if (!fin) return null;
  return {
    responsibleType: fin.responsibleType,
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
    address: {
      country: fin.country,
      state: fin.state,
      city: fin.city,
      neighborhood: fin.neighborhood,
      street: fin.street,
      number: fin.number,
      complement: fin.complement,
      zipCode: fin.zipCode,
    },
  };
}

export function mapEnrollmentDocuments(list: LeadEnrollmentDocument[]) {
  return list.map(d => ({
    id: d.id,
    documentType: d.documentType,
    category: d.category,
    childId: d.childId,
    fileName: d.fileName,
    fileUrl: d.fileUrl,
    fileSize: d.fileSize,
    mimeType: d.mimeType,
    includesOtherDocs: d.includesOtherDocs,
    status: d.status,
    rejectionReason: d.rejectionReason,
    uploadedAt: d.uploadedAt.toISOString(),
  }));
}

/**
 * Compose the full data envelope returned by getEnrollmentData.
 * Pure function: takes the lead snapshot plus the parallel-fetched related
 * records and returns the shape consumed by the public enrollment form.
 */
export function buildEnrollmentDataResponse(
  lead: LeadWithRelations,
  related: EnrollmentRelatedData,
) {
  const father = lead.parents.find(p => p.parentType === 'FATHER');
  const mother = lead.parents.find(p => p.parentType === 'MOTHER');

  const applicantChildren = lead.children.filter(c => c.isApplicant && c.relationship === 'STUDENT');
  const applicantChild = applicantChildren[0] ?? null;

  return {
    leadCode: lead.code,
    familyName: lead.familyName,
    students: applicantChildren.map(child => buildStudentFromChild(child, related)),
    student: buildLegacyStudent(applicantChild),
    father: buildParentProjection(father, lead.address),
    mother: buildParentProjection(mother, lead.address),
    address: buildAddressProjection(lead.address),
    additionalInfo: buildLegacyAdditionalInfo(related.additionalInfoList),
    enrollmentInfo: buildLegacyEnrollmentInfo(related.enrollmentInfoList),
    childHealth: buildLegacyChildHealth(applicantChild, related.childrenHealth),
    emergencyContacts: mapEmergencyContacts(related.emergencyContacts),
    healthPlan: buildHealthPlanProjection(related.healthPlan),
    transport: buildTransportProjection(related.transport),
    financialResponsible: buildFinancialResponsibleProjection(related.financialResponsible),
    documents: mapEnrollmentDocuments(related.enrollmentDocuments),
    tokenExpires: lead.enrollmentTokenExpires?.toISOString(),
    enrollmentStatus: lead.enrollmentStatus,
    isAlreadySubmitted: lead.enrollmentStatus === 'FORM_RECEIVED',
  };
}
