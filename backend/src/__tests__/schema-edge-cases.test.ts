/**
 * Comprehensive Zod Schema Edge Case Tests for publicEnrollmentSchema
 *
 * Tests ALL validation branches including transport superRefine,
 * financial responsible superRefine, health data, emergency contacts,
 * enrollment info, terms/token, parent updates, childrenData, and
 * combined validation error counts.
 */

import { describe, it, expect } from 'vitest';
import { publicEnrollmentSchema } from '../schemas/public.schemas.js';

// ============================================================================
// Helper: builds a valid base payload that passes all validation
// ============================================================================
function validPayload(overrides: Record<string, any> = {}) {
  return {
    enrollmentToken: 'test-token-123',
    enrollmentInfo: {
      academicCalendar: '', campus: '', course: '', module: '', classGroup: '',
      personType: 'INDIVIDUAL', studentCpf: '123.456.789-00',
      studentIdNumber: 'MG-12.345.678', studentIdIssueDate: '2020-01-15', studentIdIssuer: 'SSP',
    },
    fatherUpdates: {
      email: 'f@t.com', phone: '31999990000', cpf: '', idNumber: '', idIssueDate: '', idIssuer: '',
      dateOfBirth: '', education: '', religion: '',
      address: { zipCode: '', country: '', state: '', city: '', neighborhood: '', street: '', number: '', complement: '' },
    },
    motherUpdates: {
      email: 'm@t.com', phone: '31999991111', cpf: '', idNumber: '', idIssueDate: '', idIssuer: '',
      dateOfBirth: '', education: '', religion: '',
      address: { zipCode: '', country: '', state: '', city: '', neighborhood: '', street: '', number: '', complement: '' },
      sameAddressAsOtherParent: true,
    },
    health: {
      weight: '35', height: '140', bloodType: 'O+',
      medicalConditions: ['NONE'], medicalConditionsNotes: '',
      hasHospitalizations: false, hospitalizationsNotes: '',
      hasSeizures: false, seizuresNotes: '',
      allergies: ['NONE'], allergiesNotes: '',
      feverMedications: ['DIPIRONA'], feverMedicationOther: '',
      painMedications: ['IBUPROFENO'], painMedicationOther: '',
      medicationRestrictions: '', regularMedications: '',
      hasEatingDisorder: false, eatingDisorderNotes: '',
      additionalHealthInfo: '',
    },
    emergencyContacts: [{ name: 'Tia Maria', phone: '31999992222', email: '', relationship: 'TIA', isPrimary: true }],
    healthPlan: { operator: '', beneficiaryCode: '', planType: '', preferredHospital: '' },
    transport: {
      dropoffPickupPersons: ['FATHER'], dropoffPickupOther: '',
      transportMethod: 'CAR', transportMethodOther: '',
      familyVehicles: [{ model: 'Civic', color: 'Prata', plate: 'ABC1D23' }],
      canLeaveAlone: false, isAthlete: false, athleteSchedule: {},
      schoolBusCompany: '', schoolBusContactName: '', schoolBusContactPhone: '', schoolBusContactEmail: '',
      hasLegalRestrictions: false, legalRestrictionsNotes: '',
      allowThirdPartyPickup: false, authorizedPersons: [],
    },
    financialResponsible: { responsibleType: 'FATHER' as const, fullName: '', cpf: '', email: '', phone: '', address: {} },
    termsAccepted: true as const,
    ...overrides,
  };
}

// ============================================================================
// 1. Transport superRefine - ALL branches (15 tests)
// ============================================================================
describe('Transport superRefine - ALL branches', () => {

  it('canLeaveAlone=false + empty dropoffPickupPersons -> REJECT with correct path', () => {
    const payload = validPayload({
      transport: {
        ...validPayload().transport,
        canLeaveAlone: false,
        dropoffPickupPersons: [],
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map(e => e.path.join('.'));
      expect(paths).toContain('transport.dropoffPickupPersons');
    }
  });

  it('canLeaveAlone=false + empty transportMethod -> REJECT with correct path', () => {
    const payload = validPayload({
      transport: {
        ...validPayload().transport,
        canLeaveAlone: false,
        transportMethod: '',
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map(e => e.path.join('.'));
      expect(paths).toContain('transport.transportMethod');
    }
  });

  it('canLeaveAlone=false + both filled -> ACCEPT', () => {
    const payload = validPayload({
      transport: {
        ...validPayload().transport,
        canLeaveAlone: false,
        dropoffPickupPersons: ['FATHER'],
        transportMethod: 'CAR',
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('canLeaveAlone=true + empty dropoffPickupPersons -> ACCEPT', () => {
    const payload = validPayload({
      transport: {
        ...validPayload().transport,
        canLeaveAlone: true,
        dropoffPickupPersons: [],
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('canLeaveAlone=true + empty transportMethod -> ACCEPT', () => {
    const payload = validPayload({
      transport: {
        ...validPayload().transport,
        canLeaveAlone: true,
        transportMethod: '',
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('dropoffPickupPersons includes OTHER + dropoffPickupOther empty -> ACCEPT (no OTHER validation in current schema)', () => {
    const payload = validPayload({
      transport: {
        ...validPayload().transport,
        dropoffPickupPersons: ['OTHER'],
        dropoffPickupOther: '',
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('dropoffPickupPersons includes OTHER + dropoffPickupOther filled -> ACCEPT', () => {
    const payload = validPayload({
      transport: {
        ...validPayload().transport,
        dropoffPickupPersons: ['OTHER'],
        dropoffPickupOther: 'Vizinha Maria',
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('dropoffPickupPersons includes OTHER + dropoffPickupOther whitespace only -> ACCEPT (no OTHER validation in current schema)', () => {
    const payload = validPayload({
      transport: {
        ...validPayload().transport,
        dropoffPickupPersons: ['OTHER'],
        dropoffPickupOther: '   ',
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('transportMethod=OTHER + transportMethodOther empty -> REJECT', () => {
    const payload = validPayload({
      transport: {
        ...validPayload().transport,
        transportMethod: 'OTHER',
        transportMethodOther: '',
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map(e => e.path.join('.'));
      expect(paths).toContain('transport.transportMethodOther');
    }
  });

  it('transportMethod=OTHER + transportMethodOther filled -> ACCEPT', () => {
    const payload = validPayload({
      transport: {
        ...validPayload().transport,
        transportMethod: 'OTHER',
        transportMethodOther: 'Bicicleta',
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('transportMethod=SCHOOL_BUS + all school bus fields empty -> ACCEPT (school bus fields are legacy/optional)', () => {
    const payload = validPayload({
      transport: {
        ...validPayload().transport,
        transportMethod: 'SCHOOL_BUS',
        schoolBusCompany: '',
        schoolBusContactName: '',
        schoolBusContactPhone: '',
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('transportMethod=SCHOOL_BUS + all school bus fields filled -> ACCEPT', () => {
    const payload = validPayload({
      transport: {
        ...validPayload().transport,
        transportMethod: 'SCHOOL_BUS',
        schoolBusCompany: 'Van do Tio Ze',
        schoolBusContactName: 'Ze',
        schoolBusContactPhone: '31999993333',
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('dropoffPickupPersons includes SCHOOL_BUS (not transport method) -> ACCEPT (school bus fields are legacy/optional)', () => {
    const payload = validPayload({
      transport: {
        ...validPayload().transport,
        dropoffPickupPersons: ['SCHOOL_BUS'],
        transportMethod: 'CAR',
        schoolBusCompany: '',
        schoolBusContactName: '',
        schoolBusContactPhone: '',
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('dropoffPickupPersons includes THIRD_PARTY + empty authorizedPersons -> REJECT', () => {
    const payload = validPayload({
      transport: {
        ...validPayload().transport,
        dropoffPickupPersons: ['THIRD_PARTY'],
        authorizedPersons: [],
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map(e => e.path.join('.'));
      expect(paths).toContain('transport.authorizedPersons');
    }
  });

  it('dropoffPickupPersons includes THIRD_PARTY + valid authorized person -> ACCEPT', () => {
    const payload = validPayload({
      transport: {
        ...validPayload().transport,
        dropoffPickupPersons: ['THIRD_PARTY'],
        authorizedPersons: [{
          name: 'Tia Ana',
          dateOfBirth: '1985-03-15',
          cpf: '12345678901',
          email: 'ana@test.com',
          bond: 'TIA',
        }],
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// 2. Authorized Person Validation (6 tests)
// ============================================================================
describe('Authorized Person Validation', () => {

  function payloadWithAuthorizedPerson(personOverrides: Record<string, any>) {
    const basePerson = {
      name: 'Tia Ana',
      dateOfBirth: '1985-03-15',
      cpf: '12345678901',
      email: 'ana@test.com',
      bond: 'TIA',
    };
    return validPayload({
      transport: {
        ...validPayload().transport,
        dropoffPickupPersons: ['THIRD_PARTY'],
        authorizedPersons: [{ ...basePerson, ...personOverrides }],
      },
    });
  }

  it('missing name -> REJECT', () => {
    const payload = payloadWithAuthorizedPerson({ name: '' });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e =>
        e.path.includes('authorizedPersons') && e.path.includes('name')
      )).toBe(true);
    }
  });

  it('missing dateOfBirth -> REJECT', () => {
    const payload = payloadWithAuthorizedPerson({ dateOfBirth: '' });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e =>
        e.path.includes('authorizedPersons') && e.path.includes('dateOfBirth')
      )).toBe(true);
    }
  });

  it('missing cpf -> REJECT', () => {
    const payload = payloadWithAuthorizedPerson({ cpf: '' });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e =>
        e.path.includes('authorizedPersons') && e.path.includes('cpf')
      )).toBe(true);
    }
  });

  it('invalid email format -> REJECT', () => {
    const payload = payloadWithAuthorizedPerson({ email: 'not-an-email' });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e =>
        e.path.includes('authorizedPersons') && e.path.includes('email')
      )).toBe(true);
    }
  });

  it('missing bond -> REJECT', () => {
    const payload = payloadWithAuthorizedPerson({ bond: '' });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e =>
        e.path.includes('authorizedPersons') && e.path.includes('bond')
      )).toBe(true);
    }
  });

  it('valid person with optional vehicle -> ACCEPT', () => {
    const payload = validPayload({
      transport: {
        ...validPayload().transport,
        dropoffPickupPersons: ['THIRD_PARTY'],
        authorizedPersons: [{
          name: 'Tia Ana',
          dateOfBirth: '1985-03-15',
          cpf: '12345678901',
          email: 'ana@test.com',
          bond: 'TIA',
          vehicle: { model: 'Onix', color: 'Branco', plate: 'XYZ9A88' },
        }],
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// 3. Financial Responsible superRefine - ALL branches (12 tests)
// ============================================================================
describe('Financial Responsible superRefine - ALL branches', () => {

  it('responsibleType=FATHER + empty detail fields -> ACCEPT', () => {
    const payload = validPayload({
      financialResponsible: {
        responsibleType: 'FATHER', fullName: '', cpf: '', email: '', phone: '', address: {},
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('responsibleType=MOTHER + empty detail fields -> ACCEPT', () => {
    const payload = validPayload({
      financialResponsible: {
        responsibleType: 'MOTHER', fullName: '', cpf: '', email: '', phone: '', address: {},
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('responsibleType=OTHER + empty fullName -> REJECT', () => {
    const payload = validPayload({
      financialResponsible: {
        responsibleType: 'OTHER', fullName: '', cpf: '12345678901', email: 'x@t.com', phone: '119999',
        address: { state: 'MG', city: 'BH', neighborhood: 'Centro', street: 'Rua X', number: '10' },
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map(e => e.path.join('.'));
      expect(paths).toContain('financialResponsible.fullName');
    }
  });

  it('responsibleType=OTHER + empty cpf -> REJECT', () => {
    const payload = validPayload({
      financialResponsible: {
        responsibleType: 'OTHER', fullName: 'Joao', cpf: '', email: 'x@t.com', phone: '119999',
        address: { state: 'MG', city: 'BH', neighborhood: 'Centro', street: 'Rua X', number: '10' },
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map(e => e.path.join('.'));
      expect(paths).toContain('financialResponsible.cpf');
    }
  });

  it('responsibleType=OTHER + cpf with wrong digit count (10 digits) -> REJECT', () => {
    const payload = validPayload({
      financialResponsible: {
        responsibleType: 'OTHER', fullName: 'Joao', cpf: '1234567890', email: 'x@t.com', phone: '119999',
        address: { state: 'MG', city: 'BH', neighborhood: 'Centro', street: 'Rua X', number: '10' },
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map(e => e.path.join('.'));
      expect(paths).toContain('financialResponsible.cpf');
    }
  });

  it('responsibleType=OTHER + cpf with 11 digits -> ACCEPT', () => {
    const payload = validPayload({
      financialResponsible: {
        responsibleType: 'OTHER', relationship: 'GRANDPARENT', fullName: 'Joao', cpf: '12345678901', email: 'x@t.com', phone: '119999',
        address: { state: 'MG', city: 'BH', neighborhood: 'Centro', street: 'Rua X', number: '10' },
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('responsibleType=OTHER + cpf with formatting 123.456.789-00 (11 digits) -> ACCEPT', () => {
    const payload = validPayload({
      financialResponsible: {
        responsibleType: 'OTHER', relationship: 'GRANDPARENT', fullName: 'Joao', cpf: '123.456.789-00', email: 'x@t.com', phone: '119999',
        address: { state: 'MG', city: 'BH', neighborhood: 'Centro', street: 'Rua X', number: '10' },
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('responsibleType=OTHER + empty email -> REJECT', () => {
    const payload = validPayload({
      financialResponsible: {
        responsibleType: 'OTHER', fullName: 'Joao', cpf: '12345678901', email: '', phone: '119999',
        address: { state: 'MG', city: 'BH', neighborhood: 'Centro', street: 'Rua X', number: '10' },
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map(e => e.path.join('.'));
      expect(paths).toContain('financialResponsible.email');
    }
  });

  it('responsibleType=OTHER + empty phone -> REJECT', () => {
    const payload = validPayload({
      financialResponsible: {
        responsibleType: 'OTHER', fullName: 'Joao', cpf: '12345678901', email: 'x@t.com', phone: '',
        address: { state: 'MG', city: 'BH', neighborhood: 'Centro', street: 'Rua X', number: '10' },
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map(e => e.path.join('.'));
      expect(paths).toContain('financialResponsible.phone');
    }
  });

  it('responsibleType=OTHER + missing address.state -> REJECT', () => {
    const payload = validPayload({
      financialResponsible: {
        responsibleType: 'OTHER', fullName: 'Joao', cpf: '12345678901', email: 'x@t.com', phone: '119999',
        address: { state: '', city: 'BH', neighborhood: 'Centro', street: 'Rua X', number: '10' },
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map(e => e.path.join('.'));
      expect(paths).toContain('financialResponsible.address.state');
    }
  });

  it('responsibleType=OTHER + missing address.city -> REJECT', () => {
    const payload = validPayload({
      financialResponsible: {
        responsibleType: 'OTHER', fullName: 'Joao', cpf: '12345678901', email: 'x@t.com', phone: '119999',
        address: { state: 'MG', city: '', neighborhood: 'Centro', street: 'Rua X', number: '10' },
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map(e => e.path.join('.'));
      expect(paths).toContain('financialResponsible.address.city');
    }
  });

  it('responsibleType=OTHER + all required fields filled -> ACCEPT', () => {
    const payload = validPayload({
      financialResponsible: {
        responsibleType: 'OTHER',
        relationship: 'UNCLE_AUNT',
        fullName: 'Joao da Silva',
        cpf: '123.456.789-00',
        email: 'joao@test.com',
        phone: '31999994444',
        address: {
          country: 'Brasil', state: 'MG', city: 'Belo Horizonte',
          neighborhood: 'Savassi', street: 'Rua da Bahia', number: '100',
          complement: 'Apto 301', zipCode: '30130-000',
        },
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// 4. Health Data Edge Cases (10 tests)
// ============================================================================
describe('Health Data Edge Cases', () => {

  it('empty medicalConditions array -> REJECT', () => {
    const payload = validPayload({
      health: { ...validPayload().health, medicalConditions: [] },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.path.join('.').includes('medicalConditions'))).toBe(true);
    }
  });

  it('empty allergies array -> REJECT', () => {
    const payload = validPayload({
      health: { ...validPayload().health, allergies: [] },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.path.join('.').includes('allergies'))).toBe(true);
    }
  });

  it('empty feverMedications array -> REJECT', () => {
    const payload = validPayload({
      health: { ...validPayload().health, feverMedications: [] },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.path.join('.').includes('feverMedications'))).toBe(true);
    }
  });

  it('empty painMedications array -> REJECT', () => {
    const payload = validPayload({
      health: { ...validPayload().health, painMedications: [] },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.path.join('.').includes('painMedications'))).toBe(true);
    }
  });

  it('empty weight -> REJECT', () => {
    const payload = validPayload({
      health: { ...validPayload().health, weight: '' },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.path.join('.').includes('weight'))).toBe(true);
    }
  });

  it('empty height -> REJECT', () => {
    const payload = validPayload({
      health: { ...validPayload().health, height: '' },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.path.join('.').includes('height'))).toBe(true);
    }
  });

  it('empty bloodType -> REJECT', () => {
    const payload = validPayload({
      health: { ...validPayload().health, bloodType: '' },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.path.join('.').includes('bloodType'))).toBe(true);
    }
  });

  it('all boolean defaults (false) -> ACCEPT', () => {
    const payload = validPayload({
      health: {
        ...validPayload().health,
        hasHospitalizations: false,
        hasSeizures: false,
        hasEatingDisorder: false,
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('all booleans true with notes -> ACCEPT', () => {
    const payload = validPayload({
      health: {
        ...validPayload().health,
        hasHospitalizations: true, hospitalizationsNotes: 'Apendicite 2019',
        hasSeizures: true, seizuresNotes: 'Convulsao febril',
        hasEatingDisorder: true, eatingDisorderNotes: 'Intolerancia a lactose',
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('health completely omitted (undefined) -> ACCEPT (it is optional)', () => {
    const { health, ...rest } = validPayload();
    const payload = rest;
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// 5. Emergency Contacts Edge Cases (6 tests)
// ============================================================================
describe('Emergency Contacts Edge Cases', () => {

  it('empty array -> REJECT', () => {
    const payload = validPayload({ emergencyContacts: [] });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.path.join('.').includes('emergencyContacts'))).toBe(true);
    }
  });

  it('contact with empty name -> REJECT', () => {
    const payload = validPayload({
      emergencyContacts: [{ name: '', phone: '31999990000', email: '', relationship: '', isPrimary: true }],
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.path.join('.').includes('name'))).toBe(true);
    }
  });

  it('contact with empty phone -> REJECT', () => {
    const payload = validPayload({
      emergencyContacts: [{ name: 'Tia Maria', phone: '', email: '', relationship: '', isPrimary: true }],
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.path.join('.').includes('phone'))).toBe(true);
    }
  });

  it('multiple valid contacts -> ACCEPT', () => {
    const payload = validPayload({
      emergencyContacts: [
        { name: 'Tia Maria', phone: '31999990000', email: '', relationship: 'TIA', isPrimary: true },
        { name: 'Tio Jose', phone: '31999991111', email: '', relationship: 'TIO', isPrimary: false },
        { name: 'Avo Clara', phone: '31999992222', email: '', relationship: 'AVO', isPrimary: false },
      ],
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('contact with email and relationship -> ACCEPT', () => {
    const payload = validPayload({
      emergencyContacts: [
        { name: 'Tia Maria', phone: '31999990000', email: 'maria@test.com', relationship: 'TIA', isPrimary: true },
      ],
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('10 contacts -> ACCEPT (no upper limit)', () => {
    const contacts = Array.from({ length: 10 }, (_, i) => ({
      name: `Contato ${i + 1}`,
      phone: `3199999${String(i).padStart(4, '0')}`,
      email: '',
      relationship: 'OUTRO',
      isPrimary: i === 0,
    }));
    const payload = validPayload({ emergencyContacts: contacts });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// 6. Enrollment Info Edge Cases (8 tests)
// ============================================================================
describe('Enrollment Info Edge Cases', () => {

  it('missing personType -> REJECT', () => {
    const payload = validPayload({
      enrollmentInfo: { ...validPayload().enrollmentInfo, personType: '' },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.path.join('.').includes('personType'))).toBe(true);
    }
  });

  it('missing studentCpf -> REJECT', () => {
    const payload = validPayload({
      enrollmentInfo: { ...validPayload().enrollmentInfo, studentCpf: '' },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.path.join('.').includes('studentCpf'))).toBe(true);
    }
  });

  it('missing studentIdNumber -> REJECT', () => {
    const payload = validPayload({
      enrollmentInfo: { ...validPayload().enrollmentInfo, studentIdNumber: '' },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.path.join('.').includes('studentIdNumber'))).toBe(true);
    }
  });

  it('missing studentIdIssueDate -> REJECT', () => {
    const payload = validPayload({
      enrollmentInfo: { ...validPayload().enrollmentInfo, studentIdIssueDate: '' },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.path.join('.').includes('studentIdIssueDate'))).toBe(true);
    }
  });

  it('missing studentIdIssuer -> REJECT', () => {
    const payload = validPayload({
      enrollmentInfo: { ...validPayload().enrollmentInfo, studentIdIssuer: '' },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.path.join('.').includes('studentIdIssuer'))).toBe(true);
    }
  });

  it('all optional fields empty -> ACCEPT', () => {
    const payload = validPayload({
      enrollmentInfo: {
        academicCalendar: '', campus: '', course: '', module: '', classGroup: '',
        personType: 'PF', studentCpf: '123', studentIdNumber: 'MG-1', studentIdIssueDate: '2020', studentIdIssuer: 'SSP',
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('enrollmentInfo completely omitted -> ACCEPT (it is optional)', () => {
    const { enrollmentInfo, ...rest } = validPayload();
    const payload = rest;
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('childrenData with 2 children both having enrollmentInfo -> ACCEPT', () => {
    const payload = validPayload({
      childrenData: [
        {
          childId: 'child-1',
          enrollmentInfo: {
            personType: 'PF', studentCpf: '123.456.789-00',
            studentIdNumber: 'MG-111', studentIdIssueDate: '2020-01-01', studentIdIssuer: 'SSP',
          },
        },
        {
          childId: 'child-2',
          enrollmentInfo: {
            personType: 'PJ', studentCpf: '987.654.321-00',
            studentIdNumber: 'MG-222', studentIdIssueDate: '2021-06-15', studentIdIssuer: 'PC',
          },
        },
      ],
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// 7. Terms & Token (4 tests)
// ============================================================================
describe('Terms & Token', () => {

  it('termsAccepted=false -> REJECT', () => {
    const payload = validPayload({ termsAccepted: false });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.path.join('.').includes('termsAccepted'))).toBe(true);
    }
  });

  it('termsAccepted missing -> REJECT', () => {
    const { termsAccepted, ...rest } = validPayload();
    const payload = rest;
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.path.join('.').includes('termsAccepted'))).toBe(true);
    }
  });

  it('enrollmentToken missing -> REJECT', () => {
    const { enrollmentToken, ...rest } = validPayload();
    const payload = rest;
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors.some(e => e.path.join('.').includes('enrollmentToken'))).toBe(true);
    }
  });

  it('enrollmentToken empty string -> ACCEPT (no min length check)', () => {
    const payload = validPayload({ enrollmentToken: '' });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// 8. Parent Updates Edge Cases (5 tests)
// ============================================================================
describe('Parent Updates Edge Cases', () => {

  it('fatherUpdates completely omitted -> ACCEPT', () => {
    const { fatherUpdates, ...rest } = validPayload();
    const payload = rest;
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('motherUpdates completely omitted -> ACCEPT', () => {
    const { motherUpdates, ...rest } = validPayload();
    const payload = rest;
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('address omitted in fatherUpdates -> ACCEPT', () => {
    const payload = validPayload({
      fatherUpdates: {
        email: 'f@t.com', phone: '31999990000', cpf: '', idNumber: '', idIssueDate: '', idIssuer: '',
        dateOfBirth: '', education: '', religion: '',
        // address deliberately omitted
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('all fields empty strings -> ACCEPT', () => {
    const payload = validPayload({
      fatherUpdates: {
        email: '', phone: '', cpf: '', idNumber: '', idIssueDate: '', idIssuer: '',
        dateOfBirth: '', education: '', religion: '',
        address: { zipCode: '', country: '', state: '', city: '', neighborhood: '', street: '', number: '', complement: '' },
      },
      motherUpdates: {
        email: '', phone: '', cpf: '', idNumber: '', idIssueDate: '', idIssuer: '',
        dateOfBirth: '', education: '', religion: '',
        address: { zipCode: '', country: '', state: '', city: '', neighborhood: '', street: '', number: '', complement: '' },
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('sameAddressAsOtherParent boolean variations -> ACCEPT', () => {
    const payload = validPayload({
      fatherUpdates: {
        ...validPayload().fatherUpdates,
        sameAddressAsOtherParent: false,
      },
      motherUpdates: {
        ...validPayload().motherUpdates,
        sameAddressAsOtherParent: true,
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// 9. ChildrenData Edge Cases (5 tests)
// ============================================================================
describe('ChildrenData Edge Cases', () => {

  it('childrenData with empty array -> ACCEPT (optional)', () => {
    const payload = validPayload({ childrenData: [] });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('childrenData with 1 child with only childId -> ACCEPT (enrollmentInfo and health are optional)', () => {
    const payload = validPayload({
      childrenData: [{ childId: 'child-1' }],
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('childrenData with 3 children -> ACCEPT', () => {
    const payload = validPayload({
      childrenData: [
        {
          childId: 'child-1',
          enrollmentInfo: {
            personType: 'PF', studentCpf: '111.111.111-11',
            studentIdNumber: 'MG-111', studentIdIssueDate: '2020-01-01', studentIdIssuer: 'SSP',
          },
        },
        {
          childId: 'child-2',
          enrollmentInfo: {
            personType: 'PF', studentCpf: '222.222.222-22',
            studentIdNumber: 'MG-222', studentIdIssueDate: '2020-02-02', studentIdIssuer: 'SSP',
          },
        },
        {
          childId: 'child-3',
          enrollmentInfo: {
            personType: 'PF', studentCpf: '333.333.333-33',
            studentIdNumber: 'MG-333', studentIdIssueDate: '2020-03-03', studentIdIssuer: 'SSP',
          },
        },
      ],
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('childrenData alongside enrollmentInfo (both provided) -> ACCEPT', () => {
    const payload = validPayload({
      enrollmentInfo: {
        academicCalendar: '', campus: '', course: '', module: '', classGroup: '',
        personType: 'PF', studentCpf: '123.456.789-00',
        studentIdNumber: 'MG-12.345.678', studentIdIssueDate: '2020-01-15', studentIdIssuer: 'SSP',
      },
      childrenData: [
        {
          childId: 'child-1',
          enrollmentInfo: {
            personType: 'PF', studentCpf: '111.111.111-11',
            studentIdNumber: 'MG-111', studentIdIssueDate: '2020-01-01', studentIdIssuer: 'SSP',
          },
        },
      ],
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('childrenData child with health but no enrollmentInfo -> ACCEPT', () => {
    const payload = validPayload({
      childrenData: [
        {
          childId: 'child-1',
          health: {
            weight: '30', height: '120', bloodType: 'A+',
            medicalConditions: ['NONE'], allergies: ['NONE'],
            feverMedications: ['DIPIRONA'], painMedications: ['IBUPROFENO'],
          },
        },
      ],
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// 10. Combined Validation Error Count (4 tests)
// ============================================================================
describe('Combined Validation Error Count', () => {

  it('completely empty payload (only enrollmentToken) -> multiple errors', () => {
    const payload = {
      enrollmentToken: 'test-token',
      emergencyContacts: [],
      transport: {
        dropoffPickupPersons: [],
        transportMethod: '',
        canLeaveAlone: false,
      },
      financialResponsible: {
        responsibleType: 'FATHER' as const,
      },
      termsAccepted: false,
    };
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      // Should have errors from emergencyContacts (min 1), termsAccepted (literal true),
      // transport superRefine (dropoffPickupPersons, transportMethod)
      expect(result.error.errors.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('payload with transport errors + financial errors -> errors from both superRefines', () => {
    const payload = validPayload({
      transport: {
        ...validPayload().transport,
        canLeaveAlone: false,
        dropoffPickupPersons: [],
        transportMethod: '',
      },
      financialResponsible: {
        responsibleType: 'OTHER',
        fullName: '',
        cpf: '',
        email: '',
        phone: '',
        address: {},
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map(e => e.path.join('.'));
      // Transport errors
      const hasTransportError = paths.some(p => p.startsWith('transport.'));
      // Financial errors
      const hasFinancialError = paths.some(p => p.startsWith('financialResponsible.'));
      expect(hasTransportError).toBe(true);
      expect(hasFinancialError).toBe(true);
    }
  });

  it('payload with health + contacts + terms errors -> errors from all 3', () => {
    const payload = validPayload({
      health: {
        weight: '', height: '', bloodType: '',
        medicalConditions: [], allergies: [], feverMedications: [], painMedications: [],
      },
      emergencyContacts: [],
      termsAccepted: false,
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.errors.map(e => e.path.join('.'));
      // Health errors
      const hasHealthError = paths.some(p => p.startsWith('health.'));
      // Emergency contacts error
      const hasContactError = paths.some(p => p.includes('emergencyContacts'));
      // Terms error
      const hasTermsError = paths.some(p => p.includes('termsAccepted'));
      expect(hasHealthError).toBe(true);
      expect(hasContactError).toBe(true);
      expect(hasTermsError).toBe(true);
      // Should have many errors: weight, height, bloodType, medicalConditions,
      // allergies, feverMedications, painMedications, emergencyContacts, termsAccepted
      expect(result.error.errors.length).toBeGreaterThanOrEqual(9);
    }
  });

  it('valid payload -> 0 errors', () => {
    const payload = validPayload();
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});
