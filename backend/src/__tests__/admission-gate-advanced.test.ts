/**
 * Admission Gate - Advanced State Machine Tests (21-state expanded)
 *
 * Covers:
 * - Exhaustive transition matrix (every possible from→to pair)
 * - Self-transitions always invalid
 * - Terminal state immutability (ENROLLED, REJECTED)
 * - Revert/cancellation semantics
 * - Happy path variations (reject at each stage)
 * - State machine completeness (no orphan states)
 * - Backward compatibility with old shorter paths
 */

import { describe, it, expect } from 'vitest';
import { canTransition } from '../services/admission-gate.service.js';
import { AdmissionGateStatus } from '@prisma/client';

const ALL_STATUSES: AdmissionGateStatus[] = [
  'NOT_STARTED', 'FORM_RECEIVED', 'FORM_APPROVED',
  'VISIT_SCHEDULED', 'VISIT_COMPLETED', 'INTERVIEW_COMPLETED',
  'VISIT_APPROVED', 'DOCS_REQUESTED', 'DOCS_RECEIVED',
  'VIVENCIA_SCHEDULED', 'VIVENCIA_COMPLETED',
  'EVALUATION_PENDING', 'EVALUATION_COMPLETED',
  'APPROVED', 'ENROLLMENT_PENDING', 'ENROLLMENT_COMPLETED',
  'CONTRACT_PENDING', 'CONTRACT_SIGNED', 'FINANCIAL_APPROVED',
  'ENROLLED', 'REJECTED',
];

describe('AdmissionGate - Exhaustive State Machine (21 states)', () => {
  // ========================================================================
  // SELF-TRANSITION: no status should ever transition to itself
  // ========================================================================
  describe('Self-transitions are forbidden', () => {
    ALL_STATUSES.forEach((status) => {
      it(`${status} → ${status} should be rejected`, () => {
        expect(canTransition(status, status)).toBe(false);
      });
    });
  });

  // ========================================================================
  // EXHAUSTIVE MATRIX
  // ========================================================================
  describe('Exhaustive transition matrix', () => {
    const expectedValid = new Set([
      'NOT_STARTED→FORM_RECEIVED',
      'NOT_STARTED→VISIT_SCHEDULED',
      'FORM_RECEIVED→FORM_APPROVED',
      'FORM_RECEIVED→REJECTED',
      'FORM_APPROVED→VISIT_SCHEDULED',
      'VISIT_SCHEDULED→VISIT_COMPLETED',
      'VISIT_SCHEDULED→NOT_STARTED',
      'VISIT_COMPLETED→INTERVIEW_COMPLETED',
      'VISIT_COMPLETED→VISIT_APPROVED',
      'VISIT_COMPLETED→REJECTED',
      'INTERVIEW_COMPLETED→VISIT_APPROVED',
      'INTERVIEW_COMPLETED→REJECTED',
      'VISIT_APPROVED→DOCS_REQUESTED',
      'VISIT_APPROVED→VIVENCIA_SCHEDULED',
      'DOCS_REQUESTED→DOCS_RECEIVED',
      'DOCS_RECEIVED→VIVENCIA_SCHEDULED',
      'VIVENCIA_SCHEDULED→VIVENCIA_COMPLETED',
      'VIVENCIA_SCHEDULED→VISIT_APPROVED',
      'VIVENCIA_COMPLETED→EVALUATION_PENDING',
      'EVALUATION_PENDING→EVALUATION_COMPLETED',
      'EVALUATION_COMPLETED→APPROVED',
      'EVALUATION_COMPLETED→REJECTED',
      'APPROVED→ENROLLMENT_PENDING',
      'ENROLLMENT_PENDING→ENROLLMENT_COMPLETED',
      'ENROLLMENT_COMPLETED→CONTRACT_PENDING',
      'CONTRACT_PENDING→CONTRACT_SIGNED',
      'CONTRACT_PENDING→REJECTED',
      'CONTRACT_SIGNED→FINANCIAL_APPROVED',
      'CONTRACT_SIGNED→REJECTED',
      'FINANCIAL_APPROVED→ENROLLED',
      'REJECTED→NOT_STARTED',
    ]);

    it('should have exactly 31 valid transitions in the state machine', () => {
      let validCount = 0;
      ALL_STATUSES.forEach((from) => {
        ALL_STATUSES.forEach((to) => {
          if (canTransition(from, to)) validCount++;
        });
      });
      expect(validCount).toBe(31);
    });

    // Spot-check some important valid ones
    expectedValid.forEach((key) => {
      const [from, to] = key.split('→') as [AdmissionGateStatus, AdmissionGateStatus];
      it(`${key} should be VALID`, () => {
        expect(canTransition(from, to)).toBe(true);
      });
    });
  });

  // ========================================================================
  // TERMINAL STATE IMMUTABILITY
  // ========================================================================
  describe('Terminal states', () => {
    it('ENROLLED should have zero outgoing transitions', () => {
      const outgoing = ALL_STATUSES.filter((to) => canTransition('ENROLLED', to));
      expect(outgoing).toHaveLength(0);
    });

    it('REJECTED should have 1 outgoing transition (NOT_STARTED for recovery)', () => {
      const outgoing = ALL_STATUSES.filter((to) => canTransition('REJECTED', to));
      expect(outgoing).toHaveLength(1);
      expect(outgoing).toEqual(['NOT_STARTED']);
    });
  });

  // ========================================================================
  // REACHABILITY: every state is reachable from NOT_STARTED
  // ========================================================================
  describe('State reachability from NOT_STARTED', () => {
    it('should be possible to reach every state via valid transitions', () => {
      const reachable = new Set<AdmissionGateStatus>(['NOT_STARTED']);
      let changed = true;

      while (changed) {
        changed = false;
        for (const from of reachable) {
          for (const to of ALL_STATUSES) {
            if (!reachable.has(to) && canTransition(from, to)) {
              reachable.add(to);
              changed = true;
            }
          }
        }
      }

      ALL_STATUSES.forEach((status) => {
        expect(reachable.has(status)).toBe(true);
      });
    });
  });

  // ========================================================================
  // SKIP PREVENTION
  // ========================================================================
  describe('Skip prevention - cannot jump stages', () => {
    const skipAttempts: [AdmissionGateStatus, AdmissionGateStatus, string][] = [
      ['NOT_STARTED', 'VISIT_COMPLETED', 'skip visit scheduling'],
      ['NOT_STARTED', 'APPROVED', 'skip everything to approval'],
      ['NOT_STARTED', 'ENROLLED', 'skip everything to enrolled'],
      ['VISIT_SCHEDULED', 'VIVENCIA_SCHEDULED', 'skip to vivência from visit'],
      ['FORM_RECEIVED', 'VISIT_SCHEDULED', 'skip form approval'],
      ['DOCS_REQUESTED', 'VIVENCIA_SCHEDULED', 'skip docs received'],
      ['APPROVED', 'ENROLLED', 'skip enrollment + contract'],
      ['APPROVED', 'CONTRACT_PENDING', 'skip enrollment'],
      ['ENROLLMENT_COMPLETED', 'ENROLLED', 'skip contract'],
      ['CONTRACT_PENDING', 'ENROLLED', 'skip signing + financial'],
    ];

    skipAttempts.forEach(([from, to, description]) => {
      it(`should prevent ${description}: ${from} → ${to}`, () => {
        expect(canTransition(from, to)).toBe(false);
      });
    });
  });

  // ========================================================================
  // CANCELLATION / REVERT SEMANTICS
  // ========================================================================
  describe('Cancellation reverts to correct previous state', () => {
    it('cancelling a VISIT_SCHEDULED reverts to NOT_STARTED', () => {
      expect(canTransition('VISIT_SCHEDULED', 'NOT_STARTED')).toBe(true);
    });

    it('cancelling a VIVENCIA_SCHEDULED reverts to VISIT_APPROVED', () => {
      expect(canTransition('VIVENCIA_SCHEDULED', 'VISIT_APPROVED')).toBe(true);
    });

    it('cannot cancel a completed visit', () => {
      expect(canTransition('VISIT_COMPLETED', 'NOT_STARTED')).toBe(false);
    });

    it('cannot cancel a completed vivência', () => {
      expect(canTransition('VIVENCIA_COMPLETED', 'VISIT_APPROVED')).toBe(false);
    });

    it('cannot revert from EVALUATION_PENDING', () => {
      expect(canTransition('EVALUATION_PENDING', 'VIVENCIA_COMPLETED')).toBe(false);
    });
  });

  // ========================================================================
  // REJECTION POINTS
  // ========================================================================
  describe('Rejection is possible at correct decision points', () => {
    const canReject = ALL_STATUSES.filter((s) => canTransition(s, 'REJECTED'));

    it('should have exactly 6 rejection points', () => {
      expect(canReject).toHaveLength(6);
    });

    it('FORM_RECEIVED can lead to REJECTED', () => {
      expect(canTransition('FORM_RECEIVED', 'REJECTED')).toBe(true);
    });

    it('VISIT_COMPLETED can lead to REJECTED', () => {
      expect(canTransition('VISIT_COMPLETED', 'REJECTED')).toBe(true);
    });

    it('INTERVIEW_COMPLETED can lead to REJECTED', () => {
      expect(canTransition('INTERVIEW_COMPLETED', 'REJECTED')).toBe(true);
    });

    it('EVALUATION_COMPLETED can lead to REJECTED', () => {
      expect(canTransition('EVALUATION_COMPLETED', 'REJECTED')).toBe(true);
    });

    it('CONTRACT_PENDING can lead to REJECTED', () => {
      expect(canTransition('CONTRACT_PENDING', 'REJECTED')).toBe(true);
    });

    it('CONTRACT_SIGNED can lead to REJECTED', () => {
      expect(canTransition('CONTRACT_SIGNED', 'REJECTED')).toBe(true);
    });
  });

  // ========================================================================
  // APPROVED IS NO LONGER TERMINAL
  // ========================================================================
  describe('APPROVED leads to enrollment', () => {
    it('APPROVED → ENROLLMENT_PENDING is valid', () => {
      expect(canTransition('APPROVED', 'ENROLLMENT_PENDING')).toBe(true);
    });

    it('APPROVED → REJECTED is NOT valid (no reverting approval)', () => {
      expect(canTransition('APPROVED', 'REJECTED')).toBe(false);
    });

    it('APPROVED → ENROLLED is NOT valid (must go through enrollment/contract)', () => {
      expect(canTransition('APPROVED', 'ENROLLED')).toBe(false);
    });
  });

  // ========================================================================
  // EACH STATE CORRECT SUCCESSORS
  // ========================================================================
  describe('Each state has the correct successors', () => {
    const expectedSuccessors: Record<string, AdmissionGateStatus[]> = {
      NOT_STARTED: ['FORM_RECEIVED', 'VISIT_SCHEDULED'],
      FORM_RECEIVED: ['FORM_APPROVED', 'REJECTED'],
      FORM_APPROVED: ['VISIT_SCHEDULED'],
      VISIT_SCHEDULED: ['VISIT_COMPLETED', 'NOT_STARTED'],
      VISIT_COMPLETED: ['INTERVIEW_COMPLETED', 'VISIT_APPROVED', 'REJECTED'],
      INTERVIEW_COMPLETED: ['VISIT_APPROVED', 'REJECTED'],
      VISIT_APPROVED: ['DOCS_REQUESTED', 'VIVENCIA_SCHEDULED'],
      DOCS_REQUESTED: ['DOCS_RECEIVED'],
      DOCS_RECEIVED: ['VIVENCIA_SCHEDULED'],
      VIVENCIA_SCHEDULED: ['VIVENCIA_COMPLETED', 'VISIT_APPROVED'],
      VIVENCIA_COMPLETED: ['EVALUATION_PENDING'],
      EVALUATION_PENDING: ['EVALUATION_COMPLETED'],
      EVALUATION_COMPLETED: ['APPROVED', 'REJECTED'],
      APPROVED: ['ENROLLMENT_PENDING'],
      ENROLLMENT_PENDING: ['ENROLLMENT_COMPLETED'],
      ENROLLMENT_COMPLETED: ['CONTRACT_PENDING'],
      CONTRACT_PENDING: ['CONTRACT_SIGNED', 'REJECTED'],
      CONTRACT_SIGNED: ['FINANCIAL_APPROVED', 'REJECTED'],
      FINANCIAL_APPROVED: ['ENROLLED'],
      ENROLLED: [],
      REJECTED: ['NOT_STARTED'],
    };

    Object.entries(expectedSuccessors).forEach(([from, expectedSuccs]) => {
      it(`${from} should lead to exactly: [${expectedSuccs.join(', ') || 'nothing'}]`, () => {
        const actualSuccs = ALL_STATUSES.filter((to) =>
          canTransition(from as AdmissionGateStatus, to)
        );
        expect(actualSuccs.sort()).toEqual([...expectedSuccs].sort());
      });
    });
  });

  // ========================================================================
  // HAPPY PATH VARIATIONS
  // ========================================================================
  describe('Happy paths - full workflows', () => {
    it('full happy path to ENROLLED: all 19 transitions', () => {
      const path: AdmissionGateStatus[] = [
        'NOT_STARTED', 'FORM_RECEIVED', 'FORM_APPROVED',
        'VISIT_SCHEDULED', 'VISIT_COMPLETED', 'INTERVIEW_COMPLETED',
        'VISIT_APPROVED', 'DOCS_REQUESTED', 'DOCS_RECEIVED',
        'VIVENCIA_SCHEDULED', 'VIVENCIA_COMPLETED',
        'EVALUATION_PENDING', 'EVALUATION_COMPLETED',
        'APPROVED', 'ENROLLMENT_PENDING', 'ENROLLMENT_COMPLETED',
        'CONTRACT_PENDING', 'CONTRACT_SIGNED', 'FINANCIAL_APPROVED',
        'ENROLLED',
      ];
      for (let i = 0; i < path.length - 1; i++) {
        expect(canTransition(path[i], path[i + 1])).toBe(true);
      }
    });

    it('backward-compatible short path (no form, no interview, no docs)', () => {
      const path: AdmissionGateStatus[] = [
        'NOT_STARTED', 'VISIT_SCHEDULED', 'VISIT_COMPLETED',
        'VISIT_APPROVED', 'VIVENCIA_SCHEDULED', 'VIVENCIA_COMPLETED',
        'EVALUATION_PENDING', 'EVALUATION_COMPLETED', 'APPROVED',
      ];
      for (let i = 0; i < path.length - 1; i++) {
        expect(canTransition(path[i], path[i + 1])).toBe(true);
      }
    });

    it('early rejection: FORM_RECEIVED → REJECTED', () => {
      expect(canTransition('NOT_STARTED', 'FORM_RECEIVED')).toBe(true);
      expect(canTransition('FORM_RECEIVED', 'REJECTED')).toBe(true);
    });

    it('contract rejection: CONTRACT_PENDING → REJECTED', () => {
      expect(canTransition('CONTRACT_PENDING', 'REJECTED')).toBe(true);
    });

    it('visit cancellation + reschedule workflow', () => {
      const path: [AdmissionGateStatus, AdmissionGateStatus][] = [
        ['NOT_STARTED', 'VISIT_SCHEDULED'],
        ['VISIT_SCHEDULED', 'NOT_STARTED'],
        ['NOT_STARTED', 'VISIT_SCHEDULED'],
        ['VISIT_SCHEDULED', 'VISIT_COMPLETED'],
      ];
      path.forEach(([from, to]) => {
        expect(canTransition(from, to)).toBe(true);
      });
    });

    it('post-enrollment contract flow', () => {
      const path: AdmissionGateStatus[] = [
        'ENROLLMENT_COMPLETED', 'CONTRACT_PENDING',
        'CONTRACT_SIGNED', 'FINANCIAL_APPROVED', 'ENROLLED',
      ];
      for (let i = 0; i < path.length - 1; i++) {
        expect(canTransition(path[i], path[i + 1])).toBe(true);
      }
    });
  });
});
