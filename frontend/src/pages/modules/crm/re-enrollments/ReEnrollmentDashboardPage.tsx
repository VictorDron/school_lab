import { useState } from 'react';
import { Loader2, Bell, BellOff } from 'lucide-react';
import { useReEnrollmentDashboard, useReEnrollmentFunnel, useReEnrollmentBottlenecks, useScheduleReminders, useRemoveReminders } from '@/hooks/useReEnrollmentDashboard';
import { gradeOptions } from '@/constants/grades';
import PeriodSummaryCards from './components/PeriodSummaryCards';
import InviteProgressChart from './components/InviteProgressChart';
import InviteManagementTable from './components/InviteManagementTable';
import PeriodTimeline from './components/PeriodTimeline';
import PeriodReport from './components/PeriodReport';
import FunnelChart from './components/FunnelChart';
import BottleneckPanel from './components/BottleneckPanel';
import OverdueFamiliesTable from './components/OverdueFamiliesTable';
import { DashboardCard } from '@/pages/modules/crm/dashboard/DashboardCard';

interface ReEnrollmentDashboardPageProps {
  periodId: string;
  eligibleGrades: string[];
}

export default function ReEnrollmentDashboardPage({ periodId, eligibleGrades }: ReEnrollmentDashboardPageProps) {
  const [grade, setGrade] = useState<string | undefined>(undefined);
  const { data, isLoading } = useReEnrollmentDashboard(periodId, { grade });
  const { data: funnelData, isLoading: funnelLoading } = useReEnrollmentFunnel(periodId);
  const { data: bottleneckData, isLoading: bottleneckLoading } = useReEnrollmentBottlenecks(periodId);
  const scheduleReminders = useScheduleReminders();
  const removeReminders = useRemoveReminders();

  const filteredGrades = gradeOptions.filter((g) => eligibleGrades.includes(g.value));

  const stats = data?.data;
  const periodStatus = stats?.period?.status;
  const isClosedOrFinalized = periodStatus === 'CLOSED' || periodStatus === 'FINALIZED';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-neutral-400 text-sm">
        Dados do dashboard não disponíveis.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Grade filter + reminder controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-neutral-600">Filtrar por série:</label>
          <select
            value={grade || ''}
            onChange={(e) => setGrade(e.target.value || undefined)}
            className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
          >
            <option value="">Todas as séries</option>
            {filteredGrades.map((g) => (
              <option key={g.value} value={g.value}>
                {g.value}
              </option>
            ))}
          </select>
        </div>

        {!isClosedOrFinalized && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => scheduleReminders.mutate(periodId)}
              disabled={scheduleReminders.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-700 border border-cyan-300 rounded-lg hover:bg-cyan-50 disabled:opacity-50 transition-colors"
            >
              {scheduleReminders.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Bell className="w-3.5 h-3.5" />
              )}
              Agendar Lembretes
            </button>
            <button
              onClick={() => removeReminders.mutate(periodId)}
              disabled={removeReminders.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 disabled:opacity-50 transition-colors"
            >
              {removeReminders.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <BellOff className="w-3.5 h-3.5" />
              )}
              Parar Lembretes
            </button>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <PeriodSummaryCards stats={stats} />

      {/* Charts + Timeline row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DashboardCard title="Distribuição de Convites" className="lg:col-span-2">
          <InviteProgressChart stats={stats} />
        </DashboardCard>
        <DashboardCard title="Linha do Tempo">
          <PeriodTimeline periodId={periodId} />
        </DashboardCard>
      </div>

      {/* Invite management table */}
      <DashboardCard title="Gerenciamento de Convites">
        <InviteManagementTable periodId={periodId} grade={grade} periodEndDate={stats?.period?.endDate} />
      </DashboardCard>

      {/* Funnel, bottleneck, and overdue section */}
      {(funnelLoading || bottleneckLoading) ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
        </div>
      ) : (
        <>
          {funnelData?.data?.stages && funnelData.data.stages.length > 0 && (
            <FunnelChart stages={funnelData.data.stages} />
          )}
          {(bottleneckData?.data?.bottlenecks || bottleneckData?.data?.overdueInvites) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {bottleneckData?.data?.bottlenecks && (
                <BottleneckPanel bottlenecks={bottleneckData.data.bottlenecks} />
              )}
              {bottleneckData?.data?.overdueInvites && (
                <OverdueFamiliesTable overdueInvites={bottleneckData.data.overdueInvites} />
              )}
            </div>
          )}
        </>
      )}

      {/* Report section for CLOSED/FINALIZED */}
      {isClosedOrFinalized && (
        <DashboardCard title="Relatório Final">
          <PeriodReport periodId={periodId} />
        </DashboardCard>
      )}
    </div>
  );
}
