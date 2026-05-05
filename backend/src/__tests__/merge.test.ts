/**
 * Merge Service Tests
 *
 * Tests for multi-student support in admission form processing:
 * - Contact data merging
 * - Notes merging
 * - Number of children calculation
 * - Sibling school detection
 * - Student child data preparation (single + multi)
 * - Sibling child data preparation
 * - Full merged lead update building
 */

import { describe, it, expect } from 'vitest';
import {
  mergeContactData,
  mergeNotes,
  calculateNumberOfChildren,
  checkSiblingsAtSchool,
  prepareStudentChildData,
  prepareSiblingChildData,
  buildMergedLeadUpdate,
} from '../services/merge.service.js';
import type { PublicAdmissionData } from '../services/admissions.service.js';
import type { Lead } from '@prisma/client';

// ============================================================================
// Fixtures
// ============================================================================

const makeIncomingData = (overrides: Partial<PublicAdmissionData> = {}): PublicAdmissionData => ({
  father: { name: 'John Doe', email: 'john@example.com', phone: '1234567890', cpf: '', occupation: '', nativeLanguage: '' },
  mother: { name: 'Jane Doe', email: 'jane@example.com', phone: '0987654321', cpf: '', occupation: '', nativeLanguage: '' },
  livesWith: 'BOTH_PARENTS',
  address: { country: 'BR', state: 'RJ', city: 'Rio de Janeiro', neighborhood: 'Barra', street: 'Rua A', number: '123', zipCode: '22000-000' },
  siblings: [],
  source: 'WEBSITE',
  ...overrides,
});

const makeSingleStudentData = (): PublicAdmissionData => ({
  ...makeIncomingData(),
  student: {
    fullName: 'Alice Doe',
    dateOfBirth: '2018-03-15',
    gender: 'F',
    nationality: 'Brazilian',
    desiredGrade: 'GRADE_3',
    currentGrade: 'GRADE_2',
    primaryLanguage: 'pt',
    otherLanguages: 'en',
  },
});

const makeMultiStudentData = (): PublicAdmissionData => ({
  ...makeIncomingData(),
  students: [
    {
      fullName: 'Alice Doe',
      dateOfBirth: '2018-03-15',
      gender: 'F',
      nationality: 'Brazilian',
      desiredGrade: 'GRADE_3',
      currentGrade: 'GRADE_2',
      primaryLanguage: 'pt',
      otherLanguages: 'en',
    },
    {
      fullName: 'Bob Doe',
      dateOfBirth: '2020-07-20',
      gender: 'M',
      nationality: 'Brazilian',
      desiredGrade: 'GRADE_1',
      currentGrade: 'PRE_K',
      primaryLanguage: 'pt',
      otherLanguages: 'en',
    },
  ],
  siblings: [
    { name: 'Charlie Doe', cpf: '123.456.789-00', dateOfBirth: '2015-01-10', grade: 'GRADE_5', school: 'Other School' },
  ],
});

const makeExistingLead = (overrides: Partial<Lead> = {}): Lead => ({
  id: 'lead-1',
  familyName: 'Doe',
  primaryContactName: 'Old Name',
  primaryContactEmail: 'old@example.com',
  primaryContactPhone: '1111111111',
  secondaryContactName: null,
  secondaryContactEmail: null,
  secondaryContactPhone: null,
  numberOfChildren: 1,
  desiredGrades: ['GRADE_2'],
  hasSiblingsAtSchool: false,
  notes: null,
  source: 'WEBSITE',
  columnId: 'col-1',
  createdById: 'user-1',
  originType: 'MANUAL',
  applicationStatus: 'PENDING',
  lastFormSubmittedAt: null,
  formSubmissionCount: 0,
  applicationToken: null,
  applicationTokenExpiresAt: null,
  enrollmentToken: null,
  enrollmentTokenExpiresAt: null,
  enrollmentStatus: 'NOT_STARTED',
  enrollmentLastSubmittedAt: null,
  enrollmentSubmissionCount: 0,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
} as Lead);

// ============================================================================
// Tests
// ============================================================================

describe('Merge Service', () => {
  describe('mergeContactData', () => {
    it('should overwrite contact data from family submission', () => {
      const existing = makeExistingLead();
      const incoming = makeSingleStudentData();
      const result = mergeContactData(existing, incoming);

      expect(result.primaryContactName).toBe('John Doe');
      expect(result.primaryContactEmail).toBe('john@example.com');
      expect(result.primaryContactPhone).toBe('1234567890');
      expect(result.secondaryContactName).toBe('Jane Doe');
      expect(result.secondaryContactEmail).toBe('jane@example.com');
      expect(result.secondaryContactPhone).toBe('0987654321');
    });

    it('should handle missing mother data', () => {
      const existing = makeExistingLead();
      const incoming = makeIncomingData({ mother: undefined as any });
      const result = mergeContactData(existing, incoming);

      expect(result.primaryContactName).toBe('John Doe');
      expect(result.secondaryContactName).toBeNull();
      expect(result.secondaryContactEmail).toBeNull();
      expect(result.secondaryContactPhone).toBeNull();
    });
  });

  describe('mergeNotes', () => {
    it('should return existing notes when no family comments', () => {
      expect(mergeNotes('Admin notes', '')).toBe('Admin notes');
      expect(mergeNotes('Admin notes', undefined)).toBe('Admin notes');
      expect(mergeNotes('Admin notes', '   ')).toBe('Admin notes');
    });

    it('should return family comments when no existing notes', () => {
      expect(mergeNotes(null, 'Family comments')).toBe('Family comments');
      expect(mergeNotes('', 'Family comments')).toBe('Family comments');
    });

    it('should append family comments to existing notes', () => {
      const result = mergeNotes('Admin notes', 'Family comments');
      expect(result).toContain('Admin notes');
      expect(result).toContain('Family comments');
      expect(result).toContain('--- Observações da família ---');
    });

    it('should return null when both are empty', () => {
      expect(mergeNotes(null, undefined)).toBeNull();
      expect(mergeNotes(null, '')).toBeNull();
    });
  });

  describe('calculateNumberOfChildren', () => {
    it('should count 1 child with single student and no siblings', () => {
      const incoming = makeSingleStudentData();
      expect(calculateNumberOfChildren(incoming)).toBe(1);
    });

    it('should count student + siblings', () => {
      const incoming = makeSingleStudentData();
      incoming.siblings = [
        { name: 'Sibling 1', cpf: '', dateOfBirth: '', grade: '' },
        { name: 'Sibling 2', cpf: '', dateOfBirth: '', grade: '' },
      ];
      expect(calculateNumberOfChildren(incoming)).toBe(3);
    });

    it('should count multi-student + siblings correctly', () => {
      const incoming = makeMultiStudentData();
      // 1 + 1 sibling = 2 (calculateNumberOfChildren uses 1 + siblings.length)
      expect(calculateNumberOfChildren(incoming)).toBe(2);
    });
  });

  describe('checkSiblingsAtSchool', () => {
    it('should return false for empty siblings', () => {
      expect(checkSiblingsAtSchool([])).toBe(false);
    });

    it('should return false when siblings have non-matching schools', () => {
      expect(checkSiblingsAtSchool([
        { name: 'A', cpf: '', dateOfBirth: '', grade: '', school: 'Other School' },
      ])).toBe(false);
    });

    it('should return false when sibling school is empty', () => {
      expect(checkSiblingsAtSchool([
        { name: 'A', cpf: '', dateOfBirth: '', grade: '', school: '' },
      ])).toBe(false);
    });

    it('should detect RIS school name variations', () => {
      const variations = ['RIS', 'ris', 'School Lab', 'Rio Internacional School', 'School International'];
      for (const school of variations) {
        expect(checkSiblingsAtSchool([
          { name: 'A', cpf: '', dateOfBirth: '', grade: '', school },
        ])).toBe(true);
      }
    });

    it('should detect "nossa escola" and "aqui" patterns', () => {
      expect(checkSiblingsAtSchool([{ name: 'A', cpf: '', dateOfBirth: '', grade: '', school: 'Nossa escola' }])).toBe(true);
      expect(checkSiblingsAtSchool([{ name: 'A', cpf: '', dateOfBirth: '', grade: '', school: 'Aqui' }])).toBe(true);
    });
  });

  describe('prepareStudentChildData', () => {
    it('should prepare child data from single student', () => {
      const incoming = makeSingleStudentData();
      const result = prepareStudentChildData('lead-1', incoming);

      expect(result.leadId).toBe('lead-1');
      expect(result.fullName).toBe('Alice Doe');
      expect(result.gender).toBe('F');
      expect(result.desiredGrade).toBe('GRADE_3');
      expect(result.relationship).toBe('STUDENT');
      expect(result.isApplicant).toBe(true);
    });

    it('should prepare child data from students array (first student)', () => {
      const incoming = makeMultiStudentData();
      const result = prepareStudentChildData('lead-1', incoming);

      expect(result.fullName).toBe('Alice Doe');
      expect(result.desiredGrade).toBe('GRADE_3');
      expect(result.isApplicant).toBe(true);
    });

    it('should throw when no students provided', () => {
      const incoming = makeIncomingData();
      expect(() => prepareStudentChildData('lead-1', incoming)).toThrow('NO_STUDENTS_PROVIDED');
    });

    it('should handle date conversion', () => {
      const incoming = makeSingleStudentData();
      const result = prepareStudentChildData('lead-1', incoming);
      expect(result.dateOfBirth).toBeInstanceOf(Date);
    });

    it('should handle otherLanguages as string', () => {
      const incoming = makeSingleStudentData();
      const result = prepareStudentChildData('lead-1', incoming);
      expect(result.otherLanguages).toEqual(['en']);
    });
  });

  describe('prepareSiblingChildData', () => {
    it('should prepare sibling data', () => {
      const sibling = { name: 'Charlie Doe', cpf: '123.456.789-00', dateOfBirth: '2015-01-10', grade: 'GRADE_5', school: 'Other School' };
      const result = prepareSiblingChildData('lead-1', sibling);

      expect(result).not.toBeNull();
      expect(result!.fullName).toBe('Charlie Doe');
      expect(result!.relationship).toBe('SIBLING');
      expect(result!.isApplicant).toBe(false);
      expect(result!.currentSchool).toBe('Other School');
    });

    it('should return null for empty sibling name', () => {
      const sibling = { name: '', cpf: '', dateOfBirth: '', grade: '' };
      expect(prepareSiblingChildData('lead-1', sibling)).toBeNull();
    });

    it('should return null for whitespace-only sibling name', () => {
      const sibling = { name: '   ', cpf: '', dateOfBirth: '', grade: '' };
      expect(prepareSiblingChildData('lead-1', sibling)).toBeNull();
    });
  });

  describe('buildMergedLeadUpdate', () => {
    it('should build complete merged update with single student', () => {
      const existing = makeExistingLead();
      const incoming = makeSingleStudentData();
      const result = buildMergedLeadUpdate(existing, incoming);

      expect(result.applicationStatus).toBe('FORM_RECEIVED');
      expect(result.formSubmissionCount).toBe(1);
      expect(result.lastFormSubmittedAt).toBeInstanceOf(Date);
      expect(result.primaryContactName).toBe('John Doe');
      expect(result.numberOfChildren).toBe(1);
      expect(result.desiredGrades).toContain('GRADE_3');
    });

    it('should merge desired grades from multiple students', () => {
      const existing = makeExistingLead({ desiredGrades: ['GRADE_2'] });
      const incoming = makeMultiStudentData();
      const result = buildMergedLeadUpdate(existing, incoming);

      expect(result.desiredGrades).toContain('GRADE_2');
      expect(result.desiredGrades).toContain('GRADE_3');
      expect(result.desiredGrades).toContain('GRADE_1');
    });

    it('should deduplicate desired grades', () => {
      const existing = makeExistingLead({ desiredGrades: ['GRADE_3'] });
      const incoming = makeSingleStudentData(); // desiredGrade = GRADE_3
      const result = buildMergedLeadUpdate(existing, incoming);

      const grade3Count = result.desiredGrades!.filter(g => g === 'GRADE_3').length;
      expect(grade3Count).toBe(1);
    });

    it('should increment form submission count', () => {
      const existing = makeExistingLead({ formSubmissionCount: 2 });
      const incoming = makeSingleStudentData();
      const result = buildMergedLeadUpdate(existing, incoming);

      expect(result.formSubmissionCount).toBe(3);
    });

    it('should detect siblings at school', () => {
      const existing = makeExistingLead();
      const incoming = makeSingleStudentData();
      incoming.siblings = [
        { name: 'Sibling', cpf: '', dateOfBirth: '', grade: '', school: 'RIS' },
      ];
      const result = buildMergedLeadUpdate(existing, incoming);

      expect(result.hasSiblingsAtSchool).toBe(true);
    });

    it('should append notes from family submission', () => {
      const existing = makeExistingLead({ notes: 'Admin note' });
      const incoming = makeSingleStudentData();
      incoming.additionalInfo = { otherRelevantInfo: 'Family note' } as any;
      const result = buildMergedLeadUpdate(existing, incoming);

      expect(result.notes).toContain('Admin note');
      expect(result.notes).toContain('Family note');
    });
  });
});
