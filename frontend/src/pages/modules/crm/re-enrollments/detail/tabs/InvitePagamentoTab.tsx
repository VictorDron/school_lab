import { DollarSign, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { InviteDetail } from '@/hooks/useReEnrollmentInvite';

interface InvitePagamentoTabProps {
  detail: InviteDetail;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PIX: 'PIX',
  BOLETO: 'Boleto',
  CARD: 'Cartão',
  TRANSFER: 'Transferência',
  CASH: 'Dinheiro',
};

export function InvitePagamentoTab({ detail }: InvitePagamentoTabProps) {
  const { feePayment } = detail;

  if (!feePayment) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-8">
        <div className="text-center max-w-md mx-auto">
          <DollarSign className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-neutral-700">
            Taxa de matrícula não registrada
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            O registro é feito na aba Gestão de Rematrícula, após a assinatura do
            contrato. Uma vez registrado, aparece aqui com valor, método e comprovante.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-white border border-neutral-200 rounded-lg p-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-emerald-50 rounded-lg">
          <DollarSign className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">
            Taxa de matrícula paga
          </h3>
          <p className="text-[11px] text-neutral-500">
            Registrado{' '}
            {formatDistanceToNow(new Date(feePayment.createdAt), {
              addSuffix: true,
              locale: ptBR,
            })}{' '}
            por {feePayment.registeredBy.displayName}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <Field label="Valor pago" value={formatCurrency(feePayment.amountPaid)} strong />
        <Field
          label="Data do pagamento"
          value={new Date(feePayment.paymentDate).toLocaleDateString('pt-BR')}
        />
        <Field
          label="Método"
          value={PAYMENT_METHOD_LABELS[feePayment.paymentMethod] || feePayment.paymentMethod}
        />
      </dl>

      {feePayment.receiptUrl && (
        <div className="mt-4">
          <a
            href={feePayment.receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Ver comprovante
          </a>
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] text-neutral-500 uppercase tracking-wide">{label}</dt>
      <dd
        className={`${strong ? 'text-lg font-bold' : 'text-sm font-medium'} text-neutral-900`}
      >
        {value}
      </dd>
    </div>
  );
}

function formatCurrency(value: string): string {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
