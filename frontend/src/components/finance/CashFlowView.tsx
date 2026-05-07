import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowDownRight, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { financeApi, formatBRL, payableCategoryLabel, statusLabel } from '@/lib/api/finance';

export default function CashFlowView() {
  const { data, isLoading } = useQuery({ queryKey: ['finance', 'cash-flow'], queryFn: financeApi.getCashFlow });

  return (
    <div className="max-w-[1320px] mx-auto px-6 lg:px-12 py-10">
      <header className="pb-8 border-b border-rule">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-iris mb-3">— i. Visão Executiva</div>
        <h1 className="font-display font-light text-ink leading-none" style={{ fontSize: 'clamp(36px, 4vw, 56px)', letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}>
          <em className="display-em">Fluxo de Caixa</em>
          <span className="text-iris">.</span>
        </h1>
        <p className="serif-em text-stone-deep mt-3" style={{ fontSize: 16 }}>
          — A receita prevista, a despesa programada, e onde estamos agora
        </p>
      </header>

      {isLoading ? (
        <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-deep" /></div>
      ) : !data ? null : (
        <>
          {/* Top metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-ink mt-10 border border-ink">
            <SummaryPanel
              eyebrow="— A receber"
              icon={<ArrowDownRight className="w-5 h-5" />}
              total={data.receivables.total}
              statusLine={[
                { label: 'Pago',     value: data.receivables.totalsByStatus.PAID,     count: data.receivables.countsByStatus.PAID },
                { label: 'Pendente', value: data.receivables.totalsByStatus.PENDING,  count: data.receivables.countsByStatus.PENDING },
                { label: 'Atrasado', value: data.receivables.totalsByStatus.OVERDUE,  count: data.receivables.countsByStatus.OVERDUE, alert: true },
              ]}
              accent="iris"
            />
            <SummaryPanel
              eyebrow="— A pagar"
              icon={<ArrowUpRight className="w-5 h-5" />}
              total={data.payables.total}
              statusLine={[
                { label: 'Pago',     value: data.payables.totalsByStatus.PAID,     count: data.payables.countsByStatus.PAID },
                { label: 'Pendente', value: data.payables.totalsByStatus.PENDING,  count: data.payables.countsByStatus.PENDING },
                { label: 'Atrasado', value: data.payables.totalsByStatus.OVERDUE,  count: data.payables.countsByStatus.OVERDUE, alert: true },
              ]}
              accent="ink"
            />
          </div>

          {/* Net position */}
          <div className="border-x border-b border-ink bg-paper p-7 flex flex-col md:flex-row items-baseline justify-between gap-3">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-deep">— Posição líquida (recebido − pago)</div>
            <div
              className="font-display font-light leading-none text-ink"
              style={{ fontSize: 40, letterSpacing: '-0.035em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
            >
              {formatBRL(data.receivables.net - data.payables.net)}
            </div>
          </div>

          {/* Upcoming */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
            <Section title="Próximas cobranças">
              {data.upcomingInvoices.length === 0 ? (
                <Empty />
              ) : (
                <ul>
                  {data.upcomingInvoices.map((inv) => (
                    <UpcomingRow
                      key={inv.id}
                      title={inv.description}
                      sub={inv.student?.fullName ?? 'Sem aluno'}
                      amount={inv.amount}
                      dueDate={inv.dueDate}
                      status={inv.status}
                    />
                  ))}
                </ul>
              )}
            </Section>
            <Section title="Próximas contas">
              {data.upcomingPayables.length === 0 ? (
                <Empty />
              ) : (
                <ul>
                  {data.upcomingPayables.map((p) => (
                    <UpcomingRow
                      key={p.id}
                      title={p.supplierName}
                      sub={`${payableCategoryLabel[p.category]} · ${p.description}`}
                      amount={p.amount}
                      dueDate={p.dueDate}
                      status={p.status}
                    />
                  ))}
                </ul>
              )}
            </Section>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryPanel({
  eyebrow,
  icon,
  total,
  statusLine,
}: {
  eyebrow: string;
  icon: React.ReactNode;
  total: number;
  statusLine: Array<{ label: string; value: number; count: number; alert?: boolean }>;
  accent: 'iris' | 'ink';
}) {
  return (
    <div className="bg-paper p-7">
      <div className="flex items-center justify-between mb-5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-iris">{eyebrow}</span>
        <span className="text-stone-deep">{icon}</span>
      </div>
      <div
        className="font-display font-light leading-none text-ink"
        style={{ fontSize: 56, letterSpacing: '-0.04em', fontVariationSettings: '"opsz" 144, "SOFT" 50' }}
      >
        {formatBRL(total)}
      </div>
      <div className="mt-5 pt-5 border-t border-rule grid grid-cols-3 gap-3">
        {statusLine.map((s) => (
          <div key={s.label}>
            <div className={['font-mono text-[9px] uppercase tracking-[0.14em]', s.alert ? 'text-iris' : 'text-stone-deep'].join(' ')}>
              {s.alert && <AlertTriangle className="w-3 h-3 inline mr-1" />}
              — {s.label}
            </div>
            <div className="text-base font-mono mt-1 text-ink">
              {formatBRL(s.value)}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-stone-deep">
              {s.count} item{s.count === 1 ? '' : 's'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-paper border border-ink">
      <div className="border-b border-ink px-5 py-3 bg-paper-deep">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-deep">— {title}</span>
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return (
    <div className="px-5 py-10 text-center serif-em text-stone-deep" style={{ fontSize: 15 }}>
      — Nada programado nos próximos 6 meses
    </div>
  );
}

function UpcomingRow({
  title,
  sub,
  amount,
  dueDate,
  status,
}: {
  title: string;
  sub: string;
  amount: string | number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
}) {
  const statusColors: Record<typeof status, string> = {
    PENDING: 'badge-neutral',
    PAID: 'badge-success',
    OVERDUE: 'badge-iris',
    CANCELLED: 'badge-error',
  };
  return (
    <li className="px-5 py-3.5 border-b border-rule last:border-b-0 flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink truncate">{title}</div>
        <div className="text-xs text-stone-deep truncate">{sub}</div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={`badge ${statusColors[status]}`}>{statusLabel[status]}</span>
        <div className="text-right">
          <div className="text-sm font-mono font-semibold text-ink">{formatBRL(amount)}</div>
          <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-stone-deep">
            {new Date(dueDate).toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>
    </li>
  );
}
