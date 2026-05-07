import { api } from '@/lib/api';

export type SchoolInvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type SchoolInvoiceType = 'TUITION' | 'MATERIAL' | 'ENROLLMENT_FEE' | 'ACTIVITY' | 'OTHER';
export type PayableStatus = SchoolInvoiceStatus;
export type PayableCategory = 'RENT' | 'UTILITIES' | 'PAYROLL' | 'SUPPLIES' | 'SERVICES' | 'TAXES' | 'OTHER';

export interface Tuition {
  id: string;
  grade: string;
  year: number;
  monthlyAmount: string;
  materialAmount: string | null;
  enrollmentFee: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolInvoice {
  id: string;
  studentId: string | null;
  type: SchoolInvoiceType;
  description: string;
  amount: string;
  dueDate: string;
  status: SchoolInvoiceStatus;
  paidAt: string | null;
  paidAmount: string | null;
  notes: string | null;
  createdById: string;
  createdAt: string;
  student: { id: string; fullName: string; code: string; grade: string | null } | null;
  createdBy: { id: string; displayName: string };
}

export interface Payable {
  id: string;
  supplierName: string;
  description: string;
  category: PayableCategory;
  amount: string;
  dueDate: string;
  status: PayableStatus;
  paidAt: string | null;
  paidAmount: string | null;
  attachmentUrl: string | null;
  notes: string | null;
  createdById: string;
  createdAt: string;
  createdBy: { id: string; displayName: string };
}

export interface CashFlow {
  receivables: {
    totalsByStatus: Record<SchoolInvoiceStatus, number>;
    countsByStatus: Record<SchoolInvoiceStatus, number>;
    total: number;
    net: number;
  };
  payables: {
    totalsByStatus: Record<PayableStatus, number>;
    countsByStatus: Record<PayableStatus, number>;
    total: number;
    net: number;
  };
  upcomingInvoices: Array<Pick<SchoolInvoice, 'id' | 'description' | 'amount' | 'dueDate' | 'status'> & { student: { fullName: string } | null }>;
  upcomingPayables: Array<Pick<Payable, 'id' | 'supplierName' | 'description' | 'amount' | 'dueDate' | 'status' | 'category'>>;
}

export const financeApi = {
  // Tuitions
  listTuitions: (year?: number) =>
    api.get<{ success: true; data: Tuition[] }>('/finance/tuitions', { params: year ? { year } : undefined }).then((r) => r.data.data),
  createTuition: (body: Omit<Tuition, 'id' | 'createdAt' | 'updatedAt' | 'isActive'> & { isActive?: boolean }) =>
    api.post<{ success: true; data: Tuition }>('/finance/tuitions', body).then((r) => r.data.data),
  updateTuition: (id: string, body: Partial<Omit<Tuition, 'id' | 'createdAt' | 'updatedAt'>>) =>
    api.patch<{ success: true; data: Tuition }>(`/finance/tuitions/${id}`, body).then((r) => r.data.data),
  deleteTuition: (id: string) =>
    api.delete<{ success: true }>(`/finance/tuitions/${id}`).then((r) => r.data),

  // Invoices
  listInvoices: (filters: { status?: SchoolInvoiceStatus; studentId?: string; type?: SchoolInvoiceType } = {}) =>
    api.get<{ success: true; data: SchoolInvoice[] }>('/finance/invoices', { params: filters }).then((r) => r.data.data),
  createInvoice: (body: { studentId?: string; type: SchoolInvoiceType; description: string; amount: number; dueDate: string; notes?: string }) =>
    api.post<{ success: true; data: SchoolInvoice }>('/finance/invoices', body).then((r) => r.data.data),
  updateInvoice: (id: string, body: any) =>
    api.patch<{ success: true; data: SchoolInvoice }>(`/finance/invoices/${id}`, body).then((r) => r.data.data),
  payInvoice: (id: string, paidAmount?: number) =>
    api.post<{ success: true; data: SchoolInvoice }>(`/finance/invoices/${id}/pay`, paidAmount !== undefined ? { paidAmount } : {}).then((r) => r.data.data),
  deleteInvoice: (id: string) =>
    api.delete<{ success: true }>(`/finance/invoices/${id}`).then((r) => r.data),

  // Payables
  listPayables: (filters: { status?: PayableStatus; category?: PayableCategory } = {}) =>
    api.get<{ success: true; data: Payable[] }>('/finance/payables', { params: filters }).then((r) => r.data.data),
  createPayable: (body: { supplierName: string; description: string; category: PayableCategory; amount: number; dueDate: string; notes?: string; attachmentUrl?: string }) =>
    api.post<{ success: true; data: Payable }>('/finance/payables', body).then((r) => r.data.data),
  updatePayable: (id: string, body: any) =>
    api.patch<{ success: true; data: Payable }>(`/finance/payables/${id}`, body).then((r) => r.data.data),
  payPayable: (id: string, paidAmount?: number) =>
    api.post<{ success: true; data: Payable }>(`/finance/payables/${id}/pay`, paidAmount !== undefined ? { paidAmount } : {}).then((r) => r.data.data),
  deletePayable: (id: string) =>
    api.delete<{ success: true }>(`/finance/payables/${id}`).then((r) => r.data),

  // Cash flow
  getCashFlow: () =>
    api.get<{ success: true; data: CashFlow }>('/finance/cash-flow').then((r) => r.data.data),
};

export const invoiceTypeLabel: Record<SchoolInvoiceType, string> = {
  TUITION:        'Mensalidade',
  MATERIAL:       'Material',
  ENROLLMENT_FEE: 'Matrícula',
  ACTIVITY:       'Atividade',
  OTHER:          'Outro',
};

export const payableCategoryLabel: Record<PayableCategory, string> = {
  RENT:      'Aluguel',
  UTILITIES: 'Utilidades',
  PAYROLL:   'Folha',
  SUPPLIES:  'Suprimentos',
  SERVICES:  'Serviços',
  TAXES:     'Impostos',
  OTHER:     'Outros',
};

export const statusLabel: Record<SchoolInvoiceStatus, string> = {
  PENDING:   'Pendente',
  PAID:      'Pago',
  OVERDUE:   'Atrasado',
  CANCELLED: 'Cancelado',
};

export function formatBRL(value: string | number): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
