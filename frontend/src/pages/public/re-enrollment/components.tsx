import type { ElementType, ReactNode } from 'react';
import { AlertCircle, CheckCircle, Loader2, Lock } from 'lucide-react';

export function SectionCard({
  icon: Icon,
  title,
  children,
  readOnly,
}: {
  icon: ElementType;
  title: string;
  children: ReactNode;
  readOnly?: boolean;
}) {
  return (
    <div className={`rounded-xl shadow-sm border p-6 ${readOnly ? 'bg-neutral-50 border-neutral-200' : 'bg-white border-neutral-200'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${readOnly ? 'bg-neutral-200' : 'bg-primary-50'}`}>
          <Icon className={`w-5 h-5 ${readOnly ? 'text-neutral-500' : 'text-primary-600'}`} />
        </div>
        <h2 className="text-lg font-semibold text-neutral-800">{title}</h2>
        {readOnly && (
          <span className="ml-auto flex items-center gap-1 text-xs text-neutral-500">
            <Lock className="w-3.5 h-3.5" /> Somente leitura
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export function ReadOnlyField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-500 mb-1">{label}</label>
      <p className="text-sm text-neutral-800">{value || '—'}</p>
    </div>
  );
}

export function FormField({
  label,
  children,
  required,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export function SuccessScreen({ studentName }: { studentName: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Rematrícula confirmada!</h1>
        <p className="text-neutral-600 mb-4">
          A confirmação de rematrícula de <strong>{studentName}</strong> foi enviada com sucesso.
        </p>
        <p className="text-sm text-neutral-500">
          Você receberá um e-mail com os próximos passos. Caso tenha dúvidas, entre em contato com a secretaria da escola.
        </p>
      </div>
    </div>
  );
}

export function AlreadyConfirmedScreen({ studentName }: { studentName: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <CheckCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Rematrícula já confirmada</h1>
        <p className="text-neutral-600">
          A rematrícula de <strong>{studentName}</strong> já foi confirmada anteriormente. Nenhuma ação adicional é necessária.
        </p>
      </div>
    </div>
  );
}

export function ErrorScreen({ message, code }: { message: string; code?: string }) {
  const isPeriodNotReady = code === 'PERIOD_NOT_OPEN' || code === 'FORM_PERIOD_CLOSED';
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isPeriodNotReady ? 'bg-gradient-to-br from-amber-50 to-orange-50' : 'bg-gradient-to-br from-red-50 to-orange-50'}`}>
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${isPeriodNotReady ? 'text-amber-500' : 'text-red-500'}`} />
        <h1 className="text-2xl font-bold text-neutral-800 mb-2">
          {isPeriodNotReady ? 'Formulário indisponível' : 'Erro ao carregar formulário'}
        </h1>
        <p className="text-neutral-600 mb-4">{message}</p>
        {isPeriodNotReady && (
          <p className="text-sm text-neutral-500">
            Entre em contato com a escola caso tenha dúvidas sobre a campanha de rematrícula.
          </p>
        )}
      </div>
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-4" />
        <p className="text-neutral-600">Carregando formulário de rematrícula...</p>
      </div>
    </div>
  );
}
