import { prisma } from '../../config/database.js';
import { pct } from './shared.js';
import type { VisitStats, VivenciaStats } from './types.js';

/**
 * Vivência (trial day) attendance + downstream evaluation outcomes.
 * Two parallel groupBys — events bucket the schedule status, evaluations
 * bucket the academic decision afterwards.
 */
export async function fetchVivencia(): Promise<VivenciaStats> {
  const [events, evaluations] = await Promise.all([
    prisma.crmEvent.groupBy({
      by: ['vivenciaStatus'],
      where: { eventType: 'VIVENCIA' },
      _count: { id: true },
    }),
    prisma.experienceEvaluation.groupBy({
      by: ['decision'],
      _count: { id: true },
    }),
  ]);

  const evMap = new Map(events.map((e) => [e.vivenciaStatus ?? 'null', e._count.id]));
  const total = events.reduce((sum, e) => sum + e._count.id, 0);
  const completed = evMap.get('COMPLETED') ?? 0;
  const cancelled = evMap.get('CANCELLED') ?? 0;
  const noShow = evMap.get('NO_SHOW') ?? 0;
  const scheduled = evMap.get('SCHEDULED') ?? 0;

  const evDecisionMap = new Map(evaluations.map((e) => [e.decision, e._count.id]));
  const evalTotal = evaluations.reduce((sum, e) => sum + e._count.id, 0);
  const evalApproved = evDecisionMap.get('APPROVED') ?? 0;
  const evalRejected = evDecisionMap.get('REJECTED') ?? 0;
  const evalPending = evDecisionMap.get('PENDING') ?? 0;

  return {
    total,
    completed,
    cancelled,
    noShow,
    scheduled,
    attendanceRate: pct(completed, total),
    evaluations: {
      total: evalTotal,
      approved: evalApproved,
      rejected: evalRejected,
      pending: evalPending,
      approvalRate: pct(evalApproved, evalTotal),
    },
  };
}

export async function fetchVisits(): Promise<VisitStats> {
  const events = await prisma.crmEvent.groupBy({
    by: ['visitStatus'],
    where: { eventType: 'VISIT' },
    _count: { id: true },
  });

  const evMap = new Map(events.map((e) => [e.visitStatus ?? 'null', e._count.id]));
  const total = events.reduce((sum, e) => sum + e._count.id, 0);
  const completed = evMap.get('COMPLETED') ?? 0;
  const cancelled = evMap.get('CANCELLED') ?? 0;
  const noShow = evMap.get('NO_SHOW') ?? 0;
  const scheduled = evMap.get('SCHEDULED') ?? 0;

  return {
    total,
    completed,
    cancelled,
    noShow,
    scheduled,
    completionRate: pct(completed, total),
  };
}
