import { useState } from 'react';
import { Check, X, Clock, AlertTriangle, Shield, ScrollText } from 'lucide-react';
import { usePipelineStatus, useSubmitApproval } from '@/hooks/useGateApprovals';
import { useAuthStore, type UserRole } from '@/stores/authStore';
import { DepartmentBadge } from './gates/DepartmentBadge';
import type { AdmissionGateApproval, AdmissionDepartment } from '@/types/contract';

interface LeadPendenciesSectionProps {
  leadId: string;
  onNavigateToContract?: () => void;
}

/** Departments whose CONTRACT_PENDING approval lives in the contract tab */
const CONTRACT_APPROVAL_DEPTS = new Set(['LEGAL', 'FINANCE']);

const deptToRole: Record<string, UserRole> = {
  ADMISSIONS: 'ADMISSIONS',
  PSYCHOLOGY: 'PSYCHOLOGY',
  HEALTH: 'HEALTH',
  SECRETARIAT: 'SECRETARY',
  COORDINATION: 'COORDINATOR',
  FINANCE: 'FINANCE',
  LEGAL: 'LEGAL',
  DIRECTOR: 'DIRECTOR',
};

const stepLabels: Record<string, string> = {
  NOT_STARTED: 'Início',
  FORM_RECEIVED: 'Formulário Recebido',
  FORM_APPROVED: 'Formulário Aprovado',
  VISIT_SCHEDULED: 'Visita Agendada',
  VISIT_COMPLETED: 'Visita Realizada',
  INTERVIEW_COMPLETED: 'Entrevista Realizada',
  VISIT_APPROVED: 'Visita Aprovada',
  DOCS_REQUESTED: 'Docs Solicitados',
  DOCS_RECEIVED: 'Docs Recebidos',
  VIVENCIA_SCHEDULED: 'Vivência Agendada',
  VIVENCIA_COMPLETED: 'Vivência Realizada',
  EVALUATION_PENDING: 'Avaliação Pendente',
  EVALUATION_COMPLETED: 'Avaliação Concluída',
  APPROVED: 'Aprovado',
  ENROLLMENT_PENDING: 'Matrícula Pendente',
  ENROLLMENT_COMPLETED: 'Matrícula Concluída',
  CONTRACT_PENDING: 'Contrato Pendente',
  CONTRACT_SIGNED: 'Contrato Assinado',
  FINANCIAL_APPROVED: 'Financeiro Aprovado',
  ENROLLED: 'Matriculado',
};

function canUserApproveForDept(role: UserRole | undefined, department: string): boolean {
  if (!role) return false;
  if (role === 'ADMIN') return true;
  return deptToRole[department] === role;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return 'há 1 dia';
  return `há ${diffDays} dias`;
}

function PendingApprovalRow({
  approval,
  leadId,
  gateStep,
  canApprove,
  onNavigateToContract,
}: {
  approval: AdmissionGateApproval;
  leadId: string;
  gateStep: string;
  canApprove: boolean;
  onNavigateToContract?: () => void;
}) {
  const submitApproval = useSubmitApproval();
  const [rejectNotes, setRejectNotes] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const handleApprove = () => {
    submitApproval.mutate({
      leadId,
      gateStep,
      department: approval.department as AdmissionDepartment,
      decision: 'APPROVED',
    });
  };

  const handleReject = () => {
    if (!showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    submitApproval.mutate(
      {
        leadId,
        gateStep,
        department: approval.department as AdmissionDepartment,
        decision: 'REJECTED',
        notes: rejectNotes || undefined,
      },
      { onSuccess: () => setShowRejectInput(false) },
    );
  };

  if (approval.decision === 'CONDITIONAL') {
    return (
      <div className="flex items-center gap-2 py-1.5">
        <DepartmentBadge department={approval.department} />
        <AlertTriangle className="w-3 h-3 text-yellow-500" />
        <span className="text-xs text-yellow-700 font-medium">Condicional</span>
        {approval.notes && (
          <span className="text-[11px] text-neutral-500">— {approval.notes}</span>
        )}
      </div>
    );
  }

  if (approval.decision === 'ESCALATED') {
    return (
      <div className="flex items-center gap-2 py-1.5">
        <DepartmentBadge department={approval.department} />
        <Shield className="w-3 h-3 text-red-500" />
        <span className="text-xs text-red-700 font-medium">Escalado</span>
        {approval.notes && (
          <span className="text-[11px] text-neutral-500">— {approval.notes}</span>
        )}
      </div>
    );
  }

  // For CONTRACT_PENDING approvals of LEGAL/FINANCE, show "Ver Contrato" instead of action buttons
  const isContractApproval =
    gateStep === 'CONTRACT_PENDING' && CONTRACT_APPROVAL_DEPTS.has(approval.department);

  // PENDING
  return (
    <div className="py-1.5 space-y-1.5">
      <div className="flex items-center gap-2">
        <DepartmentBadge department={approval.department} />
        <Clock className="w-3 h-3 text-amber-500" />
        <span className="text-xs text-amber-700 font-medium">Aguardando</span>
        <span className="text-[10px] text-neutral-400">{timeAgo(approval.createdAt)}</span>
      </div>
      {isContractApproval ? (
        <div className="ml-6">
          <button
            onClick={onNavigateToContract}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded border border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors"
          >
            <ScrollText className="w-3 h-3" />
            Ver Contrato
          </button>
        </div>
      ) : canApprove ? (
        <div className="flex items-center gap-1.5 ml-6">
          <button
            onClick={handleApprove}
            disabled={submitApproval.isPending}
            className="px-2.5 py-1 text-[11px] font-medium rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            Aprovar
          </button>
          <button
            onClick={handleReject}
            disabled={submitApproval.isPending}
            className="px-2.5 py-1 text-[11px] font-medium rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            Rejeitar
          </button>
          {showRejectInput && (
            <input
              type="text"
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              placeholder="Motivo..."
              className="flex-1 px-2 py-1 text-[11px] border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-red-400"
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

export function LeadPendenciesSection({ leadId, onNavigateToContract }: LeadPendenciesSectionProps) {
  const { data: pipelineData, isLoading } = usePipelineStatus(leadId);
  const user = useAuthStore((s) => s.user);

  if (isLoading) return null;

  const phases = pipelineData?.data?.phases ?? [];

  // Only collect steps that have PENDING approvals
  const pendingSteps: { gateStep: string; phaseName: string; approvals: AdmissionGateApproval[] }[] = [];

  for (const phase of phases) {
    for (const step of phase.steps) {
      const approvals = phase.approvals[step];
      if (!approvals || approvals.length === 0) continue;

      const hasPending = approvals.some(
        (a) => a.decision === 'PENDING' || a.decision === 'CONDITIONAL' || a.decision === 'ESCALATED'
      );
      if (hasPending) {
        // Only include the pending/actionable approvals
        pendingSteps.push({
          gateStep: step,
          phaseName: phase.name,
          approvals: approvals.filter(
            (a) => a.decision === 'PENDING' || a.decision === 'CONDITIONAL' || a.decision === 'ESCALATED'
          ),
        });
      }
    }
  }

  // Nothing pending → hide section entirely
  if (pendingSteps.length === 0) return null;

  const totalPending = pendingSteps.reduce((n, s) => n + s.approvals.length, 0);

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
          Pendências de Aprovação
        </h3>
        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700">
          {totalPending}
        </span>
      </div>

      <div className="space-y-2">
        {pendingSteps.map(({ gateStep, phaseName, approvals }) => (
          <div
            key={gateStep}
            className="border border-neutral-100 rounded-lg px-3 py-2 bg-white"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-semibold text-neutral-700">
                {stepLabels[gateStep] || gateStep.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] text-neutral-400">· {phaseName}</span>
            </div>

            <div className="divide-y divide-neutral-50">
              {approvals.map((approval) => (
                <PendingApprovalRow
                  key={approval.id}
                  approval={approval}
                  leadId={leadId}
                  gateStep={gateStep}
                  canApprove={canUserApproveForDept(user?.role, approval.department)}
                  onNavigateToContract={onNavigateToContract}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
