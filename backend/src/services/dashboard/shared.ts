import { Prisma } from '@prisma/client';
import type { DashboardStats } from './types.js';

/** Exclude imported leads from dashboard stats — they skip the admissions pipeline. */
export const EXCLUDE_IMPORT: Prisma.LeadWhereInput = { source: { not: 'IMPORT' as any } };

/** Round a number to 1 decimal place, safe for division by zero. */
export function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export const FUNNEL_STAGES = [
  {
    stage: 'contato',
    label: 'Contato',
    gates: ['NOT_STARTED', 'FORM_RECEIVED', 'FORM_APPROVED'],
  },
  {
    stage: 'visita',
    label: 'Visita',
    gates: ['VISIT_SCHEDULED', 'VISIT_COMPLETED', 'INTERVIEW_COMPLETED', 'VISIT_APPROVED'],
  },
  {
    stage: 'vivencia',
    label: 'Vivência',
    gates: ['DOCS_REQUESTED', 'DOCS_RECEIVED', 'VIVENCIA_SCHEDULED', 'VIVENCIA_COMPLETED'],
  },
  {
    stage: 'avaliacao',
    label: 'Avaliação',
    gates: ['EVALUATION_PENDING', 'EVALUATION_COMPLETED'],
  },
  {
    stage: 'aprovacao',
    label: 'Aprovação',
    gates: ['APPROVED'],
  },
  {
    stage: 'matricula',
    label: 'Matrícula',
    gates: ['ENROLLMENT_PENDING', 'ENROLLMENT_COMPLETED'],
  },
  {
    stage: 'contrato',
    label: 'Contrato',
    gates: ['CONTRACT_PENDING', 'CONTRACT_SIGNED', 'FINANCIAL_APPROVED'],
  },
  {
    stage: 'matriculado',
    label: 'Matriculado',
    gates: ['ENROLLED'],
  },
] as const;

/**
 * Default zero-filled stats. Returned by the orchestrator when any fetcher
 * throws — degraded UI is preferable to a 500 error on the dashboard route.
 */
export function buildEmptyStats(): DashboardStats {
  return {
    summary: {
      total: 0,
      thisMonth: 0,
      lastMonth: 0,
      thisWeek: 0,
      today: 0,
      enrolled: 0,
      enrolledThisMonth: 0,
      rejected: 0,
      inProgress: 0,
      conversionRate: 0,
    },
    funnel: FUNNEL_STAGES.map((s) => ({
      stage: s.stage,
      label: s.label,
      count: 0,
      converted: 0,
      conversionRate: 0,
    })),
    bySource: [],
    byGrade: [],
    monthlyTrend: [],
    vivencia: {
      total: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      scheduled: 0,
      attendanceRate: 0,
      evaluations: { total: 0, approved: 0, rejected: 0, pending: 0, approvalRate: 0 },
    },
    visits: {
      total: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      scheduled: 0,
      completionRate: 0,
    },
    financial: {
      totalContracts: 0,
      signed: 0,
      active: 0,
      cancelled: 0,
      pending: 0,
      signatureRate: 0,
      projectedRevenue: 0,
      averageTicket: 0,
      averageDiscount: 0,
      totalEnrollmentFees: 0,
      payments: { total: 0, paid: 0, overdue: 0, pending: 0, collectionRate: 0 },
    },
    departmentPerformance: [],
    documents: { totalRequested: 0, approved: 0, rejected: 0, pending: 0, completionRate: 0 },
    demographics: {
      totalChildren: 0,
      avgChildrenPerFamily: 0,
      withSiblings: 0,
      withSpecialNeeds: 0,
      byStudentType: [],
      topNationalities: [],
    },
  };
}
