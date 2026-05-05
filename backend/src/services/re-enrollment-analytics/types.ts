export interface FunnelStage {
  name: string;
  key: string;
  count: number;
  percentage: number;
  avgDaysInStage: number | null;
}

export interface FunnelData {
  funnelStages: FunnelStage[];
  totalInvites: number;
}

export interface BottleneckStage {
  stageName: string;
  key: string;
  count: number;
  percentage: number;
  isBottleneck: boolean;
}

export interface OverdueInvite {
  studentName: string;
  grade: string;
  currentStage: string;
  currentStageName: string;
  daysOverdue: number;
}

export interface BottleneckAnalysis {
  bottlenecks: BottleneckStage[];
  overdueInvites: OverdueInvite[];
}

export interface DashboardFilters {
  grade?: string;
}

export interface ReportInvite {
  id: string;
  status: string;
  student: {
    id: string;
    fullName?: string;
    grade?: string;
    child?: { fullName: string } | null;
    lead?: { familyName?: string; primaryContactName?: string } | null;
  };
  confirmedAt?: Date | null;
  declinedAt?: Date | null;
  expiredAt?: Date | null;
  declineReason?: string | null;
}

export interface GradeBreakdown {
  grade: string;
  total: number;
  agreed: number;
  disagreed: number;
  noResponse: number;
  negotiating: number;
  negotiated: number;
}

export interface PreReEnrollmentReportData {
  periodId: string;
  periodName: string;
  total: number;
  agreed: number;
  disagreed: number;
  noResponse: number;
  negotiating: number;
  negotiated: number;
  adhesionRate: number;
  averageEffectiveAdjustment: number;
  byGrade: GradeBreakdown[];
}
