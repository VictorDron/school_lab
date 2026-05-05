import { AlertCircle, Loader2 } from 'lucide-react';

interface SubmitFooterProps {
  validationErrors: Record<string, string>;
  lgpdConsent: boolean;
  isSubmitting: boolean;
  submitCooldown: boolean;
  onSubmit: () => void;
}

export function SubmitFooter({
  validationErrors,
  lgpdConsent,
  isSubmitting,
  submitCooldown,
  onSubmit,
}: SubmitFooterProps) {
  const hasErrors = Object.keys(validationErrors).length > 0;
  const disabled = !lgpdConsent || isSubmitting || submitCooldown;

  return (
    <>
      {hasErrors && (
        <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Existem campos obrigatórios que precisam ser preenchidos.
            </p>
            <p className="text-xs text-red-600 mt-1">
              Revise os campos marcados em vermelho antes de continuar.
            </p>
          </div>
        </div>
      )}
      <div className="flex justify-center pb-8">
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Enviando...
            </>
          ) : (
            'Confirmar Rematrícula'
          )}
        </button>
      </div>
    </>
  );
}
