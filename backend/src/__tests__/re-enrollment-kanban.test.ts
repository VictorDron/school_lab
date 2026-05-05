import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
  reEnrollmentPeriod: {
    findUnique: vi.fn(),
  },
  reEnrollmentInvite: {
    groupBy: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock('../config/database.js', () => ({
  prisma: mockPrisma,
}));

import { getKanbanView } from '../services/re-enrollment-kanban.service.js';

const ONE_DAY = 24 * 60 * 60 * 1000;
const THIRTY_DAYS = 30 * ONE_DAY;

function periodEndingIn(days: number) {
  return {
    id: 'period-1',
    endDate: new Date(Date.now() + days * ONE_DAY),
  };
}

describe('getKanbanView: column aggregation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maps the 8 gate states into 6 pipeline columns + RECUSADO rail, preserving order', async () => {
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue(periodEndingIn(30));
    mockPrisma.reEnrollmentInvite.groupBy.mockResolvedValue([
      { gateStatus: 'CONVITE_ENVIADO', _count: { _all: 10 } },
      { gateStatus: 'FORMULARIO_CONFIRMADO', _count: { _all: 5 } },
      { gateStatus: 'DOCS_APROVADOS', _count: { _all: 3 } },
      { gateStatus: 'CONTRATO_PENDENTE', _count: { _all: 4 } },
      { gateStatus: 'CONTRATO_ASSINADO', _count: { _all: 2 } },
      { gateStatus: 'TAXA_PAGA', _count: { _all: 1 } },
      { gateStatus: 'REMATRICULADO', _count: { _all: 7 } },
      { gateStatus: 'RECUSADO', _count: { _all: 8 } },
    ]);
    mockPrisma.reEnrollmentInvite.findMany.mockResolvedValue([]);

    const result = await getKanbanView('period-1');

    expect(result.columns.map((c) => c.id)).toEqual([
      'CONVITE',
      'FORMULARIO',
      'DOCS',
      'CONTRATO',
      'PAGAMENTO',
      'CONCLUIDO',
      'RECUSADO',
    ]);

    const byId = Object.fromEntries(result.columns.map((c) => [c.id, c.count]));
    expect(byId).toEqual({
      CONVITE: 10,
      FORMULARIO: 5,
      DOCS: 3,
      // CONTRATO merges CONTRATO_PENDENTE (4) + CONTRATO_ASSINADO (2).
      CONTRATO: 6,
      PAGAMENTO: 1,
      CONCLUIDO: 7,
      RECUSADO: 8,
    });
  });

  it('returns zero-count columns in stable order when period has no invites', async () => {
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue(periodEndingIn(30));
    mockPrisma.reEnrollmentInvite.groupBy.mockResolvedValue([]);
    mockPrisma.reEnrollmentInvite.findMany.mockResolvedValue([]);

    const result = await getKanbanView('period-1');

    expect(result.columns).toHaveLength(7);
    expect(result.columns.every((c) => c.count === 0)).toBe(true);
    expect(result.cards).toEqual([]);
  });
});

describe('getKanbanView: card overdue flag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.reEnrollmentInvite.groupBy.mockResolvedValue([]);
  });

  it('marks a pipeline card overdue when extendedDeadline < now', async () => {
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue(periodEndingIn(30));
    mockPrisma.reEnrollmentInvite.findMany.mockResolvedValue([
      {
        id: 'inv-1',
        gateStatus: 'FORMULARIO_CONFIRMADO',
        updatedAt: new Date(),
        extendedDeadline: new Date(Date.now() - ONE_DAY),
        student: { fullName: 'Aluno Atrasado', grade: '5º Ano' },
      },
    ]);

    const { cards } = await getKanbanView('period-1');
    expect(cards[0].overdue).toBe(true);
  });

  it('falls back to period.endDate when extendedDeadline is null', async () => {
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue(periodEndingIn(-1));
    mockPrisma.reEnrollmentInvite.findMany.mockResolvedValue([
      {
        id: 'inv-2',
        gateStatus: 'CONVITE_ENVIADO',
        updatedAt: new Date(),
        extendedDeadline: null,
        student: { fullName: 'Aluno Sem Prorrogação', grade: null },
      },
    ]);

    const { cards } = await getKanbanView('period-1');
    expect(cards[0].overdue).toBe(true);
  });

  it('never flags terminal states as overdue', async () => {
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue(periodEndingIn(-10));
    mockPrisma.reEnrollmentInvite.findMany.mockResolvedValue([
      {
        id: 'inv-rem',
        gateStatus: 'REMATRICULADO',
        updatedAt: new Date(),
        extendedDeadline: null,
        student: { fullName: 'Rematrícula Concluída', grade: '3º Ano' },
      },
      {
        id: 'inv-rec',
        gateStatus: 'RECUSADO',
        updatedAt: new Date(),
        extendedDeadline: null,
        student: { fullName: 'Declinou', grade: '3º Ano' },
      },
    ]);

    const { cards } = await getKanbanView('period-1');
    expect(cards.find((c) => c.id === 'inv-rem')!.overdue).toBe(false);
    expect(cards.find((c) => c.id === 'inv-rec')!.overdue).toBe(false);
  });
});

describe('getKanbanView: hasAction flag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue(periodEndingIn(30));
    mockPrisma.reEnrollmentInvite.groupBy.mockResolvedValue([]);
  });

  it.each([
    ['FORMULARIO_CONFIRMADO', true],
    ['DOCS_APROVADOS', true],
    ['CONTRATO_ASSINADO', true],
    ['CONVITE_ENVIADO', false],
    ['CONTRATO_PENDENTE', false],
    ['TAXA_PAGA', false],
    ['REMATRICULADO', false],
    ['RECUSADO', false],
  ])('for %s, hasAction = %s', async (gateStatus, expected) => {
    mockPrisma.reEnrollmentInvite.findMany.mockResolvedValue([
      {
        id: 'inv-x',
        gateStatus,
        updatedAt: new Date(),
        extendedDeadline: null,
        student: { fullName: 'Aluno X', grade: '4º Ano' },
      },
    ]);

    const { cards } = await getKanbanView('period-1');
    expect(cards[0].hasAction).toBe(expected);
  });
});

describe('getKanbanView: 30-day auto-archive of REMATRICULADO', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue(periodEndingIn(30));
    mockPrisma.reEnrollmentInvite.groupBy.mockResolvedValue([]);
    mockPrisma.reEnrollmentInvite.findMany.mockResolvedValue([]);
  });

  it('applies the archive filter to both groupBy (counts) and findMany (cards)', async () => {
    await getKanbanView('period-1');

    const groupByCall = mockPrisma.reEnrollmentInvite.groupBy.mock.calls[0][0];
    const findManyCall = mockPrisma.reEnrollmentInvite.findMany.mock.calls[0][0];

    const expectArchiveFilter = (where: any) => {
      expect(where.periodId).toBe('period-1');
      expect(where.NOT.AND).toHaveLength(2);
      expect(where.NOT.AND[0]).toEqual({ gateStatus: 'REMATRICULADO' });
      expect(where.NOT.AND[1].rematriculadoAt).toBeDefined();
      expect(where.NOT.AND[1].rematriculadoAt.lt).toBeInstanceOf(Date);
      const cutoff = (where.NOT.AND[1].rematriculadoAt.lt as Date).getTime();
      const expected = Date.now() - THIRTY_DAYS;
      expect(Math.abs(cutoff - expected)).toBeLessThan(5_000);
    };

    expectArchiveFilter(groupByCall.where);
    expectArchiveFilter(findManyCall.where);
  });

  it('keeps REMATRICULADO rows with recent rematriculadoAt (stamped yesterday)', async () => {
    const yesterday = new Date(Date.now() - ONE_DAY);
    mockPrisma.reEnrollmentInvite.findMany.mockResolvedValue([
      {
        id: 'inv-fresh',
        gateStatus: 'REMATRICULADO',
        updatedAt: yesterday,
        extendedDeadline: null,
        student: { fullName: 'Concluída Ontem', grade: '2º Ano' },
      },
    ]);

    const { cards } = await getKanbanView('period-1');
    expect(cards).toHaveLength(1);
    expect(cards[0].columnId).toBe('CONCLUIDO');
  });
});

describe('getKanbanView: error paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws PERIOD_NOT_FOUND when the period does not exist', async () => {
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue(null);

    await expect(getKanbanView('missing-period')).rejects.toThrow();
    expect(mockPrisma.reEnrollmentInvite.groupBy).not.toHaveBeenCalled();
    expect(mockPrisma.reEnrollmentInvite.findMany).not.toHaveBeenCalled();
  });
});

describe('getKanbanView: card shape', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue(periodEndingIn(30));
    mockPrisma.reEnrollmentInvite.groupBy.mockResolvedValue([]);
  });

  it('returns only the fields the Kanban renders — no deep include leaks through', async () => {
    const updatedAt = new Date('2026-04-20T12:00:00.000Z');
    const periodEnd = new Date(Date.now() + 30 * ONE_DAY);
    mockPrisma.reEnrollmentPeriod.findUnique.mockResolvedValue({ id: 'period-1', endDate: periodEnd });
    mockPrisma.reEnrollmentInvite.findMany.mockResolvedValue([
      {
        id: 'inv-shape',
        gateStatus: 'FORMULARIO_CONFIRMADO',
        updatedAt,
        extendedDeadline: null,
        student: { fullName: 'Maria Silva', grade: '8º Ano' },
      },
    ]);

    const { cards } = await getKanbanView('period-1');
    expect(cards[0]).toEqual({
      id: 'inv-shape',
      columnId: 'FORMULARIO',
      studentName: 'Maria Silva',
      grade: '8º Ano',
      gateStatus: 'FORMULARIO_CONFIRMADO',
      overdue: false,
      hasAction: true,
      lastUpdatedAt: '2026-04-20T12:00:00.000Z',
      effectiveDeadline: periodEnd.toISOString(),
    });
    // Sanity: no leaked fields from the deeper Prisma selection.
    expect(Object.keys(cards[0]).sort()).toEqual(
      ['columnId', 'effectiveDeadline', 'gateStatus', 'grade', 'hasAction', 'id', 'lastUpdatedAt', 'overdue', 'studentName'],
    );
  });

  it('normalizes null grade to null (not undefined)', async () => {
    mockPrisma.reEnrollmentInvite.findMany.mockResolvedValue([
      {
        id: 'inv-no-grade',
        gateStatus: 'CONVITE_ENVIADO',
        updatedAt: new Date(),
        extendedDeadline: null,
        student: { fullName: 'Sem Série', grade: null },
      },
    ]);

    const { cards } = await getKanbanView('period-1');
    expect(cards[0].grade).toBeNull();
  });
});
