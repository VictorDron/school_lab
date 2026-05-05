import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ScrollText,
  DollarSign,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { InviteDetail } from '@/hooks/useReEnrollmentInvite';
import { InviteFinanceiroSection } from '../InviteFinanceiroSection';

interface InviteResumoTabProps {
  detail: InviteDetail;
}

const GATE_LABELS: Record<string, string> = {
  CONVITE_ENVIADO: 'Convite Enviado',
  FORMULARIO_CONFIRMADO: 'Formulário Confirmado',
  DOCS_APROVADOS: 'Documentos Aprovados',
  CONTRATO_PENDENTE: 'Contrato Pendente',
  CONTRATO_ASSINADO: 'Contrato Assinado',
  TAXA_PAGA: 'Taxa Paga',
  REMATRICULADO: 'Rematriculado',
  RECUSADO: 'Recusado',
};

const NEXT_ACTION: Record<string, string> = {
  CONVITE_ENVIADO: 'Aguardando a família confirmar o formulário de rematrícula.',
  FORMULARIO_CONFIRMADO:
    'Secretaria precisa revisar e aprovar os documentos enviados pela família.',
  DOCS_APROVADOS: 'Admin deve criar o contrato de renovação.',
  CONTRATO_PENDENTE: 'Aguardando assinatura eletrônica do contrato.',
  CONTRATO_ASSINADO: 'Financeiro deve registrar o pagamento da taxa de matrícula.',
  TAXA_PAGA: 'Pronto para concluir a rematrícula do aluno.',
  REMATRICULADO: 'Fluxo concluído.',
  RECUSADO: 'Família recusou a rematrícula.',
};

export function InviteResumoTab({ detail }: InviteResumoTabProps) {
  const { invite, documents, contract, feePayment } = detail;

  const docCounts = {
    total: documents.length,
    approved: documents.filter((d) => d.status === 'APPROVED').length,
    pending: documents.filter((d) => d.status === 'PENDING').length,
    rejected: documents.filter((d) => d.status === 'REJECTED').length,
  };

  const hasDocIssues = docCounts.pending > 0 || docCounts.rejected > 0;

  return (
    <div className="space-y-4">
      {/* Etapa atual */}
      <section className="bg-white border border-neutral-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary-50 rounded-lg flex-shrink-0">
            <ClipboardList className="w-5 h-5 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-neutral-900">
              {GATE_LABELS[invite.gateStatus] || invite.gateStatus}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Próxima ação:{' '}
              <span className="text-neutral-700">
                {NEXT_ACTION[invite.gateStatus] || '—'}
              </span>
            </p>
            <p className="text-[11px] text-neutral-400 mt-1">
              Última atualização{' '}
              {formatDistanceToNow(new Date(invite.updatedAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>
        </div>
      </section>

      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatusCard
          icon={<FileText className="w-4 h-4" />}
          title="Documentos"
          primary={`${docCounts.approved}/${docCounts.total} aprovados`}
          secondary={
            hasDocIssues
              ? `${docCounts.pending} pendente(s) · ${docCounts.rejected} reprovado(s)`
              : docCounts.total === 0
                ? 'Nenhum documento enviado'
                : 'Todos revisados'
          }
          tone={hasDocIssues ? 'warning' : docCounts.total === 0 ? 'neutral' : 'success'}
        />
        <StatusCard
          icon={<ScrollText className="w-4 h-4" />}
          title="Contrato"
          primary={contract ? contract.status : 'Não criado'}
          secondary={
            contract
              ? contract.signedAt
                ? `Assinado ${formatDistanceToNow(new Date(contract.signedAt), { addSuffix: true, locale: ptBR })}`
                : 'Aguardando assinatura'
              : 'Criar via aba Contrato'
          }
          tone={contract?.signedAt ? 'success' : contract ? 'warning' : 'neutral'}
        />
        <StatusCard
          icon={<DollarSign className="w-4 h-4" />}
          title="Taxa de matrícula"
          primary={feePayment ? formatCurrency(feePayment.amountPaid) : 'Não paga'}
          secondary={
            feePayment
              ? `Pago em ${new Date(feePayment.paymentDate).toLocaleDateString('pt-BR')} · ${feePayment.paymentMethod}`
              : 'Registre após a assinatura do contrato'
          }
          tone={feePayment ? 'success' : 'neutral'}
        />
      </div>

      <InviteFinanceiroSection detail={detail} />

      {/* Decline reason (RECUSADO) */}
      {invite.gateStatus === 'RECUSADO' && invite.declineReason && (
        <section className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-800">Motivo da recusa</h3>
              <p className="text-sm text-red-700 mt-1">{invite.declineReason}</p>
              {invite.declinedAt && (
                <p className="text-[11px] text-red-600 mt-1">
                  Recusado{' '}
                  {formatDistanceToNow(new Date(invite.declinedAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Overdue warning */}
      {invite.extendedDeadline &&
        new Date(invite.extendedDeadline) < new Date() &&
        invite.gateStatus !== 'REMATRICULADO' &&
        invite.gateStatus !== 'RECUSADO' && (
          <section className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-800">Prazo vencido</h3>
                <p className="text-sm text-amber-700 mt-1">
                  O prazo estendido desta rematrícula já passou. Entre em contato com a
                  família ou estenda novamente via menu de ações.
                </p>
              </div>
            </div>
          </section>
        )}
    </div>
  );
}

function StatusCard({
  icon,
  title,
  primary,
  secondary,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  primary: string;
  secondary: string;
  tone: 'success' | 'warning' | 'neutral';
}) {
  const toneClasses = {
    success: 'text-emerald-700 bg-emerald-50',
    warning: 'text-amber-700 bg-amber-50',
    neutral: 'text-neutral-600 bg-neutral-100',
  }[tone];

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md ${toneClasses}`}>
          {tone === 'success' ? <CheckCircle2 className="w-4 h-4" /> : icon}
        </span>
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
          {title}
        </span>
      </div>
      <p className="text-sm font-semibold text-neutral-900">{primary}</p>
      <p className="text-xs text-neutral-500 mt-0.5">{secondary}</p>
    </div>
  );
}

function formatCurrency(value: string): string {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
