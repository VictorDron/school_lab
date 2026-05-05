import type { DashboardStats } from './types';

interface FinancialSummaryProps {
  financial: DashboardStats['financial'];
}

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

const BRL_DECIMAL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

interface MiniMetricProps {
  label: string;
  value: string;
}

function MiniMetric({ label, value }: MiniMetricProps) {
  return (
    <div className="bg-neutral-50 rounded-lg p-3 text-center">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className="text-base font-bold text-neutral-900">{value}</p>
    </div>
  );
}

export function FinancialSummary({ financial }: FinancialSummaryProps) {
  const f = financial ?? {
    projectedRevenue: 0,
    avgTicket: 0,
    avgDiscount: 0,
    enrollmentFees: 0,
    signatureRate: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
  };

  const totalPayments = f.paid + f.pending + f.overdue;
  const paidPct = totalPayments > 0 ? (f.paid / totalPayments) * 100 : 0;
  const pendingPct = totalPayments > 0 ? (f.pending / totalPayments) * 100 : 0;
  const overduePct = totalPayments > 0 ? (f.overdue / totalPayments) * 100 : 0;

  return (
    <div>
      {/* Hero revenue */}
      <div className="mb-5">
        <p className="text-xs text-neutral-500 mb-1">Receita Projetada</p>
        <p className="text-3xl font-bold text-neutral-900">{BRL.format(f.projectedRevenue)}</p>
      </div>

      {/* Mini metrics grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <MiniMetric
          label="Ticket Médio"
          value={BRL_DECIMAL.format(f.avgTicket)}
        />
        <MiniMetric
          label="Desconto Médio"
          value={`${(f.avgDiscount ?? 0).toFixed(1)}%`}
        />
        <MiniMetric
          label="Taxas de Matrícula"
          value={BRL_DECIMAL.format(f.enrollmentFees)}
        />
        <MiniMetric
          label="Taxa de Assinatura"
          value={`${(f.signatureRate ?? 0).toFixed(1)}%`}
        />
      </div>

      {/* Payments progress */}
      <div>
        <p className="text-xs font-medium text-neutral-600 mb-2">Pagamentos</p>
        <div className="h-3 rounded-full overflow-hidden flex bg-neutral-100">
          {paidPct > 0 && (
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${paidPct}%` }}
              title={`Pagos: ${f.paid}`}
            />
          )}
          {pendingPct > 0 && (
            <div
              className="h-full bg-amber-400 transition-all"
              style={{ width: `${pendingPct}%` }}
              title={`Pendentes: ${f.pending}`}
            />
          )}
          {overduePct > 0 && (
            <div
              className="h-full bg-red-500 transition-all"
              style={{ width: `${overduePct}%` }}
              title={`Atrasados: ${f.overdue}`}
            />
          )}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-sm bg-emerald-500" />
            {f.paid} pagos
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-sm bg-amber-400" />
            {f.pending} pendentes
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-sm bg-red-500" />
            {f.overdue} atrasados
          </span>
        </div>
      </div>
    </div>
  );
}
