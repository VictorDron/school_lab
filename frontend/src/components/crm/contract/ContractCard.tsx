import { useState } from 'react';
import {
  Send,
  Ban,
  CheckCircle2,
  XCircle,
  FileText,
  Trash2,
  Loader2,
  Eye,
  Download,
  FileCheck,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  useSendForSignature,
  useCancelContract,
  useContractDocumentUrl,
  useSignedDocumentUrl,
  useDeleteContract,
} from '@/hooks/useContracts';
import { post, getErrorMessage } from '@/lib/api';
import { PaymentScheduleTable } from './PaymentScheduleTable';
import { AddendumSection } from './AddendumSection';
import type { GateApprovalDecision } from '@/types/contract';
import { statusConfig, approvalBadge } from './constants';
import { ApprovalModal, CancelModal } from './ApprovalModal';
import { SignerManagement } from './SignerManagement';

interface ContractCardProps {
  contract: any;
  leadId: string;
  canApproveLegal: boolean;
  canApproveFinancial: boolean;
  canSendForSignature: boolean;
  onApproval: (contractId: string, type: 'legal' | 'financial', decision: GateApprovalDecision, notes?: string) => void;
  approvalPending: boolean;
}

export function ContractCard({
  contract,
  leadId,
  canApproveLegal,
  canApproveFinancial,
  canSendForSignature: canSend,
  onApproval,
  approvalPending,
}: ContractCardProps) {
  const queryClient = useQueryClient();
  const sendForSignature = useSendForSignature();
  const cancelContract = useCancelContract();
  const deleteContractMutation = useDeleteContract();
  const getDocUrl = useContractDocumentUrl();
  const getSignedDocUrl = useSignedDocumentUrl();

  const generateDocMutation = useMutation({
    mutationFn: (contractId: string) => post(`/contracts/${contractId}/generate-document`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      toast.success('Documento do contrato gerado com sucesso');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Approval / Cancel modal
  const [approvalModal, setApprovalModal] = useState<{ type: 'legal' | 'financial' } | null>(null);
  const [cancelModal, setCancelModal] = useState(false);

  const status = statusConfig[contract.status as keyof typeof statusConfig];
  const legalStatus = contract.legalApprovalStatus ? approvalBadge[contract.legalApprovalStatus] : approvalBadge.PENDING;
  const financialStatus = contract.financialApprovalStatus
    ? approvalBadge[contract.financialApprovalStatus]
    : approvalBadge.PENDING;

  const bothApproved = contract.legalApprovalStatus === 'APPROVED' && contract.financialApprovalStatus === 'APPROVED';
  const canGenDoc = bothApproved && !contract.documentUrl && !contract.clicksignEnvelopeId;
  const signerSchoolReps = (contract.signers || []).filter((s: any) => s.role === 'SCHOOL_REPRESENTATIVE').length;
  const signerWitnesses = (contract.signers || []).filter((s: any) => s.role === 'WITNESS').length;
  const signersReady = signerSchoolReps >= 1 && signerWitnesses >= 2;
  const canSendContract = canSend && bothApproved && !!contract.documentUrl && !contract.clicksignEnvelopeId && signersReady;
  const isSigned = contract.status === 'SIGNED' || contract.status === 'ACTIVE';
  const canCancel = contract.status !== 'CANCELLED' && contract.status !== 'SIGNED' && contract.status !== 'ACTIVE';

  return (
    <div className="border border-neutral-200 rounded-lg bg-white overflow-hidden">
      {/* Contract Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-neutral-400" />
          <div>
            <span className="text-sm font-semibold text-neutral-800">{contract.code}</span>
            <span className="ml-2 text-xs text-neutral-500">
              Criado em {new Date(contract.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status?.color}`}>{status?.label}</span>
      </div>

      <div className="p-4 space-y-5">
        {/* Contract lifecycle stepper */}
        {contract.status !== 'CANCELLED' && (
          <div className="flex items-center gap-1 text-[10px]">
            {[
              { key: 'PENDING_LEGAL', label: 'Juridico' },
              { key: 'PENDING_FINANCIAL', label: 'Financeiro' },
              { key: 'SENT', label: 'Assinatura' },
              { key: 'SIGNED', label: 'Assinado' },
              { key: 'ACTIVE', label: 'Ativo' },
            ].map((step, i, arr) => {
              const order = ['DRAFT', 'PENDING_LEGAL', 'PENDING_FINANCIAL', 'SENT', 'SIGNED', 'ACTIVE'];
              const currentIdx = order.indexOf(contract.status);
              const stepIdx = order.indexOf(step.key);
              const isDone = stepIdx < currentIdx;
              const isCurrent = stepIdx === currentIdx;
              return (
                <div key={step.key} className="flex items-center gap-1">
                  <div
                    className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-medium ${
                      isDone
                        ? 'bg-emerald-100 text-emerald-700'
                        : isCurrent
                          ? 'bg-[#0aacce]/10 text-[#0aacce] ring-1 ring-[#0aacce]/30'
                          : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    {isDone && <CheckCircle2 className="w-2.5 h-2.5" />}
                    {step.label}
                  </div>
                  {i < arr.length - 1 && <span className="text-neutral-300">&rarr;</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Financial Summary */}
        {(contract.totalAnnualValue || contract.installments) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {contract.totalAnnualValue != null && (
              <div>
                <span className="block text-xs text-neutral-500">Valor Anual</span>
                <span className="font-medium text-neutral-800">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.totalAnnualValue)}
                </span>
              </div>
            )}
            {contract.installments != null && (
              <div>
                <span className="block text-xs text-neutral-500">Parcelas</span>
                <span className="font-medium text-neutral-800">{contract.installments}x</span>
              </div>
            )}
            {contract.discountPercent != null && contract.discountPercent > 0 && (
              <div>
                <span className="block text-xs text-neutral-500">Desconto</span>
                <span className="font-medium text-neutral-800">{contract.discountPercent}%</span>
              </div>
            )}
            {contract.enrollmentFee != null && (
              <div>
                <span className="block text-xs text-neutral-500">Taxa Matricula</span>
                <span className="font-medium text-neutral-800">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.enrollmentFee)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Legal Approval */}
        <div className="border border-neutral-100 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Aprovacao Juridica</h5>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${legalStatus.color}`}>{legalStatus.label}</span>
          </div>
          {contract.legalApprovedBy && (
            <p className="text-xs text-neutral-500">
              Aprovado por {contract.legalApprovedBy.displayName}
              {contract.legalApprovedAt && ` em ${new Date(contract.legalApprovedAt).toLocaleDateString('pt-BR')}`}
            </p>
          )}
          {contract.legalNotes && <p className="text-xs text-neutral-600 mt-1 italic">{contract.legalNotes}</p>}
          {canApproveLegal &&
            contract.status === 'PENDING_LEGAL' &&
            (!contract.legalApprovalStatus || contract.legalApprovalStatus === 'PENDING') && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setApprovalModal({ type: 'legal' })}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Aprovar
                </button>
                <button
                  onClick={() => setApprovalModal({ type: 'legal' })}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Rejeitar
                </button>
              </div>
            )}
        </div>

        {/* Financial Approval */}
        <div className="border border-neutral-100 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Aprovacao Financeira</h5>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${financialStatus.color}`}>{financialStatus.label}</span>
          </div>
          {contract.financialApprovedBy && (
            <p className="text-xs text-neutral-500">
              Aprovado por {contract.financialApprovedBy.displayName}
              {contract.financialApprovedAt && ` em ${new Date(contract.financialApprovedAt).toLocaleDateString('pt-BR')}`}
            </p>
          )}
          {contract.financialNotes && <p className="text-xs text-neutral-600 mt-1 italic">{contract.financialNotes}</p>}
          {canApproveFinancial &&
            contract.status === 'PENDING_FINANCIAL' &&
            contract.legalApprovalStatus === 'APPROVED' &&
            (!contract.financialApprovalStatus || contract.financialApprovalStatus === 'PENDING') && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setApprovalModal({ type: 'financial' })}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Aprovar
                </button>
                <button
                  onClick={() => setApprovalModal({ type: 'financial' })}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Rejeitar
                </button>
              </div>
            )}
        </div>

        {/* Signer Management */}
        <SignerManagement contract={contract} leadId={leadId} />

        {/* Payment Schedule */}
        {contract.payments && contract.payments.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">Parcelas</h5>
            <PaymentScheduleTable payments={contract.payments} />
          </div>
        )}

        {/* Addendum Section */}
        {contract.status !== 'CANCELLED' && (isSigned || contract.status === 'SENT') && (
          <AddendumSection
            contractId={contract.id}
            contractCode={contract.code}
            contractSigners={contract.signers?.map((s: any) => ({ name: s.name, email: s.email, role: s.role, cpf: s.cpf }))}
          />
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-neutral-100">
          {contract.documentUrl && (
            <>
              <button
                onClick={() =>
                  getDocUrl.mutate(
                    { id: contract.id },
                    { onSuccess: (data) => { if (data?.url) window.open(data.url, '_blank'); } },
                  )
                }
                disabled={getDocUrl.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Visualizar
              </button>
              <button
                onClick={() =>
                  getDocUrl.mutate(
                    { id: contract.id },
                    {
                      onSuccess: async (data) => {
                        if (!data?.url) return;
                        const res = await fetch(data.url);
                        const blob = await res.blob();
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = `${contract.code}.pdf`;
                        a.click();
                        URL.revokeObjectURL(a.href);
                      },
                    },
                  )
                }
                disabled={getDocUrl.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-700 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </>
          )}
          {isSigned && (
            <button
              onClick={() =>
                getSignedDocUrl.mutate(
                  { id: contract.id },
                  { onSuccess: (data) => { if (data?.url) window.open(data.url, '_blank'); } },
                )
              }
              disabled={getSignedDocUrl.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              {getSignedDocUrl.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
              Ver Contrato Assinado
            </button>
          )}
          {(contract.status === 'PENDING_LEGAL' || contract.status === 'DRAFT') && (
            <button
              onClick={() => {
                if (confirm('Tem certeza que deseja excluir este contrato?')) {
                  deleteContractMutation.mutate({ id: contract.id });
                }
              }}
              disabled={deleteContractMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          )}
          {canGenDoc && (
            <button
              onClick={() => generateDocMutation.mutate(contract.id)}
              disabled={generateDocMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {generateDocMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Gerar Documento
            </button>
          )}
          {bothApproved && contract.documentUrl && !contract.clicksignEnvelopeId && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              Documento Gerado
            </span>
          )}
          {canSendContract && (
            <button
              onClick={() => {
                const reps = (contract.signers || []).filter((s: any) => s.role === 'SCHOOL_REPRESENTATIVE').length;
                const wit = (contract.signers || []).filter((s: any) => s.role === 'WITNESS').length;
                if (reps < 1) {
                  toast.error('Adicione ao menos 1 representante da escola antes de enviar');
                  return;
                }
                if (wit < 2) {
                  toast.error('Adicione ao menos 2 testemunhas antes de enviar');
                  return;
                }
                sendForSignature.mutate({ id: contract.id });
              }}
              disabled={sendForSignature.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {sendForSignature.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar para Assinatura
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => setCancelModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Ban className="w-4 h-4" />
              Cancelar Contrato
            </button>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {approvalModal && (
        <ApprovalModal
          type={approvalModal.type}
          onClose={() => setApprovalModal(null)}
          onSubmit={(decision, notes) => {
            onApproval(contract.id, approvalModal.type, decision, notes);
            setApprovalModal(null);
          }}
          isPending={approvalPending}
        />
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <CancelModal
          onClose={() => setCancelModal(false)}
          onConfirm={(reason) => {
            cancelContract.mutate(
              { id: contract.id, reason },
              { onSuccess: () => setCancelModal(false) },
            );
          }}
          isPending={cancelContract.isPending}
        />
      )}
    </div>
  );
}
