import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';
import type { PreReEnrollmentPublicData } from '@/types/pre-reenrollment';

type PageState = 'loading' | 'error' | 'already-responded' | 'active' | 'success';

function formatBRL(value: number | null): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr));
}

export default function PreReEnrollmentResponsePage() {
  const { token } = useParams<{ token: string }>();

  const [state, setState] = useState<PageState>('loading');
  const [data, setData] = useState<PreReEnrollmentPublicData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setState('error');
      return;
    }

    api
      .get<ApiResponse<PreReEnrollmentPublicData>>(`/public/pre-reenrollment/${token}`)
      .then((res) => {
        const publicData = res.data.data;
        if (!publicData) {
          setState('error');
          return;
        }
        setData(publicData);
        if (publicData.status !== 'PENDING') {
          setState('already-responded');
        } else {
          setState('active');
        }
      })
      .catch(() => {
        setState('error');
      });
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await api.post<ApiResponse<{ status: string; reEnrollmentToken?: string }>>(
        `/public/pre-reenrollment/${token}/respond`,
        { response: 'AGREED' },
      );
      const reEnrollmentToken = res.data.data?.reEnrollmentToken;
      if (reEnrollmentToken) {
        window.location.href = `/re-enrollment/${reEnrollmentToken}`;
      } else {
        setState('success');
      }
    } catch {
      setState('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600 mx-auto mb-3" />
          <p className="text-sm text-neutral-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="max-w-sm text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-neutral-800 mb-2">Link inválido ou expirado</h1>
          <p className="text-sm text-neutral-500">
            Entre em contato com a escola para obter um novo link.
          </p>
        </div>
      </div>
    );
  }

  if (state === 'already-responded' && data) {
    const statusLabels: Record<string, string> = {
      AGREED: 'Confirmado',
      DISAGREED: 'Respondido',
      NEGOTIATING: 'Em análise',
      NEGOTIATED: 'Concluído',
    };
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="max-w-sm text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-neutral-800 mb-2">
            Você já respondeu a esta comunicação.
          </h1>
          <p className="text-sm text-neutral-500 mb-2">Obrigado!</p>
          <span className="inline-block px-3 py-1 text-xs font-medium bg-neutral-100 text-neutral-700 rounded-full">
            Status: {statusLabels[data.status] || data.status}
          </span>
        </div>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
        <div className="max-w-md text-center">
          <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-lg font-semibold text-neutral-800 mb-2">
            Confirmação registrada!
          </h1>
          <p className="text-sm text-neutral-600 mb-4">
            Sua confirmação foi registrada com sucesso.
          </p>
          <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 text-left">
            <p className="text-sm text-cyan-800 font-medium mb-1">Próximo passo</p>
            <p className="text-sm text-cyan-700">
              Você receberá em breve um e-mail com o link para preencher o formulário de rematrícula com os dados atualizados do aluno.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-neutral-900">
            Pré-Rematrícula
          </h1>
          <p className="text-sm text-neutral-500 mt-1">{data.periodName}</p>
        </div>

        {/* Student info */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 mb-4 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-800 mb-3">Dados do Aluno</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-medium text-neutral-500">Nome</span>
              <p className="text-sm font-medium text-neutral-900">{data.studentName}</p>
            </div>
            <div>
              <span className="text-[10px] font-medium text-neutral-500">Série</span>
              <p className="text-sm font-medium text-neutral-900">{data.grade}</p>
            </div>
          </div>
        </div>

        {/* Financial info — show full value and discounted value */}
        <div className="bg-white border-2 border-cyan-200 rounded-xl p-5 mb-4 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-800 mb-3">Informações Financeiras</h2>
          {data.communicatedAnnualValue != null && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-500">Valor da mensalidade:</span>
                <span className="text-sm text-neutral-700">
                  {formatBRL(data.communicatedAnnualValue / 12)}
                </span>
              </div>
              <div className="border-t border-neutral-100 pt-2 flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-700">Valor com desconto:</span>
                <span className="text-lg font-bold text-emerald-600">
                  {formatBRL(data.communicatedAnnualValue / 12)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Deadline */}
        {data.deadline && (
          <div className="text-center mb-6">
            <p className="text-xs text-neutral-500">
              Prazo para manifestação:{' '}
              <strong className="text-neutral-700">{formatDate(data.deadline)}</strong>
            </p>
          </div>
        )}

        {/* Info about next step */}
        <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-3 mb-4 text-center">
          <p className="text-xs text-neutral-600">
            Ao confirmar, você receberá um e-mail com o link para preencher o formulário de rematrícula.
          </p>
        </div>

        {/* Single confirm button — no negotiate option */}
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="w-full py-3 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Confirmar Rematrícula
        </button>
      </div>
    </div>
  );
}
