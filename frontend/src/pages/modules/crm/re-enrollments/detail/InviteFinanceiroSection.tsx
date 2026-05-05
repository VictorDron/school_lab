import { useState } from 'react';
import { DollarSign, Edit2, Plus, AlertCircle, Info } from 'lucide-react';
import type { InviteDetail } from '@/hooks/useReEnrollmentInvite';
import type { FamilyPriceException } from '@/types/pre-reenrollment';
import FamilyExceptionModal from '../components/FamilyExceptionModal';

interface InviteFinanceiroSectionProps {
  detail: InviteDetail;
}

const PRE_RESPONSE_LABELS: Record<string, { label: string; tone: string }> = {
  PENDING: { label: 'Aguardando resposta', tone: 'bg-neutral-100 text-neutral-600' },
  AGREED: { label: 'Concordou', tone: 'bg-emerald-50 text-emerald-700' },
  DISAGREED: { label: 'Discordou do reajuste', tone: 'bg-amber-50 text-amber-700' },
  NEGOTIATED: { label: 'Negociado', tone: 'bg-blue-50 text-blue-700' },
};

const FINANCIAL_LABELS: Record<string, { label: string; tone: string }> = {
  ADIMPLENTE: { label: 'Adimplente', tone: 'bg-emerald-50 text-emerald-700' },
  INADIMPLENTE: { label: 'Inadimplente', tone: 'bg-red-50 text-red-700' },
  SEM_CONTRATO: { label: 'Sem contrato', tone: 'bg-neutral-100 text-neutral-600' },
};

const APPROVAL_LABELS: Record<string, { label: string; tone: string }> = {
  PENDING: { label: 'Aguardando aprovação', tone: 'text-amber-700' },
  APPROVED: { label: 'Aprovada', tone: 'text-emerald-700' },
  REJECTED: { label: 'Rejeitada', tone: 'text-red-700' },
};

function formatBRL(value: number | null | undefined): string {
  if (value == null) return '—';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export function InviteFinanceiroSection({ detail }: InviteFinanceiroSectionProps) {
  const { pricing, period, student, lead } = detail;
  const [showExceptionModal, setShowExceptionModal] = useState(false);

  const communicatedValue =
    pricing.preResponse?.communicatedAnnualValue ?? pricing.computed.proposedValue;

  const existingExceptionForModal: FamilyPriceException | undefined = pricing.exception
    ? {
        id: pricing.exception.id,
        periodId: period.id,
        studentId: student.id,
        studentName: student.fullName,
        overrideAnnualValue: pricing.exception.overrideAnnualValue,
        overrideDiscountPercent: pricing.exception.overrideDiscountPercent,
        justification: pricing.exception.justification,
        createdBy: '',
        createdAt: '',
      }
    : undefined;

  const preStatus = pricing.preResponse?.status;
  const preBadge = preStatus ? PRE_RESPONSE_LABELS[preStatus] : null;
  const finBadge = FINANCIAL_LABELS[pricing.financialStatus];
  const exceptionApproval = pricing.exception ? APPROVAL_LABELS[pricing.exception.approvalStatus] : null;

  return (
    <>
      <section className="bg-white border border-neutral-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-primary-600" />
          <h3 className="text-sm font-semibold text-neutral-900">Financeiro</h3>
        </div>

        <div className="space-y-3 text-sm">
          {/* Preço comunicado */}
          <div className="flex items-start justify-between gap-3">
            <div className="text-neutral-600">Preço comunicado</div>
            <div className="text-right">
              <div className="font-semibold text-neutral-900">{formatBRL(communicatedValue)}</div>
              {!pricing.preResponse && (
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Pré-rematrícula não enviada · valor estimado
                </div>
              )}
            </div>
          </div>

          {/* Reajuste */}
          <div className="flex items-center justify-between gap-3">
            <div className="text-neutral-600">Reajuste aplicado</div>
            <div className="text-neutral-900 font-medium">
              {pricing.computed.adjustmentPercent.toFixed(2)}%
            </div>
          </div>

          {/* Exceção */}
          <div className="border-t border-neutral-100 pt-3">
            <div className="flex items-start justify-between gap-3">
              <div className="text-neutral-600">Exceção familiar</div>
              {pricing.exception ? (
                <button
                  type="button"
                  onClick={() => setShowExceptionModal(true)}
                  className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  <Edit2 className="w-3 h-3" />
                  Editar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowExceptionModal(true)}
                  className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  <Plus className="w-3 h-3" />
                  Criar exceção
                </button>
              )}
            </div>
            {pricing.exception && (
              <div className="mt-1.5 text-xs space-y-0.5">
                <div className="text-neutral-700">
                  {pricing.exception.overrideAnnualValue != null && (
                    <span>Valor fixo: <strong>{formatBRL(pricing.exception.overrideAnnualValue)}</strong></span>
                  )}
                  {pricing.exception.overrideDiscountPercent != null && (
                    <span>Desconto: <strong>{pricing.exception.overrideDiscountPercent}%</strong></span>
                  )}
                </div>
                <div className="text-neutral-500" title={pricing.exception.justification}>
                  {truncate(pricing.exception.justification, 80)}
                </div>
                {exceptionApproval && (
                  <div className={`text-[11px] font-medium ${exceptionApproval.tone}`}>
                    {exceptionApproval.label}
                    {pricing.exception.approvalStatus === 'PENDING' && (
                      <span className="ml-1 text-neutral-500 font-normal">
                        (não aplicada ao valor final)
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status pré-rematrícula */}
          <div className="flex items-center justify-between gap-3 border-t border-neutral-100 pt-3">
            <div className="text-neutral-600">Pré-rematrícula</div>
            {preBadge ? (
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${preBadge.tone}`}>
                  {preBadge.label}
                </span>
                {preStatus === 'DISAGREED' && pricing.preResponse?.disagreementReason && (
                  <span
                    className="text-amber-600 cursor-help"
                    title={pricing.preResponse.disagreementReason}
                  >
                    <Info className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-neutral-400">Não enviada</span>
            )}
          </div>

          {/* Adimplência */}
          <div className="flex items-center justify-between gap-3 border-t border-neutral-100 pt-3">
            <div className="text-neutral-600">Adimplência</div>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${finBadge.tone}`}>
              {finBadge.label}
            </span>
          </div>

          {/* Sem priceTable */}
          {!pricing.priceTableEntry && student.grade && (
            <div className="border-t border-neutral-100 pt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 -mx-4 -mb-4 px-4 py-2.5 rounded-b-lg">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                Tabela de preços não configurada para a série <strong>{student.grade}</strong> nesta
                campanha. Configure em Pré-Rematrícula → Tabela de Preços.
              </span>
            </div>
          )}
        </div>
      </section>

      {showExceptionModal && (
        <FamilyExceptionModal
          isOpen={showExceptionModal}
          onClose={() => setShowExceptionModal(false)}
          periodId={period.id}
          studentId={student.id}
          studentName={student.fullName || lead.familyName}
          existingException={existingExceptionForModal}
        />
      )}
    </>
  );
}
