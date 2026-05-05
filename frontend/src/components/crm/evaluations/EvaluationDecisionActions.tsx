import { useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useEvaluationDecision } from '@/hooks/useEvaluations';

interface EvaluationDecisionActionsProps {
  evaluationId: string;
  leadId?: string;
}

export function EvaluationDecisionActions({ evaluationId, leadId }: EvaluationDecisionActionsProps) {
  const [showConfirm, setShowConfirm] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [notes, setNotes] = useState('');
  const decisionMutation = useEvaluationDecision();

  const handleDecision = () => {
    if (!showConfirm) return;
    decisionMutation.mutate(
      { id: evaluationId, leadId, decision: showConfirm, notes: notes || undefined },
      {
        onSuccess: () => {
          setShowConfirm(null);
          setNotes('');
        },
      }
    );
  };

  if (showConfirm) {
    return (
      <div className="p-3 border border-neutral-200 rounded-lg bg-neutral-50 space-y-3">
        <p className="text-sm font-medium">
          {showConfirm === 'APPROVED' ? 'Aprovar' : 'Rejeitar'} esta avaliação?
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas (opcional)..."
          rows={2}
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm resize-none"
        />
        <div className="flex gap-2">
          <button
            onClick={handleDecision}
            disabled={decisionMutation.isPending}
            className={`flex-1 btn btn-md text-white ${
              showConfirm === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {decisionMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Confirmar'
            )}
          </button>
          <button
            onClick={() => {
              setShowConfirm(null);
              setNotes('');
            }}
            className="btn btn-secondary btn-md"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setShowConfirm('APPROVED')}
        className="flex-1 btn btn-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
      >
        <CheckCircle className="w-4 h-4" />
        Aprovar
      </button>
      <button
        onClick={() => setShowConfirm('REJECTED')}
        className="flex-1 btn btn-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
      >
        <XCircle className="w-4 h-4" />
        Rejeitar
      </button>
    </div>
  );
}
