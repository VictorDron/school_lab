import {
  User,
  Mail,
  Phone,
  FileText,
  Link2,
  Users,
  Home,
  MapPin,
  Copy,
  ExternalLink,
  Calendar,
  Hash,
  GraduationCap,
  DollarSign,
  History,
  Send,
} from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { SidebarSection } from '@/components/crm/lead-detail/SidebarSection';
import type { InviteDetail } from '@/hooks/useReEnrollmentInvite';

interface ReEnrollmentInviteSidebarProps {
  detail: InviteDetail;
}

const GATE_LABELS: Record<string, string> = {
  CONVITE_ENVIADO: 'Convite Enviado',
  FORMULARIO_CONFIRMADO: 'Formulário Confirmado',
  DOCS_APROVADOS: 'Documentos Aprovados',
  CONTRATO_PENDENTE: 'Contrato Pendente',
  CONTRATO_ASSINADO: 'Contrato Assinado',
  TAXA_PAGA: 'Taxa Paga',
  REMATRICULADO: 'Rematriculado',
  RECUSADO: 'Recusado',
};

const PARENT_LABELS: Record<string, string> = {
  FATHER: 'Pai',
  MOTHER: 'Mãe',
  GUARDIAN: 'Responsável Legal',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/**
 * Left rail of the invite detail page. Reads everything from the single
 * detail payload — contact info + linked family siblings come from the
 * invite's lead, re-enrollment context (period, gate, deadline) from
 * the invite itself, and the public enrollment link is built from the
 * invite's token.
 */
const FINANCIAL_SUMMARY_LABELS: Record<string, string> = {
  ADIMPLENTE: 'Adimplente',
  INADIMPLENTE: 'Inadimplente',
  SEM_CONTRATO: 'Sem contrato',
};

const FINANCIAL_SUMMARY_TONE: Record<string, string> = {
  ADIMPLENTE: 'text-emerald-700',
  INADIMPLENTE: 'text-red-700',
  SEM_CONTRATO: 'text-neutral-500',
};

export function ReEnrollmentInviteSidebar({ detail }: ReEnrollmentInviteSidebarProps) {
  const { invite, student, lead, period, effectiveDeadline, pricing } = detail;

  const publicLink = `${window.location.origin}/public/re-enrollment/${invite.token}`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const hasSecondary = !!(
    lead.secondaryContactName ||
    lead.secondaryContactEmail ||
    lead.secondaryContactPhone
  );
  const hasAddress = !!lead.address;
  const hasParents = lead.parents.length > 0;

  const siblings = lead.children.filter((c) => c.id !== student.leadChildId);

  return (
    <aside className="w-full lg:w-[380px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-neutral-200 bg-white overflow-y-auto max-h-[40vh] lg:max-h-none">
      <div className="p-4 space-y-0">
        <SidebarSection
          title="Contato Principal"
          icon={<User className="w-3.5 h-3.5 text-neutral-400" />}
          defaultOpen
        >
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-primary-600">
                  {getInitials(lead.primaryContactName)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-900 truncate">
                  {lead.primaryContactName}
                </p>
                <p className="text-[11px] text-neutral-400">Responsável Principal</p>
              </div>
            </div>
            <div className="space-y-1 pl-12">
              <a
                href={`mailto:${lead.primaryContactEmail}`}
                className="flex items-center gap-2 text-xs text-neutral-600 hover:text-primary-600 transition-colors truncate"
              >
                <Mail className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                {lead.primaryContactEmail}
              </a>
              {lead.primaryContactPhone && (
                <a
                  href={`tel:${lead.primaryContactPhone}`}
                  className="flex items-center gap-2 text-xs text-neutral-600 hover:text-primary-600 transition-colors"
                >
                  <Phone className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                  {lead.primaryContactPhone}
                </a>
              )}
            </div>
          </div>
        </SidebarSection>

        {hasSecondary && (
          <SidebarSection
            title="Contato Secundário"
            icon={<User className="w-3.5 h-3.5 text-neutral-400" />}
            defaultOpen
          >
            <div className="space-y-1.5 text-xs text-neutral-600">
              {lead.secondaryContactName && (
                <p className="font-medium text-neutral-800">{lead.secondaryContactName}</p>
              )}
              {lead.secondaryContactEmail && (
                <a
                  href={`mailto:${lead.secondaryContactEmail}`}
                  className="flex items-center gap-2 hover:text-primary-600"
                >
                  <Mail className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                  {lead.secondaryContactEmail}
                </a>
              )}
              {lead.secondaryContactPhone && (
                <a
                  href={`tel:${lead.secondaryContactPhone}`}
                  className="flex items-center gap-2 hover:text-primary-600"
                >
                  <Phone className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                  {lead.secondaryContactPhone}
                </a>
              )}
            </div>
          </SidebarSection>
        )}

        <SidebarSection
          title="Resumo da Rematrícula"
          icon={<FileText className="w-3.5 h-3.5 text-neutral-400" />}
          defaultOpen
        >
          <div className="space-y-1.5">
            <Row label="Campanha">
              <span className="text-xs text-neutral-700">{period.name}</span>
            </Row>
            <Row label="Etapa">
              <span className="text-xs font-medium text-neutral-800">
                {GATE_LABELS[invite.gateStatus] || invite.gateStatus}
              </span>
            </Row>
            <Row label="Série atual">
              <span className="text-xs text-neutral-700 inline-flex items-center gap-1">
                <GraduationCap className="w-3 h-3 text-neutral-400" />
                {student.grade || '—'}
              </span>
            </Row>
            <Row label="Código aluno">
              <span className="font-mono text-xs bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-700 inline-flex items-center gap-1">
                <Hash className="w-2.5 h-2.5 text-neutral-400" />
                {student.code}
              </span>
            </Row>
            <Row label="Prazo efetivo">
              <span className="text-xs text-neutral-700 inline-flex items-center gap-1">
                <Calendar className="w-3 h-3 text-neutral-400" />
                {new Date(effectiveDeadline).toLocaleDateString('pt-BR')}
                {invite.extendedDeadline && (
                  <span className="text-[10px] text-amber-600 font-medium ml-1">
                    (estendido)
                  </span>
                )}
              </span>
            </Row>
            <Row label="Convite criado">
              <span className="text-xs text-neutral-700">
                {formatDistanceToNow(new Date(invite.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </Row>
            {invite.sentAt && (
              <Row label="Email enviado">
                <span className="text-xs text-neutral-700">
                  {formatDistanceToNow(new Date(invite.sentAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </Row>
            )}
            {invite.confirmedAt && (
              <Row label="Confirmado">
                <span className="text-xs text-emerald-700 font-medium">
                  {formatDistanceToNow(new Date(invite.confirmedAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </Row>
            )}
            {invite.declineReason && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-[11px] font-semibold text-red-700 uppercase tracking-wider mb-1">
                  Motivo da recusa
                </p>
                <p className="text-xs text-red-700">{invite.declineReason}</p>
              </div>
            )}
          </div>
        </SidebarSection>

        {student.previousStudent && (
          <SidebarSection
            title="Histórico Escolar"
            icon={<History className="w-3.5 h-3.5 text-neutral-400" />}
            defaultOpen={false}
          >
            <div className="space-y-1.5">
              <Row label="Ano anterior">
                <span className="text-xs text-neutral-700">
                  {student.previousStudent.academicYear}
                </span>
              </Row>
              <Row label="Série anterior">
                <span className="text-xs text-neutral-700 inline-flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-neutral-400" />
                  {student.previousStudent.grade ?? '—'}
                </span>
              </Row>
              <Row label="Status">
                <span className="text-xs text-neutral-700">
                  {student.previousStudent.status}
                </span>
              </Row>
            </div>
          </SidebarSection>
        )}

        <SidebarSection
          title="Comunicações"
          icon={<Send className="w-3.5 h-3.5 text-neutral-400" />}
          defaultOpen={false}
        >
          <div className="space-y-1.5">
            {invite.emailSentAt ? (
              <Row label="Convite enviado">
                <span className="text-xs text-neutral-700">
                  {formatDistanceToNow(new Date(invite.emailSentAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </Row>
            ) : (
              <p className="text-xs text-neutral-400">Convite ainda não enviado por email.</p>
            )}
            {pricing.preResponse?.emailSentAt && (
              <Row label="Pré-rematrícula">
                <span className="text-xs text-neutral-700">
                  {formatDistanceToNow(new Date(pricing.preResponse.emailSentAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </Row>
            )}
            {pricing.preResponse?.respondedAt && (
              <Row label="Resposta da família">
                <span className="text-xs text-emerald-700 font-medium">
                  {formatDistanceToNow(new Date(pricing.preResponse.respondedAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </Row>
            )}
          </div>
        </SidebarSection>

        <SidebarSection
          title="Financeiro"
          icon={<DollarSign className="w-3.5 h-3.5 text-neutral-400" />}
          defaultOpen={false}
        >
          <div className="space-y-1.5">
            <Row label="Adimplência">
              <span className={`text-xs font-medium ${FINANCIAL_SUMMARY_TONE[pricing.financialStatus]}`}>
                {FINANCIAL_SUMMARY_LABELS[pricing.financialStatus]}
              </span>
            </Row>
            {pricing.computed.finalValue != null && (
              <Row label="Valor anual">
                <span className="text-xs text-neutral-700">
                  {pricing.computed.finalValue.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </Row>
            )}
            <RouterLink
              to={`/crm/re-enrollments/${period.id}/pre-reenrollment`}
              className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 mt-1.5 font-medium"
            >
              <ExternalLink className="w-3 h-3" />
              Ver Pré-Rematrícula
            </RouterLink>
          </div>
        </SidebarSection>

        <SidebarSection
          title="Link Público"
          icon={<Link2 className="w-3.5 h-3.5 text-neutral-400" />}
          defaultOpen
        >
          <div className="space-y-2">
            <p className="text-[11px] text-neutral-400">
              URL do formulário de rematrícula acessado pela família.
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleCopy(publicLink, 'Link')}
                className="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded transition-colors"
              >
                <Copy className="w-3 h-3" />
                Copiar
              </button>
              <a
                href={publicLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Abrir
              </a>
            </div>
          </div>
        </SidebarSection>

        {siblings.length > 0 && (
          <SidebarSection
            title="Irmãos na família"
            icon={<Users className="w-3.5 h-3.5 text-neutral-400" />}
            defaultOpen
            count={siblings.length}
          >
            <div className="space-y-1">
              {siblings.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-neutral-50"
                >
                  <span className="text-xs font-medium text-neutral-800 truncate">
                    {c.fullName}
                  </span>
                  {c.currentGrade && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-primary-50 text-primary-600 rounded-full font-medium flex-shrink-0 ml-2">
                      {c.currentGrade}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </SidebarSection>
        )}

        {hasParents && (
          <SidebarSection
            title="Responsáveis"
            icon={<Home className="w-3.5 h-3.5 text-neutral-400" />}
            defaultOpen={false}
          >
            <div className="space-y-1.5">
              {lead.parents.map((p) => (
                <div
                  key={p.id}
                  className="py-1.5 px-2 bg-neutral-50 rounded text-xs text-neutral-700"
                >
                  <p className="font-medium text-neutral-800">{p.fullName}</p>
                  <p className="text-[10px] text-emerald-600 font-medium">
                    {PARENT_LABELS[p.parentType] || p.parentType}
                  </p>
                  {p.email && <p className="text-[10px] text-neutral-500">{p.email}</p>}
                  {p.phone && <p className="text-[10px] text-neutral-500">{p.phone}</p>}
                </div>
              ))}
            </div>
          </SidebarSection>
        )}

        {hasAddress && lead.address && (
          <SidebarSection
            title="Endereço"
            icon={<MapPin className="w-3.5 h-3.5 text-neutral-400" />}
            defaultOpen={false}
          >
            <div className="flex items-start gap-2 text-xs text-neutral-600">
              <MapPin className="w-3 h-3 text-neutral-400 mt-0.5 flex-shrink-0" />
              <span>
                {[lead.address.street, lead.address.number].filter(Boolean).join(', ')}
                {lead.address.neighborhood && ` - ${lead.address.neighborhood}`}
                {(lead.address.city || lead.address.state) && (
                  <>
                    {' - '}
                    {[lead.address.city, lead.address.state].filter(Boolean).join('/')}
                  </>
                )}
                {lead.address.zipCode && ` (${lead.address.zipCode})`}
              </span>
            </div>
          </SidebarSection>
        )}
      </div>
    </aside>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-neutral-500">{label}</span>
      {children}
    </div>
  );
}

