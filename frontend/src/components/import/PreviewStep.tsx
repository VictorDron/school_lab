import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Users,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import type {
  ImportPreviewResult,
  DuplicateAction,
  RowError,
} from '@/types/import';

interface PreviewStepProps {
  previewData: ImportPreviewResult;
  duplicateActions: Record<number, DuplicateAction>;
  onDuplicateActionChange: (rowNumber: number, action: DuplicateAction) => void;
  onContinue: () => void;
  onBack: () => void;
}

const DUPLICATE_OPTIONS: { value: DuplicateAction; label: string }[] = [
  { value: 'skip', label: 'Ignorar' },
  { value: 'update', label: 'Atualizar' },
  { value: 'create', label: 'Criar mesmo assim' },
];

const PAGE_SIZE = 50;

export function PreviewStep({
  previewData,
  duplicateActions,
  onDuplicateActionChange,
  onContinue,
  onBack,
}: PreviewStepProps) {
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [showFamilies, setShowFamilies] = useState(false);

  const { rows, errors, duplicates, summary, familyGroups } = previewData;

  const errorsByRow = useMemo(() => {
    const map = new Map<number, RowError[]>();
    for (const err of errors) {
      if (!map.has(err.row)) map.set(err.row, []);
      map.get(err.row)!.push(err);
    }
    return map;
  }, [errors]);

  const duplicateByRow = useMemo(() => {
    const map = new Map<number, typeof duplicates[0]>();
    for (const dup of duplicates) {
      map.set(dup.rowNumber, dup);
    }
    return map;
  }, [duplicates]);

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const visibleRows = rows.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          label="Total de linhas"
          value={summary.totalRows}
          color="text-neutral-700"
          bg="bg-neutral-50"
        />
        <SummaryCard
          label="Válidas"
          value={summary.validRows}
          color="text-green-700"
          bg="bg-green-50"
        />
        <SummaryCard
          label="Com erros"
          value={summary.errorRows}
          color="text-red-700"
          bg="bg-red-50"
        />
        <SummaryCard
          label="Duplicatas"
          value={summary.duplicates}
          color="text-yellow-700"
          bg="bg-yellow-50"
        />
      </div>

      {/* Data table */}
      <div className="overflow-x-auto border border-neutral-200 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="text-left px-4 py-3 font-medium text-neutral-600 w-12">#</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-600">Nome do Aluno</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-600">Turma</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-600">Série</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-600 w-40">Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const rowErrors = errorsByRow.get(row.rowNumber);
              const duplicate = duplicateByRow.get(row.rowNumber);
              const hasError = !!rowErrors?.some((e) => e.severity === 'error');
              const hasDuplicate = !!duplicate;
              const isExpanded = expandedRow === row.rowNumber;

              return (
                <RowGroup key={row.rowNumber}>
                  <tr
                    onClick={() => setExpandedRow(isExpanded ? null : row.rowNumber)}
                    className={`border-b border-neutral-100 cursor-pointer transition-colors ${
                      hasError
                        ? 'bg-red-50 hover:bg-red-100'
                        : hasDuplicate
                          ? 'bg-yellow-50 hover:bg-yellow-100'
                          : 'hover:bg-neutral-50'
                    }`}
                  >
                    <td className="px-4 py-2.5 text-neutral-500">{row.rowNumber}</td>
                    <td className="px-4 py-2.5 font-medium text-neutral-900">{row.studentName}</td>
                    <td className="px-4 py-2.5 text-neutral-600">{row.classGroup || '--'}</td>
                    <td className="px-4 py-2.5 text-neutral-600">{row.grade || '--'}</td>
                    <td className="px-4 py-2.5">
                      {hasError ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <XCircle className="w-3 h-3" />
                          Erro
                        </span>
                      ) : hasDuplicate ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                          <AlertTriangle className="w-3 h-3" />
                          Duplicata
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" />
                          OK
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Expanded error/duplicate details */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={5} className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                        {rowErrors && rowErrors.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-red-600 mb-1">Erros:</p>
                            <ul className="space-y-1">
                              {rowErrors.map((err, i) => (
                                <li key={i} className="text-xs text-red-600">
                                  <span className="font-medium">{err.field}:</span> {err.message}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {hasDuplicate && duplicate && (
                          <div>
                            <p className="text-xs font-semibold text-yellow-700 mb-1">
                              Duplicata detectada ({duplicate.matchType}):
                            </p>
                            <p className="text-xs text-yellow-700 mb-2">
                              Aluno existente: {duplicate.existingStudentName}
                              {duplicate.existingGrade && ` (${duplicate.existingGrade})`}
                            </p>
                            <select
                              value={duplicateActions[row.rowNumber] || duplicate.action}
                              onChange={(e) =>
                                onDuplicateActionChange(row.rowNumber, e.target.value as DuplicateAction)
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs border border-yellow-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                            >
                              {DUPLICATE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </RowGroup>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-neutral-500">
          <span>
            Mostrando {startIndex + 1}-{Math.min(startIndex + PAGE_SIZE, rows.length)} de {rows.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 border border-neutral-300 rounded-md hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </button>
          </div>
        </div>
      )}

      {/* Family groups */}
      {familyGroups.length > 0 && (
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowFamilies(!showFamilies)}
            className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 hover:bg-neutral-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-medium text-neutral-700">
                Famílias detectadas ({familyGroups.length})
              </span>
            </div>
            {showFamilies ? (
              <ChevronUp className="w-4 h-4 text-neutral-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            )}
          </button>
          {showFamilies && (
            <div className="divide-y divide-neutral-100">
              {familyGroups.map((group) => (
                <div key={group.familyId} className="px-4 py-3">
                  <p className="text-sm font-medium text-neutral-800">{group.familyName}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {group.members.length} {group.members.length === 1 ? 'membro' : 'membros'} -
                    Detecção: {group.detectionMethod === 'EMERGENCY_CONTACT' ? 'Contato de emergência' :
                      group.detectionMethod === 'SURNAME' ? 'Sobrenome' : 'Individual'}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {group.members.map((m) => (
                      <span
                        key={m.rowNumber}
                        className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full"
                      >
                        {m.studentName}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <button
          onClick={onContinue}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors"
        >
          Continuar
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function SummaryCard({
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
    <div className={`${bg} rounded-lg p-4`}>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function RowGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
