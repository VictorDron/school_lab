import { useMemo } from 'react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import type { ImportPreviewResult, DuplicateAction } from '@/types/import';

interface ConfirmStepProps {
  previewData: ImportPreviewResult;
  duplicateActions: Record<number, DuplicateAction>;
  onConfirm: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function ConfirmStep({
  previewData,
  duplicateActions,
  onConfirm,
  onBack,
  isLoading,
}: ConfirmStepProps) {
  const { summary, duplicates } = previewData;

  const counts = useMemo(() => {
    let toCreate = summary.validRows;
    let toSkip = 0;
    let toUpdate = 0;

    for (const dup of duplicates) {
      const action = duplicateActions[dup.rowNumber] || dup.action;
      if (action === 'skip') {
        toSkip++;
        toCreate--;
      } else if (action === 'update') {
        toUpdate++;
        toCreate--;
      }
    }

    return {
      toCreate: Math.max(0, toCreate),
      toSkip,
      toUpdate,
      errors: summary.errorRows,
      families: summary.familyGroups,
    };
  }, [summary, duplicates, duplicateActions]);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Summary panel */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-neutral-900">Resumo da importação</h3>

        <div className="space-y-3">
          <SummaryRow
            label="Alunos a criar"
            value={counts.toCreate}
            color="text-green-600"
          />
          <SummaryRow
            label="Duplicatas ignoradas"
            value={counts.toSkip}
            color="text-yellow-600"
          />
          <SummaryRow
            label="Duplicatas a atualizar"
            value={counts.toUpdate}
            color="text-blue-600"
          />
          <SummaryRow
            label="Linhas com erro (excluídas)"
            value={counts.errors}
            color="text-red-600"
          />
          <div className="border-t border-neutral-200 pt-3">
            <SummaryRow
              label="Famílias detectadas"
              value={counts.families}
              color="text-violet-600"
            />
          </div>
        </div>
      </div>

      {/* Warning box */}
      {counts.errors > 0 && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800">
            As linhas com erro serão ignoradas durante a importação.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={onConfirm}
          disabled={isLoading || counts.toCreate + counts.toUpdate === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Importando...
            </>
          ) : (
            'Confirmar Importação'
          )}
        </button>

        <button
          onClick={onBack}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-neutral-600">{label}</span>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
    </div>
  );
}
