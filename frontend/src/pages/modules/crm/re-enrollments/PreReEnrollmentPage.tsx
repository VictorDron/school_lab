import { useState } from 'react';
import {
  Loader2,
  Users,
  UserX,
  CheckCircle,
  AlertTriangle,
  Star,
  ChevronDown,
  Info,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { usePreReEnrollmentDashboard } from '@/hooks/usePreReEnrollment';
import { DashboardCard } from '@/pages/modules/crm/dashboard/DashboardCard';
import PreReEnrollmentTable from './components/PreReEnrollmentTable';
import PriceTableEditor from './components/PriceTableEditor';
import AdjustmentConfig from './components/AdjustmentConfig';
import FamilyExceptionModal from './components/FamilyExceptionModal';
import PreReEnrollmentEmailDispatch from './components/PreReEnrollmentEmailDispatch';
import PreReEnrollmentResponseTracker from './components/PreReEnrollmentResponseTracker';
import PreReEnrollmentReport from './components/PreReEnrollmentReport';
import DiscountImportSection from './components/DiscountImportSection';
import PendingDiscountApprovals from './components/PendingDiscountApprovals';
import type { FamilyPriceException } from '@/types/pre-reenrollment';

interface PreReEnrollmentPageProps {
  periodId: string;
}

export default function PreReEnrollmentPage({ periodId }: PreReEnrollmentPageProps) {
  const queryClient = useQueryClient();
  const { data, isLoading } = usePreReEnrollmentDashboard(periodId);
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
    exception?: FamilyPriceException;
  } | null>(null);
  const [isStudentsExpanded, setIsStudentsExpanded] = useState(false);

  const dashboard = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-12 text-neutral-400 text-sm">
        Dados da pré-rematrícula não disponíveis.
      </div>
    );
  }

  const isLocked =
    dashboard.periodStatus === 'CLOSED' || dashboard.periodStatus === 'FINALIZED';

  const summary = dashboard.summary;

  const cards: Array<{
    label: string;
    value: number;
    icon: typeof Users;
    color: string;
    bg: string;
    tooltip?: string;
  }> = [
    {
      label: 'Total Elegíveis',
      value: summary.total,
      icon: Users,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
      tooltip: 'Alunos ativos do ano letivo anterior nas séries elegíveis para esta campanha.',
    },
    {
      label: 'Sem contrato ainda',
      value: summary.semContrato,
      icon: UserX,
      color: 'text-neutral-600',
      bg: 'bg-neutral-100',
      tooltip: 'Alunos elegíveis que ainda não possuem contrato ativo do ano letivo da campanha.',
    },
    {
      label: 'Adimplentes ano anterior',
      value: summary.adimplente,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      tooltip:
        'Famílias com contrato ativo do ano letivo anterior e sem parcelas em atraso.',
    },
    {
      label: 'Inadimplentes ano anterior',
      value: summary.inadimplente,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      tooltip:
        'Famílias com contrato ativo do ano letivo anterior e ao menos uma parcela em atraso.',
    },
    {
      label: 'Com exceção criada',
      value: summary.withException,
      icon: Star,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      tooltip: 'Alunos com valor ou desconto sobrescritos por exceção nesta campanha.',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <span className="text-xs font-medium text-neutral-500 truncate" title={card.tooltip}>
                  {card.label}
                </span>
                {card.tooltip && (
                  <span title={card.tooltip} aria-label={card.tooltip} className="shrink-0">
                    <Info className="w-3 h-3 text-neutral-300 hover:text-neutral-500 cursor-help" />
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-neutral-900">{card.value}</div>
            </div>
          );
        })}
      </div>

      {/* Price table editor */}
      <DashboardCard title="Tabela de Preços" subtitle="Valores anuais por série e configuração de descontos">
        <AdjustmentConfig
          periodId={periodId}
          currentPercent={dashboard.adjustmentPercent}
          isLocked={isLocked}
        />
        <div className="mt-4 mb-4 border-t border-neutral-200" />
        <PriceTableEditor
          periodId={periodId}
          entries={dashboard.priceTable}
          eligibleGrades={dashboard.eligibleGrades ?? []}
          discountOptions={dashboard.discountOptions ?? []}
          isLocked={isLocked}
        />
      </DashboardCard>

      {/* Pending discount approvals */}
      <PendingDiscountApprovals periodId={periodId} />

      {/* Discount import */}
      {!isLocked && (
        <DiscountImportSection
          periodId={periodId}
          onImportComplete={() => queryClient.invalidateQueries({ queryKey: ['preReEnrollmentDashboard', periodId] })}
        />
      )}

      {/* Family list table — collapsible */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
        <button
          onClick={() => setIsStudentsExpanded(!isStudentsExpanded)}
          className="w-full flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-neutral-800">
              Alunos e Valores ({summary.total})
            </h3>
            <span className="text-xs text-neutral-400">
              {summary.semContrato} sem contrato • {summary.adimplente} adimplentes • {summary.inadimplente} inadimplentes • {summary.withException} com exceção
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-neutral-400 group-hover:text-neutral-600 transition-transform ${isStudentsExpanded ? 'rotate-180' : ''}`} />
        </button>
        {isStudentsExpanded && (
          <div className="mt-3">
            <PreReEnrollmentTable
              students={dashboard.students}
              onAddException={(studentId: string, studentName: string, exception?: { id: string; overrideAnnualValue: number | null; overrideDiscountPercent: number | null; justification: string | null }) =>
                setSelectedStudent({ id: studentId, name: studentName, exception: exception ? { id: exception.id, overrideAnnualValue: exception.overrideAnnualValue, overrideDiscountPercent: exception.overrideDiscountPercent, justification: exception.justification } as any : undefined })
              }
            />
          </div>
        )}
      </div>

      {/* Exception modal */}
      {selectedStudent && (
        <FamilyExceptionModal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          periodId={periodId}
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          existingException={selectedStudent.exception}
        />
      )}

      {/* Divider */}
      <div className="border-t border-neutral-200" />

      {/* Email dispatch */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
        <PreReEnrollmentEmailDispatch
          periodId={periodId}
          students={dashboard.students}
          isLocked={isLocked}
        />
      </div>

      {/* Response tracker */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
        <PreReEnrollmentResponseTracker periodId={periodId} isLocked={isLocked} />
      </div>

      {/* Report */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
        <PreReEnrollmentReport periodId={periodId} />
      </div>
    </div>
  );
}
