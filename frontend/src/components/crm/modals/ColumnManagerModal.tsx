import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { X, Loader2, GripVertical, Pencil, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { useKanbanColumns, useCreateKanbanColumn, useUpdateKanbanColumn, useDeleteKanbanColumn, useReorderKanbanColumns } from '@/hooks/useKanbanColumns';
import type { KanbanColumn, UpdateKanbanColumnData } from '@/types/crm';

interface ColumnManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Color presets for quick selection
const colorPresets = [
  '#94A3B8', // Slate
  '#3B82F6', // Blue
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#10B981', // Emerald
  '#F97316', // Orange
  '#22C55E', // Green
  '#EF4444', // Red
  '#6B7280', // Gray
];

export function ColumnManagerModal({ isOpen, onClose }: ColumnManagerModalProps) {
  const { data: columnsResponse, isLoading } = useKanbanColumns();
  const createMutation = useCreateKanbanColumn();
  const updateMutation = useUpdateKanbanColumn();
  const deleteMutation = useDeleteKanbanColumn();
  const reorderMutation = useReorderKanbanColumns();

  const [localColumns, setLocalColumns] = useState<KanbanColumn[]>([]);
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [deletingColumn, setDeletingColumn] = useState<KanbanColumn | null>(null);
  const [targetColumnId, setTargetColumnId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('#3B82F6');
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  // Sync local state with server data
  useEffect(() => {
    if (columnsResponse?.data) {
      setLocalColumns(columnsResponse.data);
    }
  }, [columnsResponse?.data]);

  // Reset deletingColumn when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDeletingColumn(null);
      setTargetColumnId('');
    }
  }, [isOpen]);

  // Handle reorder when local columns change
  const handleReorder = (newOrder: KanbanColumn[]) => {
    setLocalColumns(newOrder);
  };

  // Save reorder on drag end
  const handleDragEnd = () => {
    const hasChanged = localColumns.some((col, index) => col.order !== index);
    if (hasChanged) {
      reorderMutation.mutate({
        columns: localColumns.map((col, index) => ({ id: col.id, order: index })),
      });
    }
  };

  // Create new column
  const handleCreate = () => {
    if (!newColumnName.trim()) return;
    createMutation.mutate(
      { name: newColumnName.trim(), color: newColumnColor },
      {
        onSuccess: () => {
          setNewColumnName('');
          setNewColumnColor('#3B82F6');
          setIsCreating(false);
        },
      }
    );
  };

  // Update column
  const handleUpdate = () => {
    if (!editingColumn || !editName.trim()) return;
    const data: UpdateKanbanColumnData = {};
    if (editName !== editingColumn.name) data.name = editName.trim();
    if (editColor !== editingColumn.color) data.color = editColor;

    if (Object.keys(data).length === 0) {
      setEditingColumn(null);
      return;
    }

    updateMutation.mutate(
      { id: editingColumn.id, data },
      {
        onSuccess: () => setEditingColumn(null),
      }
    );
  };

  // Delete column
  const handleDelete = () => {
    if (!deletingColumn) return;
    const columnId = deletingColumn.id;
    const target = targetColumnId || undefined;

    // Close the delete modal immediately
    setDeletingColumn(null);
    setTargetColumnId('');

    deleteMutation.mutate({ id: columnId, targetColumnId: target });
  };

  // Start editing a column
  const startEdit = (column: KanbanColumn) => {
    setEditingColumn(column);
    setEditName(column.name);
    setEditColor(column.color);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingColumn(null);
    setEditName('');
    setEditColor('');
  };

  // Close delete confirmation
  const closeDeleteModal = () => {
    if (!deleteMutation.isPending) {
      setDeletingColumn(null);
      setTargetColumnId('');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-40">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50"
        />

        {/* Modal */}
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden pointer-events-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900">Gerenciar Colunas</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-10rem)]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                </div>
              ) : (
                <>
                  {/* Column list with drag-and-drop */}
                  <Reorder.Group
                    axis="y"
                    values={localColumns}
                    onReorder={handleReorder}
                    className="space-y-2"
                  >
                    {localColumns.map((column) => (
                      <Reorder.Item
                        key={column.id}
                        value={column}
                        onDragEnd={handleDragEnd}
                        className="bg-neutral-50 rounded-lg border border-neutral-200 overflow-hidden"
                      >
                        {editingColumn?.id === column.id ? (
                          // Edit mode
                          <div className="p-3 space-y-3">
                            <div>
                              <label className="label text-xs">Nome da Coluna</label>
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="input"
                                autoFocus
                              />
                            </div>
                            <div>
                              <label className="label text-xs">Cor</label>
                              <div className="flex flex-wrap gap-2">
                                {colorPresets.map((color) => (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => setEditColor(color)}
                                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                                      editColor === color
                                        ? 'border-primary-500 scale-110'
                                        : 'border-transparent hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="btn btn-secondary btn-sm"
                                disabled={updateMutation.isPending}
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={handleUpdate}
                                disabled={updateMutation.isPending || !editName.trim()}
                                className="btn btn-primary btn-sm"
                              >
                                {updateMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  'Salvar'
                                )}
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div className="flex items-center gap-3 p-3">
                            <div className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600">
                              <GripVertical className="w-5 h-5" />
                            </div>
                            <div
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: column.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-neutral-900 truncate">
                                {column.name}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {column._count?.leads || 0} {(column._count?.leads || 0) === 1 ? 'lead' : 'leads'}
                                {column.isDefault && ' (padrão)'}
                                {column.isFinal && ' (final)'}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => startEdit(column)}
                                className="p-1.5 hover:bg-neutral-200 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4 text-neutral-500" />
                              </button>
                              {!column.isDefault && (
                                <button
                                  type="button"
                                  onClick={() => setDeletingColumn(column)}
                                  className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>

                  {/* Add new column section */}
                  {isCreating ? (
                    <div className="mt-4 p-3 bg-primary-50 rounded-lg border border-primary-200 space-y-3">
                      <div>
                        <label className="label text-xs">Nome da Nova Coluna</label>
                        <input
                          type="text"
                          value={newColumnName}
                          onChange={(e) => setNewColumnName(e.target.value)}
                          placeholder="Ex: Em Negociação"
                          className="input"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="label text-xs">Cor</label>
                        <div className="flex flex-wrap gap-2">
                          {colorPresets.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setNewColumnColor(color)}
                              className={`w-7 h-7 rounded-full border-2 transition-all ${
                                newColumnColor === color
                                  ? 'border-primary-500 scale-110'
                                  : 'border-transparent hover:scale-105'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreating(false);
                            setNewColumnName('');
                            setNewColumnColor('#3B82F6');
                          }}
                          className="btn btn-secondary btn-sm"
                          disabled={createMutation.isPending}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleCreate}
                          disabled={createMutation.isPending || !newColumnName.trim()}
                          className="btn btn-primary btn-sm"
                        >
                          {createMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Criar Coluna'
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsCreating(true)}
                      className="mt-4 w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Adicionar Coluna
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-200">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-primary btn-md"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Delete confirmation modal - Completely separate from main modal */}
      {deletingColumn && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeDeleteModal}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md pointer-events-auto">
              <div className="p-4 border-b border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">Excluir Coluna</h3>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-neutral-600">
                  Tem certeza que deseja excluir a coluna{' '}
                  <strong>"{deletingColumn.name}"</strong>?
                </p>
                {(deletingColumn._count?.leads || 0) > 0 && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-800 mb-3">
                      Esta coluna possui{' '}
                      <strong>{deletingColumn._count?.leads} lead(s)</strong>. Selecione uma
                      coluna de destino para mover os leads:
                    </p>
                    <select
                      value={targetColumnId}
                      onChange={(e) => setTargetColumnId(e.target.value)}
                      className="input"
                    >
                      <option value="">Selecione...</option>
                      {localColumns
                        .filter((c) => c.id !== deletingColumn.id)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="btn btn-secondary btn-md"
                  disabled={deleteMutation.isPending}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={
                    deleteMutation.isPending ||
                    ((deletingColumn._count?.leads || 0) > 0 && !targetColumnId)
                  }
                  className="btn btn-md bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Excluir'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
