import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { get, post, patch, del, api, getErrorMessage } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import toast from 'react-hot-toast';
import type { DashboardStats, TimelineMilestone, PeriodReport, FunnelData, BottleneckData } from '@/types/re-enrollment';

export function useReEnrollmentDashboard(periodId: string, filters?: { grade?: string }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!periodId) return;

    const socket = getSocket();
    if (!socket) return;

    socket.emit('re-enrollment:join', periodId);

    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentInvites'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentFunnel'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentBottlenecks'] });
    };

    socket.on('re-enrollment:invite:updated', handleUpdate);
    socket.on('re-enrollment:invite:created', handleUpdate);
    socket.on('re-enrollment:period:updated', handleUpdate);

    return () => {
      socket.emit('re-enrollment:leave', periodId);
      socket.off('re-enrollment:invite:updated', handleUpdate);
      socket.off('re-enrollment:invite:created', handleUpdate);
      socket.off('re-enrollment:period:updated', handleUpdate);
    };
  }, [periodId, queryClient]);

  return useQuery({
    queryKey: ['reEnrollmentDashboard', periodId, filters?.grade],
    queryFn: () =>
      get<DashboardStats>(`/re-enrollment/periods/${periodId}/dashboard`, {
        params: { grade: filters?.grade || undefined },
      }),
    enabled: !!periodId,
  });
}

export function useReEnrollmentTimeline(periodId: string) {
  return useQuery({
    queryKey: ['reEnrollmentTimeline', periodId],
    queryFn: () => get<TimelineMilestone[]>(`/re-enrollment/periods/${periodId}/timeline`),
    enabled: !!periodId,
  });
}

export function useReEnrollmentReport(periodId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['reEnrollmentReport', periodId],
    queryFn: () => get<PeriodReport>(`/re-enrollment/periods/${periodId}/report`),
    enabled: !!periodId && enabled,
  });
}

export function useResendInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => post(`/re-enrollment/invites/${id}/resend`),
    onSuccess: () => {
      toast.success('Convite reenviado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentInvites'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentManagement'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentInvite'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCancelInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => post(`/re-enrollment/invites/${id}/cancel`),
    onSuccess: () => {
      toast.success('Convite cancelado');
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentInvites'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentManagement'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentInvite'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useExtendDeadline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newDeadline }: { id: string; newDeadline: string }) =>
      patch(`/re-enrollment/invites/${id}/extend-deadline`, { newDeadline }),
    onSuccess: () => {
      toast.success('Prazo estendido com sucesso');
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentInvites'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentManagement'] });
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentInvite'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export async function useExportReport(periodId: string) {
  try {
    const response = await api.get(`/re-enrollment/periods/${periodId}/report/export`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio-rematricula-${periodId}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast.success('Relatório exportado com sucesso');
  } catch (error) {
    toast.error(getErrorMessage(error));
  }
}

export function useScheduleReminders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (periodId: string) =>
      post(`/re-enrollment/periods/${periodId}/reminders/schedule`),
    onSuccess: () => {
      toast.success('Lembretes agendados com sucesso');
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentDashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRemoveReminders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (periodId: string) =>
      del(`/re-enrollment/periods/${periodId}/reminders`),
    onSuccess: () => {
      toast.success('Lembretes removidos');
      queryClient.invalidateQueries({ queryKey: ['reEnrollmentDashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useReEnrollmentFunnel(periodId: string) {
  return useQuery({
    queryKey: ['reEnrollmentFunnel', periodId],
    queryFn: () => get<FunnelData>(`/re-enrollment/periods/${periodId}/funnel`),
    enabled: !!periodId,
  });
}

export function useReEnrollmentBottlenecks(periodId: string) {
  return useQuery({
    queryKey: ['reEnrollmentBottlenecks', periodId],
    queryFn: () => get<BottleneckData>(`/re-enrollment/periods/${periodId}/bottlenecks`),
    enabled: !!periodId,
  });
}
