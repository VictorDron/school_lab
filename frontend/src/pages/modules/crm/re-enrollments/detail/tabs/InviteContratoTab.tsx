import { useState } from 'react';
import { ScrollText, CheckCircle2, Clock, FileSignature } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { InviteDetail } from '@/hooks/useReEnrollmentInvite';
import CreateRenewalContractModal from '../../components/CreateRenewalContractModal';

interface InviteContratoTabProps {
  detail: InviteDetail;
}

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  PENDING_SIGNATURE: 'Aguardando assinatura',
  SIGNED: 'Assinado',
  ACTIVATED: 'Ativado',
  SENT_TO_ADMIN: 'Enviado à administração',
  CANCELLED: 'Cancelado',
};

const SIGNER_ROLE_LABELS: Record<string, string> = {
  FATHER: 'Pai',
  MOTHER: 'Mãe',
  GUARDIAN: 'Responsável Legal',
  FINANCIAL_RESPONSIBLE: 'Responsável Financeiro',
  SCHOOL: 'Escola',
};

export function InviteContratoTab({ detail }: InviteContratoTabProps) {
  const { contract, invite, period, student, lead, pricing } = detail;
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canCreateContract =
    !contract &&
    invite.gateStatus !== 'RECUSADO' &&
    invite.gateStatus !== 'REMATRICULADO';

  if (!contract) {
    return (
      <>
        <div className="bg-white border border-neutral-200 rounded-lg p-8">
          <div className="text-center max-w-md mx-auto">
            <ScrollText className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-neutral-700">
              Nenhum contrato de renovação criado
            </p>
            <p className="text-xs text-neutral-500 mt-1 mb-4">
              {pricing.computed.finalValue != null ? (
                <>
                  Valor estimado:{' '}
                  <strong className="text-neutral-700">
                    {pricing.computed.finalValue.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </strong>
                  {' '}· Crie o contrato para iniciar a coleta de assinaturas.
                </>
              ) : (
                'Configure a tabela de preços antes de criar o contrato.'
              )}
            </p>
            {canCreateContract && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <FileSignature className="w-4 h-4" />
                Criar contrato de renovação
              </button>
            )}
          </div>
        </div>
        {showCreateModal && (
          <CreateRenewalContractModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            inviteId={invite.id}
            periodId={period.id}
            studentId={student.id}
            studentName={student.fullName}
            studentGrade={student.grade}
            leadId={lead.id}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-4">
      <section className="bg-white border border-neutral-200 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-50 rounded-lg">
              <ScrollText className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Contrato de renovação
              </h3>
              <p className="text-[11px] text-neutral-500">
                Criado{' '}
                {formatDistanceToNow(new Date(contract.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>
          <StatusBadge status={contract.status} />
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mt-4">
          <Field
            label="Valor anual"
            value={contract.totalAnnualValue ? formatCurrency(contract.totalAnnualValue) : '—'}
          />
          <Field
            label="Parcelas"
            value={contract.installments ? `${contract.installments}x` : '—'}
          />
          <Field
            label="Desconto"
            value={
              contract.discountPercent
                ? `${parseFloat(contract.discountPercent).toFixed(1)}%`
                : '—'
            }
          />
          <Field
            label="Taxa de matrícula"
            value={contract.enrollmentFee ? formatCurrency(contract.enrollmentFee) : '—'}
          />
        </dl>

        {contract.sentAt && (
          <p className="text-xs text-neutral-500 mt-3">
            Enviado para assinatura{' '}
            {formatDistanceToNow(new Date(contract.sentAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        )}
        {contract.signedAt && (
          <p className="text-xs text-emerald-700 mt-1">
            Assinado{' '}
            {formatDistanceToNow(new Date(contract.signedAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        )}
      </section>

      {contract.signers.length > 0 && (
        <section className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <header className="px-4 py-2.5 border-b border-neutral-200 bg-neutral-50">
            <h3 className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
              Signatários
            </h3>
          </header>
          <ul className="divide-y divide-neutral-100">
            {contract.signers.map((signer) => (
              <li key={signer.id} className="px-4 py-3 flex items-center gap-3">
                {signer.signedAt ? (
                  <div className="w-7 h-7 bg-emerald-50 rounded-md flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                ) : (
                  <div className="w-7 h-7 bg-amber-50 rounded-md flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {signer.name}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {SIGNER_ROLE_LABELS[signer.role] || signer.role} · {signer.email}
                  </p>
                </div>
                {signer.signedAt && (
                  <span className="text-[11px] text-emerald-700">
                    {formatDistanceToNow(new Date(signer.signedAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'SIGNED' || status === 'ACTIVATED'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'CANCELLED'
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-amber-50 text-amber-700 border-amber-200';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full border ${tone}`}
    >
      {CONTRACT_STATUS_LABELS[status] || status}
    </span>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] text-neutral-500 uppercase tracking-wide">{label}</dt>
      <dd className="text-sm font-medium text-neutral-900">{value}</dd>
    </div>
  );
}

function formatCurrency(value: string): string {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
