import { AlertTriangle } from 'lucide-react';

interface AssetCreationWarningProps {
  count: number;
}

export function AssetCreationWarning({ count }: AssetCreationWarningProps) {
  if (count <= 0) return null;
  return (
    <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-warning-800">
          {count} {count === 1 ? 'ativo será criado' : 'ativos serão criados'} automaticamente
        </p>
        <p className="text-xs text-warning-600 mt-0.5">
          Os ativos serão registrados no patrimônio ao executar a compra.
        </p>
      </div>
    </div>
  );
}
