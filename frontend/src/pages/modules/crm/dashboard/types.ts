// Dashboard statistics types for the CRM admission metrics dashboard

export interface DashboardStats {
  summary: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    today: number;
    inProgress: number;
    enrolled: number;
    enrolledThisMonth?: number;
    rejected: number;
    conversionRate?: number;
    avgCycleDays?: number;
  };

  funnel: {
    stages: {
      key: string;
      label: string;
      count: number;
      converted?: number;
      conversionRate?: number;
    }[];
  };

  bySource: {
    source: string;
    count: number;
    conversionRate?: number;
  }[];

  byGrade: {
    grade: string;
    count: number;
    conversionRate?: number;
  }[];

  monthlyTrend: {
    year: number;
    month: number;
    created: number;
    enrolled: number;
    rejected: number;
  }[];

  vivencia: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    attendanceRate: number;
    approvalRate: number;
    approved: number;
    rejected: number;
    pending: number;
  };

  visits: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    completionRate: number;
  };

  financial: {
    projectedRevenue: number;
    avgTicket: number;
    avgDiscount: number;
    enrollmentFees: number;
    signatureRate: number;
    paid: number;
    pending: number;
    overdue: number;
  };

  departmentPerformance: {
    department: string;
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    avgDays?: number;
  }[];

  documents: {
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    completionRate: number;
  };

  demographics: {
    totalChildren: number;
    avgChildrenPerFamily: number;
    withSiblings: number;
    withSpecialNeeds: number;
    byStudentType: { type: string; count: number }[];
    topNationalities: { nationality: string; count: number }[];
  };
}
