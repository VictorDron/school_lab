import { prisma } from '../../config/database.js';
import { EXCLUDE_IMPORT, FUNNEL_STAGES, pct } from './shared.js';
import type { BySourceRow, ByGradeRow, FunnelStage, MonthlyTrendRow } from './types.js';

export async function fetchSummary(
  startOfThisMonth: Date,
  startOfLastMonth: Date,
  endOfLastMonth: Date,
  startOfWeek: Date,
  startOfToday: Date,
) {
  const [
    total,
    thisMonth,
    lastMonth,
    thisWeek,
    today,
    enrolled,
    enrolledThisMonth,
    rejected,
    inProgress,
  ] = await Promise.all([
    prisma.lead.count({ where: EXCLUDE_IMPORT }),
    prisma.lead.count({ where: { ...EXCLUDE_IMPORT, createdAt: { gte: startOfThisMonth } } }),
    prisma.lead.count({ where: { ...EXCLUDE_IMPORT, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    prisma.lead.count({ where: { ...EXCLUDE_IMPORT, createdAt: { gte: startOfWeek } } }),
    prisma.lead.count({ where: { ...EXCLUDE_IMPORT, createdAt: { gte: startOfToday } } }),
    prisma.lead.count({ where: { ...EXCLUDE_IMPORT, admissionGateStatus: 'ENROLLED' } }),
    prisma.lead.count({
      where: {
        ...EXCLUDE_IMPORT,
        admissionGateStatus: 'ENROLLED',
        createdAt: { gte: startOfThisMonth },
      },
    }),
    prisma.lead.count({ where: { ...EXCLUDE_IMPORT, admissionGateStatus: 'REJECTED' } }),
    prisma.lead.count({
      where: {
        ...EXCLUDE_IMPORT,
        admissionGateStatus: {
          notIn: ['ENROLLED', 'REJECTED', 'NOT_STARTED'],
        },
      },
    }),
  ]);

  return {
    total,
    thisMonth,
    lastMonth,
    thisWeek,
    today,
    enrolled,
    enrolledThisMonth,
    rejected,
    inProgress,
    conversionRate: pct(enrolled, total),
  };
}

/**
 * Macro-stage funnel built from a single groupBy on admissionGateStatus.
 * Each stage's "converted" count is the next stage's count — produces a
 * cumulative drop-off view.
 */
export async function fetchFunnel(): Promise<FunnelStage[]> {
  const grouped = await prisma.lead.groupBy({
    by: ['admissionGateStatus'],
    _count: { id: true },
    where: EXCLUDE_IMPORT,
  });

  const countByGate = new Map<string, number>(
    grouped.map((g) => [g.admissionGateStatus, g._count.id]),
  );

  const stageCounts = FUNNEL_STAGES.map((stage) => {
    const count = stage.gates.reduce(
      (sum, gate) => sum + (countByGate.get(gate) ?? 0),
      0,
    );
    return { ...stage, count };
  });

  return stageCounts.map((stage, index) => {
    const nextCount = index < stageCounts.length - 1 ? stageCounts[index + 1].count : 0;
    return {
      stage: stage.stage,
      label: stage.label,
      count: stage.count,
      converted: nextCount,
      conversionRate: pct(nextCount, stage.count),
    };
  });
}

export async function fetchBySource(): Promise<BySourceRow[]> {
  const [grouped, enrolledBySource, rejectedBySource] = await Promise.all([
    prisma.lead.groupBy({ by: ['source'], _count: { id: true }, where: EXCLUDE_IMPORT }),
    prisma.lead.groupBy({
      by: ['source'],
      _count: { id: true },
      where: { ...EXCLUDE_IMPORT, admissionGateStatus: 'ENROLLED' },
    }),
    prisma.lead.groupBy({
      by: ['source'],
      _count: { id: true },
      where: { ...EXCLUDE_IMPORT, admissionGateStatus: 'REJECTED' },
    }),
  ]);

  const enrolledMap = new Map(enrolledBySource.map((r) => [r.source, r._count.id]));
  const rejectedMap = new Map(rejectedBySource.map((r) => [r.source, r._count.id]));

  return grouped.map((row) => {
    const count = row._count.id;
    const enrolled = enrolledMap.get(row.source) ?? 0;
    const rejected = rejectedMap.get(row.source) ?? 0;
    return {
      source: row.source,
      count,
      enrolled,
      rejected,
      conversionRate: pct(enrolled, count),
    };
  });
}

export async function fetchByGrade(): Promise<ByGradeRow[]> {
  const [grouped, enrolledChildren] = await Promise.all([
    prisma.leadChild.groupBy({
      by: ['desiredGrade'],
      where: { isApplicant: true, desiredGrade: { not: null }, lead: EXCLUDE_IMPORT },
      _count: { id: true },
    }),
    prisma.leadChild.findMany({
      where: {
        isApplicant: true,
        desiredGrade: { not: null },
        lead: { ...EXCLUDE_IMPORT, admissionGateStatus: 'ENROLLED' },
      },
      select: { desiredGrade: true },
    }),
  ]);

  const enrolledCountByGrade = new Map<string, number>();
  for (const child of enrolledChildren) {
    if (child.desiredGrade) {
      enrolledCountByGrade.set(
        child.desiredGrade,
        (enrolledCountByGrade.get(child.desiredGrade) ?? 0) + 1,
      );
    }
  }

  return grouped
    .map((row) => {
      const grade = row.desiredGrade ?? 'Unknown';
      const count = row._count.id;
      const enrolled = enrolledCountByGrade.get(grade) ?? 0;
      return {
        grade,
        count,
        enrolled,
        conversionRate: pct(enrolled, count),
      };
    })
    .sort((a, b) => b.count - a.count);
}

/**
 * 12-month rolling time series. Uses raw SQL for date_trunc since Prisma's
 * groupBy can't bucket by month directly. Three parallel queries (created /
 * enrolled / rejected) joined client-side by month key.
 */
export async function fetchMonthlyTrend(): Promise<MonthlyTrendRow[]> {
  type RawMonthRow = { month: Date; count: bigint };

  const [createdRaw, enrolledRaw, rejectedRaw] = await Promise.all([
    prisma.$queryRaw<RawMonthRow[]>`
      SELECT date_trunc('month', "createdAt") AS month, COUNT(*) AS count
      FROM "Lead"
      WHERE "createdAt" >= NOW() - INTERVAL '12 months'
        AND "source" != 'IMPORT'
      GROUP BY month
      ORDER BY month
    `,
    prisma.$queryRaw<RawMonthRow[]>`
      SELECT date_trunc('month', "createdAt") AS month, COUNT(*) AS count
      FROM "Lead"
      WHERE "createdAt" >= NOW() - INTERVAL '12 months'
        AND "admissionGateStatus" = 'ENROLLED'
        AND "source" != 'IMPORT'
      GROUP BY month
      ORDER BY month
    `,
    prisma.$queryRaw<RawMonthRow[]>`
      SELECT date_trunc('month', "createdAt") AS month, COUNT(*) AS count
      FROM "Lead"
      WHERE "createdAt" >= NOW() - INTERVAL '12 months'
        AND "admissionGateStatus" = 'REJECTED'
        AND "source" != 'IMPORT'
      GROUP BY month
      ORDER BY month
    `,
  ]);

  const toKey = (d: Date) => d.toISOString().substring(0, 7);

  const enrolledMap = new Map(enrolledRaw.map((r) => [toKey(r.month), Number(r.count)]));
  const rejectedMap = new Map(rejectedRaw.map((r) => [toKey(r.month), Number(r.count)]));

  return createdRaw.map((row) => {
    const key = toKey(row.month);
    return {
      month: key,
      created: Number(row.count),
      enrolled: enrolledMap.get(key) ?? 0,
      rejected: rejectedMap.get(key) ?? 0,
    };
  });
}
