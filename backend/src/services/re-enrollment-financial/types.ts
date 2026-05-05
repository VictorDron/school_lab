export interface FeePaymentData {
  amountPaid: number;
  paymentDate: string;
  paymentMethod: string;
  receipt?: { buffer: Buffer; originalname: string; mimetype: string };
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

export interface DashboardSummary {
  total: number;
  adimplente: number;
  inadimplente: number;
  semContrato: number;
  withException: number;
}

export interface PriceTableEntry {
  id: string;
  periodId: string;
  grade: string;
  baseAnnualValue: number;
  enrollmentFee: number;
  discountPercent: number | null;
}

export interface PreReEnrollmentDashboard {
  periodId: string;
  periodName: string;
  periodStatus: string;
  adjustmentPercent: number | null;
  eligibleGrades: string[];
  discountOptions: number[];
  students: StudentPriceCalculation[];
  summary: DashboardSummary;
  priceTable: PriceTableEntry[];
}

export interface StudentRaw {
  id: string;
  code: string;
  fullName: string;
  grade: string | null;
  status: string;
  lead: {
    id: string;
    familyName: string | null;
    contracts: Array<{
      id: string;
      status: string;
      totalAnnualValue: unknown;
      payments: Array<{ status: string }>;
    }>;
  } | null;
  child: { id: string; fullName: string } | null;
}

export interface PriceMapEntry {
  baseAnnualValue: number;
  enrollmentFee: number;
  discountPercent: number | null;
}

export interface ExceptionMapEntry {
  overrideAnnualValue: number | null;
  overrideDiscountPercent: number | null;
  justification: string;
}

export interface BuildOptions {
  priceMap: Map<string, PriceMapEntry>;
  exceptionMap: Map<string, ExceptionMapEntry & { id?: string }>;
  adjustmentPercent: number;
}

export interface StudentBuildResult {
  row: StudentPriceCalculation;
  bucket: 'adimplente' | 'inadimplente' | 'semContrato';
  hasException: boolean;
}

export interface DiscountImportRow {
  rowNumber: number;
  codigoAluno: string;
  nomeAluno: string;
  percentualDesconto: number;
  matchedStudentId: string | null;
  matchedStudentName: string | null;
  matchedStudentGrade: string | null;
  currentDiscount: number | null;
  status: 'matched' | 'not_found' | 'invalid' | 'duplicate';
  message?: string;
}

export interface DiscountImportPreview {
  totalRows: number;
  matched: number;
  notFound: number;
  invalid: number;
  duplicates: number;
  rows: DiscountImportRow[];
}
