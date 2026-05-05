import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
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
}));

vi.mock('../config/database.js', () => ({
  prisma: mockPrisma,
}));

vi.mock('../config/redis.js', () => ({
  redis: { publish: vi.fn().mockResolvedValue(1) },
}));

vi.mock('../utils/logger.js', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('../socket/io.js', () => ({
  getIO: () => ({ to: () => ({ emit: vi.fn() }) }),
}));

const { transitionGate } = await import('../services/re-enrollment-gate.service.js');

describe('transitionGate: rematriculadoAt stamping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.leadEnrollmentDocument.count.mockResolvedValue(0);
  });

  it('stamps rematriculadoAt when transitioning to REMATRICULADO', async () => {
    mockPrisma.reEnrollmentInvite.findUnique.mockResolvedValue({
      id: 'inv-1',
      gateStatus: 'TAXA_PAGA',
      periodId: 'per-1',
      studentId: 'stu-1',
      student: { leadId: 'lead-1' },
    });
    mockPrisma.reEnrollmentInvite.update.mockResolvedValue({});

    const before = Date.now();
    await transitionGate('inv-1', 'REMATRICULADO', 'user-1');
    const after = Date.now();

    expect(mockPrisma.reEnrollmentInvite.update).toHaveBeenCalledTimes(1);
    const call = mockPrisma.reEnrollmentInvite.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: 'inv-1' });
    expect(call.data.gateStatus).toBe('REMATRICULADO');
    expect(call.data.rematriculadoAt).toBeInstanceOf(Date);
    const stamp = (call.data.rematriculadoAt as Date).getTime();
    expect(stamp).toBeGreaterThanOrEqual(before);
    expect(stamp).toBeLessThanOrEqual(after);
  });

  it('does not stamp rematriculadoAt for non-terminal transitions', async () => {
    mockPrisma.reEnrollmentInvite.findUnique.mockResolvedValue({
      id: 'inv-2',
      gateStatus: 'CONVITE_ENVIADO',
      periodId: 'per-1',
      studentId: 'stu-2',
      student: { leadId: 'lead-2' },
    });
    mockPrisma.reEnrollmentInvite.update.mockResolvedValue({});

    await transitionGate('inv-2', 'FORMULARIO_CONFIRMADO', 'user-1');

    const call = mockPrisma.reEnrollmentInvite.update.mock.calls[0][0];
    expect(call.data.gateStatus).toBe('FORMULARIO_CONFIRMADO');
    expect('rematriculadoAt' in call.data).toBe(false);
  });

  it('does not stamp rematriculadoAt when transitioning to other terminal states', async () => {
    mockPrisma.reEnrollmentInvite.findUnique.mockResolvedValue({
      id: 'inv-3',
      gateStatus: 'CONVITE_ENVIADO',
      periodId: 'per-1',
      studentId: 'stu-3',
      student: { leadId: 'lead-3' },
    });
    mockPrisma.reEnrollmentInvite.update.mockResolvedValue({});

    await transitionGate('inv-3', 'RECUSADO', 'user-1');

    const call = mockPrisma.reEnrollmentInvite.update.mock.calls[0][0];
    expect(call.data.gateStatus).toBe('RECUSADO');
    expect('rematriculadoAt' in call.data).toBe(false);
  });

  it('rejects invalid transitions before touching the update call', async () => {
    mockPrisma.reEnrollmentInvite.findUnique.mockResolvedValue({
      id: 'inv-4',
      gateStatus: 'CONVITE_ENVIADO',
      periodId: 'per-1',
      studentId: 'stu-4',
      student: { leadId: 'lead-4' },
    });

    await expect(transitionGate('inv-4', 'REMATRICULADO', 'user-1')).rejects.toThrow();
    expect(mockPrisma.reEnrollmentInvite.update).not.toHaveBeenCalled();
  });
});
