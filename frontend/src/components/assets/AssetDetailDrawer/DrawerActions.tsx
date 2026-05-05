import { MapPin, User, Wrench, AlertTriangle, Edit2 } from 'lucide-react';
import type { Asset } from '@/types/assets';

// ---------------------------------------------------------------------------
// DrawerActions — bottom action bar. Edit/move/assign/maintenance buttons
// require EDIT permission; the destructive "Desativar" button requires
// ADMIN and is hidden for already-decommissioned assets. Renders nothing
// when the user has neither permission so the bar collapses with no border.
// ---------------------------------------------------------------------------

export interface DrawerActionsProps {
  asset: Asset;
  canEdit: boolean;
  isAdmin: boolean;
  onEdit?: (assetId: string) => void;
  onMove: (assetId: string) => void;
  onAssign: (assetId: string) => void;
  onMaintenance: (assetId: string) => void;
  onDecommission: (assetId: string) => void;
}

const editButtonClass =
  'flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors';

export function DrawerActions({
  asset,
  canEdit,
  isAdmin,
  onEdit,
  onMove,
  onAssign,
  onMaintenance,
  onDecommission,
}: DrawerActionsProps) {
  if (!canEdit && !isAdmin) return null;

  const showDecommission = isAdmin && asset.status !== 'DECOMMISSIONED';

  return (
    <div className="border-t border-neutral-200 p-4 bg-neutral-50 flex flex-wrap gap-2">
      {canEdit && (
        <>
          <button onClick={() => onEdit?.(asset.id)} className={editButtonClass}>
            <Edit2 className="w-4 h-4" />
            Editar
          </button>
          <button onClick={() => onMove(asset.id)} className={editButtonClass}>
            <MapPin className="w-4 h-4" />
            Mover
          </button>
          <button onClick={() => onAssign(asset.id)} className={editButtonClass}>
            <User className="w-4 h-4" />
            Atribuir Responsável
          </button>
          <button onClick={() => onMaintenance(asset.id)} className={editButtonClass}>
            <Wrench className="w-4 h-4" />
            Agendar Manutenção
          </button>
        </>
      )}
      {showDecommission && (
        <button
          onClick={() => onDecommission(asset.id)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-colors ml-auto"
        >
          <AlertTriangle className="w-4 h-4" />
          Desativar
        </button>
      )}
    </div>
  );
}
