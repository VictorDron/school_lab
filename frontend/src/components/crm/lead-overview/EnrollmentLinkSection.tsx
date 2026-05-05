import {
  Link2,
  Copy,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Lead } from '@/types/crm';
import { useGenerateEnrollmentLink, useEnrollmentTokenStatus, useRevokeEnrollmentToken, useSendEnrollmentLinkEmail } from '@/hooks/useLeads';
import { TokenCountdown } from './TokenCountdown';

interface EnrollmentLinkSectionProps {
  lead: Lead;
}

export function EnrollmentLinkSection({ lead }: EnrollmentLinkSectionProps) {
  const generateEnrollmentLinkMutation = useGenerateEnrollmentLink();
  const revokeEnrollmentTokenMutation = useRevokeEnrollmentToken();
  const sendEnrollmentEmailMutation = useSendEnrollmentLinkEmail();
  const { data: enrollmentStatusData } = useEnrollmentTokenStatus(lead.id);
  const enrollmentStatus = enrollmentStatusData?.data;

  const enrollmentLink = lead.enrollmentToken
    ? `${window.location.origin}/enrollment/apply?token=${lead.enrollmentToken}`
    : null;

  const handleGenerateEnrollmentLink = () => {
    generateEnrollmentLinkMutation.mutate(lead.id);
  };

  const handleCopyEnrollmentLink = () => {
    if (enrollmentLink) {
      navigator.clipboard.writeText(enrollmentLink);
      toast.success('Link de matricula copiado para a area de transferencia!');
    }
  };

  const handleRevokeEnrollmentToken = () => {
    if (confirm('Tem certeza que deseja revogar o link de matricula? O cliente nao podera mais usa-lo.')) {
      revokeEnrollmentTokenMutation.mutate(lead.id);
    }
  };

  const handleSendEnrollmentEmail = () => {
    sendEnrollmentEmailMutation.mutate(lead.id);
  };

  const wasEnrollmentSubmitted = enrollmentStatus?.wasSubmitted || !!lead.enrollmentSubmittedAt;

  return (
    <section className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
      <h3 className="text-sm font-semibold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Link2 className="w-4 h-4" />
        Link de Matricula
      </h3>

      {/* Enrollment submitted banner */}
      {wasEnrollmentSubmitted && (
        <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-3 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">Formulario de Matricula Preenchido</p>
            <p className="text-xs text-green-700">
              Enviado em{' '}
              {lead.enrollmentSubmittedAt
                ? new Date(lead.enrollmentSubmittedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'data nao registrada'}
            </p>
          </div>
        </div>
      )}

      {enrollmentLink && enrollmentStatus ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-emerald-700">Status:</span>
            {enrollmentStatus.isExpired ? (
              <span className="text-red-600 flex items-center gap-1 font-medium">
                <XCircle className="w-4 h-4" />
                Link Expirado
              </span>
            ) : (
              <span className="text-green-600 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Link Ativo
              </span>
            )}
          </div>

          {enrollmentStatus.expiresAt && !enrollmentStatus.isExpired && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-700">Expira em:</span>
              <TokenCountdown expiresAt={enrollmentStatus.expiresAt} />
            </div>
          )}

          <div className="flex items-center gap-2 bg-white rounded-lg p-2 border border-emerald-200">
            <input
              type="text"
              value={enrollmentLink}
              readOnly
              className={`flex-1 text-sm bg-transparent border-none focus:outline-none truncate ${
                enrollmentStatus.isExpired ? 'text-neutral-400 line-through' : 'text-neutral-600'
              }`}
            />
            {!enrollmentStatus.isExpired && (
              <>
                <button
                  onClick={handleCopyEnrollmentLink}
                  className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Copiar link"
                >
                  <Copy className="w-4 h-4 text-emerald-600" />
                </button>
                <a
                  href={enrollmentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Abrir link"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-600" />
                </a>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGenerateEnrollmentLink}
              disabled={generateEnrollmentLinkMutation.isPending}
              className="btn btn-outline btn-sm flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              {generateEnrollmentLinkMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {enrollmentStatus.isExpired ? 'Gerar Novo Link' : 'Renovar Link'}
            </button>
            {!enrollmentStatus.isExpired && (
              <>
                <button
                  onClick={handleSendEnrollmentEmail}
                  disabled={sendEnrollmentEmailMutation.isPending}
                  className="btn btn-outline btn-sm border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  title={`Enviar para ${lead.primaryContactEmail}`}
                >
                  {sendEnrollmentEmailMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Enviar por Email
                </button>
                <button
                  onClick={handleRevokeEnrollmentToken}
                  disabled={revokeEnrollmentTokenMutation.isPending}
                  className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                  title="Revogar link"
                >
                  {revokeEnrollmentTokenMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-emerald-700">
            {enrollmentStatus.isExpired
              ? 'O link expirou. Gere um novo link para enviar ao responsavel.'
              : 'Envie este link para a familia preencher o formulario de matricula.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-emerald-700">
            Gere um link unico para a familia preencher o formulario de matricula.
            O link expira em <strong>7 dias</strong>.
          </p>
          <button
            onClick={handleGenerateEnrollmentLink}
            disabled={generateEnrollmentLinkMutation.isPending}
            className="btn btn-sm w-full bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {generateEnrollmentLinkMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                Gerar Link de Matricula
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
