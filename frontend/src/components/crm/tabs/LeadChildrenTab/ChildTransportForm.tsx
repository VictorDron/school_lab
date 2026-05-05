import { Car, Loader2, Pencil, Save } from 'lucide-react';
import type { LeadChildTransport } from '@/types/crm';

interface ChildTransportFormProps {
  transport: LeadChildTransport;
  childId: string;
  leadId: string;
  canEdit: boolean;
  isEditing: boolean;
  transportForm: Record<string, any>;
  isSaving: boolean;
  onStartEdit: (initial: Record<string, any>) => void;
  onCancelEdit: () => void;
  onChangeForm: (form: Record<string, any>) => void;
  onSave: (payload: { leadId: string; childId: string; data: Record<string, any> }) => void;
}

export function ChildTransportForm({
  transport,
  childId,
  leadId,
  canEdit,
  isEditing,
  transportForm,
  isSaving,
  onStartEdit,
  onCancelEdit,
  onChangeForm,
  onSave,
}: ChildTransportFormProps) {
  const startEdit = () => {
    onStartEdit({
      transportMethod: transport.transportMethod || '',
      canLeaveAlone: transport.canLeaveAlone || false,
    });
  };

  return (
    <div className="mt-3 pt-3 border-t border-neutral-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
          <Car className="w-3.5 h-3.5" /> Transporte
        </span>
        {canEdit && !isEditing && (
          <button onClick={startEdit} className="text-neutral-400 hover:text-blue-600">
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>
      {isEditing ? (
        <div className="bg-blue-50 rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-neutral-500">Meio de transporte</label>
              <input
                value={transportForm.transportMethod}
                onChange={(e) =>
                  onChangeForm({ ...transportForm, transportMethod: e.target.value })
                }
                className="w-full border rounded px-2 py-1 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                checked={transportForm.canLeaveAlone}
                onChange={(e) =>
                  onChangeForm({ ...transportForm, canLeaveAlone: e.target.checked })
                }
                className="rounded"
              />
              <label className="text-xs text-neutral-600">Pode sair sozinho</label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancelEdit}
              className="px-2 py-1 text-xs text-neutral-600 border rounded"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave({ leadId, childId, data: transportForm })}
              disabled={isSaving}
              className="px-2 py-1 text-xs text-white bg-blue-600 rounded flex items-center gap-1"
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Salvar
            </button>
          </div>
        </div>
      ) : (
        <div className="text-xs text-neutral-600">
          {transport.canLeaveAlone ? (
            <span className="text-green-600">Autorizado a sair sozinho</span>
          ) : (
            <span>Transporte: {transport.transportMethod || 'Não informado'}</span>
          )}
        </div>
      )}
    </div>
  );
}
