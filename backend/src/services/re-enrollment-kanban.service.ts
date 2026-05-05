import { prisma } from '../config/database.js';
import { createAppError } from '../lib/error-messages.js';

/**
 * Lean payload optimized for Kanban rendering. Avoid deep includes — only the
 * fields the board actually paints.
 */

export type ReEnrollmentGateStatus =
  | 'CONVITE_ENVIADO'
  | 'FORMULARIO_CONFIRMADO'
  | 'DOCS_APROVADOS'
  | 'CONTRATO_PENDENTE'
  | 'CONTRATO_ASSINADO'
  | 'TAXA_PAGA'
  | 'REMATRICULADO'
  | 'RECUSADO';

export type KanbanColumnKey =
  | 'CONVITE'
  | 'FORMULARIO'
  | 'DOCS'
  | 'CONTRATO'
  | 'PAGAMENTO'
  | 'CONCLUIDO'
  | 'RECUSADO';

const COLUMN_OF: Record<ReEnrollmentGateStatus, KanbanColumnKey> = {
  CONVITE_ENVIADO: 'CONVITE',
  FORMULARIO_CONFIRMADO: 'FORMULARIO',
  DOCS_APROVADOS: 'DOCS',
  CONTRATO_PENDENTE: 'CONTRATO',
  CONTRATO_ASSINADO: 'CONTRATO',
  TAXA_PAGA: 'PAGAMENTO',
  REMATRICULADO: 'CONCLUIDO',
  RECUSADO: 'RECUSADO',
};

/**
 * Stable column order rendered by the frontend. Final lane (RECUSADO) is
 * last so the frontend can place it after the pipeline separator.
 */
const COLUMN_ORDER: KanbanColumnKey[] = [
  'CONVITE',
  'FORMULARIO',
  'DOCS',
  'CONTRATO',
  'PAGAMENTO',
  'CONCLUIDO',
  'RECUSADO',
];

// TODO: hasAction should be role-scoped (Role[] or computed frontend-side
// from user role). Phase 0 uses a global flag as a known simplification —
// a secretary and a finance user see the same action indicator regardless
// of who's actually accountable for the next step.
const HAS_ACTION_GATES: Set<ReEnrollmentGateStatus> = new Set([
  'FORMULARIO_CONFIRMADO', // secretary: review submitted docs
  'DOCS_APROVADOS',        // admin: create renewal contract
  'CONTRATO_ASSINADO',     // finance: register enrollment-fee payment
]);

const ARCHIVE_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface KanbanColumnCount {
  id: KanbanColumnKey;
  count: number;
}

export interface KanbanCard {
  id: string;
  columnId: KanbanColumnKey;
  studentName: string;
  grade: string | null;
  gateStatus: ReEnrollmentGateStatus;
  overdue: boolean;
  hasAction: boolean;
  lastUpdatedAt: string;
  /** ISO timestamp — extendedDeadline if set, else period.endDate. */
  effectiveDeadline: string;
}

export interface KanbanViewPayload {
  columns: KanbanColumnCount[];
  cards: KanbanCard[];
}

/**
 * Archive filter: exclude REMATRICULADO invites whose rematriculadoAt is
 * older than 30 days. Rows with a null rematriculadoAt always pass (they
 * are not REMATRICULADO yet, or — defensively — were set via a path that
 * bypassed the central stamp).
 */
function archiveCutoff(): Date {
  return new Date(Date.now() - ARCHIVE_THRESHOLD_MS);
}

export async function getKanbanView(periodId: string): Promise<KanbanViewPayload> {
  const period = await prisma.reEnrollmentPeriod.findUnique({
    where: { id: periodId },
    select: { id: true, endDate: true },
  });
  if (!period) {
    throw createAppError('PERIOD_NOT_FOUND');
  }

  const archiveBefore = archiveCutoff();

  // Shared filter — keep it in one place so counts and cards stay aligned.
  // "Exclude rows that are both REMATRICULADO AND older than archive cutoff."
  const baseWhere = {
    periodId,
    NOT: {
      AND: [
        { gateStatus: 'REMATRICULADO' as const },
        { rematriculadoAt: { lt: archiveBefore } },
      ],
    },
  };

  const [gateCounts, invites] = await Promise.all([
    prisma.reEnrollmentInvite.groupBy({
      by: ['gateStatus'],
      where: baseWhere,
      _count: { _all: true },
    }),
    prisma.reEnrollmentInvite.findMany({
      where: baseWhere,
      select: {
        id: true,
        gateStatus: true,
        updatedAt: true,
        extendedDeadline: true,
        student: { select: { fullName: true, grade: true } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  const columns = aggregateColumns(gateCounts);
  const now = Date.now();
  const periodEndMs = period.endDate.getTime();

  const cards: KanbanCard[] = invites.map((inv) => {
    const gateStatus = inv.gateStatus as ReEnrollmentGateStatus;
    const columnId = COLUMN_OF[gateStatus];
    const deadlineMs = inv.extendedDeadline?.getTime() ?? periodEndMs;
    const isTerminal = gateStatus === 'REMATRICULADO' || gateStatus === 'RECUSADO';
    return {
      id: inv.id,
      columnId,
      studentName: inv.student.fullName,
      grade: inv.student.grade ?? null,
      gateStatus,
      overdue: !isTerminal && deadlineMs < now,
      hasAction: HAS_ACTION_GATES.has(gateStatus),
      lastUpdatedAt: inv.updatedAt.toISOString(),
      effectiveDeadline: new Date(deadlineMs).toISOString(),
    };
  });

  return { columns, cards };
}

function aggregateColumns(
  gateCounts: Array<{ gateStatus: string; _count: { _all: number } }>,
): KanbanColumnCount[] {
  const totals = new Map<KanbanColumnKey, number>();
  for (const key of COLUMN_ORDER) {
    totals.set(key, 0);
  }
  for (const row of gateCounts) {
    const col = COLUMN_OF[row.gateStatus as ReEnrollmentGateStatus];
    if (!col) continue;
    totals.set(col, (totals.get(col) ?? 0) + row._count._all);
  }
  return COLUMN_ORDER.map((id) => ({ id, count: totals.get(id) ?? 0 }));
}
