import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { useStudentDashboard, useStudentEvolution } from '@/hooks/useStudents';
import { StudentSummaryCards } from './StudentSummaryCards';
import { GradeDistributionChart } from './GradeDistributionChart';
import { StatusDistributionChart } from './StatusDistributionChart';
import { MonthlyEvolutionChart } from './MonthlyEvolutionChart';
import { YearComparisonCards } from './YearComparisonCards';
import { EvasionRateCard } from './EvasionRateCard';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-neutral-100 rounded-2xl h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-neutral-100 rounded-2xl h-[360px]" />
        <div className="bg-neutral-100 rounded-2xl h-[360px]" />
      </div>
    </div>
  );
}

function EvolutionSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="bg-neutral-100 rounded-2xl h-[340px]" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-neutral-100 rounded-xl h-28" />
            ))}
          </div>
        </div>
        <div className="bg-neutral-100 rounded-xl h-28" />
      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  const [academicYear, setAcademicYear] = useState<number | undefined>(CURRENT_YEAR);
  const { data: response, isLoading, isError } = useStudentDashboard({ academicYear });
  const { data: evolutionResponse, isLoading: evolutionLoading } = useStudentEvolution({ academicYear });

  const stats = response?.data;
  const evolution = evolutionResponse?.data;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-neutral-200 px-4 lg:px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg">
            <GraduationCap className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">Dashboard de Alunos</h1>
            <p className="text-xs text-neutral-500">
              Visão geral do corpo discente
            </p>
          </div>
          <div className="ml-auto">
            <select
              value={academicYear ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setAcademicYear(val ? Number(val) : undefined);
              }}
              className="text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white hover:border-neutral-300 transition-colors"
            >
              <option value="">Todos os anos</option>
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-neutral-50/50">
        {isLoading && <LoadingSkeleton />}

        {isError && (
          <div className="flex items-center justify-center h-64">
            <p className="text-red-500 text-sm">
              Erro ao carregar dados do dashboard. Tente novamente.
            </p>
          </div>
        )}

        {stats && (
          <div className="space-y-6">
            <StudentSummaryCards stats={stats} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <GradeDistributionChart data={stats.byGrade} />
              </div>
              <div>
                <StatusDistributionChart data={stats.byStatus} />
              </div>
            </div>

            {/* Evolution section */}
            {evolutionLoading && <EvolutionSkeleton />}

            {evolution && (
              <div className="space-y-6">
                <MonthlyEvolutionChart data={evolution.monthly} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <YearComparisonCards data={evolution.yearOverYear} />
                  </div>
                  <div>
                    <EvasionRateCard rate={evolution.evasionRate} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
