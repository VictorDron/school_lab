import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, Loader2, Tag, X, Check } from 'lucide-react';
import {
  useAssetCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/useAssets';
import type { AssetCategory } from '@/types/assets';
import type { CategoryFormData } from './types';
import { SectionHeader } from './SectionHeader';
import { DeleteConfirmRow } from './DeleteConfirmRow';

const EMPTY_FORM: CategoryFormData = { name: '', description: '', icon: '' };

// ---------------------------------------------------------------------------
// CategorySection — left panel of the manager. Lists asset categories with
// inline add/edit forms and an inline delete-confirmation flow. Asset count
// blocks deletion when there are still assets attached to the category.
// ---------------------------------------------------------------------------

export function CategorySection() {
  const { data: categoriesData, isLoading } = useAssetCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const categories = categoriesData?.data || [];

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(EMPTY_FORM);

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
        icon: formData.icon.trim() || undefined,
      },
      { onSuccess: resetForm },
    );
  };

  const handleEdit = (category: AssetCategory) => {
    setEditingId(category.id);
    setShowAddForm(false);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
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
          icon: formData.icon.trim() || undefined,
        },
      },
      { onSuccess: resetForm },
    );
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, { onSuccess: () => setDeleteConfirmId(null) });
  };

  const formInputs = (
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
      <input
        value={formData.icon}
        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
        placeholder="Ícone (emoji)"
        className="input text-sm"
      />
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <SectionHeader
        icon={Tag}
        title="Categorias"
        count={categories.length}
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
              {formInputs}
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
        ) : categories.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-neutral-400">
            Nenhuma categoria cadastrada
          </div>
        ) : (
          categories.map((cat) => {
            const assetCount = cat._count?.assets ?? 0;
            const canDelete = assetCount === 0;

            return (
              <div key={cat.id} className="px-5 py-3">
                {editingId === cat.id ? (
                  <div className="space-y-3">
                    {formInputs}
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
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg flex-shrink-0">{cat.icon || '📦'}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">{cat.name}</p>
                        {cat.description && (
                          <p className="text-xs text-neutral-500 truncate">{cat.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full flex-shrink-0">
                        {assetCount} ativos
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {deleteConfirmId === cat.id ? (
                        <DeleteConfirmRow
                          isDeleting={deleteMutation.isPending}
                          onConfirm={() => handleDelete(cat.id)}
                          onCancel={() => setDeleteConfirmId(null)}
                        />
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(cat)}
                            className="p-1.5 text-neutral-500 hover:bg-neutral-100 rounded-md transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(cat.id)}
                            disabled={!canDelete}
                            className="p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title={canDelete ? 'Excluir' : 'Não é possível excluir categorias com ativos'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
