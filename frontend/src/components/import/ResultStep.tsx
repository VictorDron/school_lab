import { useState } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { ImportResult } from '@/types/import';

interface ResultStepProps {
  result: ImportResult;
  onViewHistory: () => void;
  onNewImport: () => void;
}

export function ResultStep({ result, onViewHistory, onNewImport }: ResultStepProps) {
  const [showErrors, setShowErrors] = useState(false);

  const isSuccess = result.created > 0 || result.updated > 0;
  const total = result.created + result.updated + result.failed + result.skipped;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center py-4">
        {isSuccess ? (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-neutral-900">Importação concluída</h2>
            <p className="text-sm text-neutral-500 mt-1">
              {total} {total === 1 ? 'linha processada' : 'linhas processadas'}
            </p>
          </>
        ) : (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-neutral-900">Importação falhou</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Nenhum aluno foi importado. Verifique os erros abaixo.
            </p>
          </>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Criados" value={result.created} color="text-green-700" bg="bg-green-50" />
        <StatCard label="Atualizados" value={result.updated} color="text-blue-700" bg="bg-blue-50" />
        <StatCard label="Ignorados" value={result.skipped} color="text-yellow-700" bg="bg-yellow-50" />
        <StatCard label="Falhas" value={result.failed} color="text-red-700" bg="bg-red-50" />
      </div>

      {/* Error details */}
      {result.errors.length > 0 && (
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowErrors(!showErrors)}
            className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 hover:bg-neutral-100 transition-colors"
          >
            <span className="text-sm font-medium text-neutral-700">
              Detalhes dos erros ({result.errors.length})
            </span>
            {showErrors ? (
              <ChevronUp className="w-4 h-4 text-neutral-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            )}
          </button>
          {showErrors && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 border-t border-b border-neutral-200">
                    <th className="text-left px-4 py-2 font-medium text-neutral-600">Linha</th>
                    <th className="text-left px-4 py-2 font-medium text-neutral-600">Campo</th>
                    <th className="text-left px-4 py-2 font-medium text-neutral-600">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((err, i) => (
                    <tr key={i} className="border-b border-neutral-100 last:border-b-0">
                      <td className="px-4 py-2 text-neutral-500">{err.row}</td>
                      <td className="px-4 py-2 font-medium text-neutral-700">{err.field}</td>
                      <td className="px-4 py-2 text-neutral-600">{err.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3 pt-2">
        {result.createdStudentIds.length > 0 && (
          <a
            href="/students"
            className="block w-full text-center px-4 py-2.5 text-sm font-medium text-violet-600 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
          >
            Ver alunos importados
          </a>
        )}
        <button
          onClick={onViewHistory}
          className="w-full px-4 py-2.5 text-sm font-medium text-neutral-700 bg-neutral-100 border border-neutral-200 rounded-lg hover:bg-neutral-200 transition-colors"
        >
          Ver histórico de importações
        </button>
        <button
          onClick={onNewImport}
          className="w-full px-4 py-2.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
        >
          Nova importação
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-lg p-4 text-center`}>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-neutral-500 mt-1">{label}</p>
    </div>
  );
}
