import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface PendingApproval {
  id: string;
  overrideDiscountPercent: number | null;
  previousDiscountPercent: number | null;
  justification: string;
  createdAt: string;
  student: { fullName: string; grade: string | null; code: string };
  period: { name: string };
  createdBy: { displayName: string };
}

interface Props {
  periodId: string;
}

export default function PendingDiscountApprovals({ periodId }: Props) {
  const queryClient = useQueryClient();
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pendingDiscountApprovals', periodId],
    queryFn: async () => {
      const res = await api.get(`/re-enrollment/periods/${periodId}/pre-reenrollment/pending-approvals`);
      return res.data.data as PendingApproval[];
    },
  });

  const decideMutation = useMutation({
    mutationFn: async ({ exceptionId, decision, notes }: { exceptionId: string; decision: 'APPROVED' | 'REJECTED'; notes?: string }) => {
      await api.post(`/re-enrollment/pre-reenrollment/exceptions/${exceptionId}/approval`, { decision, notes });
    },
    onSuccess: (_, vars) => {
      toast.success(vars.decision === 'APPROVED' ? 'Desconto aprovado!' : 'Desconto rejeitado.');
      queryClient.invalidateQueries({ queryKey: ['pendingDiscountApprovals', periodId] });
      queryClient.invalidateQueries({ queryKey: ['preReEnrollmentDashboard', periodId] });
      setDecidingId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Erro ao processar aprovação.');
    },
  });

  if (isLoading || !data || data.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-amber-600" />
        <h4 className="text-sm font-semibold text-amber-800">
          Aprovações de Desconto Pendentes ({data.length})
        </h4>
      </div>
      <div className="space-y-2">
        {data.map((approval) => (
          <div
            key={approval.id}
            className="bg-white border border-amber-100 rounded-lg p-3 flex items-center justify-between"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-neutral-800 truncate">
                {approval.student.fullName}
              </div>
              <div className="text-xs text-neutral-500">
                {approval.student.grade} — {approval.student.code}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">
                Desconto: {approval.previousDiscountPercent ?? 0}% → {approval.overrideDiscountPercent ?? 0}%
                <span className="ml-2 text-neutral-400">por {approval.createdBy.displayName}</span>
              </div>
              <div className="text-xs text-neutral-400 italic mt-0.5">
                {approval.justification}
              </div>
            </div>
            <div className="flex gap-1.5 ml-3 shrink-0">
              <button
                onClick={() => decideMutation.mutate({ exceptionId: approval.id, decision: 'APPROVED' })}
                disabled={decideMutation.isPending}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 disabled:opacity-50 transition-colors"
              >
                {decideMutation.isPending && decidingId === approval.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                Aprovar
              </button>
              <button
                onClick={() => decideMutation.mutate({ exceptionId: approval.id, decision: 'REJECTED' })}
                disabled={decideMutation.isPending}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Rejeitar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
