import { Wrench } from 'lucide-react';
import { useAssetMaintenance, useCompleteMaintenance } from '@/hooks/useAssets';
import type { AssetMaintenance } from '@/types/assets';
import {
  maintenanceTypeColors,
  maintenanceTypeLabels,
  maintenanceStatusColors,
  maintenanceStatusLabels,
} from './constants';
import { formatCurrency, formatDate } from './helpers';

const ACTIVE_STATUSES = new Set(['SCHEDULED', 'IN_PROGRESS', 'OVERDUE']);

// ---------------------------------------------------------------------------
// ManutencaoTab — list of maintenance records for the active asset. Header
// shows a count of active records (scheduled, in progress, overdue) so the
// reader can spot the hot ones at a glance. Each record renders through
// MaintenanceCard, which exposes a one-click "Concluir" action when the
// record is in a state that allows completion.
// ---------------------------------------------------------------------------

export function ManutencaoTab({ assetId }: { assetId: string }) {
  const { data: maintenanceResponse, isLoading } = useAssetMaintenance(assetId);
  const records: AssetMaintenance[] = maintenanceResponse?.data ?? [];

  const activeCount = records.filter((m) => ACTIVE_STATUSES.has(m.status)).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-700">Manutenções</h3>
        {activeCount > 0 && (
          <span className="text-xs px-2 py-1 bg-warning-100 text-warning-700 rounded-full font-medium">
            {activeCount} ativa{activeCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
          <Wrench className="w-10 h-10 mb-2" />
          <span className="text-sm">Nenhuma manutenção registrada</span>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <MaintenanceCard key={record.id} record={record} assetId={assetId} />
          ))}
        </div>
      )}
    </div>
  );
}

function MaintenanceCard({ record, assetId }: { record: AssetMaintenance; assetId: string }) {
  const completeMutation = useCompleteMaintenance();
  const canComplete = record.status === 'SCHEDULED' || record.status === 'IN_PROGRESS';

  return (
    <div className="border border-neutral-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${maintenanceTypeColors[record.type]}`}>
          {maintenanceTypeLabels[record.type]}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${maintenanceStatusColors[record.status]}`}>
          {maintenanceStatusLabels[record.status]}
        </span>
        {canComplete && (
          <button
            onClick={() => completeMutation.mutate({ assetId, maintenanceId: record.id })}
            disabled={completeMutation.isPending}
            className="ml-auto text-xs text-success-600 hover:text-success-700 font-medium"
          >
            {completeMutation.isPending ? 'Concluindo...' : 'Concluir'}
          </button>
        )}
      </div>

      <p className="text-sm text-neutral-800">{record.description}</p>

      <div className="grid grid-cols-2 gap-2 text-xs text-neutral-500">
        {record.scheduledDate && (
          <div>
            <span className="block text-neutral-400">Agendada</span>
            <span className="text-neutral-700">{formatDate(record.scheduledDate)}</span>
          </div>
        )}
        {record.cost != null && (
          <div>
            <span className="block text-neutral-400">Custo</span>
            <span className="text-neutral-700">{formatCurrency(record.cost)}</span>
          </div>
        )}
        {record.vendor && (
          <div>
            <span className="block text-neutral-400">Fornecedor</span>
            <span className="text-neutral-700">{record.vendor}</span>
          </div>
        )}
        {record.createdBy && (
          <div>
            <span className="block text-neutral-400">Criado por</span>
            <span className="text-neutral-700">{record.createdBy.displayName}</span>
          </div>
        )}
        {record.completedBy && (
          <div>
            <span className="block text-neutral-400">Concluído por</span>
            <span className="text-neutral-700">{record.completedBy.displayName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
