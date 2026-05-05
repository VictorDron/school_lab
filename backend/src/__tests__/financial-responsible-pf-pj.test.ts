/**
 * Financial Responsible PF/PJ + Relationship — Comprehensive Zod Schema Tests
 *
 * Covers EVERY validation branch for the new personType (INDIVIDUAL/COMPANY)
 * and relationship fields on the financialResponsible object.
 *
 * ┌────────────────────────────────────────────────────────────────────────────┐
 * │ #  │ Category                              │ Tests │ Description          │
 * ├────────────────────────────────────────────────────────────────────────────┤
 * │ 1  │ Backward Compatibility                │   5   │ Old payloads still   │
 * │    │                                       │       │ work (no new fields) │
 * │ 2  │ Relationship (PF only)                │  10   │ Required for PF,     │
 * │    │                                       │       │ NOT required for PJ  │
 * │ 3  │ PersonType Defaults & Routing         │   6   │ Default INDIVIDUAL,  │
 * │    │                                       │       │ branch selection      │
 * │ 4  │ PF — Required Fields                  │  10   │ Each field empty,    │
 * │    │                                       │       │ whitespace, valid     │
 * │ 5  │ PF — CPF Edge Cases                   │   7   │ Digit count, format, │
 * │    │                                       │       │ special chars         │
 * │ 6  │ PJ — Required Fields                  │  12   │ Each field empty,    │
 * │    │                                       │       │ whitespace, valid     │
 * │ 7  │ PJ — CNPJ Edge Cases                  │   7   │ Digit count, format, │
 * │    │                                       │       │ special chars         │
 * │ 8  │ PJ tradeName (Optional)               │   3   │ Empty, filled, space │
 * │ 9  │ Address Validation (PF & PJ)          │  12   │ Each address field   │
 * │    │                                       │       │ tested for both types │
 * │ 10 │ Cross-Type Isolation                  │   4   │ PJ fields ignored in │
 * │    │                                       │       │ PF mode & vice-versa │
 * │ 11 │ Combined Error Counts                 │   4   │ Exact error counts   │
 * │ 12 │ Full Valid Payloads (Happy Path)      │   4   │ PF/PJ complete       │
 * │ 13 │ Regression FATHER/MOTHER              │   5   │ Unaffected by new    │
 * │    │                                       │       │ feature              │
 * │ 14 │ Injection & Malicious Input           │   8   │ SQL/XSS/Unicode/     │
 * │    │                                       │       │ long strings/nulls   │
 * │ 15 │ Address Optional Fields               │   6   │ complement/zipCode/  │
 * │    │                                       │       │ country optional     │
 * │ 16 │ Missing Address Object                │   4   │ undefined/{} address │
 * │ 17 │ Data Integrity                        │   4   │ Parsed output values │
 * │ 18 │ Error Messages (Portuguese)           │   6   │ Correct PT messages  │
 * ├────────────────────────────────────────────────────────────────────────────┤
 * │    │ TOTAL                                 │ 117   │                      │
 * └────────────────────────────────────────────────────────────────────────────┘
 */

import { describe, it, expect } from 'vitest';
import { publicEnrollmentSchema } from '../schemas/public.schemas.js';

// ============================================================================
// Helpers
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
    financialResponsible: { responsibleType: 'FATHER' as const },
    termsAccepted: true as const,
    ...overrides,
  };
}

const VALID_ADDRESS = { state: 'SP', city: 'São Paulo', neighborhood: 'Pinheiros', street: 'Rua dos Pinheiros', number: '500' };
const VALID_ADDRESS_FULL = { ...VALID_ADDRESS, country: 'Brasil', complement: 'Sala 301', zipCode: '05422-010' };

/** Valid PF (Pessoa Física) financial responsible payload */
function validPF(overrides: Record<string, any> = {}) {
  return {
    responsibleType: 'OTHER',
    relationship: 'GRANDPARENT',
    personType: 'INDIVIDUAL',
    fullName: 'Carlos Alberto da Silva',
    cpf: '12345678901',
    email: 'carlos@email.com',
    phone: '11999887766',
    address: VALID_ADDRESS,
    ...overrides,
  };
}

/** Valid PJ (Pessoa Jurídica) financial responsible payload — no relationship needed */
function validPJ(overrides: Record<string, any> = {}) {
  return {
    responsibleType: 'OTHER',
    personType: 'COMPANY',
    companyName: 'Empresa ABC Ltda',
    cnpj: '12345678000195',
    tradeName: 'ABC Educação',
    contactPerson: 'Maria Souza',
    contactEmail: 'maria@empresa.com',
    contactPhone: '1133334444',
    address: VALID_ADDRESS,
    ...overrides,
  };
}

/** Extracts error paths from a failed parse result */
function errorPaths(result: { success: false; error: { errors: { path: (string | number)[] }[] } }) {
  return result.error.errors.map(e => e.path.join('.'));
}

/** Extracts error paths scoped to financialResponsible */
function finErrorPaths(result: { success: false; error: { errors: { path: (string | number)[] }[] } }) {
  return result.error.errors
    .filter(e => e.path[0] === 'financialResponsible')
    .map(e => e.path.slice(1).join('.'));
}

// ============================================================================
// 1. Backward Compatibility (5 tests)
// ============================================================================
describe('1. Backward Compatibility — old payloads without new fields', () => {

  it('FATHER without any new fields -> ACCEPT', () => {
    const payload = validPayload({
      financialResponsible: { responsibleType: 'FATHER' },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('MOTHER without any new fields -> ACCEPT', () => {
    const payload = validPayload({
      financialResponsible: { responsibleType: 'MOTHER' },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('FATHER with empty strings for all old fields -> ACCEPT', () => {
    const payload = validPayload({
      financialResponsible: { responsibleType: 'FATHER', fullName: '', cpf: '', email: '', phone: '', address: {} },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('MOTHER with PJ fields set (should be ignored) -> ACCEPT', () => {
    const payload = validPayload({
      financialResponsible: {
        responsibleType: 'MOTHER', companyName: 'XYZ', cnpj: '12345678000195',
        contactPerson: 'Test', contactEmail: 'a@b.com', contactPhone: '123',
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('personType defaults to INDIVIDUAL when not provided (OTHER)', () => {
    // OTHER without personType should default to INDIVIDUAL and require PF fields
    const payload = validPayload({
      financialResponsible: {
        responsibleType: 'OTHER',
        relationship: 'GRANDPARENT',
        // no personType -> defaults to INDIVIDUAL
        fullName: 'Test', cpf: '12345678901', email: 'x@y.com', phone: '119999',
        address: VALID_ADDRESS,
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// 2. Relationship Validation (8 tests)
// ============================================================================
describe('2. Relationship Validation — required only for PF (INDIVIDUAL)', () => {

  it('PF + missing relationship -> REJECT with path relationship', () => {
    const payload = validPayload({ financialResponsible: validPF({ relationship: '' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('relationship');
  });

  it('PF + whitespace-only relationship -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPF({ relationship: '   ' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('relationship');
  });

  it('OTHER + relationship=GRANDPARENT -> ACCEPT', () => {
    const payload = validPayload({ financialResponsible: validPF({ relationship: 'GRANDPARENT' }) });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('OTHER + relationship=UNCLE_AUNT -> ACCEPT', () => {
    const payload = validPayload({ financialResponsible: validPF({ relationship: 'UNCLE_AUNT' }) });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('OTHER + relationship=SIBLING -> ACCEPT', () => {
    const payload = validPayload({ financialResponsible: validPF({ relationship: 'SIBLING' }) });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('PF + relationship=FRIEND -> ACCEPT', () => {
    const payload = validPayload({ financialResponsible: validPF({ relationship: 'FRIEND' }) });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('PJ + missing relationship -> ACCEPT (not required for companies)', () => {
    const payload = validPayload({ financialResponsible: validPJ({ relationship: '' }) });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('PJ + no relationship field at all -> ACCEPT', () => {
    const payload = validPayload({ financialResponsible: validPJ() });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });
});

// ============================================================================
// 3. PersonType Defaults & Routing (6 tests)
// ============================================================================
describe('3. PersonType Defaults & Routing', () => {

  it('personType omitted -> defaults to INDIVIDUAL, requires PF fields', () => {
    const payload = validPayload({
      financialResponsible: {
        responsibleType: 'OTHER', relationship: 'GRANDPARENT',
        // no personType
        fullName: '', cpf: '', email: '', phone: '', address: VALID_ADDRESS,
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = finErrorPaths(result);
      expect(paths).toContain('fullName');
      expect(paths).toContain('cpf');
      expect(paths).toContain('email');
      expect(paths).toContain('phone');
      // Should NOT contain PJ fields
      expect(paths).not.toContain('companyName');
      expect(paths).not.toContain('cnpj');
    }
  });

  it('personType=INDIVIDUAL -> validates PF fields, ignores PJ fields', () => {
    const payload = validPayload({
      financialResponsible: validPF({ companyName: '', cnpj: '', contactPerson: '', contactEmail: '', contactPhone: '' }),
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('personType=COMPANY -> validates PJ fields, ignores PF fields', () => {
    const payload = validPayload({
      financialResponsible: validPJ({ fullName: '', cpf: '', email: '', phone: '' }),
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('personType=COMPANY + empty PJ fields -> REJECT with PJ paths only', () => {
    const payload = validPayload({
      financialResponsible: validPJ({
        companyName: '', cnpj: '', contactPerson: '', contactEmail: '', contactPhone: '',
      }),
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = finErrorPaths(result);
      expect(paths).toContain('companyName');
      expect(paths).toContain('cnpj');
      expect(paths).toContain('contactPerson');
      expect(paths).toContain('contactEmail');
      expect(paths).toContain('contactPhone');
      // Should NOT contain PF fields
      expect(paths).not.toContain('fullName');
      expect(paths).not.toContain('cpf');
      expect(paths).not.toContain('email');
      expect(paths).not.toContain('phone');
    }
  });

  it('personType=INDIVIDUAL + empty PF fields -> REJECT with PF paths only', () => {
    const payload = validPayload({
      financialResponsible: validPF({
        fullName: '', cpf: '', email: '', phone: '',
      }),
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = finErrorPaths(result);
      expect(paths).toContain('fullName');
      expect(paths).toContain('cpf');
      expect(paths).toContain('email');
      expect(paths).toContain('phone');
      expect(paths).not.toContain('companyName');
      expect(paths).not.toContain('cnpj');
    }
  });

  it('personType with unknown value -> falls through (no PF or PJ errors, only address validated)', () => {
    const payload = validPayload({
      financialResponsible: {
        responsibleType: 'OTHER', personType: 'ALIEN',
        address: VALID_ADDRESS,
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    // Should pass since no PF/PJ branch matched, only address is validated
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// 4. PF (INDIVIDUAL) — Required Fields (10 tests)
// ============================================================================
describe('4. PF (Pessoa Física) — Required Fields', () => {

  it('empty fullName -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPF({ fullName: '' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('fullName');
  });

  it('whitespace-only fullName -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPF({ fullName: '   ' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('fullName');
  });

  it('empty cpf -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPF({ cpf: '' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('cpf');
  });

  it('whitespace-only cpf -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPF({ cpf: '   ' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('cpf');
  });

  it('empty email -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPF({ email: '' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('email');
  });

  it('whitespace-only email -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPF({ email: '  ' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('email');
  });

  it('empty phone -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPF({ phone: '' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('phone');
  });

  it('whitespace-only phone -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPF({ phone: '   ' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('phone');
  });

  it('all PF fields filled -> ACCEPT', () => {
    const payload = validPayload({ financialResponsible: validPF() });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('PF with formatted CPF (123.456.789-00) -> ACCEPT', () => {
    const payload = validPayload({ financialResponsible: validPF({ cpf: '123.456.789-00' }) });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });
});

// ============================================================================
// 5. PF (INDIVIDUAL) — CPF Edge Cases (7 tests)
// ============================================================================
describe('5. PF CPF Edge Cases', () => {

  it('CPF with 10 digits -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPF({ cpf: '1234567890' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('cpf');
  });

  it('CPF with 12 digits -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPF({ cpf: '123456789012' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('cpf');
  });

  it('CPF with 11 raw digits -> ACCEPT', () => {
    const payload = validPayload({ financialResponsible: validPF({ cpf: '12345678901' }) });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('CPF with dots and dash (standard formatting) -> ACCEPT', () => {
    const payload = validPayload({ financialResponsible: validPF({ cpf: '123.456.789-01' }) });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('CPF with spaces mixed in -> ACCEPT (digits extracted = 11)', () => {
    const payload = validPayload({ financialResponsible: validPF({ cpf: '123 456 789 01' }) });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('CPF with letters mixed in -> digits extracted < 11 -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPF({ cpf: 'abc12345678' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('cpf');
  });

  it('CPF with only non-digit characters -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPF({ cpf: '...-' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('cpf');
  });
});

// ============================================================================
// 6. PJ (COMPANY) — Required Fields (12 tests)
// ============================================================================
describe('6. PJ (Pessoa Jurídica) — Required Fields', () => {

  it('empty companyName -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ companyName: '' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('companyName');
  });

  it('whitespace-only companyName -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ companyName: '   ' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('companyName');
  });

  it('empty cnpj -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ cnpj: '' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('cnpj');
  });

  it('whitespace-only cnpj -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ cnpj: '   ' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('cnpj');
  });

  it('empty contactPerson -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ contactPerson: '' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('contactPerson');
  });

  it('whitespace-only contactPerson -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ contactPerson: '  \t  ' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('contactPerson');
  });

  it('empty contactEmail -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ contactEmail: '' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('contactEmail');
  });

  it('whitespace-only contactEmail -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ contactEmail: '   ' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('contactEmail');
  });

  it('empty contactPhone -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ contactPhone: '' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('contactPhone');
  });

  it('whitespace-only contactPhone -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ contactPhone: '   ' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('contactPhone');
  });

  it('all PJ required fields filled -> ACCEPT', () => {
    const payload = validPayload({ financialResponsible: validPJ() });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('PJ with formatted CNPJ (12.345.678/0001-95) -> ACCEPT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ cnpj: '12.345.678/0001-95' }) });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });
});

// ============================================================================
// 7. PJ (COMPANY) — CNPJ Edge Cases (7 tests)
// ============================================================================
describe('7. PJ CNPJ Edge Cases', () => {

  it('CNPJ with 13 digits -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ cnpj: '1234567800019' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('cnpj');
  });

  it('CNPJ with 15 digits -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ cnpj: '123456780001950' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('cnpj');
  });

  it('CNPJ with 14 raw digits -> ACCEPT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ cnpj: '12345678000195' }) });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('CNPJ with standard formatting (dots, slash, dash) -> ACCEPT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ cnpj: '12.345.678/0001-95' }) });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('CNPJ with spaces mixed in -> ACCEPT (digits extracted = 14)', () => {
    const payload = validPayload({ financialResponsible: validPJ({ cnpj: '12 345 678 0001 95' }) });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('CNPJ with only non-digit characters -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ cnpj: '../-' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('cnpj');
  });

  it('CNPJ with 11 digits (CPF length) -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ cnpj: '12345678901' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('cnpj');
  });
});

// ============================================================================
// 8. PJ tradeName (Optional Field) (3 tests)
// ============================================================================
describe('8. PJ tradeName — Optional Field', () => {

  it('PJ without tradeName -> ACCEPT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ tradeName: '' }) });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('PJ with tradeName filled -> ACCEPT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ tradeName: 'ABC Educação Premium' }) });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('PJ with whitespace-only tradeName -> ACCEPT (it is optional)', () => {
    const payload = validPayload({ financialResponsible: validPJ({ tradeName: '   ' }) });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });
});

// ============================================================================
// 9. Address Validation — shared between PF & PJ (12 tests)
// ============================================================================
describe('9. Address Validation — shared between PF & PJ', () => {

  // ---- PF address tests (6) ----
  it('PF + empty address.state -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPF({ address: { ...VALID_ADDRESS, state: '' } }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('address.state');
  });

  it('PF + empty address.city -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPF({ address: { ...VALID_ADDRESS, city: '' } }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('address.city');
  });

  it('PF + empty address.neighborhood -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPF({ address: { ...VALID_ADDRESS, neighborhood: '' } }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('address.neighborhood');
  });

  it('PF + empty address.street -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPF({ address: { ...VALID_ADDRESS, street: '' } }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('address.street');
  });

  it('PF + empty address.number -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPF({ address: { ...VALID_ADDRESS, number: '' } }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('address.number');
  });

  it('PF + whitespace-only address.street -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPF({ address: { ...VALID_ADDRESS, street: '  ' } }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('address.street');
  });

  // ---- PJ address tests (6) ----
  it('PJ + empty address.state -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ address: { ...VALID_ADDRESS, state: '' } }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('address.state');
  });

  it('PJ + empty address.city -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ address: { ...VALID_ADDRESS, city: '' } }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('address.city');
  });

  it('PJ + empty address.neighborhood -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ address: { ...VALID_ADDRESS, neighborhood: '' } }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('address.neighborhood');
  });

  it('PJ + empty address.street -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ address: { ...VALID_ADDRESS, street: '' } }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('address.street');
  });

  it('PJ + empty address.number -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ address: { ...VALID_ADDRESS, number: '' } }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('address.number');
  });

  it('PJ + whitespace-only address.city -> REJECT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ address: { ...VALID_ADDRESS, city: '   ' } }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) expect(finErrorPaths(result)).toContain('address.city');
  });
});

// ============================================================================
// 10. Cross-Type Isolation (4 tests)
// ============================================================================
describe('10. Cross-Type Isolation — PF fields ignored in PJ & vice-versa', () => {

  it('PJ mode: empty PF fields (fullName, cpf, email, phone) -> ACCEPT', () => {
    const payload = validPayload({
      financialResponsible: validPJ({ fullName: '', cpf: '', email: '', phone: '' }),
    });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('PF mode: empty PJ fields (companyName, cnpj, contactPerson, contactEmail, contactPhone) -> ACCEPT', () => {
    const payload = validPayload({
      financialResponsible: validPF({ companyName: '', cnpj: '', contactPerson: '', contactEmail: '', contactPhone: '' }),
    });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('PJ mode: garbage in PF fields -> still ACCEPT (PF fields not validated)', () => {
    const payload = validPayload({
      financialResponsible: validPJ({ fullName: '!!!', cpf: 'notacpf', email: 'bademail', phone: 'xxx' }),
    });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('PF mode: garbage in PJ fields -> still ACCEPT (PJ fields not validated)', () => {
    const payload = validPayload({
      financialResponsible: validPF({ companyName: '!!!', cnpj: 'notacnpj', contactPerson: '', contactEmail: 'bad', contactPhone: '' }),
    });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });
});

// ============================================================================
// 11. Combined Error Counts (4 tests)
// ============================================================================
describe('11. Combined Error Counts — multiple errors at once', () => {

  it('PF + all fields empty -> exactly 6 errors (relationship + fullName + cpf + email + phone + 5 address = 10 if address empty)', () => {
    const payload = validPayload({
      financialResponsible: {
        responsibleType: 'OTHER', personType: 'INDIVIDUAL',
        relationship: '', fullName: '', cpf: '', email: '', phone: '',
        address: { state: '', city: '', neighborhood: '', street: '', number: '' },
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = finErrorPaths(result);
      // 1 relationship + 4 PF fields + 5 address fields = 10
      expect(paths).toHaveLength(10);
      expect(paths).toContain('relationship');
      expect(paths).toContain('fullName');
      expect(paths).toContain('cpf');
      expect(paths).toContain('email');
      expect(paths).toContain('phone');
      expect(paths).toContain('address.state');
      expect(paths).toContain('address.city');
      expect(paths).toContain('address.neighborhood');
      expect(paths).toContain('address.street');
      expect(paths).toContain('address.number');
    }
  });

  it('PJ + all fields empty -> exactly 10 errors (5 PJ fields + 5 address fields, NO relationship)', () => {
    const payload = validPayload({
      financialResponsible: {
        responsibleType: 'OTHER', personType: 'COMPANY',
        companyName: '', cnpj: '', contactPerson: '', contactEmail: '', contactPhone: '',
        address: { state: '', city: '', neighborhood: '', street: '', number: '' },
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = finErrorPaths(result);
      // 5 PJ fields + 5 address fields = 10 (no relationship for PJ)
      expect(paths).toHaveLength(10);
      expect(paths).not.toContain('relationship');
      expect(paths).toContain('companyName');
      expect(paths).toContain('cnpj');
      expect(paths).toContain('contactPerson');
      expect(paths).toContain('contactEmail');
      expect(paths).toContain('contactPhone');
      expect(paths).toContain('address.state');
      expect(paths).toContain('address.city');
      expect(paths).toContain('address.neighborhood');
      expect(paths).toContain('address.street');
      expect(paths).toContain('address.number');
    }
  });

  it('PF + only relationship missing -> exactly 1 error', () => {
    const payload = validPayload({ financialResponsible: validPF({ relationship: '' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = finErrorPaths(result);
      expect(paths).toHaveLength(1);
      expect(paths[0]).toBe('relationship');
    }
  });

  it('PJ + only cnpj invalid -> exactly 1 error', () => {
    const payload = validPayload({ financialResponsible: validPJ({ cnpj: '123' }) });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = finErrorPaths(result);
      expect(paths).toHaveLength(1);
      expect(paths[0]).toBe('cnpj');
    }
  });
});

// ============================================================================
// 12. Full Valid Payloads — Happy Path (4 tests)
// ============================================================================
describe('12. Full Valid Payloads — Happy Path', () => {

  it('Complete PF payload with full address -> ACCEPT', () => {
    const payload = validPayload({
      financialResponsible: validPF({ address: VALID_ADDRESS_FULL }),
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      const fr = result.data.financialResponsible;
      expect(fr.responsibleType).toBe('OTHER');
      expect(fr.relationship).toBe('GRANDPARENT');
      expect(fr.personType).toBe('INDIVIDUAL');
      expect(fr.fullName).toBe('Carlos Alberto da Silva');
      expect(fr.cpf).toBe('12345678901');
      expect(fr.email).toBe('carlos@email.com');
      expect(fr.phone).toBe('11999887766');
      expect(fr.address?.state).toBe('SP');
      expect(fr.address?.complement).toBe('Sala 301');
    }
  });

  it('Complete PJ payload with full address -> ACCEPT', () => {
    const payload = validPayload({
      financialResponsible: validPJ({ address: VALID_ADDRESS_FULL }),
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      const fr = result.data.financialResponsible;
      expect(fr.responsibleType).toBe('OTHER');
      expect(fr.relationship).toBe(''); // PJ has no relationship
      expect(fr.personType).toBe('COMPANY');
      expect(fr.companyName).toBe('Empresa ABC Ltda');
      expect(fr.cnpj).toBe('12345678000195');
      expect(fr.tradeName).toBe('ABC Educação');
      expect(fr.contactPerson).toBe('Maria Souza');
      expect(fr.contactEmail).toBe('maria@empresa.com');
      expect(fr.contactPhone).toBe('1133334444');
      expect(fr.address?.zipCode).toBe('05422-010');
    }
  });

  it('PJ without tradeName (optional) -> ACCEPT and tradeName defaults to empty', () => {
    const payload = validPayload({
      financialResponsible: validPJ({ tradeName: undefined }),
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.financialResponsible.tradeName).toBe('');
    }
  });

  it('PF with each valid relationship option -> all ACCEPT', () => {
    const relationships = ['GRANDPARENT', 'UNCLE_AUNT', 'SIBLING', 'FRIEND'] as const;
    for (const rel of relationships) {
      const payload = validPayload({ financialResponsible: validPF({ relationship: rel }) });
      const result = publicEnrollmentSchema.safeParse(payload);
      expect(result.success).toBe(true);
    }
  });
});

// ============================================================================
// 13. Regression — FATHER/MOTHER must NOT require new fields (5 tests)
// ============================================================================
describe('13. Regression — FATHER/MOTHER unaffected by new feature', () => {

  it('FATHER with no extra fields -> ACCEPT (no relationship, no personType needed)', () => {
    const payload = validPayload({ financialResponsible: { responsibleType: 'FATHER' } });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('MOTHER with no extra fields -> ACCEPT', () => {
    const payload = validPayload({ financialResponsible: { responsibleType: 'MOTHER' } });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('FATHER + relationship set (should be ignored) -> ACCEPT', () => {
    const payload = validPayload({
      financialResponsible: { responsibleType: 'FATHER', relationship: 'GRANDPARENT' },
    });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('MOTHER + personType=COMPANY (should be ignored) -> ACCEPT', () => {
    const payload = validPayload({
      financialResponsible: { responsibleType: 'MOTHER', personType: 'COMPANY' },
    });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('FATHER + all PJ fields filled but type=FATHER -> ACCEPT (PJ validation not triggered)', () => {
    const payload = validPayload({
      financialResponsible: {
        responsibleType: 'FATHER', personType: 'COMPANY',
        companyName: 'XYZ', cnpj: '', contactPerson: '', contactEmail: '', contactPhone: '',
      },
    });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });
});

// ============================================================================
// 14. Injection & Malicious Input (8 tests)
// ============================================================================
describe('14. Injection & Malicious Input', () => {

  it('SQL injection in companyName -> ACCEPT (Zod only checks non-empty, Prisma handles escaping)', () => {
    const payload = validPayload({
      financialResponsible: validPJ({ companyName: "'; DROP TABLE LeadFinancialResponsible; --" }),
    });
    // Schema should accept it (string is not empty), SQL injection is handled by Prisma
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('XSS in fullName -> ACCEPT (Zod checks non-empty, XSS handled by React rendering)', () => {
    const payload = validPayload({
      financialResponsible: validPF({ fullName: '<script>alert("xss")</script>' }),
    });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('Very long companyName (10000 chars) -> ACCEPT (no max length in schema)', () => {
    const longName = 'A'.repeat(10000);
    const payload = validPayload({ financialResponsible: validPJ({ companyName: longName }) });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('Unicode in relationship -> ACCEPT (any non-empty string)', () => {
    const payload = validPayload({ financialResponsible: validPF({ relationship: '祖父母' }) });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('Emoji in contactPerson -> ACCEPT', () => {
    const payload = validPayload({ financialResponsible: validPJ({ contactPerson: '👩‍💼 Maria' }) });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('Null bytes in cnpj -> digits extracted from non-null parts', () => {
    const payload = validPayload({ financialResponsible: validPJ({ cnpj: '12345678\x00000195' }) });
    // The null byte is not a digit, so it's stripped; resulting digits may not be 14
    const result = publicEnrollmentSchema.safeParse(payload);
    // Either passes (14 digits remain) or fails (fewer digits) — just must not crash
    expect(typeof result.success).toBe('boolean');
  });

  it('CNPJ with only zeros (14 digits) -> ACCEPT at schema level (algorithmic check is frontend-only)', () => {
    const payload = validPayload({ financialResponsible: validPJ({ cnpj: '00000000000000' }) });
    // Backend Zod only checks length = 14 digits, not algorithmic validity
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('CPF with only zeros (11 digits) -> ACCEPT at schema level (algorithmic check is frontend-only)', () => {
    const payload = validPayload({ financialResponsible: validPF({ cpf: '00000000000' }) });
    // Backend Zod only checks length = 11 digits, not algorithmic validity
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });
});

// ============================================================================
// 15. Address Optional Fields — complement & zipCode (6 tests)
// ============================================================================
describe('15. Address Optional Fields — complement & zipCode', () => {

  it('PF + address without complement -> ACCEPT', () => {
    const payload = validPayload({
      financialResponsible: validPF({ address: { ...VALID_ADDRESS, complement: '' } }),
    });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('PF + address without zipCode -> ACCEPT', () => {
    const payload = validPayload({
      financialResponsible: validPF({ address: { ...VALID_ADDRESS, zipCode: '' } }),
    });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('PF + address without country -> ACCEPT', () => {
    const payload = validPayload({
      financialResponsible: validPF({ address: { ...VALID_ADDRESS, country: '' } }),
    });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('PJ + address without complement -> ACCEPT', () => {
    const payload = validPayload({
      financialResponsible: validPJ({ address: { ...VALID_ADDRESS, complement: '' } }),
    });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('PJ + address without zipCode -> ACCEPT', () => {
    const payload = validPayload({
      financialResponsible: validPJ({ address: { ...VALID_ADDRESS, zipCode: '' } }),
    });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });

  it('PJ + address without country -> ACCEPT', () => {
    const payload = validPayload({
      financialResponsible: validPJ({ address: { ...VALID_ADDRESS, country: '' } }),
    });
    expect(publicEnrollmentSchema.safeParse(payload).success).toBe(true);
  });
});

// ============================================================================
// 16. Missing address object entirely (4 tests)
// ============================================================================
describe('16. Missing address object entirely', () => {

  it('PF + no address object -> REJECT (5 address errors)', () => {
    const payload = validPayload({
      financialResponsible: validPF({ address: undefined }),
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = finErrorPaths(result);
      expect(paths).toContain('address.state');
      expect(paths).toContain('address.city');
      expect(paths).toContain('address.neighborhood');
      expect(paths).toContain('address.street');
      expect(paths).toContain('address.number');
    }
  });

  it('PJ + no address object -> REJECT (5 address errors)', () => {
    const payload = validPayload({
      financialResponsible: validPJ({ address: undefined }),
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = finErrorPaths(result);
      expect(paths).toContain('address.state');
      expect(paths).toContain('address.city');
    }
  });

  it('PF + address as empty object -> REJECT (5 address errors)', () => {
    const payload = validPayload({
      financialResponsible: validPF({ address: {} }),
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = finErrorPaths(result);
      expect(paths).toContain('address.state');
      expect(paths).toContain('address.city');
      expect(paths).toContain('address.neighborhood');
      expect(paths).toContain('address.street');
      expect(paths).toContain('address.number');
    }
  });

  it('PJ + address as empty object -> REJECT (5 address errors)', () => {
    const payload = validPayload({
      financialResponsible: validPJ({ address: {} }),
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = finErrorPaths(result);
      expect(paths).toContain('address.state');
      expect(paths).toContain('address.number');
    }
  });
});

// ============================================================================
// 17. Data Integrity — parsed output has correct values (4 tests)
// ============================================================================
describe('17. Data Integrity — parsed output retains values', () => {

  it('PF parsed data retains all field values', () => {
    const payload = validPayload({
      financialResponsible: {
        responsibleType: 'OTHER', relationship: 'UNCLE_AUNT', personType: 'INDIVIDUAL',
        fullName: 'José da Silva', cpf: '111.222.333-44', email: 'jose@mail.com', phone: '21987654321',
        companyName: 'should-be-ignored', cnpj: 'ignored', tradeName: 'ignored',
        contactPerson: 'ignored', contactEmail: 'ignored', contactPhone: 'ignored',
        address: { country: 'Brasil', state: 'RJ', city: 'Rio de Janeiro', neighborhood: 'Copacabana', street: 'Av Atlântica', number: '1000', complement: 'Cobertura', zipCode: '22070-000' },
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      const fr = result.data.financialResponsible;
      expect(fr.relationship).toBe('UNCLE_AUNT');
      expect(fr.personType).toBe('INDIVIDUAL');
      expect(fr.fullName).toBe('José da Silva');
      expect(fr.cpf).toBe('111.222.333-44');
      expect(fr.email).toBe('jose@mail.com');
      expect(fr.phone).toBe('21987654321');
      // PJ fields should be present (from input, no stripping)
      expect(fr.companyName).toBe('should-be-ignored');
      expect(fr.address?.complement).toBe('Cobertura');
    }
  });

  it('PJ parsed data retains all field values', () => {
    const payload = validPayload({
      financialResponsible: {
        responsibleType: 'OTHER', personType: 'COMPANY',
        companyName: 'Educação S.A.', cnpj: '99.888.777/0001-66', tradeName: 'EduSA',
        contactPerson: 'Ana Costa', contactEmail: 'ana@edusa.com', contactPhone: '4133221100',
        address: { state: 'PR', city: 'Curitiba', neighborhood: 'Batel', street: 'Rua XV', number: '50' },
      },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      const fr = result.data.financialResponsible;
      expect(fr.relationship).toBe(''); // PJ has no relationship
      expect(fr.personType).toBe('COMPANY');
      expect(fr.companyName).toBe('Educação S.A.');
      expect(fr.cnpj).toBe('99.888.777/0001-66');
      expect(fr.tradeName).toBe('EduSA');
      expect(fr.contactPerson).toBe('Ana Costa');
      expect(fr.contactEmail).toBe('ana@edusa.com');
      expect(fr.contactPhone).toBe('4133221100');
    }
  });

  it('Default values applied when fields omitted', () => {
    const payload = validPayload({
      financialResponsible: { responsibleType: 'FATHER' },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      const fr = result.data.financialResponsible;
      expect(fr.relationship).toBe('');
      expect(fr.personType).toBe('INDIVIDUAL');
      expect(fr.fullName).toBe('');
      expect(fr.cpf).toBe('');
      expect(fr.companyName).toBe('');
      expect(fr.cnpj).toBe('');
      expect(fr.tradeName).toBe('');
      expect(fr.contactPerson).toBe('');
      expect(fr.contactEmail).toBe('');
      expect(fr.contactPhone).toBe('');
    }
  });

  it('personType defaults to INDIVIDUAL when field is omitted', () => {
    const payload = validPayload({
      financialResponsible: { responsibleType: 'MOTHER' },
    });
    const result = publicEnrollmentSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.financialResponsible.personType).toBe('INDIVIDUAL');
    }
  });
});

// ============================================================================
// 18. Error Messages — correct Portuguese messages (6 tests)
// ============================================================================
describe('18. Error Messages — correct Portuguese messages', () => {

  function getFinErrors(payload: any) {
    const result = publicEnrollmentSchema.safeParse(payload);
    if (result.success) return [];
    return result.error.errors
      .filter(e => e.path[0] === 'financialResponsible')
      .map(e => ({ path: e.path.slice(1).join('.'), message: e.message }));
  }

  it('missing relationship -> correct message', () => {
    const errors = getFinErrors(validPayload({ financialResponsible: validPF({ relationship: '' }) }));
    const relErr = errors.find(e => e.path === 'relationship');
    expect(relErr).toBeDefined();
    expect(relErr!.message).toContain('Parentesco');
  });

  it('PF missing fullName -> correct message', () => {
    const errors = getFinErrors(validPayload({ financialResponsible: validPF({ fullName: '' }) }));
    const err = errors.find(e => e.path === 'fullName');
    expect(err).toBeDefined();
    expect(err!.message).toContain('Nome completo');
  });

  it('PF invalid cpf -> correct message', () => {
    const errors = getFinErrors(validPayload({ financialResponsible: validPF({ cpf: '123' }) }));
    const err = errors.find(e => e.path === 'cpf');
    expect(err).toBeDefined();
    expect(err!.message).toContain('CPF');
  });

  it('PJ missing companyName -> correct message', () => {
    const errors = getFinErrors(validPayload({ financialResponsible: validPJ({ companyName: '' }) }));
    const err = errors.find(e => e.path === 'companyName');
    expect(err).toBeDefined();
    expect(err!.message).toContain('Razão Social');
  });

  it('PJ invalid cnpj -> correct message', () => {
    const errors = getFinErrors(validPayload({ financialResponsible: validPJ({ cnpj: '123' }) }));
    const err = errors.find(e => e.path === 'cnpj');
    expect(err).toBeDefined();
    expect(err!.message).toContain('CNPJ');
  });

  it('PJ missing contactPerson -> correct message', () => {
    const errors = getFinErrors(validPayload({ financialResponsible: validPJ({ contactPerson: '' }) }));
    const err = errors.find(e => e.path === 'contactPerson');
    expect(err).toBeDefined();
    expect(err!.message).toContain('responsável na empresa');
  });
});
