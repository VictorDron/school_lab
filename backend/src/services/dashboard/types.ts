export interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  converted: number;
  conversionRate: number;
}

export interface BySourceRow {
  source: string;
  count: number;
  enrolled: number;
  rejected: number;
  conversionRate: number;
}

export interface ByGradeRow {
  grade: string;
  count: number;
  enrolled: number;
  conversionRate: number;
}

export interface MonthlyTrendRow {
  month: string;
  created: number;
  enrolled: number;
  rejected: number;
}

export interface VivenciaStats {
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  scheduled: number;
  attendanceRate: number;
  evaluations: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    approvalRate: number;
  };
}

export interface VisitStats {
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  scheduled: number;
  completionRate: number;
}

export interface FinancialStats {
  totalContracts: number;
  signed: number;
  active: number;
  cancelled: number;
  pending: number;
  signatureRate: number;
  projectedRevenue: number;
  averageTicket: number;
  averageDiscount: number;
  totalEnrollmentFees: number;
  payments: {
    total: number;
    paid: number;
    overdue: number;
    pending: number;
    collectionRate: number;
  };
}

export interface DepartmentRow {
  department: string;
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  avgDecisionDays: number;
}

export interface DocumentStats {
  totalRequested: number;
  approved: number;
  rejected: number;
  pending: number;
  completionRate: number;
}

export interface DemographicsStats {
  totalChildren: number;
  avgChildrenPerFamily: number;
  withSiblings: number;
  withSpecialNeeds: number;
  byStudentType: { type: string; count: number }[];
  topNationalities: { nationality: string; count: number }[];
}

export interface DashboardStats {
  summary: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    thisWeek: number;
    today: number;
    enrolled: number;
    enrolledThisMonth: number;
    rejected: number;
    inProgress: number;
    conversionRate: number;
  };
  funnel: FunnelStage[];
  bySource: BySourceRow[];
  byGrade: ByGradeRow[];
  monthlyTrend: MonthlyTrendRow[];
  vivencia: VivenciaStats;
  visits: VisitStats;
  financial: FinancialStats;
  departmentPerformance: DepartmentRow[];
  documents: DocumentStats;
  demographics: DemographicsStats;
}
