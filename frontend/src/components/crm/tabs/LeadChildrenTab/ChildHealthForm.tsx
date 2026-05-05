import { Heart, Loader2, Pencil, Save } from 'lucide-react';
import type { LeadChildHealth } from '@/types/crm';

interface ChildHealthFormProps {
  health: LeadChildHealth;
  childId: string;
  leadId: string;
  canEdit: boolean;
  isEditing: boolean;
  healthForm: Record<string, any>;
  isSaving: boolean;
  onStartEdit: (initial: Record<string, any>) => void;
  onCancelEdit: () => void;
  onChangeForm: (form: Record<string, any>) => void;
  onSave: (payload: { leadId: string; childId: string; data: Record<string, any> }) => void;
}

export function ChildHealthForm({
  health,
  childId,
  leadId,
  canEdit,
  isEditing,
  healthForm,
  isSaving,
  onStartEdit,
  onCancelEdit,
  onChangeForm,
  onSave,
}: ChildHealthFormProps) {
  const startEdit = () => {
    onStartEdit({
      weight: health.weight || '',
      height: health.height || '',
      bloodType: health.bloodType || '',
      additionalHealthInfo: health.additionalHealthInfo || '',
    });
  };

  return (
    <div className="mt-3 pt-3 border-t border-neutral-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
          <Heart className="w-3.5 h-3.5" /> Saúde
        </span>
        {canEdit && !isEditing && (
          <button onClick={startEdit} className="text-neutral-400 hover:text-blue-600">
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>
      {isEditing ? (
        <div className="bg-blue-50 rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-neutral-500">Peso</label>
              <input
                value={healthForm.weight}
                onChange={(e) => onChangeForm({ ...healthForm, weight: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500">Altura</label>
              <input
                value={healthForm.height}
                onChange={(e) => onChangeForm({ ...healthForm, height: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500">Tipo Sanguíneo</label>
              <input
                value={healthForm.bloodType}
                onChange={(e) => onChangeForm({ ...healthForm, bloodType: e.target.value })}
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-neutral-500">Informações adicionais</label>
            <textarea
              value={healthForm.additionalHealthInfo}
              onChange={(e) =>
                onChangeForm({ ...healthForm, additionalHealthInfo: e.target.value })
              }
              className="w-full border rounded px-2 py-1 text-sm"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancelEdit}
              className="px-2 py-1 text-xs text-neutral-600 border rounded"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave({ leadId, childId, data: healthForm })}
              disabled={isSaving}
              className="px-2 py-1 text-xs text-white bg-blue-600 rounded flex items-center gap-1"
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Salvar
            </button>
          </div>
        </div>
      ) : (
        <div className="text-xs text-neutral-600 grid grid-cols-3 gap-2">
          {health.weight && <span>Peso: {health.weight}kg</span>}
          {health.height && <span>Altura: {health.height}cm</span>}
          {health.bloodType && <span>Sangue: {health.bloodType}</span>}
        </div>
      )}
    </div>
  );
}
