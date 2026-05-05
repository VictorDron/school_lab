import { DollarSign } from 'lucide-react';
import type { ReEnrollmentFormData } from '@/types/re-enrollment';
import { formatBRL, formatDateBR } from '../formatters';

interface HeaderSectionProps {
  student: ReEnrollmentFormData['student'];
  period: ReEnrollmentFormData['period'];
  suggestedGrade: ReEnrollmentFormData['suggestedGrade'];
  financialInfo?: ReEnrollmentFormData['financialInfo'];
}

export function HeaderSection({ student, period, suggestedGrade, financialInfo }: HeaderSectionProps) {
  const monthlyValue =
    financialInfo?.communicatedAnnualValue != null
      ? financialInfo.communicatedAnnualValue / 12
      : null;
  const adjustment = financialInfo?.communicatedAdjustmentPercent;

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-800 mb-2">
          Confirmação de Rematrícula
        </h1>
        <p className="text-lg text-neutral-600">{student.fullName}</p>
        {suggestedGrade && (
          <p className="text-sm text-neutral-500 mt-1">
            Série sugerida: <strong>{suggestedGrade}</strong>
          </p>
        )}
        <p className="text-sm text-neutral-500 mt-1">
          Prazo: <strong>{formatDateBR(period.endDate)}</strong>
        </p>
        <p className="text-xs text-neutral-400 mt-1">
          {period.name} - {period.targetYear}
        </p>
      </div>

      {monthlyValue != null && (
        <div className="bg-white border-2 border-cyan-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-cyan-50">
              <DollarSign className="w-5 h-5 text-cyan-600" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-800">Informações Financeiras</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-xs font-medium text-neutral-500">Série atual</span>
              <p className="text-sm font-medium text-neutral-900">{student.grade || '—'}</p>
            </div>
            {suggestedGrade && (
              <div>
                <span className="text-xs font-medium text-neutral-500">Série sugerida</span>
                <p className="text-sm font-medium text-neutral-900">{suggestedGrade}</p>
              </div>
            )}
            <div>
              <span className="text-xs font-medium text-neutral-500">Valor da mensalidade</span>
              <p className="text-lg font-bold text-emerald-600">{formatBRL(monthlyValue)}</p>
            </div>
          </div>
          {adjustment != null && adjustment > 0 && (
            <p className="text-xs text-neutral-500 mt-3">
              Reajuste aplicado: {adjustment}%
            </p>
          )}
        </div>
      )}
    </>
  );
}
