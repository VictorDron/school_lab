import { useState } from 'react';
import {
  Calendar,
  Eye,
  Loader2,
  FileText,
  GraduationCap,
  Ban,
  Pencil,
  Trash2,
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  useReEnrollmentPeriods,
  useTransitionPeriod,
  useUpdatePeriod,
  useDeletePeriod,
} from '@/hooks/useReEnrollmentAdmin';
import { useReEnrollmentDashboard } from '@/hooks/useReEnrollmentDashboard';
import type { ReEnrollmentPeriodFull } from '@/types/re-enrollment';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  ACCENT_GRADIENTS,
  NEXT_TRANSITION,
} from './constants';

export default function PeriodsOverview({
  onSelect,
}: {
  onSelect: (id: string) => void;
}) {
  const { data, isLoading } = useReEnrollmentPeriods();
  const periods = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (periods.length === 0) {
    return <EmptyState />;
  }

  const activePeriods = periods
    .filter((p) => p.status === 'OPEN' || p.status === 'DRAFT')
    .sort((a, b) => (a.status === 'OPEN' ? -1 : b.status === 'OPEN' ? 1 : 0));
  const pastPeriods = periods.filter(
    (p) => p.status === 'CLOSED' || p.status === 'FINALIZED'
  );
  const hasOpenPeriod = activePeriods.some((p) => p.status === 'OPEN');

  return (
    <div className="flex-1 overflow-auto p-4 lg:p-6 space-y-6">
      {activePeriods.map((activePeriod) => (
        <ActivePeriodCard
          key={activePeriod.id}
          period={activePeriod}
          hasOtherOpenPeriod={activePeriod.status === 'DRAFT' && hasOpenPeriod}
          onSelect={() => onSelect(activePeriod.id)}
        />
      ))}

      {pastPeriods.length > 0 && (
        <PastPeriodsSection periods={pastPeriods} onSelect={onSelect} />
      )}

      {activePeriods.length === 0 && pastPeriods.length === 0 && <EmptyState />}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
        <Calendar className="w-10 h-10 text-neutral-300" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-700 mb-1">
        Nenhuma campanha de rematrícula criada
      </h3>
      <p className="text-sm text-neutral-500 mb-4">
        Crie a primeira campanha para começar a gerenciar rematrículas.
      </p>
    </div>
  );
}

function ActivePeriodCard({
  period,
  hasOtherOpenPeriod = false,
  onSelect,
}: {
  period: ReEnrollmentPeriodFull;
  hasOtherOpenPeriod?: boolean;
  onSelect: () => void;
}) {
  const transitionMutation = useTransitionPeriod();
  const deleteMutation = useDeletePeriod();
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: dashboardData, isLoading: dashboardLoading } = useReEnrollmentDashboard(
    period.id,
    {}
  );
  const stats = dashboardData?.data;

  const total = stats?.total ?? period._count?.invites ?? 0;
  const rematriculados = stats?.gateStatusCounts
    ? stats.gateStatusCounts.find((g) => g.gateStatus === 'REMATRICULADO')?._count?._all ?? 0
    : 0;
  const progressPercent = total > 0 ? (rematriculados / total) * 100 : 0;

  const transition = NEXT_TRANSITION[period.status];
  const isDraft = period.status === 'DRAFT';

  if (editing && isDraft) {
    return (
      <EditPeriodInline
        period={period}
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <>
      <div
        className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:outline-none"
        onClick={() => onSelect()}
        role="button"
        tabIndex={0}
        aria-label={`Ver detalhes da campanha ${period.name}`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
      >
        <div className={`h-2 bg-gradient-to-r ${ACCENT_GRADIENTS[period.status]}`} />

        <div className="p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-800 truncate">{period.name}</h2>
            <div className="flex items-center gap-2">
              {isDraft && (
                <button
                  onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                  className="p-1.5 text-neutral-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                  title="Editar campanha"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {period.status !== 'OPEN' && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                  className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir campanha"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[period.status]}`}>
                {STATUS_LABELS[period.status]}
              </span>
            </div>
          </div>

          <div className="mt-1.5 flex items-center gap-3 text-xs text-neutral-500">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(period.startDate), 'dd/MM/yyyy')} - {format(new Date(period.endDate), 'dd/MM/yyyy')}
            </span>
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              {period.eligibleGrades.length} série(s)
            </span>
          </div>

          <div className="mt-4">
            <div className="h-2 bg-neutral-100 rounded-full">
              <div className="h-2 bg-cyan-500 rounded-full transition-all" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-neutral-500">
              {dashboardLoading
                ? 'Calculando progresso...'
                : `${rematriculados} de ${total} rematriculados`}
            </p>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(); }}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> Ver Detalhes
            </button>

            {transition && !hasOtherOpenPeriod && (
              <button
                onClick={(e) => { e.stopPropagation(); transitionMutation.mutate({ id: period.id, status: transition.next }); }}
                disabled={transitionMutation.isPending}
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                {transitionMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {transition.label}
              </button>
            )}

            {hasOtherOpenPeriod && period.status === 'DRAFT' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg">
                <Ban className="w-3.5 h-3.5" /> Feche a campanha aberta antes
              </span>
            )}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmDialog
          period={period}
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(period.id, { onSuccess: () => setShowDeleteConfirm(false) })}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}

function PastPeriodsSection({
  periods,
  onSelect,
}: {
  periods: ReEnrollmentPeriodFull[];
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
        Campanhas Anteriores
      </h3>
      <div className="space-y-2">
        {periods.map((period) => (
          <PastPeriodRow key={period.id} period={period} onSelect={() => onSelect(period.id)} />
        ))}
      </div>
    </div>
  );
}

function PastPeriodRow({
  period,
  onSelect,
}: {
  period: ReEnrollmentPeriodFull;
  onSelect: () => void;
}) {
  const deleteMutation = useDeletePeriod();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const inviteCount = period._count?.invites ?? 0;
  const statusBadgeClass =
    period.status === 'FINALIZED'
      ? 'bg-purple-100 text-purple-700'
      : 'bg-neutral-100 text-neutral-600';

  return (
    <>
      <div
        className="bg-white border border-neutral-200 rounded-xl px-4 py-3.5 hover:shadow-sm transition-shadow flex items-center gap-4 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:outline-none"
        onClick={onSelect}
        role="button"
        tabIndex={0}
        aria-label={`Ver detalhes da campanha ${period.name}`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
      >
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-neutral-400" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-sm font-semibold text-neutral-800 truncate">{period.name}</h4>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadgeClass}`}>
              {STATUS_LABELS[period.status]}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <span>
              {format(new Date(period.startDate), 'dd/MM/yyyy', { locale: ptBR })} —{' '}
              {format(new Date(period.endDate), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
            <span className="text-neutral-300">|</span>
            <span>{inviteCount} convite{inviteCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Excluir campanha"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> Ver Relatório
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmDialog
          period={period}
          isPending={deleteMutation.isPending}
          onConfirm={() => deleteMutation.mutate(period.id, { onSuccess: () => setShowDeleteConfirm(false) })}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}

function EditPeriodInline({
  period,
  onClose,
}: {
  period: ReEnrollmentPeriodFull;
  onClose: () => void;
}) {
  const updateMutation = useUpdatePeriod();
  const [form, setForm] = useState({
    name: period.name,
    targetYear: period.targetYear,
    startDate: new Date(period.startDate).toISOString().slice(0, 16),
    endDate: new Date(period.endDate).toISOString().slice(0, 16),
  });

  const handleSubmit = async () => {
    if (!form.name || !form.startDate || !form.endDate) return;
    await updateMutation.mutateAsync({
      id: period.id,
      data: {
        name: form.name,
        targetYear: form.targetYear,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      },
    });
    onClose();
  };

  return (
    <div className="bg-white border border-cyan-200 rounded-xl shadow-sm overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-cyan-400 to-cyan-600" />
      <div className="p-5 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-700">Editar Campanha</h3>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-600 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-neutral-600 mb-1">Nome</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 mb-1">Ano Letivo Alvo</label>
            <input
              type="number"
              value={form.targetYear}
              onChange={(e) => setForm((f) => ({ ...f, targetYear: Number(e.target.value) }))}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 mb-1">Data de Início</label>
            <input
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 mb-1">Data de Fim</label>
            <input
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSubmit}
            disabled={!form.name || !form.startDate || !form.endDate || updateMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmDialog({
  period,
  isPending,
  onConfirm,
  onCancel,
}: {
  period: ReEnrollmentPeriodFull;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const inviteCount = period._count?.invites ?? 0;
  const hasData = inviteCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-neutral-900">Excluir campanha</h3>
            <p className="text-sm text-neutral-500">{period.name}</p>
          </div>
        </div>

        {hasData ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-amber-800">
              Esta campanha possui <strong>{inviteCount} convite{inviteCount !== 1 ? 's' : ''}</strong>.
              Todos os dados relacionados (convites, respostas, tabela de preços, exceções) serão
              excluídos permanentemente.
            </p>
          </div>
        ) : (
          <p className="text-sm text-neutral-600 mb-4">
            Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Excluindo...' : 'Excluir Campanha'}
          </button>
        </div>
      </div>
    </div>
  );
}
