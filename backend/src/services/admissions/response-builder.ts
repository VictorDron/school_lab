import type {
  Lead,
  LeadAddress,
  LeadAdditionalInfo,
  LeadChild,
  LeadDocument,
  LeadEducationHistory,
  LeadParent,
} from '@prisma/client';

/**
 * Lead shape used by the application-data response. Matches the data the
 * caller already loaded for getApplicationData (children come included with
 * the lead; the rest are loaded in parallel).
 */
export type LeadWithChildren = Lead & { children: LeadChild[] };

export interface ApplicationRelatedData {
  address: LeadAddress | null;
  parents: LeadParent[];
  educationHistory: LeadEducationHistory[];
  additionalInfoList: LeadAdditionalInfo[];
  documents: LeadDocument[];
}

function buildAdditionalInfoProjection(info: LeadAdditionalInfo) {
  return {
    hasPsychoEvaluation: info.hasPsychoEvaluation,
    psychoEvaluationDetails: info.psychoEvaluationDetails,
    hasAcademicSupport: info.hasAcademicSupport,
    academicSupportDetails: info.academicSupportDetails,
    hasHealthIssues: info.hasHealthIssues,
    healthIssuesDetails: info.healthIssuesDetails,
    hasAdaptationDifficulty: info.hasAdaptationDifficulty,
    adaptationDifficultyDetails: info.adaptationDifficultyDetails,
    otherRelevantInfo: info.otherRelevantInfo,
  };
}

function buildEducationHistoryForChild(
  child: LeadChild,
  educationHistory: LeadEducationHistory[],
) {
  return educationHistory
    .filter(edu => edu.childId === child.id)
    .map(edu => ({
      schoolName: edu.schoolName,
      country: edu.country,
      city: edu.city,
      gradesAttended: edu.gradesAttended,
    }));
}

function buildParentProjection(parent: LeadParent) {
  return {
    name: parent.fullName,
    email: parent.email,
    phone: parent.phone,
    cpf: parent.cpf,
    occupation: parent.occupation,
    nativeLanguage: parent.nativeLanguage,
  };
}

function buildAddressProjection(address: LeadAddress) {
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

function buildChildProjection(child: LeadChild) {
  return {
    id: child.id,
    fullName: child.fullName,
    dateOfBirth: child.dateOfBirth?.toISOString().split('T')[0],
    gender: child.gender,
    nationality: child.nationality,
    desiredGrade: child.desiredGrade,
    currentGrade: child.currentGrade,
    studentType: child.studentType,
    currentSchool: child.currentSchool,
    specialNeeds: child.specialNeeds,
    primaryLanguage: child.primaryLanguage,
    otherLanguages: child.otherLanguages,
  };
}

function buildStudentProjection(
  child: LeadChild,
  educationHistory: LeadEducationHistory[],
  additionalInfoList: LeadAdditionalInfo[],
) {
  const childAdditionalInfo = additionalInfoList.find(ai => ai.childId === child.id);
  return {
    ...buildChildProjection(child),
    educationHistory: buildEducationHistoryForChild(child, educationHistory),
    additionalInfo: childAdditionalInfo ? buildAdditionalInfoProjection(childAdditionalInfo) : null,
  };
}

function buildDocumentProjection(doc: LeadDocument) {
  return {
    id: doc.id,
    name: doc.name,
    type: doc.type,
    url: doc.url,
    size: doc.size,
    uploadedAt: doc.uploadedAt,
    childIndex: doc.childIndex,
  };
}

/**
 * Shape the lead + related data into the response consumed by the public
 * admission form for pre-fill. Splitting this out keeps the service file
 * focused on the data fetch — every transformation lives here.
 */
export function buildApplicationDataResponse(
  lead: LeadWithChildren,
  related: ApplicationRelatedData,
) {
  const { address, parents, educationHistory, additionalInfoList, documents } = related;
  const father = parents.find(p => p.parentType === 'FATHER');
  const mother = parents.find(p => p.parentType === 'MOTHER');

  const applicantChildren = lead.children.filter(c => c.isApplicant && c.relationship === 'STUDENT');
  const studentsData = applicantChildren.map(child =>
    buildStudentProjection(child, educationHistory, additionalInfoList),
  );

  return {
    familyName: lead.familyName,
    source: lead.source,
    desiredGrades: lead.desiredGrades,
    livesWith: lead.livesWith,
    guardianInfo: lead.guardianInfo,

    // Primary contact info (legacy support)
    primaryContactName: lead.primaryContactName,
    primaryContactEmail: lead.primaryContactEmail,
    primaryContactPhone: lead.primaryContactPhone,
    secondaryContactName: lead.secondaryContactName,
    secondaryContactEmail: lead.secondaryContactEmail,
    secondaryContactPhone: lead.secondaryContactPhone,

    father: father ? buildParentProjection(father) : null,
    mother: mother ? buildParentProjection(mother) : null,
    address: address ? buildAddressProjection(address) : null,

    // Students array (applicants with per-child data)
    students: studentsData,

    // All children data (legacy: includes siblings too)
    children: lead.children.map(child => ({
      ...buildChildProjection(child),
      relationship: child.relationship,
      isApplicant: child.isApplicant,
    })),

    documents: documents.map(buildDocumentProjection),

    tokenExpires: lead.applicationTokenExpires?.toISOString(),
    isAlreadySubmitted: (lead.formSubmissionCount ?? 0) > 0,
  };
}
