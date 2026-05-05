import { useState } from 'react';
import { X, Loader2, Handshake } from 'lucide-react';
import { useRegisterNegotiation } from '@/hooks/usePreReEnrollment';
import type { PreReEnrollmentResponse } from '@/types/pre-reenrollment';

interface NegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  response: PreReEnrollmentResponse;
  periodId: string;
}

function formatBRL(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function NegotiationModal({
  isOpen,
  onClose,
  response,
  periodId,
}: NegotiationModalProps) {
  const [discountPercent, setDiscountPercent] = useState('');
  const [finalValue, setFinalValue] = useState('');
  const [justification, setJustification] = useState('');

  const mutation = useRegisterNegotiation(periodId);

  const isValid =
    discountPercent !== '' &&
    Number(discountPercent) >= 0 &&
    Number(discountPercent) <= 100 &&
    finalValue !== '' &&
    Number(finalValue) > 0 &&
    justification.trim().length >= 3;

  const handleSave = () => {
    if (!isValid) return;
    mutation.mutate(
      {
        responseId: response.id,
        data: {
          discountPercent: Number(discountPercent),
          finalValue: Number(finalValue),
          justification: justification.trim(),
        },
      },
      { onSuccess: onClose }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50">
              <Handshake className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900">
              Registrar Negociação
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        {/* Read-only info */}
        <div className="bg-neutral-50 rounded-lg p-3 mb-4 space-y-1">
          <p className="text-xs text-neutral-600">
            <strong>Aluno:</strong> {response.student.fullName}
          </p>
          <p className="text-xs text-neutral-600">
            <strong>Série:</strong> {response.student.grade || '—'}
          </p>
          <p className="text-xs text-neutral-600">
            <strong>Valor comunicado:</strong>{' '}
            {formatBRL(response.communicatedAnnualValue)}
          </p>
        </div>

        {/* Form */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Desconto acordado (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Valor final anual (R$)
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={finalValue}
              onChange={(e) => setFinalValue(e.target.value)}
              placeholder="0,00"
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

        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || mutation.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
