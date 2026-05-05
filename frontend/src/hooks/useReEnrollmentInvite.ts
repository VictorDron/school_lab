import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, patch, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';

/**
 * Query + mutation hooks scoped to a single re-enrollment invite. The
 * detail page reads through useInviteDetail; mutations that advance or
 * mutate invite state invalidate the detail key so the shell picks up
 * the change without an explicit refetch on the consumer.
 */

export interface InviteDetailParent {
  id: string;
  fullName: string;
  parentType: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
}

export interface InviteDetailChild {
  id: string;
  fullName: string;
  currentGrade: string | null;
  studentType: string;
}

export interface InviteDetailAddress {
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
}

export interface InviteDetailLead {
  id: string;
  code: string;
  familyName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string | null;
  secondaryContactName: string | null;
  secondaryContactEmail: string | null;
  secondaryContactPhone: string | null;
  notificationPreference: string | null;
  notes: string | null;
  createdAt: string;
  address: InviteDetailAddress | null;
  parents: InviteDetailParent[];
  children: InviteDetailChild[];
}

export interface InviteDetailPreviousStudent {
  id: string;
  grade: string | null;
  academicYear: number;
  status: string;
}

export interface InviteDetailStudent {
  id: string;
  code: string;
  fullName: string;
  grade: string | null;
  dateOfBirth: string | null;
  cpf: string | null;
  gender: string | null;
  nationality: string | null;
  leadChildId: string | null;
  academicYear: number;
  previousStudent: InviteDetailPreviousStudent | null;
}

export interface InviteDetailPeriod {
  id: string;
  name: string;
  targetYear: number;
  startDate: string;
  endDate: string;
  status: string;
  eligibleGrades: string[];
  adjustmentPercent: number | null;
}

export interface InviteDetailPriceTableEntry {
  baseAnnualValue: number | null;
  enrollmentFee: number | null;
  discountPercent: number | null;
}

export interface InviteDetailException {
  id: string;
  overrideAnnualValue: number | null;
  overrideDiscountPercent: number | null;
  justification: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedById: string | null;
  approvalDecidedAt: string | null;
  approvalNotes: string | null;
}

export interface InviteDetailPreResponse {
  id: string;
  status: 'PENDING' | 'AGREED' | 'DISAGREED' | 'NEGOTIATED';
  communicatedAnnualValue: number | null;
  communicatedAdjustmentPercent: number | null;
  disagreementReason: string | null;
  negotiatedDiscountPercent: number | null;
  negotiatedFinalValue: number | null;
  negotiationJustification: string | null;
  respondedAt: string | null;
  emailSentAt: string | null;
  emailTo: string | null;
}

export interface InviteDetailPricing {
  priceTableEntry: InviteDetailPriceTableEntry | null;
  exception: InviteDetailException | null;
  preResponse: InviteDetailPreResponse | null;
  computed: {
    adjustmentPercent: number;
    proposedValue: number | null;
    finalValue: number | null;
    monthlyValue: number | null;
  };
  financialStatus: 'ADIMPLENTE' | 'INADIMPLENTE' | 'SEM_CONTRATO';
}

export interface InviteDetailContractSigner {
  id: string;
  name: string;
  email: string;
  role: string;
  signedAt: string | null;
}

export interface InviteDetailContract {
  id: string;
  status: string;
  enrollmentType: string;
  totalAnnualValue: string | null;
  installments: number | null;
  discountPercent: string | null;
  enrollmentFee: string | null;
  templateVersion: string | null;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  signedAt: string | null;
  signers: InviteDetailContractSigner[];
}

export interface InviteDetailFeePayment {
  id: string;
  amountPaid: string;
  paymentDate: string;
  paymentMethod: string;
  receiptUrl: string | null;
  createdAt: string;
  registeredBy: { id: string; displayName: string; email: string };
}

export interface InviteDetailDocument {
  id: string;
  documentType: string;
  category: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: string;
  rejectionReason: string | null;
  uploadedAt: string;
  reviewedAt: string | null;
  childId: string | null;
}

export interface InviteDetailInvite {
  id: string;
  periodId: string;
  studentId: string;
  token: string;
  status: string;
  gateStatus: string;
  sentAt: string | null;
  openedAt: string | null;
  confirmedAt: string | null;
  declinedAt: string | null;
  expiredAt: string | null;
  declineReason: string | null;
  notes: string | null;
  emailStatus: string | null;
  emailError: string | null;
  emailSentAt: string | null;
  optOutReminders: boolean;
  extendedDeadline: string | null;
  rematriculadoAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InviteDetail {
  invite: InviteDetailInvite;
  effectiveDeadline: string;
  student: InviteDetailStudent;
  lead: InviteDetailLead;
  period: InviteDetailPeriod;
  contract: InviteDetailContract | null;
  feePayment: InviteDetailFeePayment | null;
  documents: InviteDetailDocument[];
  pricing: InviteDetailPricing;
}

export function useInviteDetail(inviteId: string | null | undefined) {
  return useQuery({
    queryKey: ['reEnrollmentInvite', inviteId],
    queryFn: () => get<InviteDetail>(`/re-enrollment/invites/${inviteId}`),
    enabled: !!inviteId,
  });
}

export interface InviteHistoryEntry {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  actor: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
}

export function useInviteHistory(inviteId: string | null | undefined) {
  return useQuery({
    queryKey: ['reEnrollmentInviteHistory', inviteId],
    queryFn: () => get<InviteHistoryEntry[]>(`/re-enrollment/invites/${inviteId}/history`),
    enabled: !!inviteId,
  });
}

export function useRegenerateInviteLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) =>
      post<{ token: string; publicUrl: string }>(`/re-enrollment/invites/${inviteId}/regenerate-link`),
    onSuccess: (_res, inviteId) => {
      toast.success('Link regenerado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentInvite', inviteId] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

/**
 * Re-enrollment gate transition mutation. Mirrors the backend's
 * PATCH /invites/:id/gate-transition and invalidates every cache key
 * that feeds the re-enrollment surfaces (detail, management table,
 * kanban view) so the move reflects immediately on any screen the
 * operator jumps to next.
 *
 * Success toast is suppressed here because the Kanban card menu and
 * the detail header both render their own contextual success affordance
 * (the card animates into a new column / the pipeline strip advances);
 * the caller can still fire one via onSuccess if it prefers.
 */
export function useTransitionInviteGate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ inviteId, gateStatus }: { inviteId: string; gateStatus: string }) =>
      patch(`/re-enrollment/invites/${inviteId}/gate-transition`, { gateStatus }),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentInvite', variables.inviteId] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentInviteHistory', variables.inviteId] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentKanbanView'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentManagement'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentInvites'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentDashboard'] });
    },
    // onError intentionally omitted — callers handle the error inline in
    // the confirm modal so the operator sees exactly which transition
    // failed and why (e.g. DOCS_NOT_ALL_APPROVED).
  });
}
