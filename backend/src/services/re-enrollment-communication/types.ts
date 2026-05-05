export interface SendEmailsParams {
  periodId: string;
  studentIds: string[];
  customBody: string;
  deadline: Date;
  sentById: string;
}

export interface SendEmailsResult {
  sent: number;
  failed: number;
}

export interface RecordResponseResult {
  periodId: string;
  studentId: string;
  status: string;
  reEnrollmentToken?: string;
}

export interface RegisterNegotiationParams {
  responseId: string;
  discountPercent: number;
  finalValue: number;
  justification: string;
  approvedById: string;
}

export interface ResponseData {
  id: string;
  token: string;
  status: string;
  studentName: string;
  grade: string | null;
  periodName: string;
  communicatedAnnualValue: number | null;
  communicatedAdjustmentPercent: number | null;
  deadline: Date | null;
}
