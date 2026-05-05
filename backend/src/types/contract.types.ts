import { ContractSignerRole } from '@prisma/client';
import { PDFDocument, PDFFont, PDFPage } from 'pdf-lib';

export interface CreateContractData {
  totalAnnualValue: number;
  installments: number;
  discountPercent?: number;
  enrollmentFee?: number;
  templateVersion?: string;
  signers: Array<{
    role: ContractSignerRole;
    name: string;
    email: string;
    cpf?: string;
    phone?: string;
  }>;
  paymentStartDate?: string;
  negotiatedDiscountPercent?: number;
  negotiatedFinalValue?: number;
  negotiationJustification?: string;
  negotiationApprovedById?: string;
}

export interface PrerequisiteItem {
  key: string;
  label: string;
  met: boolean;
  detail?: string;
  blocking?: boolean; // false = warning only, does not block contract creation
}

export interface PdfRenderContext {
  pdfDoc: PDFDocument;
  font: PDFFont;
  boldFont: PDFFont;
  currentPage: PDFPage;
  y: number;
  leftMargin: number;
  rightMargin: number;
  pageWidth: number;
  pageHeight: number;
  lineHeight: number;
}
