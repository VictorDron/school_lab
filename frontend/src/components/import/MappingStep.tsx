import { CheckCircle, MinusCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import type { ImportPreviewResult } from '@/types/import';

interface MappingStepProps {
  previewData: ImportPreviewResult;
  onContinue: () => void;
  onBack: () => void;
}

interface MappingEntry {
  csvHeader: string;
  target: string;
  example: string;
  isSkipped: boolean;
}

function extractMappings(previewData: ImportPreviewResult): MappingEntry[] {
  if (!previewData.rows.length) return [];

  const firstRow = previewData.rows[0];
  const rawKeys = Object.keys(firstRow.raw);

  return rawKeys.map((key) => {
    const ptLabel = key.includes('|') ? key.split('|')[1]?.replace(':', '').trim() : key;
    const isSkipped = key.toLowerCase().includes('section') || key.trim() === '';
    const example = firstRow.raw[key] || '';

    return {
      csvHeader: ptLabel || key,
      target: isSkipped ? 'Ignorada' : 'Auto-mapeada',
      example: example.substring(0, 60),
      isSkipped,
    };
  });
}

export function MappingStep({ previewData, onContinue, onBack }: MappingStepProps) {
  const mappings = extractMappings(previewData);
  const mapped = mappings.filter((m) => !m.isSkipped).length;
  const skipped = mappings.filter((m) => m.isSkipped).length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
        <p className="text-sm text-neutral-700">
          <span className="font-semibold">{mappings.length}</span> colunas detectadas,{' '}
          <span className="font-semibold text-green-600">{mapped}</span> mapeadas automaticamente,{' '}
          <span className="font-semibold text-neutral-500">{skipped}</span> ignoradas (cabeçalhos de seção)
        </p>
      </div>

      {/* Mapping table */}
      <div className="overflow-x-auto border border-neutral-200 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="text-left px-4 py-3 font-medium text-neutral-600">Coluna do arquivo</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-600">Destino no sistema</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-600">Exemplo</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((mapping, index) => (
              <tr
                key={index}
                className={`border-b border-neutral-100 last:border-b-0 ${
                  mapping.isSkipped ? 'bg-neutral-50 text-neutral-400' : ''
                }`}
              >
                <td className="px-4 py-2.5 flex items-center gap-2">
                  {mapping.isSkipped ? (
                    <MinusCircle className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  )}
                  <span className="truncate">{mapping.csvHeader}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      mapping.isSkipped
                        ? 'bg-neutral-100 text-neutral-400'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {mapping.target}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-neutral-500 truncate max-w-[200px]">
                  {mapping.example || <span className="text-neutral-300">--</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
