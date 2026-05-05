import { vi, describe, it, expect, beforeEach } from 'vitest';

/**
 * Happy-path E2E for the re-enrollment gate state machine. Walks an invite
 * from CONVITE_ENVIADO all the way to REMATRICULADO via transitionGate,
 * exactly the way the production auto-transitions would chain it:
 *
 *   submitForm    → FORMULARIO_CONFIRMADO    (re-enrollment-form.service)
 *   approveLastDoc→ DOCS_APROVADOS           (re-enrollment-document.service)
 *   createContract→ CONTRATO_PENDENTE        (contract-core.service)
 *   webhook signed→ CONTRATO_ASSINADO        (contract-webhook.service)
 *   registerFee   → TAXA_PAGA                (re-enrollment-financial.service)
 *   <implicit>    → REMATRICULADO            (re-enrollment-financial.service)
 *
 * Each step here calls transitionGate with the same inputs the live services
 * pass, asserting the state machine accepts the move and persists the new
 * gate. Service-level concerns (Prisma layer, ClickSign HTTP, email dispatch)
 * are covered by their dedicated unit tests; this one guarantees the chain
 * itself does not develop a hole over time.
 */

const { prismaMock } = vi.hoisted(() => {
  let currentGate = 'CONVITE_ENVIADO';
  const prismaMock = {
    reEnrollmentInvite: {
      findUnique: vi.fn(async () => ({
        id: 'invite-1',
        gateStatus: currentGate,
        periodId: 'period-1',
        studentId: 'student-1',
        student: { leadId: 'lead-1' },
      })),
      update: vi.fn(async ({ data }: { data: { gateStatus: string; rematriculadoAt?: Date } }) => {
        currentGate = data.gateStatus;
        return { id: 'invite-1', gateStatus: currentGate };
      }),
    },
    leadEnrollmentDocument: {
      count: vi.fn().mockResolvedValue(0),
    },
    studentHistory: {
      create: vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn(),
  };
  return { prismaMock, getCurrentGate: () => currentGate };
});

vi.mock('../config/database.js', () => ({
  prisma: prismaMock,
}));

vi.mock('../config/redis.js', () => ({ redis: { publish: vi.fn() } }));
vi.mock('../socket/io.js', () => ({
  getIO: vi.fn(() => ({ to: vi.fn(() => ({ emit: vi.fn() })) })),
}));
vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { transitionGate, canTransitionGate } from '../services/re-enrollment-gate.service.js';

describe('Re-enrollment happy-path chain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('walks CONVITE_ENVIADO → REMATRICULADO via every auto-transition step', async () => {
    const sequence = [
      ['CONVITE_ENVIADO', 'FORMULARIO_CONFIRMADO'],
      ['FORMULARIO_CONFIRMADO', 'DOCS_APROVADOS'],
      ['DOCS_APROVADOS', 'CONTRATO_PENDENTE'],
      ['CONTRATO_PENDENTE', 'CONTRATO_ASSINADO'],
      ['CONTRATO_ASSINADO', 'TAXA_PAGA'],
      ['TAXA_PAGA', 'REMATRICULADO'],
    ] as const;

    for (const [from, to] of sequence) {
      expect(canTransitionGate(from, to)).toBe(true);
      // findUnique always returns the rolling currentGate from the closure,
      // so the next call sees the previous step's result.
      await transitionGate('invite-1', to, 'user-1');
    }

    // The last update call should reflect REMATRICULADO + the rematriculadoAt stamp.
    const lastUpdate = prismaMock.reEnrollmentInvite.update.mock.calls.at(-1)?.[0];
    expect(lastUpdate?.data?.gateStatus).toBe('REMATRICULADO');
    expect(lastUpdate?.data?.rematriculadoAt).toBeInstanceOf(Date);
  });

  it('records a StudentHistory entry for every transition in the chain', async () => {
    const sequence = ['FORMULARIO_CONFIRMADO', 'DOCS_APROVADOS', 'CONTRATO_PENDENTE'] as const;
    // Reset the closure-backed gate by re-mocking findUnique
    let g = 'CONVITE_ENVIADO';
    prismaMock.reEnrollmentInvite.findUnique.mockImplementation(async () => ({
      id: 'invite-1',
      gateStatus: g,
      periodId: 'period-1',
      studentId: 'student-1',
      student: { leadId: 'lead-1' },
    }));
    prismaMock.reEnrollmentInvite.update.mockImplementation(async ({ data }: { data: { gateStatus: string; rematriculadoAt?: Date } }) => {
      g = data.gateStatus;
      return { id: 'invite-1', gateStatus: g };
    });

    for (const to of sequence) {
      await transitionGate('invite-1', to, 'user-1');
    }

    const calls = prismaMock.studentHistory.create.mock.calls;
    expect(calls.length).toBe(sequence.length);

    const recordedStatuses = calls.map((c) => (c[0]?.data as { details: { newStatus: string } }).details.newStatus);
    expect(recordedStatuses).toEqual([...sequence]);
  });

  it('blocks an invalid skip-ahead from CONVITE_ENVIADO directly to CONTRATO_PENDENTE', async () => {
    let g = 'CONVITE_ENVIADO';
    prismaMock.reEnrollmentInvite.findUnique.mockImplementation(async () => ({
      id: 'invite-2',
      gateStatus: g,
      periodId: 'period-1',
      studentId: 'student-1',
      student: { leadId: 'lead-1' },
    }));
    prismaMock.reEnrollmentInvite.update.mockImplementation(async ({ data }: { data: { gateStatus: string; rematriculadoAt?: Date } }) => {
      g = data.gateStatus;
      return { id: 'invite-2', gateStatus: g };
    });

    await expect(transitionGate('invite-2', 'CONTRATO_PENDENTE', 'user-1')).rejects.toThrow();
    // The state must NOT have advanced.
    expect(g).toBe('CONVITE_ENVIADO');
  });
});
