import { prisma } from '../../config/database.js';
import { EXCLUDE_IMPORT, pct } from './shared.js';
import type { DemographicsStats, DepartmentRow, DocumentStats } from './types.js';

/**
 * Approval throughput per department. APPROVED + CONDITIONAL count toward
 * "approved" since both unblock the gate; ESCALATED falls into "pending"
 * because someone still needs to act on it.
 */
export async function fetchDepartmentPerformance(): Promise<DepartmentRow[]> {
  const [grouped, decisionTimes] = await Promise.all([
    prisma.admissionGateApproval.groupBy({
      by: ['department', 'decision'],
      _count: { id: true },
    }),
    prisma.$queryRaw<{ department: string; avg_days: number }[]>`
      SELECT department,
             AVG(EXTRACT(EPOCH FROM ("decidedAt" - "createdAt")) / 86400.0) AS avg_days
      FROM "AdmissionGateApproval"
      WHERE "decidedAt" IS NOT NULL
      GROUP BY department
    `,
  ]);

  const avgMap = new Map(decisionTimes.map((r) => [r.department, Number(r.avg_days ?? 0)]));

  const deptMap = new Map<
    string,
    { total: number; approved: number; rejected: number; pending: number }
  >();

  for (const row of grouped) {
    const dept = row.department;
    if (!deptMap.has(dept)) {
      deptMap.set(dept, { total: 0, approved: 0, rejected: 0, pending: 0 });
    }
    const entry = deptMap.get(dept)!;
    entry.total += row._count.id;
    if (row.decision === 'APPROVED' || row.decision === 'CONDITIONAL') {
      entry.approved += row._count.id;
    } else if (row.decision === 'REJECTED') {
      entry.rejected += row._count.id;
    } else {
      // PENDING, ESCALATED
      entry.pending += row._count.id;
    }
  }

  return Array.from(deptMap.entries()).map(([department, counts]) => ({
    department,
    total: counts.total,
    approved: counts.approved,
    rejected: counts.rejected,
    pending: counts.pending,
    avgDecisionDays: Math.round((avgMap.get(department) ?? 0) * 10) / 10,
  }));
}

export async function fetchDocuments(): Promise<DocumentStats> {
  const grouped = await prisma.leadEnrollmentDocument.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  const dMap = new Map(grouped.map((r) => [r.status, r._count.id]));
  const totalRequested = grouped.reduce((sum, r) => sum + r._count.id, 0);
  const approved = dMap.get('APPROVED') ?? 0;
  const rejected = dMap.get('REJECTED') ?? 0;
  const pending = dMap.get('PENDING') ?? 0;

  return {
    totalRequested,
    approved,
    rejected,
    pending,
    completionRate: pct(approved, totalRequested),
  };
}

/**
 * Applicant demographics — siblings, special needs, student type, and top-5
 * nationalities. Filters to applicant children only (siblings live as
 * non-applicant rows on the same lead).
 */
export async function fetchDemographics(): Promise<DemographicsStats> {
  const [
    totalChildren,
    totalLeads,
    withSiblings,
    withSpecialNeeds,
    byStudentType,
    nationalities,
  ] = await Promise.all([
    prisma.leadChild.count({ where: { isApplicant: true, lead: EXCLUDE_IMPORT } }),
    prisma.lead.count({ where: EXCLUDE_IMPORT }),
    prisma.lead.count({ where: { ...EXCLUDE_IMPORT, hasSiblingsAtSchool: true } }),
    prisma.leadChild.count({
      where: {
        isApplicant: true,
        specialNeeds: { not: null },
        NOT: { specialNeeds: '' },
        lead: EXCLUDE_IMPORT,
      },
    }),
    prisma.leadChild.groupBy({
      by: ['studentType'],
      where: { isApplicant: true, studentType: { not: null }, lead: EXCLUDE_IMPORT },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.leadChild.groupBy({
      by: ['nationality'],
      where: { isApplicant: true, nationality: { not: null }, lead: EXCLUDE_IMPORT },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
  ]);

  return {
    totalChildren,
    avgChildrenPerFamily: totalLeads > 0 ? Math.round((totalChildren / totalLeads) * 10) / 10 : 0,
    withSiblings,
    withSpecialNeeds,
    byStudentType: byStudentType.map((r) => ({
      type: r.studentType ?? 'UNKNOWN',
      count: r._count.id,
    })),
    topNationalities: nationalities.map((r) => ({
      nationality: r.nationality ?? 'Unknown',
      count: r._count.id,
    })),
  };
}
