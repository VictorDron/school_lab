import { useState } from 'react';
import {
  Plus,
  FileText,
  Loader2,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  useLeadContracts,
  useSubmitLegalApproval,
  useSubmitFinancialApproval,
} from '@/hooks/useContracts';
import { useAuthStore } from '@/stores/authStore';
import { get, patch, getErrorMessage } from '@/lib/api';
import type { GateApprovalDecision } from '@/types/contract';
import { type FeeRow } from './constants';
import { FeeEditor } from './FeeEditor';
import { ContractCreateForm } from './ContractCreateForm';
import { ContractCard } from './ContractCard';

interface ContractTabProps {
  leadId: string;
  lead?: {
    primaryContactName?: string;
    primaryContactEmail?: string;
    secondaryContactName?: string;
    secondaryContactEmail?: string;
    parents?: Array<{ fullName: string; email?: string; parentType: string }>;
  };
}

export function ContractTab({ leadId, lead }: ContractTabProps) {
  const { user } = useAuthStore();
  const { data: contractsResponse, isLoading } = useLeadContracts(leadId);
  const contracts = contractsResponse?.data || [];
  const submitLegal = useSubmitLegalApproval();
  const submitFinancial = useSubmitFinancialApproval();
  const queryClient = useQueryClient();

  // Fee table from API
  const { data: feesResponse } = useQuery({
    queryKey: ['settings-fees'],
    queryFn: () =>
      get<{ feeTable: FeeRow[]; foodTable: any[]; discountOptions: number[] }>('/settings/fees'),
  });
  const feeTable: FeeRow[] = feesResponse?.data?.feeTable ?? [];
  const discountOptions: number[] =
    feesResponse?.data?.discountOptions ?? [0, 2.5, 5, 7.5, 10, 12.5, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100];

  const [showFeeEditor, setShowFeeEditor] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const saveFeesMutation = useMutation({
    mutationFn: (data: { feeTable: FeeRow[]; discountOptions?: number[] }) => patch('/settings/fees', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-fees'] });
      setShowFeeEditor(false);
      toast.success('Tabela de precos atualizada');
    },
    onError: (error: any) => toast.error(getErrorMessage(error)),
  });

  const userRole = user?.role;
  const canEditFees = userRole === 'ADMIN' || userRole === 'FINANCE' || userRole === 'LEGAL';
  const canApproveLegal = userRole === 'ADMIN' || userRole === 'LEGAL';
  const canApproveFinancial = userRole === 'ADMIN' || userRole === 'FINANCE';
  const canSendForSignature = userRole === 'ADMIN' || userRole === 'ADMISSIONS' || userRole === 'LEGAL';

  function handleApproval(
    contractId: string,
    type: 'legal' | 'financial',
    decision: GateApprovalDecision,
    notes?: string,
  ) {
    const mutation = type === 'legal' ? submitLegal : submitFinancial;
    mutation.mutate({ id: contractId, decision, notes });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const hasContracts = contracts.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-neutral-800">Contratos</h3>
          {canEditFees && (
            <button
              onClick={() => setShowFeeEditor(true)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <FileText className="w-3 h-3" />
              Configurar Valores
            </button>
          )}
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Criar Contrato
          </button>
        )}
      </div>

      {/* Fee Table Editor */}
      {showFeeEditor && (
        <FeeEditor
          feeTable={feeTable}
          discountOptions={discountOptions}
          onSave={(data) => saveFeesMutation.mutate(data)}
          onClose={() => setShowFeeEditor(false)}
          isSaving={saveFeesMutation.isPending}
        />
      )}

      {/* Create Contract Form */}
      {showForm && (
        <ContractCreateForm
          leadId={leadId}
          lead={lead}
          feeTable={feeTable}
          discountOptions={discountOptions}
          onCreated={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* No contracts message */}
      {!hasContracts && !showForm && (
        <div className="text-center py-12 text-neutral-500">
          <FileText className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
          <p className="text-sm">Nenhum contrato encontrado para este lead.</p>
        </div>
      )}

      {/* Contract List */}
      {hasContracts &&
        contracts.map((contract: any) => (
          <ContractCard
            key={contract.id}
            contract={contract}
            leadId={leadId}
            canApproveLegal={canApproveLegal}
            canApproveFinancial={canApproveFinancial}
            canSendForSignature={canSendForSignature}
            onApproval={handleApproval}
            approvalPending={submitLegal.isPending || submitFinancial.isPending}
          />
        ))}
    </div>
  );
}
