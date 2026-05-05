import { useState } from 'react';
import { Download, ChevronDown, ChevronRight, Loader2, FileText } from 'lucide-react';
import { useReEnrollmentReport, useExportReport } from '@/hooks/useReEnrollmentDashboard';
import type { ReEnrollmentInviteFull } from '@/types/re-enrollment';

interface PeriodReportProps {
  periodId: string;
}

function CollapsibleSection({
  title,
  count,
  color,
  items,
}: {
  title: string;
  count: number;
  color: string;
  items: ReEnrollmentInviteFull[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 hover:bg-neutral-100 transition-colors text-sm"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />}
          <span className="font-medium text-neutral-800">{title}</span>
        </div>
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${color}`}>
          {count}
        </span>
      </button>
      {open && items.length > 0 && (
        <div className="divide-y divide-neutral-100">
          {items.map((inv) => (
            <div key={inv.id} className="px-4 py-2 flex items-center justify-between text-sm">
              <div>
                <span className="font-medium text-neutral-800">{inv.student?.fullName || '—'}</span>
                <span className="ml-2 text-xs text-neutral-400 font-mono">{inv.student?.code}</span>
              </div>
              <span className="text-xs text-neutral-500">{inv.student?.grade || '—'}</span>
            </div>
          ))}
        </div>
      )}
      {open && items.length === 0 && (
        <div className="px-4 py-3 text-xs text-neutral-400">Nenhum registro nesta categoria.</div>
      )}
    </div>
  );
}

export default function PeriodReport({ periodId }: PeriodReportProps) {
  const { data, isLoading } = useReEnrollmentReport(periodId, true);
  const [exporting, setExporting] = useState(false);
  const report = data?.data;

  const handleExport = async () => {
    setExporting(true);
    try {
      await useExportReport(periodId);
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-6 text-neutral-400 text-sm">
        Relatório não disponível.
      </div>
    );
  }

  const statBoxes = [
    { label: 'Confirmados', value: report.summary.confirmed, color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Não Respondidos', value: report.summary.nonResponded, color: 'bg-amber-100 text-amber-700' },
    { label: 'Recusados', value: report.summary.declined, color: 'bg-red-100 text-red-700' },
    { label: 'Expirados', value: report.summary.expired, color: 'bg-neutral-100 text-neutral-600' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-neutral-500" />
          <h3 className="text-sm font-semibold text-neutral-800">Relatório da Campanha</h3>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-cyan-700 border border-cyan-300 rounded-lg hover:bg-cyan-50 disabled:opacity-50 transition-colors"
        >
          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statBoxes.map((box) => (
          <div key={box.label} className={`rounded-lg px-4 py-3 ${box.color}`}>
            <div className="text-2xl font-bold">{box.value}</div>
            <div className="text-xs font-medium mt-0.5">{box.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <CollapsibleSection
          title="Confirmados"
          count={report.summary.confirmed}
          color="bg-emerald-100 text-emerald-700"
          items={report.confirmed}
        />
        <CollapsibleSection
          title="Não Respondidos"
          count={report.summary.nonResponded}
          color="bg-amber-100 text-amber-700"
          items={report.nonResponded}
        />
        <CollapsibleSection
          title="Recusados"
          count={report.summary.declined}
          color="bg-red-100 text-red-700"
          items={report.declined}
        />
        <CollapsibleSection
          title="Expirados"
          count={report.summary.expired}
          color="bg-neutral-100 text-neutral-600"
          items={report.expired}
        />
      </div>
    </div>
  );
}
