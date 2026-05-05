import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import axios from 'axios';
import { api, get, post, patch, del, getErrorMessage } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import toast from 'react-hot-toast';
import type {
  ReEnrollmentPeriodFull,
  CreatePeriodData,
  UpdatePeriodData,
  EligibleStudent,
  BatchInviteResult,
  ReEnrollmentInviteFull,
  ReEnrollmentPeriodStatus,
  EnrollmentFeePayment,
  UnifiedStudentRow,
  UnifiedManagementMeta,
} from '@/types/re-enrollment';

export function useReEnrollmentPeriods(filters?: { status?: string; targetYear?: number }) {
  return useQuery({
    queryKey: ['reEnrollmentPeriods', filters],
    queryFn: () =>
      get<ReEnrollmentPeriodFull[]>('/re-enrollment/periods', {
        params: {
          status: filters?.status || undefined,
          targetYear: filters?.targetYear || undefined,
          limit: 50,
        },
      }),
  });
}

export function useReEnrollmentPeriod(id: string | null) {
  return useQuery({
    queryKey: ['reEnrollmentPeriod', id],
    queryFn: () => get<ReEnrollmentPeriodFull>(`/re-enrollment/periods/${id}`),
    enabled: !!id,
  });
}

export function useCreatePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePeriodData) => post<ReEnrollmentPeriodFull>('/re-enrollment/periods', data),
    onSuccess: () => {
      toast.success('Campanha criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentPeriods'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useTransitionPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReEnrollmentPeriodStatus }) =>
      patch(`/re-enrollment/periods/${id}/transition`, { status }),
    onSuccess: () => {
      toast.success('Status da campanha atualizado!');
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentPeriods'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentPeriod'] });
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data;
        if (data?.code === 'PERIOD_ALREADY_OPEN' && data?.details?.conflictingPeriodName) {
          toast.error(
            `Já existe uma campanha aberta: "${data.details.conflictingPeriodName}". Feche-a antes de abrir outra.`,
            { duration: 6000 }
          );
          return;
        }
      }
      toast.error(getErrorMessage(error));
    },
  });
}

export function useUpdatePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePeriodData }) =>
      patch<ReEnrollmentPeriodFull>(`/re-enrollment/periods/${id}`, data),
    onSuccess: () => {
      toast.success('Campanha atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentPeriods'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentPeriod'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeletePeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del(`/re-enrollment/periods/${id}`),
    onSuccess: () => {
      toast.success('Campanha excluída com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentPeriods'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useEligibleStudents(periodId: string | null) {
  return useQuery({
    queryKey: ['eligibleStudents', periodId],
    queryFn: () => get<EligibleStudent[]>(`/re-enrollment/periods/${periodId}/invites/eligible`),
    enabled: !!periodId,
  });
}

export function useBatchCreateInvites() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (periodId: string) => post<BatchInviteResult>(`/re-enrollment/periods/${periodId}/invites/batch`),
    onSuccess: (result) => {
      const data = result.data;
      if (data && data.created > 0) {
        toast.success(`${data.created} convite(s) enviado(s) com sucesso!`);
      } else {
        toast.success('Nenhum novo convite foi criado.');
      }
      queryClient.invalidateQueries({ queryKey: ['eligibleStudents'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentInvites'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentManagement'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentPeriods'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCreateSingleInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ periodId, studentId }: { periodId: string; studentId: string }) =>
      post(`/re-enrollment/periods/${periodId}/invites`, { studentId }),
    onSuccess: () => {
      toast.success('Convite enviado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['eligibleStudents'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentInvites'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentManagement'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentPeriods'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useReEnrollmentInvites(periodId: string | null, filters?: { status?: string; gateStatus?: string; grade?: string }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!periodId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('re-enrollment:period:join', periodId);

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentInvites', periodId] });
    };

    socket.on('re-enrollment:invite:created', handleUpdate);
    socket.on('re-enrollment:invite:updated', handleUpdate);

    return () => {
      socket.off('re-enrollment:invite:created', handleUpdate);
      socket.off('re-enrollment:invite:updated', handleUpdate);
    };
  }, [periodId, queryClient]);

  return useQuery({
    queryKey: ['reEnrollmentInvites', periodId, filters],
    queryFn: () =>
      get<ReEnrollmentInviteFull[]>(`/re-enrollment/periods/${periodId}/invites`, {
        params: {
          status: filters?.status || undefined,
          gateStatus: filters?.gateStatus || undefined,
          grade: filters?.grade || undefined,
          limit: 100,
        },
      }),
    enabled: !!periodId,
  });
}

export function useReEnrollmentManagement(
  periodId: string | null,
  filters?: { status?: string; gateStatus?: string; grade?: string; unified?: string }
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!periodId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('re-enrollment:period:join', periodId);

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentManagement', periodId] });
    };

    socket.on('re-enrollment:invite:created', handleUpdate);
    socket.on('re-enrollment:invite:updated', handleUpdate);

    return () => {
      socket.off('re-enrollment:invite:created', handleUpdate);
      socket.off('re-enrollment:invite:updated', handleUpdate);
    };
  }, [periodId, queryClient]);

  return useQuery({
    queryKey: ['reEnrollmentManagement', periodId, filters],
    queryFn: () =>
      get<UnifiedStudentRow[]>(`/re-enrollment/periods/${periodId}/management`, {
        params: {
          status: filters?.status || undefined,
          gateStatus: filters?.gateStatus || undefined,
          grade: filters?.grade || undefined,
          unified: filters?.unified || undefined,
          limit: 500,
        },
      }),
    enabled: !!periodId,
  });
}

export function useRegisterFeePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ inviteId, data }: { inviteId: string; data: FormData }) => {
      const response = await api.post<{ success: boolean; data: EnrollmentFeePayment }>(
        `/re-enrollment/invites/${inviteId}/fee-payment`,
        data,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Pagamento registrado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentInvites'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentManagement'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentPeriods'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentDashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

// ── Renewal Contract ──────────────────────────────────────────────

export function useInviteContract(inviteId: string | null) {
  return useQuery({
    queryKey: ['inviteContract', inviteId],
    queryFn: () => get<any>(`/re-enrollment/invites/${inviteId}/contract`),
    enabled: !!inviteId,
  });
}

export function useCreateRenewalContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { inviteId: string; data: any }) =>
      post<any>(`/re-enrollment/invites/${params.inviteId}/contract`, params.data),
    onSuccess: () => {
      toast.success('Contrato criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentInvites'] });
      queryClient.invalidateQueries({ queryKey: ['inviteContract'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
