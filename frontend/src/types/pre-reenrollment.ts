export interface PriceTableEntry {
  id?: string;
  grade: string;
  baseAnnualValue: number;
  enrollmentFee: number;
  discountPercent: number | null;
}

export interface FamilyPriceException {
  id: string;
  periodId: string;
  studentId: string;
  studentName: string;
  overrideAnnualValue: number | null;
  overrideDiscountPercent: number | null;
  justification: string;
  createdBy: string;
  createdAt: string;
}

export interface StudentPriceCalculation {
  studentId: string;
  studentName: string;
  studentCode: string;
  grade: string | null;
  academicStatus: string;
  financialStatus: 'ADIMPLENTE' | 'INADIMPLENTE' | 'SEM_CONTRATO';
  currentAnnualValue: number | null;
  baseAnnualValue: number | null;
  adjustmentPercent: number;
  proposedAnnualValue: number | null;
  hasException: boolean;
  exceptionId: string | null;
  exceptionJustification: string | null;
  exceptionOverrideAnnualValue: number | null;
  exceptionOverrideDiscountPercent: number | null;
  finalAnnualValue: number | null;
  monthlyValue: number | null;
}

export interface PreReEnrollmentDashboard {
  periodId: string;
  periodName: string;
  periodStatus: string;
  adjustmentPercent: number | null;
  eligibleGrades: string[];
  discountOptions: number[];
  students: StudentPriceCalculation[];
  summary: {
    total: number;
    adimplente: number;
    inadimplente: number;
    semContrato: number;
    withException: number;
  };
  priceTable: PriceTableEntry[];
}

export type PreReEnrollmentResponseStatus =
  | 'PENDING'
  | 'AGREED'
  | 'DISAGREED'
  | 'NEGOTIATING'
  | 'NEGOTIATED';

export interface PreReEnrollmentResponse {
  id: string;
  periodId: string;
  studentId: string;
  token: string;
  status: PreReEnrollmentResponseStatus;
  emailSentAt: string | null;
  emailTo: string | null;
  respondedAt: string | null;
  disagreementReason: string | null;
  negotiatedDiscountPercent: number | null;
  negotiatedFinalValue: number | null;
  negotiationJustification: string | null;
  negotiationApprovedById: string | null;
  negotiationCompletedAt: string | null;
  communicatedAnnualValue: number | null;
  communicatedAdjustmentPercent: number | null;
  student: {
    fullName: string;
    grade: string | null;
    studentCode: string;
  };
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
  byGrade: Array<{
    grade: string;
    total: number;
    agreed: number;
    disagreed: number;
    noResponse: number;
    negotiating: number;
    negotiated: number;
  }>;
}

export interface PreReEnrollmentPublicData {
  id: string;
  token: string;
  status: PreReEnrollmentResponseStatus;
  studentName: string;
  grade: string | null;
  periodName: string;
  communicatedAnnualValue: number | null;
  communicatedAdjustmentPercent: number | null;
  deadline: string | null;
}
