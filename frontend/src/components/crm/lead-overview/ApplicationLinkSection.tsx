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
import { useGenerateApplicationLink, useTokenStatus, useRevokeToken, useSendApplicationLinkEmail } from '@/hooks/useLeads';
import { TokenCountdown } from './TokenCountdown';

interface ApplicationLinkSectionProps {
  lead: Lead;
}

export function ApplicationLinkSection({ lead }: ApplicationLinkSectionProps) {
  const generateLinkMutation = useGenerateApplicationLink();
  const revokeTokenMutation = useRevokeToken();
  const sendApplicationEmailMutation = useSendApplicationLinkEmail();
  const { data: tokenStatusData } = useTokenStatus(lead.id);
  const tokenStatus = tokenStatusData?.data;

  const applicationLink = lead.applicationToken
    ? `${window.location.origin}/admissions/apply?token=${lead.applicationToken}`
    : null;

  const handleGenerateLink = () => {
    generateLinkMutation.mutate(lead.id);
  };

  const handleCopyLink = () => {
    if (applicationLink) {
      navigator.clipboard.writeText(applicationLink);
      toast.success('Link copiado para a area de transferencia!');
    }
  };

  const handleRevokeToken = () => {
    if (confirm('Tem certeza que deseja revogar o link? O cliente nao podera mais usa-lo.')) {
      revokeTokenMutation.mutate(lead.id);
    }
  };

  const handleSendApplicationEmail = () => {
    sendApplicationEmailMutation.mutate(lead.id);
  };

  return (
    <section className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-4 border border-primary-200">
      <h3 className="text-sm font-semibold text-primary-800 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Link2 className="w-4 h-4" />
        Link de Inscricao
      </h3>

      {applicationLink && tokenStatus ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-primary-700">Status:</span>
            {tokenStatus.isExpired ? (
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

          {tokenStatus.expiresAt && !tokenStatus.isExpired && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-primary-700">Expira em:</span>
              <TokenCountdown expiresAt={tokenStatus.expiresAt} />
            </div>
          )}

          <div className="flex items-center gap-2 bg-white rounded-lg p-2 border border-primary-200">
            <input
              type="text"
              value={applicationLink}
              readOnly
              className={`flex-1 text-sm bg-transparent border-none focus:outline-none truncate ${
                tokenStatus.isExpired ? 'text-neutral-400 line-through' : 'text-neutral-600'
              }`}
            />
            {!tokenStatus.isExpired && (
              <>
                <button
                  onClick={handleCopyLink}
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Copiar link"
                >
                  <Copy className="w-4 h-4 text-primary-600" />
                </button>
                <a
                  href={applicationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Abrir link"
                >
                  <ExternalLink className="w-4 h-4 text-primary-600" />
                </a>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGenerateLink}
              disabled={generateLinkMutation.isPending}
              className="btn btn-outline btn-sm flex-1"
            >
              {generateLinkMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {tokenStatus.isExpired ? 'Gerar Novo Link' : 'Renovar Link'}
            </button>
            {!tokenStatus.isExpired && (
              <>
                <button
                  onClick={handleSendApplicationEmail}
                  disabled={sendApplicationEmailMutation.isPending}
                  className="btn btn-outline btn-sm"
                  title={`Enviar para ${lead.primaryContactEmail}`}
                >
                  {sendApplicationEmailMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Enviar por Email
                </button>
                <button
                  onClick={handleRevokeToken}
                  disabled={revokeTokenMutation.isPending}
                  className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                  title="Revogar link"
                >
                  {revokeTokenMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-primary-700">
            {tokenStatus.isExpired
              ? 'O link expirou. Gere um novo link para enviar ao responsavel.'
              : 'Envie este link para a familia preencher o formulario completo de inscricao.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-primary-700">
            Gere um link unico para a familia preencher o formulario completo de inscricao.
            O link expira em <strong>7 dias</strong>.
          </p>
          <button
            onClick={handleGenerateLink}
            disabled={generateLinkMutation.isPending}
            className="btn btn-primary btn-sm w-full"
          >
            {generateLinkMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                Gerar Link de Inscricao
              </>
            )}
          </button>
        </div>
      )}
    </section>
  );
}
