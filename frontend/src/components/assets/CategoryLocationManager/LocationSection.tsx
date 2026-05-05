import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, Check, FolderTree } from 'lucide-react';
import {
  useAssetLocations,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
} from '@/hooks/useAssets';
import type { AssetLocation } from '@/types/assets';
import type { LocationFormData } from './types';
import { SectionHeader } from './SectionHeader';
import { LocationTreeItem } from './LocationTreeItem';

const EMPTY_FORM: LocationFormData = { name: '', description: '', parentId: '' };

// ---------------------------------------------------------------------------
// LocationSection — right panel of the manager. Lists asset locations as a
// tree (root locations are those without a parentId) and renders each row
// through LocationTreeItem. Carries an inline add form whose parent selector
// can attach the new location to any existing one.
// ---------------------------------------------------------------------------

export function LocationSection() {
  const { data: locationsData, isLoading } = useAssetLocations();
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const deleteMutation = useDeleteLocation();

  const allLocations = locationsData?.data || [];
  const rootLocations = useMemo(
    () => allLocations.filter((loc) => !loc.parentId),
    [allLocations],
  );

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<LocationFormData>(EMPTY_FORM);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleAdd = () => {
    if (!formData.name.trim()) return;
    createMutation.mutate(
      {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        parentId: formData.parentId || undefined,
      },
      { onSuccess: resetForm },
    );
  };

  const handleEdit = (location: AssetLocation) => {
    setEditingId(location.id);
    setShowAddForm(false);
    setFormData({
      name: location.name,
      description: location.description || '',
      parentId: location.parentId || '',
    });
  };

  const handleUpdate = () => {
    if (!editingId || !formData.name.trim()) return;
    updateMutation.mutate(
      {
        id: editingId,
        data: {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          parentId: formData.parentId || undefined,
        },
      },
      { onSuccess: resetForm },
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, { onSuccess: () => setDeleteConfirmId(null) });
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <SectionHeader
        icon={FolderTree}
        title="Localizações"
        count={allLocations.length}
        onAddClick={() => {
          setShowAddForm(true);
          setEditingId(null);
          setFormData(EMPTY_FORM);
        }}
      />

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 bg-primary-50/50 border-b border-neutral-100 space-y-3">
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
                  {allLocations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={resetForm} className="btn btn-secondary btn-sm">
                  <X className="w-3.5 h-3.5 mr-1" />
                  Cancelar
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!formData.name.trim() || createMutation.isPending}
                  className="btn btn-primary btn-sm"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1" />
                  )}
                  Salvar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="divide-y divide-neutral-100">
        {isLoading ? (
          <div className="px-5 py-8 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        ) : rootLocations.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-neutral-400">
            Nenhuma localização cadastrada
          </div>
        ) : (
          rootLocations.map((loc) => (
            <LocationTreeItem
              key={loc.id}
              location={loc}
              allLocations={allLocations}
              depth={0}
              onEdit={handleEdit}
              onDelete={handleDelete}
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
          ))
        )}
      </div>
    </div>
  );
}
