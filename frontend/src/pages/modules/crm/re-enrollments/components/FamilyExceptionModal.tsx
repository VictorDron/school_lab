import { useState, useEffect } from 'react';
import { X, Loader2, Trash2 } from 'lucide-react';
import { useCreateException, useUpdateException, useDeleteException } from '@/hooks/usePreReEnrollment';
import type { FamilyPriceException } from '@/types/pre-reenrollment';

interface FamilyExceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodId: string;
  studentId: string;
  studentName: string;
  existingException?: FamilyPriceException;
}

export default function FamilyExceptionModal({
  isOpen,
  onClose,
  periodId,
  studentId,
  studentName,
  existingException,
}: FamilyExceptionModalProps) {
  const [overrideAnnualValue, setOverrideAnnualValue] = useState<string>('');
  const [overrideDiscountPercent, setOverrideDiscountPercent] = useState<string>('');
  const [justification, setJustification] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const createMutation = useCreateException(periodId);
  const updateMutation = useUpdateException();
  const deleteMutation = useDeleteException();

  useEffect(() => {
    if (existingException) {
      setOverrideAnnualValue(
        existingException.overrideAnnualValue !== null
          ? String(existingException.overrideAnnualValue)
          : ''
      );
      setOverrideDiscountPercent(
        existingException.overrideDiscountPercent !== null
          ? String(existingException.overrideDiscountPercent)
          : ''
      );
      setJustification(existingException.justification || '');
    } else {
      setOverrideAnnualValue('');
      setOverrideDiscountPercent('');
      setJustification('');
    }
    setConfirmDelete(false);
  }, [existingException, isOpen]);

  const isValid = justification.trim().length >= 3;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    if (!isValid) return;

    const annualVal = overrideAnnualValue ? Number(overrideAnnualValue) : undefined;
    const discountVal = overrideDiscountPercent ? Number(overrideDiscountPercent) : undefined;

    if (existingException) {
      updateMutation.mutate(
        {
          exceptionId: existingException.id,
          data: {
            overrideAnnualValue: annualVal ?? null,
            overrideDiscountPercent: discountVal ?? null,
            justification: justification.trim(),
          },
        },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(
        {
          studentId,
          overrideAnnualValue: annualVal,
          overrideDiscountPercent: discountVal,
          justification: justification.trim(),
        },
        { onSuccess: onClose }
      );
    }
  };

  const handleDelete = () => {
    if (!existingException) return;
    deleteMutation.mutate(existingException.id, { onSuccess: onClose });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-neutral-900">
            {existingException ? 'Editar Exceção' : 'Nova Exceção'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        <p className="text-sm text-neutral-600 mb-4">
          Aluno: <strong>{studentName}</strong>
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Valor Anual Override (R$)
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={overrideAnnualValue}
              onChange={(e) => setOverrideAnnualValue(e.target.value)}
              placeholder="Deixe vazio para usar valor padrão"
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Desconto Override (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={overrideDiscountPercent}
              onChange={(e) => setOverrideDiscountPercent(e.target.value)}
              placeholder="Deixe vazio para usar desconto padrão"
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Justificativa <span className="text-red-500">*</span>
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Mínimo 3 caracteres"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
            {justification.length > 0 && justification.trim().length < 3 && (
              <p className="text-xs text-red-500 mt-0.5">
                A justificativa deve ter no mínimo 3 caracteres.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-5">
          <div>
            {existingException && (
              <>
                {confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600">Confirmar exclusão?</span>
                    <button
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        'Sim, excluir'
                      )}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1 text-xs text-neutral-600 hover:text-neutral-800"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir exceção
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid || isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-colors"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
