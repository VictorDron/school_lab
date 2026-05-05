import logger from '../../utils/logger.js';
import { fetchVisits, fetchVivencia } from './events.js';
import { fetchFinancial } from './financial.js';
import {
  fetchDemographics,
  fetchDepartmentPerformance,
  fetchDocuments,
} from './operations.js';
import {
  fetchByGrade,
  fetchBySource,
  fetchFunnel,
  fetchMonthlyTrend,
  fetchSummary,
} from './pipeline.js';
import { buildEmptyStats } from './shared.js';
import type { DashboardStats } from './types.js';

export type {
  BySourceRow,
  ByGradeRow,
  DashboardStats,
  DemographicsStats,
  DepartmentRow,
  DocumentStats,
  FinancialStats,
  FunnelStage,
  MonthlyTrendRow,
  VisitStats,
  VivenciaStats,
} from './types.js';

/**
 * Compute aggregated dashboard metrics for the CRM admission pipeline.
 * All section fetchers run in parallel — a single Promise.all hits the
 * database with ~30 queries concurrently. On total failure we degrade to
 * zero-filled stats so the dashboard route still renders.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const now = new Date();

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      summaryData,
      funnelData,
      sourceData,
      gradeData,
      monthlyRaw,
      vivenciaData,
      visitData,
      financialData,
      departmentData,
      documentData,
      demographicsData,
    ] = await Promise.all([
      fetchSummary(startOfThisMonth, startOfLastMonth, endOfLastMonth, startOfWeek, startOfToday),
      fetchFunnel(),
      fetchBySource(),
      fetchByGrade(),
      fetchMonthlyTrend(),
      fetchVivencia(),
      fetchVisits(),
      fetchFinancial(),
      fetchDepartmentPerformance(),
      fetchDocuments(),
      fetchDemographics(),
    ]);

    return {
      summary: summaryData,
      funnel: funnelData,
      bySource: sourceData,
      byGrade: gradeData,
      monthlyTrend: monthlyRaw,
      vivencia: vivenciaData,
      visits: visitData,
      financial: financialData,
      departmentPerformance: departmentData,
      documents: documentData,
      demographics: demographicsData,
    };
  } catch (error) {
    logger.error('getDashboardStats failed:', error);
    return buildEmptyStats();
  }
}
