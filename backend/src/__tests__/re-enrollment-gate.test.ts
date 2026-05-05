import { vi, describe, it, expect, beforeEach } from 'vitest';

const { prismaMock } = vi.hoisted(() => {
  const prismaMock = {
    reEnrollmentInvite: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    leadEnrollmentDocument: {
      count: vi.fn().mockResolvedValue(0),
    },
    studentHistory: {
      create: vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn(),
  };
  return { prismaMock };
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

import { canTransitionGate as canTransition, transitionGate } from '../services/re-enrollment-gate.service.js';

describe('ReEnrollment Gate - canTransition', () => {
  // Valid transitions (linear + TAXA_PAGA branch + v2.0 backward compat)
  const validPairs = [
    ['CONVITE_ENVIADO', 'FORMULARIO_CONFIRMADO'],
    ['FORMULARIO_CONFIRMADO', 'CONTRATO_PENDENTE'],
    ['CONTRATO_PENDENTE', 'CONTRATO_ASSINADO'],
    ['CONTRATO_ASSINADO', 'TAXA_PAGA'],
    ['CONTRATO_ASSINADO', 'REMATRICULADO'], // v2.0 backward compat
    ['TAXA_PAGA', 'REMATRICULADO'],
  ] as const;

  validPairs.forEach(([from, to]) => {
    it(`should allow ${from} -> ${to}`, () => {
      expect(canTransition(from, to)).toBe(true);
    });
  });

  // Invalid transitions (skip steps, backward, terminal)
  const invalidPairs = [
    ['CONVITE_ENVIADO', 'CONTRATO_PENDENTE'],       // skip
    ['CONVITE_ENVIADO', 'CONTRATO_ASSINADO'],        // skip
    ['CONVITE_ENVIADO', 'REMATRICULADO'],            // skip to end
    ['FORMULARIO_CONFIRMADO', 'CONVITE_ENVIADO'],    // backward
    ['FORMULARIO_CONFIRMADO', 'CONTRATO_ASSINADO'],  // skip
    ['FORMULARIO_CONFIRMADO', 'REMATRICULADO'],      // skip to end
    ['CONTRATO_PENDENTE', 'CONVITE_ENVIADO'],        // backward
    ['CONTRATO_PENDENTE', 'FORMULARIO_CONFIRMADO'],  // backward
    ['CONTRATO_ASSINADO', 'CONVITE_ENVIADO'],        // backward
    ['CONTRATO_ASSINADO', 'CONTRATO_PENDENTE'],      // backward
    ['TAXA_PAGA', 'CONTRATO_ASSINADO'],              // backward from TAXA_PAGA
    ['REMATRICULADO', 'TAXA_PAGA'],                  // backward from terminal
  ] as const;

  invalidPairs.forEach(([from, to]) => {
    it(`should reject ${from} -> ${to}`, () => {
      expect(canTransition(from, to)).toBe(false);
    });
  });

  it('should not allow any transition from REMATRICULADO (terminal)', () => {
    const allStatuses = [
      'CONVITE_ENVIADO',
      'FORMULARIO_CONFIRMADO',
      'CONTRATO_PENDENTE',
      'CONTRATO_ASSINADO',
      'TAXA_PAGA',
      'REMATRICULADO',
    ];
    allStatuses.forEach((to) => {
      expect(canTransition('REMATRICULADO', to)).toBe(false);
    });
  });

  it('should not allow any transition from TAXA_PAGA except REMATRICULADO', () => {
    const nonAllowed = [
      'CONVITE_ENVIADO',
      'FORMULARIO_CONFIRMADO',
      'CONTRATO_PENDENTE',
      'CONTRATO_ASSINADO',
      'TAXA_PAGA',
    ];
    nonAllowed.forEach((to) => {
      expect(canTransition('TAXA_PAGA', to)).toBe(false);
    });
    expect(canTransition('TAXA_PAGA', 'REMATRICULADO')).toBe(true);
  });

  it('should follow the v3.0 happy path with TAXA_PAGA: CONVITE_ENVIADO -> TAXA_PAGA -> REMATRICULADO', () => {
    const happyPath = [
      'CONVITE_ENVIADO',
      'FORMULARIO_CONFIRMADO',
      'CONTRATO_PENDENTE',
      'CONTRATO_ASSINADO',
      'TAXA_PAGA',
      'REMATRICULADO',
    ];
    for (let i = 0; i < happyPath.length - 1; i++) {
      expect(canTransition(happyPath[i], happyPath[i + 1])).toBe(true);
    }
  });

  it('should follow the v2.0 legacy happy path: CONVITE_ENVIADO -> CONTRATO_ASSINADO -> REMATRICULADO', () => {
    const legacyPath = [
      'CONVITE_ENVIADO',
      'FORMULARIO_CONFIRMADO',
      'CONTRATO_PENDENTE',
      'CONTRATO_ASSINADO',
      'REMATRICULADO',
    ];
    for (let i = 0; i < legacyPath.length - 1; i++) {
      expect(canTransition(legacyPath[i], legacyPath[i + 1])).toBe(true);
    }
  });
});

describe('ReEnrollment Gate - transitionGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update gateStatus on the invite record', async () => {
    const mockInvite = {
      id: 'invite-1',
      gateStatus: 'CONVITE_ENVIADO',
      periodId: 'period-1',
      studentId: 'student-1',
      student: { leadId: 'lead-1' },
    };

    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue(mockInvite);
    prismaMock.reEnrollmentInvite.update.mockResolvedValue({
      ...mockInvite,
      gateStatus: 'FORMULARIO_CONFIRMADO',
    });

    await transitionGate('invite-1', 'FORMULARIO_CONFIRMADO');

    expect(prismaMock.reEnrollmentInvite.findUnique).toHaveBeenCalledWith({
      where: { id: 'invite-1' },
      select: { id: true, gateStatus: true, periodId: true, studentId: true, student: { select: { leadId: true } } },
    });

    expect(prismaMock.reEnrollmentInvite.update).toHaveBeenCalledWith({
      where: { id: 'invite-1' },
      data: { gateStatus: 'FORMULARIO_CONFIRMADO' },
    });
  });

  it('should allow CONTRATO_ASSINADO -> TAXA_PAGA transition', async () => {
    const mockInvite = {
      id: 'invite-1',
      gateStatus: 'CONTRATO_ASSINADO',
      periodId: 'period-1',
      studentId: 'student-1',
      student: { leadId: 'lead-1' },
    };

    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue(mockInvite);
    prismaMock.reEnrollmentInvite.update.mockResolvedValue({
      ...mockInvite,
      gateStatus: 'TAXA_PAGA',
    });

    await transitionGate('invite-1', 'TAXA_PAGA');

    expect(prismaMock.reEnrollmentInvite.update).toHaveBeenCalledWith({
      where: { id: 'invite-1' },
      data: { gateStatus: 'TAXA_PAGA' },
    });
  });

  it('should allow TAXA_PAGA -> REMATRICULADO transition', async () => {
    const mockInvite = {
      id: 'invite-1',
      gateStatus: 'TAXA_PAGA',
      periodId: 'period-1',
      studentId: 'student-1',
      student: { leadId: 'lead-1' },
    };

    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue(mockInvite);
    prismaMock.reEnrollmentInvite.update.mockResolvedValue({
      ...mockInvite,
      gateStatus: 'REMATRICULADO',
    });

    await transitionGate('invite-1', 'REMATRICULADO');

    expect(prismaMock.reEnrollmentInvite.update).toHaveBeenCalledWith({
      where: { id: 'invite-1' },
      data: expect.objectContaining({
        gateStatus: 'REMATRICULADO',
        rematriculadoAt: expect.any(Date),
      }),
    });
  });

  it('should throw INVITE_NOT_FOUND for non-existent invite', async () => {
    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue(null);

    await expect(transitionGate('nonexistent', 'FORMULARIO_CONFIRMADO')).rejects.toThrow(
      'Convite de rematrícula não encontrado.'
    );
  });

  it('should throw INVALID_GATE_TRANSITION_REENROLLMENT for invalid transitions', async () => {
    const mockInvite = {
      id: 'invite-1',
      gateStatus: 'CONVITE_ENVIADO',
      periodId: 'period-1',
      studentId: 'student-1',
      student: { leadId: 'lead-1' },
    };

    prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue(mockInvite);

    await expect(transitionGate('invite-1', 'REMATRICULADO')).rejects.toThrow(
      'Transição de gate de rematrícula inválida.'
    );
  });

  it('should transition through v3.0 path with TAXA_PAGA sequentially', async () => {
    const steps = [
      { from: 'CONVITE_ENVIADO', to: 'FORMULARIO_CONFIRMADO' },
      { from: 'FORMULARIO_CONFIRMADO', to: 'CONTRATO_PENDENTE' },
      { from: 'CONTRATO_PENDENTE', to: 'CONTRATO_ASSINADO' },
      { from: 'CONTRATO_ASSINADO', to: 'TAXA_PAGA' },
      { from: 'TAXA_PAGA', to: 'REMATRICULADO' },
    ];

    for (const step of steps) {
      prismaMock.reEnrollmentInvite.findUnique.mockResolvedValue({
        id: 'invite-1',
        gateStatus: step.from,
        periodId: 'period-1',
        studentId: 'student-1',
        student: { leadId: 'lead-1' },
      });
      prismaMock.reEnrollmentInvite.update.mockResolvedValue({
        id: 'invite-1',
        gateStatus: step.to,
      });

      await transitionGate('invite-1', step.to);

      const expectedData =
        step.to === 'REMATRICULADO'
          ? expect.objectContaining({ gateStatus: step.to, rematriculadoAt: expect.any(Date) })
          : { gateStatus: step.to };

      expect(prismaMock.reEnrollmentInvite.update).toHaveBeenCalledWith({
        where: { id: 'invite-1' },
        data: expectedData,
      });
    }
  });
});
