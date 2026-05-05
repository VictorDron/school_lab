import { describe, it, expect } from 'vitest';
import { canTransition } from '../services/admission-gate.service.js';
import { AdmissionGateStatus } from '@prisma/client';

describe('AdmissionGate - canTransition', () => {
  // Valid transitions (expanded 21-state machine)
  const validTransitions: [AdmissionGateStatus, AdmissionGateStatus][] = [
    ['NOT_STARTED', 'FORM_RECEIVED'],
    ['NOT_STARTED', 'VISIT_SCHEDULED'],  // backward compat
    ['FORM_RECEIVED', 'FORM_APPROVED'],
    ['FORM_RECEIVED', 'REJECTED'],
    ['FORM_APPROVED', 'VISIT_SCHEDULED'],
    ['VISIT_SCHEDULED', 'VISIT_COMPLETED'],
    ['VISIT_SCHEDULED', 'NOT_STARTED'], // cancel
    ['VISIT_COMPLETED', 'INTERVIEW_COMPLETED'],
    ['VISIT_COMPLETED', 'VISIT_APPROVED'], // backward compat
    ['VISIT_COMPLETED', 'REJECTED'],
    ['INTERVIEW_COMPLETED', 'VISIT_APPROVED'],
    ['INTERVIEW_COMPLETED', 'REJECTED'],
    ['VISIT_APPROVED', 'DOCS_REQUESTED'],
    ['VISIT_APPROVED', 'VIVENCIA_SCHEDULED'], // backward compat
    ['DOCS_REQUESTED', 'DOCS_RECEIVED'],
    ['DOCS_RECEIVED', 'VIVENCIA_SCHEDULED'],
    ['VIVENCIA_SCHEDULED', 'VIVENCIA_COMPLETED'],
    ['VIVENCIA_SCHEDULED', 'VISIT_APPROVED'], // cancel
    ['VIVENCIA_COMPLETED', 'EVALUATION_PENDING'],
    ['EVALUATION_PENDING', 'EVALUATION_COMPLETED'],
    ['EVALUATION_COMPLETED', 'APPROVED'],
    ['EVALUATION_COMPLETED', 'REJECTED'],
    ['APPROVED', 'ENROLLMENT_PENDING'],
    ['ENROLLMENT_PENDING', 'ENROLLMENT_COMPLETED'],
    ['ENROLLMENT_COMPLETED', 'CONTRACT_PENDING'],
    ['CONTRACT_PENDING', 'CONTRACT_SIGNED'],
    ['CONTRACT_PENDING', 'REJECTED'],
    ['CONTRACT_SIGNED', 'FINANCIAL_APPROVED'],
    ['CONTRACT_SIGNED', 'REJECTED'],
    ['FINANCIAL_APPROVED', 'ENROLLED'],
  ];

  validTransitions.forEach(([from, to]) => {
    it(`should allow ${from} → ${to}`, () => {
      expect(canTransition(from, to)).toBe(true);
    });
  });

  // Invalid transitions
  const invalidTransitions: [AdmissionGateStatus, AdmissionGateStatus][] = [
    ['NOT_STARTED', 'VIVENCIA_SCHEDULED'],
    ['NOT_STARTED', 'APPROVED'],
    ['NOT_STARTED', 'ENROLLED'],
    ['VISIT_SCHEDULED', 'VIVENCIA_SCHEDULED'],
    ['VISIT_COMPLETED', 'VIVENCIA_SCHEDULED'],
    ['VISIT_APPROVED', 'APPROVED'],
    ['VIVENCIA_SCHEDULED', 'APPROVED'],
    ['APPROVED', 'REJECTED'],
    ['REJECTED', 'APPROVED'],
    ['ENROLLED', 'NOT_STARTED'],
    ['ENROLLED', 'REJECTED'],
    // ['REJECTED', 'NOT_STARTED'], // now valid (recovery from rejection)
    ['APPROVED', 'ENROLLED'], // skip
    ['ENROLLMENT_COMPLETED', 'ENROLLED'], // skip
  ];

  invalidTransitions.forEach(([from, to]) => {
    it(`should reject ${from} → ${to}`, () => {
      expect(canTransition(from, to)).toBe(false);
    });
  });

  it('should not allow any transition from ENROLLED', () => {
    const allStatuses = Object.values(AdmissionGateStatus);
    allStatuses.forEach((to) => {
      expect(canTransition('ENROLLED', to)).toBe(false);
    });
  });

  it('should only allow REJECTED → NOT_STARTED (recovery)', () => {
    const allStatuses = Object.values(AdmissionGateStatus);
    allStatuses.forEach((to) => {
      if (to === 'NOT_STARTED') {
        expect(canTransition('REJECTED', to)).toBe(true);
      } else {
        expect(canTransition('REJECTED', to)).toBe(false);
      }
    });
  });

  it('should follow the full happy path: NOT_STARTED → ENROLLED', () => {
    const happyPath: AdmissionGateStatus[] = [
      'NOT_STARTED', 'FORM_RECEIVED', 'FORM_APPROVED',
      'VISIT_SCHEDULED', 'VISIT_COMPLETED', 'INTERVIEW_COMPLETED',
      'VISIT_APPROVED', 'DOCS_REQUESTED', 'DOCS_RECEIVED',
      'VIVENCIA_SCHEDULED', 'VIVENCIA_COMPLETED',
      'EVALUATION_PENDING', 'EVALUATION_COMPLETED',
      'APPROVED', 'ENROLLMENT_PENDING', 'ENROLLMENT_COMPLETED',
      'CONTRACT_PENDING', 'CONTRACT_SIGNED', 'FINANCIAL_APPROVED',
      'ENROLLED',
    ];

    for (let i = 0; i < happyPath.length - 1; i++) {
      expect(canTransition(happyPath[i], happyPath[i + 1])).toBe(true);
    }
  });

  it('should follow backward-compatible short path: NOT_STARTED → APPROVED', () => {
    const shortPath: AdmissionGateStatus[] = [
      'NOT_STARTED',
      'VISIT_SCHEDULED',
      'VISIT_COMPLETED',
      'VISIT_APPROVED',
      'VIVENCIA_SCHEDULED',
      'VIVENCIA_COMPLETED',
      'EVALUATION_PENDING',
      'EVALUATION_COMPLETED',
      'APPROVED',
    ];

    for (let i = 0; i < shortPath.length - 1; i++) {
      expect(canTransition(shortPath[i], shortPath[i + 1])).toBe(true);
    }
  });
});
