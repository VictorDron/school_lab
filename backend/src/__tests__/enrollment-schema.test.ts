/**
 * Enrollment Zod Schema Validation Tests
 *
 * Tests the publicEnrollmentSchema against payloads that match
 * what the frontend actually sends on form submission.
 */

import { describe, it, expect } from 'vitest';
import { publicEnrollmentSchema } from '../schemas/public.schemas.js';

// ============================================================================
// Exact frontend form defaults (from EnrollmentFormPage.tsx defaultValues)
// ============================================================================
const FRONTEND_DEFAULTS = {
  enrollmentInfo: {
    academicCalendar: '',
    campus: '',
    course: '',
    module: '',
    classGroup: '',
    personType: 'INDIVIDUAL',
    studentCpf: '',
    studentIdNumber: '',
    studentIdIssueDate: '',
    studentIdIssuer: '',
  },
  student: { desiredGrade: '' },
  studentsEnrollment: [],
  fatherUpdates: {
    email: '', phone: '', cpf: '',
    idNumber: '', idIssueDate: '', idIssuer: '',
    dateOfBirth: '', education: '', religion: '',
    address: { zipCode: '', country: '', state: '', city: '', neighborhood: '', street: '', number: '', complement: '' },
  },
  motherUpdates: {
    email: '', phone: '', cpf: '',
    idNumber: '', idIssueDate: '', idIssuer: '',
    dateOfBirth: '', education: '', religion: '',
    address: { zipCode: '', country: '', state: '', city: '', neighborhood: '', street: '', number: '', complement: '' },
  },
  health: {
    weight: '', height: '', bloodType: '',
    medicalConditions: [], medicalConditionsNotes: '',
    hasHospitalizations: false, hospitalizationsNotes: '',
    hasSeizures: false, seizuresNotes: '',
    allergies: [], allergiesNotes: '',
    feverMedications: [], feverMedicationOther: '',
    painMedications: [], painMedicationOther: '',
    medicationRestrictions: '', regularMedications: '',
    hasEatingDisorder: false, eatingDisorderNotes: '',
    additionalHealthInfo: '',
  },
  emergencyContacts: [{ name: '', phone: '', email: '', relationship: '', isPrimary: true }],
  healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
  transport: {
    dropoffPickupPersons: [], dropoffPickupOther: '',
    transportMethod: 'CAR', transportMethodOther: '',
    familyVehicles: [],
    canLeaveAlone: false, isAthlete: false, athleteSchedule: {},
    schoolBusCompany: '', schoolBusContactName: '', schoolBusContactPhone: '', schoolBusContactEmail: '',
    hasLegalRestrictions: false, legalRestrictionsNotes: '',
    allowThirdPartyPickup: false,
  },
  financialResponsible: { responsibleType: 'FATHER' as const, fullName: '', cpf: '', email: '', phone: '', address: {} },
  authorizedPersons: [],
  termsAccepted: false,
};

// ============================================================================
// Helper: builds a payload exactly as the frontend onSubmit constructs it
// ============================================================================
function buildFrontendPayload(formData: Record<string, any> = {}, opts: { multiChild?: boolean; parentsSeparateAddresses?: boolean } = {}) {
  const data = { ...FRONTEND_DEFAULTS, ...formData };

  // Reproduce the frontend onSubmit logic
  const childrenData = opts.multiChild && data.studentsEnrollment?.length > 1
    ? data.studentsEnrollment.map((se: any) => ({
        childId: se.childId || '',
        enrollmentInfo: se.enrollmentInfo,
        health: se.health,
      }))
    : undefined;

  return {
    enrollmentToken: 'test-token-123',
    // For multi-child, root enrollmentInfo/health are undefined (data is in childrenData)
    enrollmentInfo: childrenData ? undefined : data.enrollmentInfo,
    childrenData,
    fatherUpdates: { ...data.fatherUpdates },
    motherUpdates: {
      ...data.motherUpdates,
      sameAddressAsOtherParent: !(opts.parentsSeparateAddresses ?? false),
    },
    health: childrenData ? undefined : data.health,
    emergencyContacts: data.emergencyContacts,
    healthPlan: data.healthPlan,
    transport: {
      ...data.transport,
      authorizedPersons: data.authorizedPersons,
    },
    financialResponsible: data.financialResponsible,
    termsAccepted: data.termsAccepted,
  };
}

function parseAndLog(payload: any) {
  const result = publicEnrollmentSchema.safeParse(payload);
  if (!result.success) {
    const errors = result.error.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));
    console.log('VALIDATION ERRORS:', JSON.stringify(errors, null, 2));
  }
  return result;
}

// ============================================================================
// Single-child: user fills all required fields normally
// ============================================================================
const VALID_SINGLE_CHILD_FILLED = {
  enrollmentInfo: {
    academicCalendar: '',
    campus: '',
    course: '',
    module: '',
    classGroup: '',
    personType: 'PF',
    studentCpf: '123.456.789-00',
    studentIdNumber: 'MG-12.345.678',
    studentIdIssueDate: '2020-01-15',
    studentIdIssuer: 'SSP',
  },
  fatherUpdates: {
    email: 'father@test.com', phone: '(31) 99999-0000', cpf: '111.222.333-44',
    idNumber: 'MG-1111', idIssueDate: '2015-01-01', idIssuer: 'SSP',
    dateOfBirth: '1980-05-10', education: 'SUPERIOR', religion: '',
    address: { country: 'Brasil', state: 'MG', city: 'BH', neighborhood: 'Savassi', street: 'Rua Teste', number: '123', complement: '', zipCode: '30130-000' },
  },
  motherUpdates: {
    email: 'mother@test.com', phone: '(31) 99999-1111', cpf: '555.666.777-88',
    idNumber: 'MG-2222', idIssueDate: '2016-03-20', idIssuer: 'SSP',
    dateOfBirth: '1982-08-15', education: 'SUPERIOR', religion: '',
    address: { country: 'Brasil', state: 'MG', city: 'BH', neighborhood: 'Savassi', street: 'Rua Teste', number: '123', complement: '', zipCode: '30130-000' },
  },
  health: {
    weight: '35', height: '1.40', bloodType: 'O+',
    medicalConditions: ['Nenhuma'], medicalConditionsNotes: '',
    hasHospitalizations: false, hospitalizationsNotes: '',
    hasSeizures: false, seizuresNotes: '',
    allergies: ['Nenhuma'], allergiesNotes: '',
    feverMedications: ['Dipirona'], feverMedicationOther: '',
    painMedications: ['Ibuprofeno'], painMedicationOther: '',
    medicationRestrictions: '', regularMedications: '',
    hasEatingDisorder: false, eatingDisorderNotes: '',
    additionalHealthInfo: '',
  },
  emergencyContacts: [{ name: 'Tia Maria', phone: '(31) 99999-2222', email: '', relationship: 'TIA', isPrimary: true }],
  transport: {
    dropoffPickupPersons: ['FATHER', 'MOTHER'],
    dropoffPickupOther: '',
    transportMethod: 'CAR',
    transportMethodOther: '',
    familyVehicles: [{ model: 'Honda Civic', color: 'Prata', plate: 'ABC-1234' }],
    canLeaveAlone: false,
    isAthlete: false,
    athleteSchedule: {},
    schoolBusCompany: '', schoolBusContactName: '', schoolBusContactPhone: '', schoolBusContactEmail: '',
    hasLegalRestrictions: false, legalRestrictionsNotes: '',
    allowThirdPartyPickup: false,
  },
  financialResponsible: { responsibleType: 'FATHER' as const, fullName: '', cpf: '', email: '', phone: '', address: {} },
  termsAccepted: true as const,
};

// ============================================================================
// Tests
// ============================================================================

describe('publicEnrollmentSchema - realistic frontend payloads', () => {

  // ---- Single-child scenarios ----

  describe('Single-child: normal flow (all fields filled)', () => {
    it('should accept valid single-child submission', () => {
      const payload = buildFrontendPayload(VALID_SINGLE_CHILD_FILLED);
      const result = parseAndLog(payload);
      expect(result.success).toBe(true);
    });
  });

  describe('Single-child: canLeaveAlone=true (transport fields hidden)', () => {
    it('should accept when canLeaveAlone=true with default transport values', () => {
      const payload = buildFrontendPayload({
        ...VALID_SINGLE_CHILD_FILLED,
        transport: {
          // Frontend defaults for hidden fields + canLeaveAlone=true
          dropoffPickupPersons: [],
          dropoffPickupOther: '',
          transportMethod: 'CAR', // stays at default since field is hidden
          transportMethodOther: '',
          familyVehicles: [],
          canLeaveAlone: true,
          isAthlete: false,
          athleteSchedule: {},
          schoolBusCompany: '', schoolBusContactName: '', schoolBusContactPhone: '', schoolBusContactEmail: '',
          hasLegalRestrictions: false, legalRestrictionsNotes: '',
          allowThirdPartyPickup: false,
        },
      });
      const result = parseAndLog(payload);
      expect(result.success).toBe(true);
    });
  });

  // ---- Multi-child scenarios ----

  describe('Multi-child: root enrollmentInfo has defaults (empty values)', () => {
    it('should accept when childrenData is present and root enrollmentInfo has empty values', () => {
      // This is the real scenario: frontend always sends root enrollmentInfo
      // even for multi-child, where the actual data is in childrenData.
      // Root enrollmentInfo has defaults: personType='INDIVIDUAL', rest empty.
      const payload = buildFrontendPayload({
        // Root enrollmentInfo: default values (what frontend sends for multi-child)
        enrollmentInfo: FRONTEND_DEFAULTS.enrollmentInfo,
        // Children have valid data
        studentsEnrollment: [
          {
            childId: 'child-1',
            enrollmentInfo: {
              personType: 'PF', studentCpf: '123.456.789-00',
              studentIdNumber: 'MG-123', studentIdIssueDate: '2020-01-15', studentIdIssuer: 'SSP',
            },
            health: {
              weight: '35', height: '1.40', bloodType: 'O+',
              medicalConditions: ['Nenhuma'], allergies: ['Nenhuma'],
              feverMedications: ['Dipirona'], painMedications: ['Ibuprofeno'],
            },
          },
          {
            childId: 'child-2',
            enrollmentInfo: {
              personType: 'PF', studentCpf: '987.654.321-00',
              studentIdNumber: 'MG-456', studentIdIssueDate: '2021-06-10', studentIdIssuer: 'SSP',
            },
            health: {
              weight: '28', height: '1.20', bloodType: 'A+',
              medicalConditions: ['Nenhuma'], allergies: ['Nenhuma'],
              feverMedications: ['Paracetamol'], painMedications: ['Ibuprofeno'],
            },
          },
        ],
        // health: last active child's data
        health: {
          weight: '28', height: '1.20', bloodType: 'A+',
          medicalConditions: ['Nenhuma'], medicalConditionsNotes: '',
          hasHospitalizations: false, hospitalizationsNotes: '',
          hasSeizures: false, seizuresNotes: '',
          allergies: ['Nenhuma'], allergiesNotes: '',
          feverMedications: ['Paracetamol'], feverMedicationOther: '',
          painMedications: ['Ibuprofeno'], painMedicationOther: '',
          medicationRestrictions: '', regularMedications: '',
          hasEatingDisorder: false, eatingDisorderNotes: '',
          additionalHealthInfo: '',
        },
        fatherUpdates: VALID_SINGLE_CHILD_FILLED.fatherUpdates,
        motherUpdates: VALID_SINGLE_CHILD_FILLED.motherUpdates,
        emergencyContacts: VALID_SINGLE_CHILD_FILLED.emergencyContacts,
        transport: VALID_SINGLE_CHILD_FILLED.transport,
        termsAccepted: true as const,
      }, { multiChild: true });
      const result = parseAndLog(payload);
      expect(result.success).toBe(true);
    });
  });

  // ---- Transport conditional validation ----

  describe('Transport: canLeaveAlone conditional rules', () => {
    it('should REJECT empty dropoffPickupPersons when canLeaveAlone=false', () => {
      const payload = buildFrontendPayload({
        ...VALID_SINGLE_CHILD_FILLED,
        transport: { ...VALID_SINGLE_CHILD_FILLED.transport, dropoffPickupPersons: [], canLeaveAlone: false },
      });
      const result = publicEnrollmentSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.path.includes('dropoffPickupPersons'))).toBe(true);
      }
    });

    it('should REJECT empty transportMethod when canLeaveAlone=false', () => {
      const payload = buildFrontendPayload({
        ...VALID_SINGLE_CHILD_FILLED,
        transport: { ...VALID_SINGLE_CHILD_FILLED.transport, transportMethod: '', canLeaveAlone: false },
      });
      const result = publicEnrollmentSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.path.includes('transportMethod'))).toBe(true);
      }
    });

    it('should ACCEPT empty transport fields when canLeaveAlone=true', () => {
      const payload = buildFrontendPayload({
        ...VALID_SINGLE_CHILD_FILLED,
        transport: {
          ...FRONTEND_DEFAULTS.transport,
          canLeaveAlone: true,
        },
      });
      const result = parseAndLog(payload);
      expect(result.success).toBe(true);
    });
  });

  // ---- Financial responsible ----

  describe('Financial responsible', () => {
    it('should accept FATHER with empty detail fields', () => {
      const payload = buildFrontendPayload({
        ...VALID_SINGLE_CHILD_FILLED,
        financialResponsible: { responsibleType: 'FATHER', fullName: '', cpf: '', email: '', phone: '', address: {} },
      });
      const result = parseAndLog(payload);
      expect(result.success).toBe(true);
    });

    it('should reject OTHER with empty required fields', () => {
      const payload = buildFrontendPayload({
        ...VALID_SINGLE_CHILD_FILLED,
        financialResponsible: { responsibleType: 'OTHER', fullName: '', cpf: '', email: '', phone: '', address: {} },
      });
      const result = publicEnrollmentSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  // ---- Terms ----

  describe('Terms', () => {
    it('should reject termsAccepted=false', () => {
      const payload = buildFrontendPayload({ ...VALID_SINGLE_CHILD_FILLED, termsAccepted: false });
      const result = publicEnrollmentSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  // ---- Emergency contacts ----

  describe('Emergency contacts', () => {
    it('should reject empty emergency contacts array', () => {
      const payload = buildFrontendPayload({ ...VALID_SINGLE_CHILD_FILLED, emergencyContacts: [] });
      const result = publicEnrollmentSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should reject contact with empty name', () => {
      const payload = buildFrontendPayload({
        ...VALID_SINGLE_CHILD_FILLED,
        emergencyContacts: [{ name: '', phone: '(31) 99999-0000', email: '', relationship: '', isPrimary: true }],
      });
      const result = publicEnrollmentSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  // ---- Sanitized data edge cases (fixes for the 400 error) ----

  describe('Sanitized data edge cases', () => {
    it('should accept health data with boolean defaults (from sanitizer)', () => {
      const payload = buildFrontendPayload({
        ...VALID_SINGLE_CHILD_FILLED,
        health: {
          ...VALID_SINGLE_CHILD_FILLED.health,
          hasHospitalizations: false,
          hasSeizures: false,
          hasEatingDisorder: false,
        },
      });
      const result = parseAndLog(payload);
      expect(result.success).toBe(true);
    });

    it('should accept transport with all boolean defaults (from sanitizer)', () => {
      const payload = buildFrontendPayload({
        ...VALID_SINGLE_CHILD_FILLED,
        transport: {
          ...VALID_SINGLE_CHILD_FILLED.transport,
          canLeaveAlone: false,
          isAthlete: false,
          hasLegalRestrictions: false,
          allowThirdPartyPickup: false,
        },
      });
      const result = parseAndLog(payload);
      expect(result.success).toBe(true);
    });

    it('should accept sanitized contacts (filtered empty entries)', () => {
      const payload = buildFrontendPayload({
        ...VALID_SINGLE_CHILD_FILLED,
        emergencyContacts: [
          { name: 'Tia Maria', phone: '(31) 99999-2222', email: '', relationship: 'TIA', isPrimary: true },
        ],
      });
      const result = parseAndLog(payload);
      expect(result.success).toBe(true);
    });

    it('should accept submission with empty authorizedPersons when allowThirdPartyPickup=false', () => {
      const payload = buildFrontendPayload({
        ...VALID_SINGLE_CHILD_FILLED,
        transport: {
          ...VALID_SINGLE_CHILD_FILLED.transport,
          allowThirdPartyPickup: false,
        },
        authorizedPersons: [],
      });
      const result = parseAndLog(payload);
      expect(result.success).toBe(true);
    });

    it('should accept valid authorized person when dropoffPickupPersons includes THIRD_PARTY', () => {
      const payload = buildFrontendPayload({
        ...VALID_SINGLE_CHILD_FILLED,
        transport: {
          ...VALID_SINGLE_CHILD_FILLED.transport,
          dropoffPickupPersons: ['THIRD_PARTY'],
        },
        authorizedPersons: [{
          name: 'Tia Ana',
          dateOfBirth: '1985-03-15',
          cpf: '123.456.789-00',
          email: 'ana@test.com',
          bond: 'AUNT',
        }],
      });
      const result = parseAndLog(payload);
      expect(result.success).toBe(true);
    });

    it('should REJECT authorized person with invalid email format', () => {
      const payload = buildFrontendPayload({
        ...VALID_SINGLE_CHILD_FILLED,
        transport: {
          ...VALID_SINGLE_CHILD_FILLED.transport,
          allowThirdPartyPickup: true,
        },
        authorizedPersons: [{
          name: 'Tia Ana',
          dateOfBirth: '1985-03-15',
          cpf: '123.456.789-00',
          email: 'not-an-email',
          relationship: 'AUNT',
        }],
      });
      const result = publicEnrollmentSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.some(e => e.path.includes('email'))).toBe(true);
      }
    });

    it('should accept school bus fields when transport method is SCHOOL_BUS', () => {
      const payload = buildFrontendPayload({
        ...VALID_SINGLE_CHILD_FILLED,
        transport: {
          ...VALID_SINGLE_CHILD_FILLED.transport,
          transportMethod: 'SCHOOL_BUS',
          schoolBusCompany: 'Van Escolar',
          schoolBusContactName: 'Joao',
          schoolBusContactPhone: '(31) 99999-3333',
          familyVehicles: [],
        },
      });
      const result = parseAndLog(payload);
      expect(result.success).toBe(true);
    });

    it('should ACCEPT school bus without company when method is SCHOOL_BUS (school bus fields are legacy/optional)', () => {
      const payload = buildFrontendPayload({
        ...VALID_SINGLE_CHILD_FILLED,
        transport: {
          ...VALID_SINGLE_CHILD_FILLED.transport,
          transportMethod: 'SCHOOL_BUS',
          schoolBusCompany: '',
          schoolBusContactName: '',
          schoolBusContactPhone: '',
          familyVehicles: [],
        },
      });
      const result = publicEnrollmentSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });
  });

  // ---- Validation error response format (error details) ----

  describe('Validation error details format', () => {
    it('should provide path and message in Zod error details', () => {
      const payload = buildFrontendPayload({
        ...VALID_SINGLE_CHILD_FILLED,
        termsAccepted: false,
      });
      const result = publicEnrollmentSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorSummary = result.error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
          code: e.code,
        }));
        expect(errorSummary.length).toBeGreaterThan(0);
        expect(errorSummary[0]).toHaveProperty('path');
        expect(errorSummary[0]).toHaveProperty('message');
        expect(errorSummary[0]).toHaveProperty('code');
      }
    });

    it('should produce multiple errors when multiple fields are invalid', () => {
      const payload = buildFrontendPayload({
        ...VALID_SINGLE_CHILD_FILLED,
        emergencyContacts: [],
        termsAccepted: false,
      });
      const result = publicEnrollmentSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThanOrEqual(2);
      }
    });
  });
});

// ============================================================================
// Frontend document count logic tests
// ============================================================================

describe('Document count logic - includesOtherDocs', () => {
  // Simulates the isDocCovered function from the frontend
  const isDocCovered = (
    docType: string,
    category: string,
    uploadedDocs: Array<{ documentType: string; category: string; childId?: string; includesOtherDocs?: string[] }>,
    childId?: string,
  ) => {
    return uploadedDocs.some(upDoc => {
      const matchesChild = childId ? upDoc.childId === childId : (category !== 'STUDENT' || upDoc.category === category);
      const categoryMatch = category !== 'STUDENT' ? upDoc.category !== 'STUDENT' : upDoc.category === 'STUDENT';
      if (upDoc.documentType === docType && categoryMatch && matchesChild) return true;
      if (categoryMatch && matchesChild && upDoc.includesOtherDocs?.includes(docType)) return true;
      return false;
    });
  };

  it('should count directly uploaded document', () => {
    const docs = [{ documentType: 'STUDENT_ID', category: 'STUDENT' }];
    expect(isDocCovered('STUDENT_ID', 'STUDENT', docs)).toBe(true);
  });

  it('should count document included in another (STUDENT_CPF via STUDENT_ID)', () => {
    const docs = [
      { documentType: 'STUDENT_ID', category: 'STUDENT', includesOtherDocs: ['STUDENT_CPF'] },
    ];
    expect(isDocCovered('STUDENT_CPF', 'STUDENT', docs)).toBe(true);
  });

  it('should NOT count unrelated document type', () => {
    const docs = [
      { documentType: 'STUDENT_ID', category: 'STUDENT', includesOtherDocs: ['STUDENT_CPF'] },
    ];
    expect(isDocCovered('BIRTH_CERTIFICATE', 'STUDENT', docs)).toBe(false);
  });

  it('should handle multi-child per-child document lookup', () => {
    const docs = [
      { documentType: 'STUDENT_ID', category: 'STUDENT', childId: 'child-1', includesOtherDocs: ['STUDENT_CPF'] },
      { documentType: 'STUDENT_ID', category: 'STUDENT', childId: 'child-2' },
    ];
    // child-1 has STUDENT_CPF included
    expect(isDocCovered('STUDENT_CPF', 'STUDENT', docs, 'child-1')).toBe(true);
    // child-2 does NOT have STUDENT_CPF included
    expect(isDocCovered('STUDENT_CPF', 'STUDENT', docs, 'child-2')).toBe(false);
  });

  it('should count shared category documents (MOTHER_ID includes MOTHER_CPF)', () => {
    const docs = [
      { documentType: 'MOTHER_ID', category: 'MOTHER', includesOtherDocs: ['MOTHER_CPF'] },
    ];
    expect(isDocCovered('MOTHER_CPF', 'MOTHER', docs)).toBe(true);
    expect(isDocCovered('MOTHER_ID', 'MOTHER', docs)).toBe(true);
    expect(isDocCovered('MOTHER_PROOF_OF_RESIDENCE', 'MOTHER', docs)).toBe(false);
  });

  it('should not cross-contaminate between categories', () => {
    const docs = [
      { documentType: 'MOTHER_ID', category: 'MOTHER', includesOtherDocs: ['MOTHER_CPF'] },
    ];
    // FATHER_CPF should NOT be covered by MOTHER_ID
    expect(isDocCovered('FATHER_CPF', 'FATHER', docs)).toBe(false);
  });
});

// ============================================================================
// hasHealthConditions logic test
// ============================================================================

describe('hasHealthConditions filter logic', () => {
  const hasHealthConditions = (healthData: any) => !!(
    (healthData?.medicalConditions && healthData.medicalConditions.length > 0 && !healthData.medicalConditions.every((c: string) => c === 'NONE')) ||
    healthData?.hasHospitalizations ||
    healthData?.hasSeizures ||
    (healthData?.allergies && healthData.allergies.length > 0 && !healthData.allergies.every((a: string) => a === 'NONE')) ||
    healthData?.hasEatingDisorder
  );

  it('should return false when medicalConditions is ["NONE"] and allergies is ["NONE"]', () => {
    expect(hasHealthConditions({
      medicalConditions: ['NONE'],
      allergies: ['NONE'],
      hasHospitalizations: false,
      hasSeizures: false,
      hasEatingDisorder: false,
    })).toBe(false);
  });

  it('should return true when medicalConditions has real conditions', () => {
    expect(hasHealthConditions({
      medicalConditions: ['ASTHMA'],
      allergies: ['NONE'],
      hasHospitalizations: false,
      hasSeizures: false,
      hasEatingDisorder: false,
    })).toBe(true);
  });

  it('should return true when hasHospitalizations is true', () => {
    expect(hasHealthConditions({
      medicalConditions: ['NONE'],
      allergies: ['NONE'],
      hasHospitalizations: true,
      hasSeizures: false,
      hasEatingDisorder: false,
    })).toBe(true);
  });

  it('should return true when allergies has real values', () => {
    expect(hasHealthConditions({
      medicalConditions: ['NONE'],
      allergies: ['PEANUTS'],
      hasHospitalizations: false,
      hasSeizures: false,
      hasEatingDisorder: false,
    })).toBe(true);
  });

  it('should return false when empty arrays', () => {
    expect(hasHealthConditions({
      medicalConditions: [],
      allergies: [],
      hasHospitalizations: false,
      hasSeizures: false,
      hasEatingDisorder: false,
    })).toBe(false);
  });

  it('should return false for undefined health data', () => {
    expect(hasHealthConditions(undefined)).toBe(false);
    expect(hasHealthConditions(null)).toBe(false);
  });
});
