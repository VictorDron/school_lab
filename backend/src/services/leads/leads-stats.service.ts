import { LeadSource } from '@prisma/client';
import { prisma } from '../../config/database.js';

export async function getOverviewStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const excludeImport = { source: { not: 'IMPORT' as LeadSource } };

  const [byColumn, bySource, total, flagged, thisMonth, thisWeek, columns] =
    await Promise.all([
      prisma.lead.groupBy({
        by: ['columnId'],
        _count: { id: true },
        where: excludeImport,
      }),
      prisma.lead.groupBy({
        by: ['source'],
        _count: { id: true },
        where: excludeImport,
      }),
      prisma.lead.count({ where: excludeImport }),
      prisma.lead.count({ where: { ...excludeImport, isFlagged: true } }),
      prisma.lead.count({
        where: { ...excludeImport, createdAt: { gte: startOfMonth } },
      }),
      prisma.lead.count({
        where: { ...excludeImport, createdAt: { gte: startOfWeek } },
      }),
      prisma.kanbanColumn.findMany({ orderBy: { order: 'asc' } }),
    ]);

  const columnMap = new Map(columns.map((c) => [c.id, c]));
  const byColumnWithInfo = byColumn.map((c) => ({
    columnId: c.columnId,
    column: columnMap.get(c.columnId),
    count: c._count.id,
  }));

  return {
    total,
    flagged,
    thisMonth,
    thisWeek,
    byColumn: byColumnWithInfo,
    bySource: bySource.map((s) => ({ source: s.source, count: s._count.id })),
  };
}

export async function getPipelineStats() {
  const [columns, leadsByColumn] = await Promise.all([
    prisma.kanbanColumn.findMany({ orderBy: { order: 'asc' } }),
    prisma.lead.groupBy({
      by: ['columnId'],
      _count: { id: true },
      where: { source: { not: 'IMPORT' as LeadSource } },
    }),
  ]);

  const countMap = new Map(leadsByColumn.map((r) => [r.columnId, r._count.id]));

  const pipeline = columns.map((col) => ({
    columnId: col.id,
    name: col.name,
    slug: col.slug,
    color: col.color,
    isFinal: col.isFinal,
    count: countMap.get(col.id) ?? 0,
  }));

  const nonFinalPipeline = pipeline.filter((p) => !p.isFinal);
  const conversions = nonFinalPipeline.slice(0, -1).map((stage, index) => {
    const nextStage = nonFinalPipeline[index + 1];
    const rate =
      stage.count > 0
        ? Math.min(100, Math.round((nextStage.count / stage.count) * 100))
        : 0;
    return {
      from: { columnId: stage.columnId, name: stage.name },
      to: { columnId: nextStage.columnId, name: nextStage.name },
      rate,
    };
  });

  return {
    pipeline,
    conversions,
    total: pipeline.reduce((sum, s) => sum + s.count, 0),
  };
}
