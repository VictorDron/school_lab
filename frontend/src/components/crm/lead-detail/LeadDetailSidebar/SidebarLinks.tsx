import type { Dispatch, SetStateAction } from 'react';
import {
  Link2,
  FileSearch,
  Copy,
  Send,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import type { Lead } from '@/types/crm';
import { SidebarSection } from '../SidebarSection';
import { FormViewerModal } from '@/components/crm/modals/FormViewerModal';
import type { ViewingForm } from './useLeadDetailSidebar';

interface SidebarLinksProps {
  lead: Lead;
  canEdit: boolean;
  applicationLink: string | null;
  enrollmentLink: string | null;
  showEnrollmentSection: boolean;
  tokenStatus: { isExpired: boolean } | undefined;
  enrollmentStatus: { isExpired: boolean } | undefined;
  viewingForm: ViewingForm;
  setViewingForm: Dispatch<SetStateAction<ViewingForm>>;
  onCopyLink: (link: string, label: string) => void;
  onGenerateApplicationLink: () => void;
  onSendApplicationEmail: () => void;
  onGenerateEnrollmentLink: () => void;
  onSendEnrollmentEmail: () => void;
  generateApplicationLinkPending: boolean;
  sendApplicationEmailPending: boolean;
  generateEnrollmentLinkPending: boolean;
  sendEnrollmentEmailPending: boolean;
}

export function SidebarLinks({
  lead,
  canEdit,
  applicationLink,
  enrollmentLink,
  showEnrollmentSection,
  tokenStatus,
  enrollmentStatus,
  viewingForm,
  setViewingForm,
  onCopyLink,
  onGenerateApplicationLink,
  onSendApplicationEmail,
  onGenerateEnrollmentLink,
  onSendEnrollmentEmail,
  generateApplicationLinkPending,
  sendApplicationEmailPending,
  generateEnrollmentLinkPending,
  sendEnrollmentEmailPending,
}: SidebarLinksProps) {
  return (
    <SidebarSection
      title="Links"
      icon={<Link2 className="w-3.5 h-3.5 text-neutral-400" />}
      defaultOpen
    >
      <div className="space-y-3">
        <div>
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
            Inscrição
          </p>
          {applicationLink && tokenStatus ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    tokenStatus.isExpired ? 'bg-red-500' : 'bg-green-500'
                  }`}
                />
                <span className={`text-xs font-medium ${tokenStatus.isExpired ? 'text-red-600' : 'text-green-600'}`}>
                  {tokenStatus.isExpired ? 'Expirado' : 'Link Ativo'}
                </span>
              </div>
              {!tokenStatus.isExpired && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onCopyLink(applicationLink, 'Link de inscrição')}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded transition-colors"
                    title="Copiar link"
                  >
                    <Copy className="w-3 h-3" />
                    Copiar
                  </button>
                  <button
                    onClick={onSendApplicationEmail}
                    disabled={sendApplicationEmailPending}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded transition-colors"
                    title={`Enviar para ${lead.primaryContactEmail}`}
                  >
                    {sendApplicationEmailPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    Email
                  </button>
                  <a
                    href={applicationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded transition-colors"
                    title="Abrir link"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              {tokenStatus.isExpired && canEdit && (
                <button
                  onClick={onGenerateApplicationLink}
                  disabled={generateApplicationLinkPending}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded transition-colors"
                >
                  {generateApplicationLinkPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Link2 className="w-3 h-3" />
                  )}
                  Gerar Novo Link
                </button>
              )}
              {lead.applicationStatus === 'FORM_RECEIVED' && (
                <button
                  onClick={() => setViewingForm('admission')}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded transition-colors mt-0.5"
                  title="Visualizar formulário de inscrição preenchido"
                >
                  <FileSearch className="w-3 h-3" />
                  Ver Formulário
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
              <span className="text-xs text-neutral-400">Sem link</span>
              {canEdit && (
                <button
                  onClick={onGenerateApplicationLink}
                  disabled={generateApplicationLinkPending}
                  className="ml-auto flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded transition-colors"
                >
                  {generateApplicationLinkPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Link2 className="w-3 h-3" />
                  )}
                  Gerar Link
                </button>
              )}
            </div>
          )}
        </div>

        {showEnrollmentSection && (
          <div>
            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Matrícula
            </p>
            {enrollmentLink && enrollmentStatus ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      enrollmentStatus.isExpired ? 'bg-red-500' : 'bg-green-500'
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      enrollmentStatus.isExpired ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {enrollmentStatus.isExpired ? 'Expirado' : 'Link Ativo'}
                  </span>
                </div>
                {!enrollmentStatus.isExpired && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onCopyLink(enrollmentLink, 'Link de matrícula')}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                      title="Copiar link"
                    >
                      <Copy className="w-3 h-3" />
                      Copiar
                    </button>
                    <button
                      onClick={onSendEnrollmentEmail}
                      disabled={sendEnrollmentEmailPending}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                      title={`Enviar para ${lead.primaryContactEmail}`}
                    >
                      {sendEnrollmentEmailPending ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      Email
                    </button>
                    <a
                      href={enrollmentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                      title="Abrir link"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                {enrollmentStatus.isExpired && canEdit && (
                  <button
                    onClick={onGenerateEnrollmentLink}
                    disabled={generateEnrollmentLinkPending}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                  >
                    {generateEnrollmentLinkPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Link2 className="w-3 h-3" />
                    )}
                    Gerar Novo Link
                  </button>
                )}
                {lead.enrollmentStatus === 'FORM_RECEIVED' && (
                  <button
                    onClick={() => setViewingForm('enrollment')}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 rounded transition-colors mt-0.5"
                    title="Visualizar formulário de matrícula preenchido"
                  >
                    <FileSearch className="w-3 h-3" />
                    Ver Formulário
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                <span className="text-xs text-neutral-400">Sem link</span>
                {canEdit && (
                  <button
                    onClick={onGenerateEnrollmentLink}
                    disabled={generateEnrollmentLinkPending}
                    className="ml-auto flex items-center gap-1 px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                  >
                    {generateEnrollmentLinkPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Link2 className="w-3 h-3" />
                    )}
                    Gerar Link
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {viewingForm && (
          <FormViewerModal
            lead={lead}
            formType={viewingForm}
            onClose={() => setViewingForm(null)}
          />
        )}
      </div>
    </SidebarSection>
  );
}
