import { prisma } from '../../config/database.js';
import { createAppError } from '../../lib/error-messages.js';
import {
  calculateProposedValue,
  getFinancialStatus,
} from '../period-pricing.service.js';
import { toNum } from './shared.js';
import type {
  BuildOptions,
  PreReEnrollmentDashboard,
  PriceTableEntry,
  StudentBuildResult,
  StudentPriceCalculation,
  StudentRaw,
} from './types.js';

/**
 * Compute one student's row for the pricing dashboard. The function is
 * exported separately because the test suite drives it directly with
 * pre-built maps — keeping it pure (no Prisma calls) makes the unit
 * tests cheap and deterministic.
 */
export function buildStudentPriceCalculation(
  s: StudentRaw,
  options: BuildOptions,
): StudentBuildResult {
  const { priceMap, exceptionMap, adjustmentPercent } = options;

  const contract = s.lead?.contracts?.[0] ?? null;
  const payments = contract?.payments ?? [];
  const financialStatus = s.lead ? getFinancialStatus(payments) : ('SEM_CONTRATO' as const);

  const bucket: 'adimplente' | 'inadimplente' | 'semContrato' =
    financialStatus === 'ADIMPLENTE'
      ? 'adimplente'
      : financialStatus === 'INADIMPLENTE'
      ? 'inadimplente'
      : 'semContrato';

  const currentAnnualValue = contract ? toNum(contract.totalAnnualValue) : null;
  const priceEntry = s.grade ? priceMap.get(s.grade) : null;
  const baseAnnualValue = priceEntry?.baseAnnualValue ?? null;
  const exception = exceptionMap.get(s.id);
  const hasException = !!exception;

  let proposedAnnualValue: number | null = null;
  let finalAnnualValue: number | null = null;
  let monthlyValue: number | null = null;

  if (baseAnnualValue != null) {
    const calc = calculateProposedValue({
      baseAnnualValue,
      adjustmentPercent,
      exception: hasException
        ? {
            overrideAnnualValue: exception!.overrideAnnualValue,
            overrideDiscountPercent: exception!.overrideDiscountPercent,
          }
        : undefined,
    });
    proposedAnnualValue = calc.proposedValue;
    finalAnnualValue = calc.finalValue;
    monthlyValue = calc.monthlyValue;
  }

  const row: StudentPriceCalculation = {
    studentId: s.id,
    studentName: s.child?.fullName ?? s.fullName,
    studentCode: s.code,
    grade: s.grade,
    academicStatus: s.status === 'ACTIVE' ? 'Regular' : s.status,
    financialStatus,
    currentAnnualValue,
    baseAnnualValue,
    adjustmentPercent,
    proposedAnnualValue,
    hasException,
    exceptionId: (exception as { id?: string } | undefined)?.id ?? null,
    exceptionJustification: exception?.justification ?? null,
    exceptionOverrideAnnualValue: exception?.overrideAnnualValue ?? null,
    exceptionOverrideDiscountPercent: exception?.overrideDiscountPercent ?? null,
    finalAnnualValue,
    monthlyValue,
  };

  return { row, bucket, hasException };
}

/**
 * Aggregate dashboard for a re-enrollment period: pulls eligible students
 * (filtered by grade and prior-year academic year), the period's price
 * table, and any FamilyPriceException overrides — then runs every
 * student through buildStudentPriceCalculation in memory.
 */
export async function getDashboardData(
  periodId: string,
): Promise<PreReEnrollmentDashboard> {
  const period = await prisma.reEnrollmentPeriod.findUnique({
    where: { id: periodId },
    select: {
      id: true,
      name: true,
      status: true,
      adjustmentPercent: true,
      eligibleGrades: true,
      targetYear: true,
      discountOptions: true,
    },
  });

  if (!period) {
    throw createAppError('PERIOD_NOT_FOUND');
  }

  const [priceTableRaw, studentsRaw, exceptionsRaw] = await Promise.all([
    prisma.periodPriceTable.findMany({
      where: { periodId },
      orderBy: { grade: 'asc' },
    }),
    prisma.student.findMany({
      where: {
        status: 'ACTIVE',
        academicYear: period.targetYear - 1,
        grade: { in: period.eligibleGrades },
      },
      include: {
        lead: {
          select: {
            id: true,
            familyName: true,
            contracts: {
              where: { status: { in: ['ACTIVE', 'SIGNED'] } },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                status: true,
                totalAnnualValue: true,
                payments: { select: { status: true } },
              },
            },
          },
        },
        child: { select: { id: true, fullName: true } },
      },
    }),
    prisma.familyPriceException.findMany({
      where: { periodId },
    }),
  ]);

  const adjustmentPercent = toNum(period.adjustmentPercent) ?? 0;

  const priceMap = new Map<
    string,
    { baseAnnualValue: number; enrollmentFee: number; discountPercent: number | null }
  >();
  for (const entry of priceTableRaw) {
    priceMap.set(entry.grade, {
      baseAnnualValue: toNum(entry.baseAnnualValue) ?? 0,
      enrollmentFee: toNum(entry.enrollmentFee) ?? 0,
      discountPercent: toNum(entry.discountPercent),
    });
  }

  const exceptionMap = new Map<
    string,
    {
      id: string;
      overrideAnnualValue: number | null;
      overrideDiscountPercent: number | null;
      justification: string;
    }
  >();
  for (const exc of exceptionsRaw) {
    exceptionMap.set(exc.studentId, {
      id: exc.id,
      overrideAnnualValue: toNum((exc as Record<string, unknown>).overrideAnnualValue),
      overrideDiscountPercent: toNum((exc as Record<string, unknown>).overrideDiscountPercent),
      justification: exc.justification,
    });
  }

  let adimplente = 0;
  let inadimplente = 0;
  let semContrato = 0;
  let withException = 0;

  const students: StudentPriceCalculation[] = studentsRaw.map((s) => {
    const { row, bucket, hasException: hasExc } = buildStudentPriceCalculation(s, {
      priceMap,
      exceptionMap,
      adjustmentPercent,
    });
    if (bucket === 'adimplente') adimplente++;
    else if (bucket === 'inadimplente') inadimplente++;
    else semContrato++;
    if (hasExc) withException++;
    return row;
  });

  const priceTable: PriceTableEntry[] = priceTableRaw.map((e) => ({
    id: e.id,
    periodId: e.periodId,
    grade: e.grade,
    baseAnnualValue: toNum(e.baseAnnualValue) ?? 0,
    enrollmentFee: toNum(e.enrollmentFee) ?? 0,
    discountPercent: toNum(e.discountPercent),
  }));

  return {
    periodId: period.id,
    periodName: period.name,
    periodStatus: period.status,
    adjustmentPercent,
    eligibleGrades: period.eligibleGrades,
    discountOptions: Array.isArray(period.discountOptions)
      ? (period.discountOptions as number[])
      : [],
    students,
    summary: {
      total: students.length,
      adimplente,
      inadimplente,
      semContrato,
      withException,
    },
    priceTable,
  };
}
