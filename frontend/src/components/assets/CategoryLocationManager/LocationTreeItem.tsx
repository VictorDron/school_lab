import { useState } from 'react';
import { Pencil, Trash2, Loader2, ChevronRight, ChevronDown, MapPin, Check } from 'lucide-react';
import type { useUpdateLocation, useDeleteLocation } from '@/hooks/useAssets';
import type { AssetLocation } from '@/types/assets';
import type { LocationFormData } from './types';
import { DeleteConfirmRow } from './DeleteConfirmRow';

// ---------------------------------------------------------------------------
// LocationTreeItem — recursive row for a single location and its descendants.
// Carries an inline edit form (with parent selector) and reuses the shared
// DeleteConfirmRow for the destroy flow. Children render in the same item
// type so the whole tree shares this implementation.
// ---------------------------------------------------------------------------

export interface LocationTreeItemProps {
  location: AssetLocation;
  allLocations: AssetLocation[];
  depth: number;
  onEdit: (loc: AssetLocation) => void;
  onDelete: (id: string) => void;
  editingId: string | null;
  deleteConfirmId: string | null;
  setDeleteConfirmId: (id: string | null) => void;
  formData: LocationFormData;
  setFormData: (data: LocationFormData) => void;
  resetForm: () => void;
  updateMutation: ReturnType<typeof useUpdateLocation>;
  deleteMutation: ReturnType<typeof useDeleteLocation>;
  handleUpdate: () => void;
}

export function LocationTreeItem({
  location,
  allLocations,
  depth,
  onEdit,
  onDelete,
  editingId,
  deleteConfirmId,
  setDeleteConfirmId,
  formData,
  setFormData,
  resetForm,
  updateMutation,
  deleteMutation,
  handleUpdate,
}: LocationTreeItemProps) {
  const [expanded, setExpanded] = useState(true);
  const children = location.children || [];
  const hasChildren = children.length > 0;
  const assetCount = location._count?.assets ?? 0;
  const canDelete = assetCount === 0 && !hasChildren;

  return (
    <div>
      <div className="px-5 py-3" style={{ paddingLeft: `${20 + depth * 20}px` }}>
        {editingId === location.id ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome *"
                className="input text-sm"
                autoFocus
              />
              <input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição"
                className="input text-sm"
              />
              <select
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                className="input text-sm"
              >
                <option value="">Sem pai (raiz)</option>
                {allLocations
                  .filter((l) => l.id !== location.id)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={resetForm} className="btn btn-secondary btn-sm">
                Cancelar
              </button>
              <button
                onClick={handleUpdate}
                disabled={!formData.name.trim() || updateMutation.isPending}
                className="btn btn-primary btn-sm"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : (
                  <Check className="w-3.5 h-3.5 mr-1" />
                )}
                Salvar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {hasChildren ? (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="p-0.5 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <span className="w-5" />
              )}
              <MapPin className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-neutral-800 truncate">{location.name}</p>
                {location.description && (
                  <p className="text-xs text-neutral-500 truncate">{location.description}</p>
                )}
              </div>
              <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full flex-shrink-0">
                {assetCount} ativos
              </span>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {deleteConfirmId === location.id ? (
                <DeleteConfirmRow
                  isDeleting={deleteMutation.isPending}
                  onConfirm={() => onDelete(location.id)}
                  onCancel={() => setDeleteConfirmId(null)}
                />
              ) : (
                <>
                  <button
                    onClick={() => onEdit(location)}
                    className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded-md transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(location.id)}
                    disabled={!canDelete}
                    className="p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title={canDelete ? 'Excluir' : 'Não é possível excluir localizações com ativos ou sub-localizações'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="border-l border-neutral-100 ml-7">
          {children.map((child) => (
            <LocationTreeItem
              key={child.id}
              location={child}
              allLocations={allLocations}
              depth={depth + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              editingId={editingId}
              deleteConfirmId={deleteConfirmId}
              setDeleteConfirmId={setDeleteConfirmId}
              formData={formData}
              setFormData={setFormData}
              resetForm={resetForm}
              updateMutation={updateMutation}
              deleteMutation={deleteMutation}
              handleUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
