import { Clock, MapPin, ArrowRight, User } from 'lucide-react';
import type { AssetMovement } from '@/types/assets';
import { formatDateTime, formatRelative } from './helpers';

// ---------------------------------------------------------------------------
// HistoricoTab — vertical timeline of every location movement the asset has
// gone through. Sorted most recent first; renders a placeholder when there
// are no movements yet so the empty state mirrors the other tabs.
// ---------------------------------------------------------------------------

export function HistoricoTab({ movements }: { movements: AssetMovement[] }) {
  if (movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
        <Clock className="w-10 h-10 mb-2" />
        <span className="text-sm">Nenhuma movimentação registrada</span>
      </div>
    );
  }

  const sorted = [...movements].sort(
    (a, b) => new Date(b.movedAt).getTime() - new Date(a.movedAt).getTime(),
  );

  return (
    <div className="p-6">
      <div className="relative">
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-neutral-200" />

        <div className="space-y-6">
          {sorted.map((movement) => (
            <div key={movement.id} className="relative pl-10">
              <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-primary-500 border-2 border-white ring-2 ring-primary-200" />

              <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-neutral-800">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{movement.fromLocation?.name ?? 'Desconhecido'}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary-500" />
                    <span>{movement.toLocation?.name ?? 'Desconhecido'}</span>
                  </div>
                </div>

                {movement.reason && (
                  <p className="text-xs text-neutral-600">{movement.reason}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-neutral-500">
                  {movement.movedBy && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{movement.movedBy.displayName}</span>
                    </div>
                  )}
                  <span title={formatDateTime(movement.movedAt)}>
                    {formatRelative(movement.movedAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
