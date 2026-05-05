import { useDashboardStats } from '@/hooks/useLeads';
import { DashboardCard } from './DashboardCard';
import { SummaryCards } from './SummaryCards';
import { ConversionFunnel } from './ConversionFunnel';
import { SourceChart } from './SourceChart';
import { GradeRanking } from './GradeRanking';
import { MonthlyTrendChart } from './MonthlyTrendChart';
import { VivenciaMetrics } from './VivenciaMetrics';
import { FinancialSummary } from './FinancialSummary';
import { DepartmentTable } from './DepartmentTable';
import { DocumentMetrics } from './DocumentMetrics';
import { DemographicsCard } from './DemographicsCard';

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-neutral-200 shadow-sm p-6 animate-pulse ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="h-4 w-40 bg-neutral-200 rounded" />
        <div className="h-4 w-16 bg-neutral-100 rounded" />
      </div>
      <div className="space-y-3">
        <div className="h-3 w-full bg-neutral-100 rounded" />
        <div className="h-3 w-4/5 bg-neutral-100 rounded" />
        <div className="h-3 w-3/5 bg-neutral-100 rounded" />
      </div>
      <div className="mt-4 h-32 bg-neutral-100 rounded-lg" />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6">
      {/* Summary cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4 animate-pulse">
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 bg-neutral-200 rounded-lg" />
            </div>
            <div className="h-8 w-16 bg-neutral-200 rounded mb-2" />
            <div className="h-3 w-24 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>

      {/* Funnel skeleton */}
      <SkeletonCard />

      {/* 2-col grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Full-width skeletons */}
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

export function CRMDashboardView() {
  const { data: response, isLoading, isError } = useDashboardStats();
  const data = response?.data;

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto bg-neutral-50">
        <LoadingSkeleton />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="h-full overflow-y-auto bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500 text-sm">Não foi possível carregar as métricas.</p>
          <p className="text-neutral-400 text-xs mt-1">Verifique sua conexão e tente novamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-neutral-50">
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Summary row */}
        <SummaryCards summary={data.summary} />

        {/* Funnel — full width */}
        <DashboardCard title="Saúde do Funil de Admissão" badge="ESTE ANO">
          <ConversionFunnel funnel={data.funnel} />
        </DashboardCard>

        {/* 2-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardCard title="Leads por Origem" badge="ESTE ANO">
            <SourceChart bySource={data.bySource} />
          </DashboardCard>

          <DashboardCard title="Tendência de Admissões" badge="12 MESES">
            <MonthlyTrendChart monthlyTrend={data.monthlyTrend} />
          </DashboardCard>

          <DashboardCard title="Séries Mais Procuradas" badge="ESTE ANO">
            <GradeRanking byGrade={data.byGrade} />
          </DashboardCard>

          <DashboardCard title="Faturamento" badge="CONTRATOS">
            <FinancialSummary financial={data.financial} />
          </DashboardCard>

          <DashboardCard title="Visitas & Vivências" badge="ESTE ANO">
            <VivenciaMetrics vivencia={data.vivencia} visits={data.visits} />
          </DashboardCard>

          <DashboardCard title="Documentação" badge="STATUS">
            <DocumentMetrics documents={data.documents} />
          </DashboardCard>
        </div>

        {/* Full width sections */}
        <DashboardCard title="Performance por Departamento" badge="ESTE ANO">
          <DepartmentTable departments={data.departmentPerformance} />
        </DashboardCard>

        <DashboardCard title="Perfil Demográfico" badge="TODOS">
          <DemographicsCard demographics={data.demographics} />
        </DashboardCard>
      </div>
    </div>
  );
}
