import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { get, put, patch, post, del, getErrorMessage } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import toast from 'react-hot-toast';
import type {
  PreReEnrollmentDashboard,
  PriceTableEntry,
  FamilyPriceException,
  PreReEnrollmentResponse,
  PreReEnrollmentReportData,
} from '@/types/pre-reenrollment';

export function usePreReEnrollmentDashboard(periodId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!periodId) return;

    const socket = getSocket();
    if (!socket) return;

    socket.emit('pre-reenrollment:period:join', periodId);

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['preReEnrollment'] });
    };

    socket.on('pre-reenrollment:prices:updated', handleUpdate);

    return () => {
      socket.emit('pre-reenrollment:period:leave', periodId);
      socket.off('pre-reenrollment:prices:updated', handleUpdate);
    };
  }, [periodId, queryClient]);

  return useQuery({
    queryKey: ['preReEnrollment', periodId, 'dashboard'],
    queryFn: () =>
      get<PreReEnrollmentDashboard>(
        `/re-enrollment/periods/${periodId}/pre-reenrollment/dashboard`
      ),
    enabled: !!periodId,
  });
}

export function useUpdatePriceTable(periodId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { entries: PriceTableEntry[]; discountOptions: number[] }) =>
      put(`/re-enrollment/periods/${periodId}/pre-reenrollment/price-table`, data),
    onSuccess: () => {
      toast.success('Tabela de preços atualizada.');
      queryClient.invalidateQueries({ queryKey: ['preReEnrollment'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateAdjustment(periodId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (adjustmentPercent: number) =>
      patch(`/re-enrollment/periods/${periodId}/pre-reenrollment/adjustment`, {
        adjustmentPercent,
      }),
    onSuccess: () => {
      toast.success('Percentual de reajuste atualizado.');
      queryClient.invalidateQueries({ queryKey: ['preReEnrollment'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCreateException(periodId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      studentId: string;
      overrideAnnualValue?: number;
      overrideDiscountPercent?: number;
      justification: string;
    }) =>
      post<FamilyPriceException>(
        `/re-enrollment/periods/${periodId}/pre-reenrollment/exceptions`,
        data
      ),
    onSuccess: () => {
      toast.success('Exceção registrada.');
      queryClient.invalidateQueries({ queryKey: ['preReEnrollment'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateException() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      exceptionId,
      data,
    }: {
      exceptionId: string;
      data: {
        overrideAnnualValue?: number | null;
        overrideDiscountPercent?: number | null;
        justification?: string;
      };
    }) => patch(`/re-enrollment/pre-reenrollment/exceptions/${exceptionId}`, data),
    onSuccess: () => {
      toast.success('Exceção atualizada.');
      queryClient.invalidateQueries({ queryKey: ['preReEnrollment'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteException() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (exceptionId: string) =>
      del(`/re-enrollment/pre-reenrollment/exceptions/${exceptionId}`),
    onSuccess: () => {
      toast.success('Exceção removida.');
      queryClient.invalidateQueries({ queryKey: ['preReEnrollment'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function usePreReEnrollmentResponses(periodId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!periodId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('pre-reenrollment:period:join', periodId);

    const handleResponseUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['preReEnrollment', periodId, 'responses'] });
    };

    socket.on('pre-reenrollment:response:updated', handleResponseUpdate);

    return () => {
      socket.off('pre-reenrollment:response:updated', handleResponseUpdate);
    };
  }, [periodId, queryClient]);

  return useQuery({
    queryKey: ['preReEnrollment', periodId, 'responses'],
    queryFn: () =>
      get<PreReEnrollmentResponse[]>(
        `/re-enrollment/periods/${periodId}/pre-reenrollment/responses`
      ),
    enabled: !!periodId,
  });
}

export function useResendPreReEnrollmentEmail(periodId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (responseId: string) =>
      post(`/re-enrollment/pre-reenrollment/responses/${responseId}/resend`, {}),
    onSuccess: () => {
      toast.success('E-mail reenviado com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['preReEnrollment', periodId, 'responses'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function usePreReEnrollmentReport(periodId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!periodId) return;
    const socket = getSocket();
    if (!socket) return;

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['preReEnrollment', periodId, 'report'] });
    };

    socket.on('pre-reenrollment:response:updated', handleUpdate);

    return () => {
      socket.off('pre-reenrollment:response:updated', handleUpdate);
    };
  }, [periodId, queryClient]);

  return useQuery({
    queryKey: ['preReEnrollment', periodId, 'report'],
    queryFn: () =>
      get<PreReEnrollmentReportData>(
        `/re-enrollment/periods/${periodId}/pre-reenrollment/report`
      ),
    enabled: !!periodId,
  });
}

export function useEmailTemplate(periodId: string) {
  return useQuery({
    queryKey: ['preReEnrollment', periodId, 'emailTemplate'],
    queryFn: () =>
      get<{ template: string | null; deadline: string | null }>(
        `/re-enrollment/periods/${periodId}/pre-reenrollment/email-template`
      ),
    enabled: !!periodId,
  });
}

export function useUpdateEmailTemplate(periodId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { template: string; deadline?: string }) =>
      put(`/re-enrollment/periods/${periodId}/pre-reenrollment/email-template`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['preReEnrollment', periodId, 'emailTemplate'],
      });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useSendPreReEnrollmentEmails(periodId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { studentIds: string[]; customBody: string; deadline: string }) =>
      post<{ sent: number; failed: number }>(
        `/re-enrollment/periods/${periodId}/pre-reenrollment/send-emails`,
        data
      ),
    onSuccess: (result) => {
      const data = result.data;
      if (data) {
        toast.success(
          `E-mails enviados com sucesso. Enviados: ${data.sent}, falhas: ${data.failed}.`
        );
      } else {
        toast.success('E-mails enviados com sucesso.');
      }
      queryClient.invalidateQueries({
        queryKey: ['preReEnrollment', periodId, 'responses'],
      });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRegisterNegotiation(periodId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      responseId,
      data,
    }: {
      responseId: string;
      data: { discountPercent: number; finalValue: number; justification: string };
    }) =>
      patch(
        `/re-enrollment/pre-reenrollment/responses/${responseId}/negotiation`,
        data
      ),
    onSuccess: () => {
      toast.success('Negociação registrada com sucesso.');
      queryClient.invalidateQueries({
        queryKey: ['preReEnrollment', periodId, 'responses'],
      });
      queryClient.invalidateQueries({
        queryKey: ['preReEnrollment', periodId, 'report'],
      });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
