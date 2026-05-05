import { vi, describe, it, expect, beforeEach } from 'vitest';

const prismaMock = vi.hoisted(() => {
  return {
    reEnrollmentInvite: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    preReEnrollmentResponse: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    reEnrollmentPeriod: {
      findUnique: vi.fn(),
    },
  };
});

vi.mock('../config/database.js', () => ({ prisma: prismaMock }));

import { getFunnelData, getBottleneckAnalysis } from '../services/re-enrollment-analytics.service.js';

const PERIOD_ID = 'period-funnel-1';

describe('re-enrollment-funnel.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFunnelData', () => {
    it('should return all funnel stages with counts from PreReEnrollmentResponse and ReEnrollmentInvite', async () => {
      prismaMock.preReEnrollmentResponse.count
        .mockResolvedValueOnce(30) // AGREED or NEGOTIATED
        .mockResolvedValueOnce(10); // PENDING

      prismaMock.reEnrollmentInvite.groupBy.mockResolvedValue([
        { gateStatus: 'CONVITE_ENVIADO', _count: { _all: 15 } },
        { gateStatus: 'FORMULARIO_CONFIRMADO', _count: { _all: 10 } },
        { gateStatus: 'CONTRATO_ASSINADO', _count: { _all: 8 } },
        { gateStatus: 'TAXA_PAGA', _count: { _all: 5 } },
        { gateStatus: 'REMATRICULADO', _count: { _all: 2 } },
      ]);

      prismaMock.reEnrollmentInvite.count.mockResolvedValue(40);

      prismaMock.reEnrollmentInvite.findMany.mockResolvedValue([]);

      const result = await getFunnelData(PERIOD_ID);

      expect(result.funnelStages).toHaveLength(6);
      expect(result.funnelStages[0].name).toBe('Pré-rematrícula (responderam)');
      expect(result.funnelStages[0].count).toBe(30);
      expect(result.funnelStages[1].name).toBe('Pré-rematrícula (não responderam)');
      expect(result.funnelStages[1].count).toBe(10);
      expect(result.funnelStages[2].name).toBe('Cadastro atualizado');
      expect(result.funnelStages[3].name).toBe('Contrato assinado');
      expect(result.funnelStages[4].name).toBe('Taxa paga');
      expect(result.funnelStages[5].name).toBe('Concluído');
      expect(result.funnelStages[5].count).toBe(2);
    });

    it('should calculate percentage relative to total invites in period', async () => {
      prismaMock.preReEnrollmentResponse.count
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(5);

      prismaMock.reEnrollmentInvite.groupBy.mockResolvedValue([
        { gateStatus: 'CONVITE_ENVIADO', _count: { _all: 10 } },
        { gateStatus: 'FORMULARIO_CONFIRMADO', _count: { _all: 8 } },
        { gateStatus: 'CONTRATO_ASSINADO', _count: { _all: 5 } },
        { gateStatus: 'TAXA_PAGA', _count: { _all: 3 } },
        { gateStatus: 'REMATRICULADO', _count: { _all: 4 } },
      ]);

      prismaMock.reEnrollmentInvite.count.mockResolvedValue(30);
      prismaMock.reEnrollmentInvite.findMany.mockResolvedValue([]);

      const result = await getFunnelData(PERIOD_ID);

      // Percentage relative to total invites (30)
      expect(result.funnelStages[5].percentage).toBeCloseTo(13.33, 1); // 4/30 * 100
      expect(result.funnelStages[0].percentage).toBeCloseTo(66.67, 1); // 20/30 * 100
    });

    it('should compute avgDaysInStage using date diffs', async () => {
      prismaMock.preReEnrollmentResponse.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(0);

      prismaMock.reEnrollmentInvite.groupBy.mockResolvedValue([
        { gateStatus: 'FORMULARIO_CONFIRMADO', _count: { _all: 3 } },
        { gateStatus: 'REMATRICULADO', _count: { _all: 2 } },
      ]);

      prismaMock.reEnrollmentInvite.count.mockResolvedValue(5);

      // Invites with timestamps for avg calculation
      prismaMock.reEnrollmentInvite.findMany.mockResolvedValue([
        {
          sentAt: new Date('2026-01-01'),
          confirmedAt: new Date('2026-01-04'), // 3 days
          gateStatus: 'FORMULARIO_CONFIRMADO',
          feePayment: null,
        },
        {
          sentAt: new Date('2026-01-01'),
          confirmedAt: new Date('2026-01-06'), // 5 days
          gateStatus: 'REMATRICULADO',
          feePayment: { createdAt: new Date('2026-01-10') },
        },
      ]);

      const result = await getFunnelData(PERIOD_ID);

      // CONVITE_ENVIADO -> FORMULARIO_CONFIRMADO avg: (3+5)/2 = 4
      const cadastroStage = result.funnelStages.find(s => s.name === 'Cadastro atualizado');
      expect(cadastroStage?.avgDaysInStage).toBe(4);
    });

    it('should return zero counts for empty period', async () => {
      prismaMock.preReEnrollmentResponse.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      prismaMock.reEnrollmentInvite.groupBy.mockResolvedValue([]);
      prismaMock.reEnrollmentInvite.count.mockResolvedValue(0);
      prismaMock.reEnrollmentInvite.findMany.mockResolvedValue([]);

      const result = await getFunnelData(PERIOD_ID);

      expect(result.funnelStages).toHaveLength(6);
      for (const stage of result.funnelStages) {
        expect(stage.count).toBe(0);
        expect(stage.percentage).toBe(0);
      }
    });
  });

  describe('getBottleneckAnalysis', () => {
    it('should flag stages with > 40% of active invites as bottleneck', async () => {
      prismaMock.reEnrollmentInvite.groupBy.mockResolvedValue([
        { gateStatus: 'CONVITE_ENVIADO', _count: { _all: 50 } },
        { gateStatus: 'FORMULARIO_CONFIRMADO', _count: { _all: 5 } },
        { gateStatus: 'CONTRATO_ASSINADO', _count: { _all: 3 } },
        { gateStatus: 'TAXA_PAGA', _count: { _all: 2 } },
        { gateStatus: 'REMATRICULADO', _count: { _all: 10 } },
      ]);

      prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue({
        id: PERIOD_ID,
        endDate: new Date('2026-06-01'),
      });

      prismaMock.reEnrollmentInvite.findMany.mockResolvedValue([]);

      const result = await getBottleneckAnalysis(PERIOD_ID);

      // Active (non-REMATRICULADO) = 60, CONVITE_ENVIADO = 50 = 83% > 40%
      const conviteStage = result.bottlenecks.find(b => b.stageName === 'Convite Enviado');
      expect(conviteStage?.isBottleneck).toBe(true);
      expect(conviteStage?.percentage).toBeCloseTo(83.33, 0);

      // FORMULARIO_CONFIRMADO = 5/60 = 8.3% < 40%
      const formStage = result.bottlenecks.find(b => b.stageName === 'Formulário Confirmado');
      expect(formStage?.isBottleneck).toBe(false);
    });

    it('should return overdue invites past period endDate that are not REMATRICULADO', async () => {
      prismaMock.reEnrollmentInvite.groupBy.mockResolvedValue([
        { gateStatus: 'CONVITE_ENVIADO', _count: { _all: 5 } },
        { gateStatus: 'REMATRICULADO', _count: { _all: 2 } },
      ]);

      prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue({
        id: PERIOD_ID,
        endDate: new Date('2026-01-01'), // past
      });

      prismaMock.reEnrollmentInvite.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          gateStatus: 'CONVITE_ENVIADO',
          extendedDeadline: null,
          student: {
            child: { fullName: 'Ana Silva' },
            grade: '5th Grade',
          },
        },
        {
          id: 'inv-2',
          gateStatus: 'FORMULARIO_CONFIRMADO',
          extendedDeadline: new Date('2026-02-01'), // also past
          student: {
            child: { fullName: 'Pedro Santos' },
            grade: '3rd Grade',
          },
        },
      ]);

      const result = await getBottleneckAnalysis(PERIOD_ID);

      expect(result.overdueInvites).toHaveLength(2);
      expect(result.overdueInvites[0].studentName).toBe('Ana Silva');
      expect(result.overdueInvites[0].grade).toBe('5th Grade');
      expect(result.overdueInvites[0].currentStage).toBe('CONVITE_ENVIADO');
      expect(result.overdueInvites[0].daysOverdue).toBeGreaterThan(0);
      expect(result.overdueInvites[1].studentName).toBe('Pedro Santos');
    });

    it('should return empty bottlenecks and overdue for empty period', async () => {
      prismaMock.reEnrollmentInvite.groupBy.mockResolvedValue([]);

      prismaMock.reEnrollmentPeriod.findUnique.mockResolvedValue({
        id: PERIOD_ID,
        endDate: new Date('2027-06-01'), // future
      });

      prismaMock.reEnrollmentInvite.findMany.mockResolvedValue([]);

      const result = await getBottleneckAnalysis(PERIOD_ID);

      expect(result.bottlenecks).toHaveLength(0);
      expect(result.overdueInvites).toHaveLength(0);
    });
  });
});
