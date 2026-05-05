import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post, patch, del, getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import type {
  LeadComment,
  CreateCommentData,
} from '@/types/crm';
import { invalidateLeadRelated } from './useLeadDashboard';

// ==================== DOCUMENTS MUTATIONS ====================

// Delete admission document from lead
export function useDeleteLeadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, docId }: { leadId: string; docId: string }) =>
      del(`/leads/${leadId}/documents/${docId}`),
    onSuccess: (_, variables) => {
      toast.success('Documento removido!');
      invalidateLeadRelated(queryClient, variables.leadId);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Delete enrollment document from CRM
export function useDeleteEnrollmentDocumentCRM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, docId }: { leadId: string; docId: string }) =>
      del(`/leads/${leadId}/enrollment-documents/${docId}`),
    onSuccess: (_, variables) => {
      toast.success('Documento de matrícula removido!');
      invalidateLeadRelated(queryClient, variables.leadId);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Review (approve/reject) enrollment document
export function useReviewEnrollmentDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      leadId,
      docId,
      status,
      rejectionReason,
    }: {
      leadId: string;
      docId: string;
      status: 'APPROVED' | 'REJECTED';
      rejectionReason?: string;
    }) =>
      patch(`/leads/${leadId}/enrollment-documents/${docId}/review`, { status, rejectionReason }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === 'APPROVED' ? 'Documento aprovado!' : 'Documento rejeitado.'
      );
      invalidateLeadRelated(queryClient, variables.leadId);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// ==================== COMMENTS MUTATIONS ====================

// Add comment to lead
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: CreateCommentData }) =>
      post<LeadComment>(`/leads/${leadId}/comments`, data),
    onSuccess: (_, variables) => {
      toast.success('Comentário adicionado!');
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

// Delete comment
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leadId, commentId }: { leadId: string; commentId: string }) =>
      del(`/leads/${leadId}/comments/${commentId}`),
    onSuccess: (_, variables) => {
      toast.success('Comentário removido!');
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}
