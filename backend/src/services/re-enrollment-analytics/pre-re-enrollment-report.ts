import { prisma } from '../../config/database.js';
import { countByStatus, toNumReport } from './shared.js';
import type { GradeBreakdown, PreReEnrollmentReportData } from './types.js';

/**
 * Pre-rematrícula adhesion report. The "average effective adjustment"
 * captures both AGREED responses (which take the communicated %) and
 * NEGOTIATED responses (back-solving the % from the negotiated final
 * value vs. base value). Refusals and non-responses don't move the
 * average — only families who actually committed.
 */
export async function getPreReEnrollmentReport(
  periodId: string,
): Promise<PreReEnrollmentReportData> {
  const period = await prisma.reEnrollmentPeriod.findUnique({
    where: { id: periodId },
    select: { id: true, name: true },
  });

  if (!period) {
    throw new Error('PERIOD_NOT_FOUND');
  }

  const responses = await prisma.preReEnrollmentResponse.findMany({
    where: { periodId },
    include: {
      student: { select: { grade: true } },
    },
  });

  const total = responses.length;
  const counts = countByStatus(responses);

  const adhesionRate =
    total > 0 ? ((counts.agreed + counts.negotiated) / total) * 100 : 0;

  const effectiveAdjustments: number[] = [];

  for (const r of responses) {
    if (r.status === 'AGREED') {
      const adj = toNumReport(r.communicatedAdjustmentPercent);
      if (adj != null) {
        effectiveAdjustments.push(adj);
      }
    } else if (r.status === 'NEGOTIATED') {
      const communicated = toNumReport(r.communicatedAnnualValue);
      const adjPercent = toNumReport(r.communicatedAdjustmentPercent);
      const negotiatedFinal = toNumReport(r.negotiatedFinalValue);

      if (communicated != null && adjPercent != null && negotiatedFinal != null) {
        const baseValue = communicated / (1 + adjPercent / 100);
        const effectiveAdj = ((negotiatedFinal - baseValue) / baseValue) * 100;
        effectiveAdjustments.push(effectiveAdj);
      }
    }
  }

  const averageEffectiveAdjustment =
    effectiveAdjustments.length > 0
      ? effectiveAdjustments.reduce((sum, v) => sum + v, 0) /
        effectiveAdjustments.length
      : 0;

  const gradeMap = new Map<string, Array<{ status: string }>>();

  for (const r of responses) {
    const grade = (r.student as { grade: string | null })?.grade ?? 'Sem série';
    if (!gradeMap.has(grade)) {
      gradeMap.set(grade, []);
    }
    gradeMap.get(grade)!.push({ status: r.status });
  }

  const byGrade: GradeBreakdown[] = [];
  for (const [grade, gradeResponses] of gradeMap) {
    const gradeCounts = countByStatus(gradeResponses);
    byGrade.push({
      grade,
      total: gradeResponses.length,
      ...gradeCounts,
    });
  }

  byGrade.sort((a, b) => a.grade.localeCompare(b.grade, 'pt-BR'));

  return {
    periodId: period.id,
    periodName: period.name,
    total,
    ...counts,
    adhesionRate,
    averageEffectiveAdjustment,
    byGrade,
  };
}
