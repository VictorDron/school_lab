import type { DashboardStats } from './types';

interface VivenciaMetricsProps {
  vivencia: DashboardStats['vivencia'];
  visits: DashboardStats['visits'];
}

interface RateBarProps {
  label: string;
  rate: number;
  color: string;
}

function RateBar({ label, rate, color }: RateBarProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-neutral-700">{label}</span>
        <span className="text-2xl font-bold text-neutral-900">{rate.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, rate)}%`, background: color }}
        />
      </div>
    </div>
  );
}

interface CountRowProps {
  items: { label: string; value: number; color: string }[];
}

function CountRow({ items }: CountRowProps) {
  return (
    <div className="flex gap-3 flex-wrap mt-2 mb-5">
      {items.map((item) => (
        <div key={item.label} className="text-center min-w-[56px]">
          <p className="text-lg font-bold" style={{ color: item.color }}>
            {item.value}
          </p>
          <p className="text-[10px] text-neutral-500 leading-tight">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 my-4">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
        {label}
      </span>
      <div className="flex-1 h-px bg-neutral-100" />
    </div>
  );
}

export function VivenciaMetrics({ vivencia, visits }: VivenciaMetricsProps) {
  const v = vivencia ?? {
    total: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
    attendanceRate: 0,
    approvalRate: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
  };

  const vi = visits ?? {
    total: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
    completionRate: 0,
  };

  return (
    <div>
      <SectionDivider label="Visitas" />
      <RateBar label="Taxa de Conclusão" rate={vi.completionRate ?? 0} color="#0aacce" />
      <CountRow
        items={[
          { label: 'Total', value: vi.total, color: '#64748b' },
          { label: 'Concluídas', value: vi.completed, color: '#10b981' },
          { label: 'Canceladas', value: vi.cancelled, color: '#f59e0b' },
          { label: 'Não Compareceu', value: vi.noShow, color: '#ef4444' },
        ]}
      />

      <SectionDivider label="Vivências" />
      <RateBar label="Taxa de Presença" rate={v.attendanceRate ?? 0} color="#8b5cf6" />
      <CountRow
        items={[
          { label: 'Total', value: v.total, color: '#64748b' },
          { label: 'Concluídas', value: v.completed, color: '#10b981' },
          { label: 'Canceladas', value: v.cancelled, color: '#f59e0b' },
          { label: 'Não Compareceu', value: v.noShow, color: '#ef4444' },
        ]}
      />

      <SectionDivider label="Avaliações" />
      <RateBar label="Taxa de Aprovação" rate={v.approvalRate ?? 0} color="#10b981" />
      <CountRow
        items={[
          { label: 'Aprovadas', value: v.approved, color: '#10b981' },
          { label: 'Rejeitadas', value: v.rejected, color: '#ef4444' },
          { label: 'Pendentes', value: v.pending, color: '#f59e0b' },
        ]}
      />
    </div>
  );
}
