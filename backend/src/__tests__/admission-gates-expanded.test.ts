/**
 * Admission Gate - Expanded 21-State Machine Tests
 *
 * Comprehensive tests for the full admission pipeline with 21 states:
 * NOT_STARTED through ENROLLED/REJECTED, including form review,
 * interview, documents, enrollment, contract, and financial gates.
 */

import { describe, it, expect } from 'vitest';
import { canTransition } from '../services/admission-gate.service.js';
import { AdmissionGateStatus } from '@prisma/client';

// All 21 statuses in logical pipeline order
const ALL_STATUSES: AdmissionGateStatus[] = [
  'NOT_STARTED',
  'FORM_RECEIVED',
  'FORM_APPROVED',
  'VISIT_SCHEDULED',
  'VISIT_COMPLETED',
  'INTERVIEW_COMPLETED',
  'VISIT_APPROVED',
  'DOCS_REQUESTED',
  'DOCS_RECEIVED',
  'VIVENCIA_SCHEDULED',
  'VIVENCIA_COMPLETED',
  'EVALUATION_PENDING',
  'EVALUATION_COMPLETED',
  'APPROVED',
  'ENROLLMENT_PENDING',
  'ENROLLMENT_COMPLETED',
  'CONTRACT_PENDING',
  'CONTRACT_SIGNED',
  'FINANCIAL_APPROVED',
  'ENROLLED',
  'REJECTED',
];

// The canonical transitions map
const TRANSITIONS: Record<AdmissionGateStatus, AdmissionGateStatus[]> = {
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

// Compute the inverse: for each status, which states can reach it
function computePredecessors(): Record<AdmissionGateStatus, AdmissionGateStatus[]> {
  const preds: Record<string, AdmissionGateStatus[]> = {};
  for (const s of ALL_STATUSES) preds[s] = [];
  for (const [from, targets] of Object.entries(TRANSITIONS)) {
    for (const to of targets) {
      preds[to].push(from as AdmissionGateStatus);
    }
  }
  return preds as Record<AdmissionGateStatus, AdmissionGateStatus[]>;
}

const PREDECESSORS = computePredecessors();

// Helper: walk a path and assert every step is valid
function assertPathValid(path: AdmissionGateStatus[]) {
  for (let i = 0; i < path.length - 1; i++) {
    expect(
      canTransition(path[i], path[i + 1]),
      `Expected ${path[i]} -> ${path[i + 1]} to be valid (step ${i + 1})`,
    ).toBe(true);
  }
}

describe('AdmissionGate - Expanded 21-State Machine', () => {
  // ========================================================================
  // 1. SELF-TRANSITIONS FORBIDDEN (21 tests)
  // ========================================================================
  describe('1. Self-transitions are forbidden', () => {
    ALL_STATUSES.forEach((status) => {
      it(`${status} cannot transition to itself`, () => {
        expect(canTransition(status, status)).toBe(false);
      });
    });
  });

  // ========================================================================
  // 2. COMPLETE HAPPY PATH (19 transitions)
  // ========================================================================
  describe('2. Complete happy path: NOT_STARTED to ENROLLED', () => {
    const HAPPY_PATH: AdmissionGateStatus[] = [
      'NOT_STARTED',
      'FORM_RECEIVED',
      'FORM_APPROVED',
      'VISIT_SCHEDULED',
      'VISIT_COMPLETED',
      'INTERVIEW_COMPLETED',
      'VISIT_APPROVED',
      'DOCS_REQUESTED',
      'DOCS_RECEIVED',
      'VIVENCIA_SCHEDULED',
      'VIVENCIA_COMPLETED',
      'EVALUATION_PENDING',
      'EVALUATION_COMPLETED',
      'APPROVED',
      'ENROLLMENT_PENDING',
      'ENROLLMENT_COMPLETED',
      'CONTRACT_PENDING',
      'CONTRACT_SIGNED',
      'FINANCIAL_APPROVED',
      'ENROLLED',
    ];

    it('should have exactly 19 transitions in the happy path', () => {
      expect(HAPPY_PATH.length - 1).toBe(19);
    });

    for (let i = 0; i < HAPPY_PATH.length - 1; i++) {
      const from = HAPPY_PATH[i];
      const to = HAPPY_PATH[i + 1];
      it(`step ${i + 1}: ${from} -> ${to} is valid`, () => {
        expect(canTransition(from, to)).toBe(true);
      });
    }
  });

  // ========================================================================
  // 3. BACKWARD COMPATIBILITY PATHS
  // ========================================================================
  describe('3. Backward compatibility paths (old shortcuts)', () => {
    it('NOT_STARTED -> VISIT_SCHEDULED (skip FORM_RECEIVED and FORM_APPROVED)', () => {
      expect(canTransition('NOT_STARTED', 'VISIT_SCHEDULED')).toBe(true);
    });

    it('VISIT_COMPLETED -> VISIT_APPROVED (skip INTERVIEW_COMPLETED)', () => {
      expect(canTransition('VISIT_COMPLETED', 'VISIT_APPROVED')).toBe(true);
    });

    it('VISIT_APPROVED -> VIVENCIA_SCHEDULED (skip DOCS_REQUESTED and DOCS_RECEIVED)', () => {
      expect(canTransition('VISIT_APPROVED', 'VIVENCIA_SCHEDULED')).toBe(true);
    });
  });

  // ========================================================================
  // 4. TERMINAL STATES
  // ========================================================================
  describe('4. Terminal states', () => {
    describe('ENROLLED is truly terminal', () => {
      ALL_STATUSES.forEach((target) => {
        it(`ENROLLED -> ${target} is forbidden`, () => {
          expect(canTransition('ENROLLED', target)).toBe(false);
        });
      });

      it('ENROLLED has exactly 0 outgoing transitions', () => {
        const outgoing = ALL_STATUSES.filter((to) => canTransition('ENROLLED', to));
        expect(outgoing).toHaveLength(0);
      });
    });

    describe('REJECTED allows recovery to NOT_STARTED', () => {
      ALL_STATUSES.forEach((target) => {
        if (target === 'NOT_STARTED') {
          it(`REJECTED -> ${target} is allowed (recovery)`, () => {
            expect(canTransition('REJECTED', target)).toBe(true);
          });
        } else {
          it(`REJECTED -> ${target} is forbidden`, () => {
            expect(canTransition('REJECTED', target)).toBe(false);
          });
        }
      });

      it('REJECTED has exactly 1 outgoing transition', () => {
        const outgoing = ALL_STATUSES.filter((to) => canTransition('REJECTED', to));
        expect(outgoing).toHaveLength(1);
        expect(outgoing).toEqual(['NOT_STARTED']);
      });
    });
  });

  // ========================================================================
  // 5. REJECTION POINTS
  // ========================================================================
  describe('5. Rejection points', () => {
    const REJECTION_SOURCES: AdmissionGateStatus[] = [
      'FORM_RECEIVED',
      'VISIT_COMPLETED',
      'INTERVIEW_COMPLETED',
      'EVALUATION_COMPLETED',
      'CONTRACT_PENDING',
      'CONTRACT_SIGNED',
    ];

    describe('States that CAN lead to REJECTED', () => {
      REJECTION_SOURCES.forEach((state) => {
        it(`${state} -> REJECTED is valid`, () => {
          expect(canTransition(state, 'REJECTED')).toBe(true);
        });
      });
    });

    describe('States that CANNOT lead to REJECTED', () => {
      const nonRejectionStates = ALL_STATUSES.filter(
        (s) => !REJECTION_SOURCES.includes(s),
      );

      nonRejectionStates.forEach((state) => {
        it(`${state} -> REJECTED is forbidden`, () => {
          expect(canTransition(state, 'REJECTED')).toBe(false);
        });
      });
    });

    it('exactly 6 states can lead to REJECTED', () => {
      const actual = ALL_STATUSES.filter((s) => canTransition(s, 'REJECTED'));
      expect(actual.sort()).toEqual([...REJECTION_SOURCES].sort());
    });
  });

  // ========================================================================
  // 6. CANCELLATION SEMANTICS
  // ========================================================================
  describe('6. Cancellation semantics', () => {
    it('VISIT_SCHEDULED -> NOT_STARTED (cancel visit)', () => {
      expect(canTransition('VISIT_SCHEDULED', 'NOT_STARTED')).toBe(true);
    });

    it('VIVENCIA_SCHEDULED -> VISIT_APPROVED (cancel vivencia)', () => {
      expect(canTransition('VIVENCIA_SCHEDULED', 'VISIT_APPROVED')).toBe(true);
    });

    describe('Completed states cannot be cancelled', () => {
      const completedNonCancellable: [AdmissionGateStatus, AdmissionGateStatus, string][] = [
        ['VISIT_COMPLETED', 'NOT_STARTED', 'completed visit cannot revert to NOT_STARTED'],
        ['VISIT_COMPLETED', 'VISIT_SCHEDULED', 'completed visit cannot revert to VISIT_SCHEDULED'],
        ['VIVENCIA_COMPLETED', 'VISIT_APPROVED', 'completed vivencia cannot revert to VISIT_APPROVED'],
        ['VIVENCIA_COMPLETED', 'VIVENCIA_SCHEDULED', 'completed vivencia cannot revert to VIVENCIA_SCHEDULED'],
        ['INTERVIEW_COMPLETED', 'VISIT_COMPLETED', 'completed interview cannot revert'],
        ['EVALUATION_COMPLETED', 'EVALUATION_PENDING', 'completed evaluation cannot revert'],
        ['ENROLLMENT_COMPLETED', 'ENROLLMENT_PENDING', 'completed enrollment cannot revert'],
        ['FORM_APPROVED', 'FORM_RECEIVED', 'approved form cannot revert to received'],
      ];

      completedNonCancellable.forEach(([from, to, description]) => {
        it(`${description}: ${from} -> ${to} is forbidden`, () => {
          expect(canTransition(from, to)).toBe(false);
        });
      });
    });
  });

  // ========================================================================
  // 7. SKIP PREVENTION
  // ========================================================================
  describe('7. Skip prevention - invalid jumps', () => {
    const skipAttempts: [AdmissionGateStatus, AdmissionGateStatus, string][] = [
      ['NOT_STARTED', 'APPROVED', 'skip everything to approval'],
      ['NOT_STARTED', 'ENROLLED', 'skip everything to enrolled'],
      ['VISIT_SCHEDULED', 'VIVENCIA_SCHEDULED', 'skip visit completion and approval'],
      ['FORM_RECEIVED', 'VISIT_SCHEDULED', 'skip FORM_APPROVED'],
      ['DOCS_REQUESTED', 'VIVENCIA_SCHEDULED', 'skip DOCS_RECEIVED'],
      ['APPROVED', 'ENROLLED', 'skip enrollment, contract, and financial'],
      ['APPROVED', 'CONTRACT_PENDING', 'skip enrollment steps'],
      ['ENROLLMENT_COMPLETED', 'ENROLLED', 'skip contract and financial'],
      ['CONTRACT_PENDING', 'ENROLLED', 'skip signing and financial'],
    ];

    skipAttempts.forEach(([from, to, description]) => {
      it(`${description}: ${from} -> ${to} is forbidden`, () => {
        expect(canTransition(from, to)).toBe(false);
      });
    });
  });

  // ========================================================================
  // 8. STATE REACHABILITY (BFS)
  // ========================================================================
  describe('8. State reachability via BFS from NOT_STARTED', () => {
    it('BFS from NOT_STARTED should reach all 21 states', () => {
      const reachable = new Set<AdmissionGateStatus>(['NOT_STARTED']);
      const queue: AdmissionGateStatus[] = ['NOT_STARTED'];

      while (queue.length > 0) {
        const current = queue.shift()!;
        for (const target of ALL_STATUSES) {
          if (!reachable.has(target) && canTransition(current, target)) {
            reachable.add(target);
            queue.push(target);
          }
        }
      }

      expect(reachable.size).toBe(21);

      ALL_STATUSES.forEach((status) => {
        expect(
          reachable.has(status),
          `${status} should be reachable from NOT_STARTED`,
        ).toBe(true);
      });
    });
  });

  // ========================================================================
  // 9. EXHAUSTIVE OUTGOING TRANSITIONS (successors)
  // ========================================================================
  describe('9. Exhaustive outgoing transitions for each state', () => {
    (Object.entries(TRANSITIONS) as [AdmissionGateStatus, AdmissionGateStatus[]][]).forEach(
      ([from, expectedSuccessors]) => {
        it(`${from} -> [${expectedSuccessors.join(', ') || 'nothing'}]`, () => {
          const actualSuccessors = ALL_STATUSES.filter((to) =>
            canTransition(from as AdmissionGateStatus, to),
          );
          expect(actualSuccessors.sort()).toEqual([...expectedSuccessors].sort());
        });
      },
    );
  });

  // ========================================================================
  // 10. EXHAUSTIVE INCOMING TRANSITIONS (predecessors)
  // ========================================================================
  describe('10. Exhaustive incoming transitions (predecessors) for each state', () => {
    (Object.entries(PREDECESSORS) as [AdmissionGateStatus, AdmissionGateStatus[]][]).forEach(
      ([target, expectedPredecessors]) => {
        it(`[${expectedPredecessors.join(', ') || 'nothing'}] -> ${target}`, () => {
          const actualPredecessors = ALL_STATUSES.filter((from) =>
            canTransition(from, target as AdmissionGateStatus),
          );
          expect(actualPredecessors.sort()).toEqual([...expectedPredecessors].sort());
        });
      },
    );
  });

  // ========================================================================
  // 11. REJECTION PATH VARIATIONS
  // ========================================================================
  describe('11. Rejection path variations', () => {
    it('early rejection: NOT_STARTED -> FORM_RECEIVED -> REJECTED', () => {
      assertPathValid(['NOT_STARTED', 'FORM_RECEIVED', 'REJECTED']);
    });

    it('after visit: NOT_STARTED -> FORM_RECEIVED -> FORM_APPROVED -> VISIT_SCHEDULED -> VISIT_COMPLETED -> REJECTED', () => {
      assertPathValid([
        'NOT_STARTED',
        'FORM_RECEIVED',
        'FORM_APPROVED',
        'VISIT_SCHEDULED',
        'VISIT_COMPLETED',
        'REJECTED',
      ]);
    });

    it('after interview: ... -> VISIT_COMPLETED -> INTERVIEW_COMPLETED -> REJECTED', () => {
      assertPathValid([
        'NOT_STARTED',
        'FORM_RECEIVED',
        'FORM_APPROVED',
        'VISIT_SCHEDULED',
        'VISIT_COMPLETED',
        'INTERVIEW_COMPLETED',
        'REJECTED',
      ]);
    });

    it('after evaluation: full path to EVALUATION_COMPLETED -> REJECTED', () => {
      assertPathValid([
        'NOT_STARTED',
        'FORM_RECEIVED',
        'FORM_APPROVED',
        'VISIT_SCHEDULED',
        'VISIT_COMPLETED',
        'INTERVIEW_COMPLETED',
        'VISIT_APPROVED',
        'DOCS_REQUESTED',
        'DOCS_RECEIVED',
        'VIVENCIA_SCHEDULED',
        'VIVENCIA_COMPLETED',
        'EVALUATION_PENDING',
        'EVALUATION_COMPLETED',
        'REJECTED',
      ]);
    });

    it('contract rejection: full path to CONTRACT_PENDING -> REJECTED', () => {
      assertPathValid([
        'NOT_STARTED',
        'FORM_RECEIVED',
        'FORM_APPROVED',
        'VISIT_SCHEDULED',
        'VISIT_COMPLETED',
        'INTERVIEW_COMPLETED',
        'VISIT_APPROVED',
        'DOCS_REQUESTED',
        'DOCS_RECEIVED',
        'VIVENCIA_SCHEDULED',
        'VIVENCIA_COMPLETED',
        'EVALUATION_PENDING',
        'EVALUATION_COMPLETED',
        'APPROVED',
        'ENROLLMENT_PENDING',
        'ENROLLMENT_COMPLETED',
        'CONTRACT_PENDING',
        'REJECTED',
      ]);
    });

    it('financial rejection: full path to CONTRACT_SIGNED -> REJECTED', () => {
      assertPathValid([
        'NOT_STARTED',
        'FORM_RECEIVED',
        'FORM_APPROVED',
        'VISIT_SCHEDULED',
        'VISIT_COMPLETED',
        'INTERVIEW_COMPLETED',
        'VISIT_APPROVED',
        'DOCS_REQUESTED',
        'DOCS_RECEIVED',
        'VIVENCIA_SCHEDULED',
        'VIVENCIA_COMPLETED',
        'EVALUATION_PENDING',
        'EVALUATION_COMPLETED',
        'APPROVED',
        'ENROLLMENT_PENDING',
        'ENROLLMENT_COMPLETED',
        'CONTRACT_PENDING',
        'CONTRACT_SIGNED',
        'REJECTED',
      ]);
    });
  });

  // ========================================================================
  // 12. CANCELLATION + RESCHEDULE WORKFLOWS
  // ========================================================================
  describe('12. Cancellation and reschedule workflows', () => {
    it('visit: schedule -> cancel -> reschedule -> complete', () => {
      const steps: [AdmissionGateStatus, AdmissionGateStatus][] = [
        ['NOT_STARTED', 'VISIT_SCHEDULED'],
        ['VISIT_SCHEDULED', 'NOT_STARTED'],        // cancel
        ['NOT_STARTED', 'VISIT_SCHEDULED'],         // reschedule
        ['VISIT_SCHEDULED', 'VISIT_COMPLETED'],     // complete
      ];
      steps.forEach(([from, to]) => {
        expect(canTransition(from, to)).toBe(true);
      });
    });

    it('vivencia: schedule -> cancel -> reschedule -> complete', () => {
      const steps: [AdmissionGateStatus, AdmissionGateStatus][] = [
        ['VISIT_APPROVED', 'VIVENCIA_SCHEDULED'],
        ['VIVENCIA_SCHEDULED', 'VISIT_APPROVED'],    // cancel
        ['VISIT_APPROVED', 'VIVENCIA_SCHEDULED'],     // reschedule
        ['VIVENCIA_SCHEDULED', 'VIVENCIA_COMPLETED'], // complete
      ];
      steps.forEach(([from, to]) => {
        expect(canTransition(from, to)).toBe(true);
      });
    });

    it('multiple visit cancellations (3x) then complete', () => {
      const steps: [AdmissionGateStatus, AdmissionGateStatus][] = [
        ['NOT_STARTED', 'VISIT_SCHEDULED'],
        ['VISIT_SCHEDULED', 'NOT_STARTED'],        // cancel #1
        ['NOT_STARTED', 'VISIT_SCHEDULED'],
        ['VISIT_SCHEDULED', 'NOT_STARTED'],        // cancel #2
        ['NOT_STARTED', 'VISIT_SCHEDULED'],
        ['VISIT_SCHEDULED', 'NOT_STARTED'],        // cancel #3
        ['NOT_STARTED', 'VISIT_SCHEDULED'],
        ['VISIT_SCHEDULED', 'VISIT_COMPLETED'],    // finally complete
      ];
      steps.forEach(([from, to]) => {
        expect(canTransition(from, to)).toBe(true);
      });
    });

    it('multiple vivencia cancellations (3x) then complete', () => {
      const steps: [AdmissionGateStatus, AdmissionGateStatus][] = [
        ['VISIT_APPROVED', 'VIVENCIA_SCHEDULED'],
        ['VIVENCIA_SCHEDULED', 'VISIT_APPROVED'],    // cancel #1
        ['VISIT_APPROVED', 'VIVENCIA_SCHEDULED'],
        ['VIVENCIA_SCHEDULED', 'VISIT_APPROVED'],    // cancel #2
        ['VISIT_APPROVED', 'VIVENCIA_SCHEDULED'],
        ['VIVENCIA_SCHEDULED', 'VISIT_APPROVED'],    // cancel #3
        ['VISIT_APPROVED', 'VIVENCIA_SCHEDULED'],
        ['VIVENCIA_SCHEDULED', 'VIVENCIA_COMPLETED'], // finally complete
      ];
      steps.forEach(([from, to]) => {
        expect(canTransition(from, to)).toBe(true);
      });
    });
  });

  // ========================================================================
  // 13. APPROVED IS NO LONGER TERMINAL
  // ========================================================================
  describe('13. APPROVED is no longer terminal', () => {
    it('APPROVED -> ENROLLMENT_PENDING is valid', () => {
      expect(canTransition('APPROVED', 'ENROLLMENT_PENDING')).toBe(true);
    });

    it('APPROVED has exactly 1 outgoing transition', () => {
      const outgoing = ALL_STATUSES.filter((to) => canTransition('APPROVED', to));
      expect(outgoing).toEqual(['ENROLLMENT_PENDING']);
    });

    it('APPROVED cannot go directly to ENROLLED', () => {
      expect(canTransition('APPROVED', 'ENROLLED')).toBe(false);
    });

    it('APPROVED cannot go directly to CONTRACT_PENDING', () => {
      expect(canTransition('APPROVED', 'CONTRACT_PENDING')).toBe(false);
    });
  });

  // ========================================================================
  // 14. POST-ENROLLMENT FLOW (contract path)
  // ========================================================================
  describe('14. Post-enrollment contract flow', () => {
    const CONTRACT_PATH: AdmissionGateStatus[] = [
      'ENROLLMENT_COMPLETED',
      'CONTRACT_PENDING',
      'CONTRACT_SIGNED',
      'FINANCIAL_APPROVED',
      'ENROLLED',
    ];

    it('full contract path: ENROLLMENT_COMPLETED -> CONTRACT_PENDING -> CONTRACT_SIGNED -> FINANCIAL_APPROVED -> ENROLLED', () => {
      assertPathValid(CONTRACT_PATH);
    });

    for (let i = 0; i < CONTRACT_PATH.length - 1; i++) {
      const from = CONTRACT_PATH[i];
      const to = CONTRACT_PATH[i + 1];
      it(`${from} -> ${to} is valid`, () => {
        expect(canTransition(from, to)).toBe(true);
      });
    }

    it('cannot skip from ENROLLMENT_COMPLETED directly to ENROLLED', () => {
      expect(canTransition('ENROLLMENT_COMPLETED', 'ENROLLED')).toBe(false);
    });

    it('cannot skip from CONTRACT_PENDING directly to ENROLLED', () => {
      expect(canTransition('CONTRACT_PENDING', 'ENROLLED')).toBe(false);
    });

    it('cannot skip from CONTRACT_SIGNED directly to ENROLLED', () => {
      expect(canTransition('CONTRACT_SIGNED', 'ENROLLED')).toBe(false);
    });
  });

  // ========================================================================
  // 15. TOTAL VALID TRANSITION COUNT
  // ========================================================================
  describe('15. Total valid transition count', () => {
    it('should have exactly 31 valid transitions across 21x21=441 matrix', () => {
      let validCount = 0;
      ALL_STATUSES.forEach((from) => {
        ALL_STATUSES.forEach((to) => {
          if (canTransition(from, to)) validCount++;
        });
      });
      expect(validCount).toBe(31);
    });

    it('total matrix size is 441 (21 x 21)', () => {
      expect(ALL_STATUSES.length * ALL_STATUSES.length).toBe(441);
    });

    it('invalid transition count is 410 (441 - 31)', () => {
      let invalidCount = 0;
      ALL_STATUSES.forEach((from) => {
        ALL_STATUSES.forEach((to) => {
          if (!canTransition(from, to)) invalidCount++;
        });
      });
      expect(invalidCount).toBe(410);
    });

    it('sum of all successor array lengths equals 31', () => {
      const totalFromMap = Object.values(TRANSITIONS).reduce(
        (sum, arr) => sum + arr.length,
        0,
      );
      expect(totalFromMap).toBe(31);
    });
  });
});
