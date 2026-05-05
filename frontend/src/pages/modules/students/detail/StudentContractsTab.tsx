import { useState } from 'react';
import { FileSignature, CheckCircle, Clock, Send, AlertCircle, Loader2, Eye, Download, FileText } from 'lucide-react';
import { useLeadContracts } from '@/hooks/useContracts';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import type { Contract } from '@/types/contract';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  DRAFT: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700', icon: Clock },
  PENDING_LEGAL: { label: 'Aguardando Aprovação', color: 'bg-amber-100 text-amber-700', icon: Clock },
  PENDING_FINANCIAL: { label: 'Aguardando Aprovação', color: 'bg-amber-100 text-amber-700', icon: Clock },
  SENT: { label: 'Aguardando Assinatura', color: 'bg-blue-100 text-blue-700', icon: Send },
  SIGNED: { label: 'Assinado', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  ACTIVE: { label: 'Ativo', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const TYPE_LABELS: Record<string, string> = {
  FIRST: 'Matrícula',
  RENEWAL: 'Rematrícula',
};

const formatBRL = (value: number | null) =>
  value != null
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    : '—';

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR') : '—';

interface Props {
  leadId: string;
}

export function StudentContractsTab({ leadId }: Props) {
  const { data, isLoading } = useLeadContracts(leadId);
  const contracts: Contract[] = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="text-center py-12">
        <FileSignature className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
        <p className="text-sm text-neutral-500">Nenhum contrato encontrado para este aluno.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {contracts.map((contract) => {
        const status = STATUS_CONFIG[contract.status] ?? STATUS_CONFIG.DRAFT;
        const StatusIcon = status.icon;
        const signers = contract.signers ?? [];
        const signedCount = signers.filter((s) => s.hasSigned).length;

        return (
          <div key={contract.id} className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-50 rounded-lg">
                  <FileSignature className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-900">{contract.code}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                      {TYPE_LABELS[contract.enrollmentType ?? ''] ?? contract.enrollmentType ?? 'Contrato'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Criado em {formatDate(contract.createdAt)}
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
                <StatusIcon className="w-3.5 h-3.5" />
                {status.label}
              </span>
            </div>

            {/* Financial summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-neutral-50 rounded-lg p-3">
                <span className="text-[10px] font-medium text-neutral-500 uppercase">Valor Anual</span>
                <p className="text-sm font-semibold text-neutral-900 mt-0.5">{formatBRL(contract.totalAnnualValue ?? null)}</p>
              </div>
              <div className="bg-neutral-50 rounded-lg p-3">
                <span className="text-[10px] font-medium text-neutral-500 uppercase">Parcelas</span>
                <p className="text-sm font-semibold text-neutral-900 mt-0.5">{contract.installments}x</p>
              </div>
              {contract.discountPercent != null && contract.discountPercent > 0 && (
                <div className="bg-neutral-50 rounded-lg p-3">
                  <span className="text-[10px] font-medium text-neutral-500 uppercase">Desconto</span>
                  <p className="text-sm font-semibold text-emerald-700 mt-0.5">{contract.discountPercent}%</p>
                </div>
              )}
              {contract.enrollmentFee != null && contract.enrollmentFee > 0 && (
                <div className="bg-neutral-50 rounded-lg p-3">
                  <span className="text-[10px] font-medium text-neutral-500 uppercase">Entrada</span>
                  <p className="text-sm font-semibold text-neutral-900 mt-0.5">{formatBRL(contract.enrollmentFee ?? null)}</p>
                </div>
              )}
            </div>

            {/* Signers */}
            {signers.length > 0 && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2">
                  Signatários ({signedCount}/{signers.length} assinaram)
                </h4>
                <div className="space-y-1.5">
                  {signers.map((signer) => (
                    <div key={signer.id} className="flex items-center justify-between py-1.5 px-3 bg-neutral-50 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        {signer.hasSigned ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        )}
                        <span className="font-medium text-neutral-800">{signer.name}</span>
                        <span className="text-neutral-400">{signer.email}</span>
                      </div>
                      <span className={signer.hasSigned ? 'text-emerald-600' : 'text-neutral-400'}>
                        {signer.hasSigned && signer.signedAt
                          ? `Assinado em ${formatDate(signer.signedAt)}`
                          : 'Pendente'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {(contract.documentUrl || contract.signedDocumentUrl) && (
              <div className="flex flex-wrap gap-2 mb-3">
                {contract.documentUrl && (
                  <DocumentButton contractId={contract.id} type="document" label="Ver Contrato" />
                )}
                {contract.signedDocumentUrl && (
                  <DocumentButton contractId={contract.id} type="signed-document" label="Ver Contrato Assinado" />
                )}
              </div>
            )}

            {/* Timeline */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-neutral-500 border-t border-neutral-100 pt-3">
              {contract.sentAt && <span>Enviado: {formatDate(contract.sentAt)}</span>}
              {contract.signedAt && <span>Assinado: {formatDate(contract.signedAt)}</span>}
              {contract.activatedAt && <span>Ativado: {formatDate(contract.activatedAt)}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DocumentButton({ contractId, type, label }: { contractId: string; type: 'document' | 'signed-document'; label: string }) {
  const [loading, setLoading] = useState(false);
  const isSigned = type === 'signed-document';

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/contracts/${contractId}/${type}`);
      const url = res.data?.data?.url;
      if (url) {
        window.open(url, '_blank');
      } else {
        toast.error('Documento não disponível.');
      }
    } catch {
      toast.error('Erro ao obter documento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${
        isSigned
          ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
          : 'text-violet-700 bg-violet-50 border-violet-200 hover:bg-violet-100'
      }`}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isSigned ? <CheckCircle className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}
