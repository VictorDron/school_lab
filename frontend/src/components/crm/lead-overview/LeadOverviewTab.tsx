import {
  Mail,
  Phone,
  Users,
  MapPin,
  Calendar,
  User,
  CheckCircle2,
  RefreshCw,
  UserPlus,
  Heart,
  Brain,
  BookOpen,
  AlertCircle,
  Info,
  School,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { sourceConfig, type Lead } from '@/types/crm';
import { useAuthStore } from '@/stores/authStore';
import { useTokenStatus } from '@/hooks/useLeads';
import { ApplicationStatusBadge, OriginBadge, type ApplicationStatusType, type LeadOriginType } from '../badges/ApplicationStatusBadge';
import { ParentCard } from './ParentCard';
import { FinancialResponsibleSection } from './FinancialResponsibleSection';
import { HealthPlanSection } from './HealthPlanSection';
import { AddressSection } from './AddressSection';
import { AdditionalInfoItem } from './AdditionalInfoItem';
import { ApplicationLinkSection } from './ApplicationLinkSection';
import { EnrollmentLinkSection } from './EnrollmentLinkSection';

interface LeadOverviewTabProps {
  lead: Lead;
}

export function LeadOverviewTab({ lead }: LeadOverviewTabProps) {
  const { user } = useAuthStore();
  const canEditData = !!user;

  const { data: tokenStatusData } = useTokenStatus(lead.id);
  const tokenStatus = tokenStatusData?.data;

  const wasFormSubmitted = tokenStatus?.wasSubmitted || !!lead.applicationDate;
  const hasFormData = !!(lead.parents?.length || lead.address || lead.additionalInfo || lead.educationHistory?.length);

  const showEnrollmentLink = lead.applicationStatus === 'FORM_RECEIVED' && lead.admissionGateStatus && [
    'APPROVED', 'ENROLLMENT_PENDING', 'ENROLLMENT_COMPLETED',
    'CONTRACT_PENDING', 'CONTRACT_SIGNED', 'FINANCIAL_APPROVED', 'ENROLLED',
  ].includes(lead.admissionGateStatus);

  return (
    <div className="p-4 space-y-6">
      {/* Status Badges Section */}
      <section className="flex flex-wrap gap-2">
        {lead.applicationStatus && (
          <ApplicationStatusBadge status={lead.applicationStatus as ApplicationStatusType} />
        )}
        {lead.originType && (
          <OriginBadge origin={lead.originType as LeadOriginType} />
        )}
        {(lead.formSubmissionCount ?? 0) > 1 && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700">
            <RefreshCw className="w-3.5 h-3.5" />
            {lead.formSubmissionCount}x enviado
          </span>
        )}
      </section>

      {/* Application Status Banner */}
      {wasFormSubmitted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-800">Formulario Preenchido</h4>
            <p className="text-sm text-green-700">
              O responsavel preencheu o formulario de inscricao em{' '}
              {lead.lastFormSubmittedAt || lead.applicationDate
                ? new Date(lead.lastFormSubmittedAt || lead.applicationDate!).toLocaleDateString('pt-BR', {
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

      {/* Application Link Section */}
      <ApplicationLinkSection lead={lead} />

      {/* Enrollment Link Section */}
      {showEnrollmentLink && <EnrollmentLinkSection lead={lead} />}

      {/* Form Submission Data */}
      {hasFormData && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pt-2">
            <div className="flex-1 h-px bg-emerald-200" />
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider px-2">
              Dados Informados pela Familia
            </span>
            <div className="flex-1 h-px bg-emerald-200" />
          </div>

          {/* Parents/Guardians Section */}
          {lead.parents && lead.parents.length > 0 && (
            <section className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <h3 className="text-sm font-semibold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Responsaveis
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {lead.parents.map((parent) => (
                  <ParentCard key={parent.id} parent={parent} leadId={lead.id} canEdit={canEditData} />
                ))}
              </div>
            </section>
          )}

          {/* Address Section */}
          {lead.address && (
            <AddressSection address={lead.address} leadId={lead.id} canEdit={canEditData} />
          )}

          {/* Financial Responsible Section */}
          {lead.financialResponsible && (
            <FinancialResponsibleSection data={lead.financialResponsible} leadId={lead.id} canEdit={canEditData} />
          )}

          {/* Health Plan Section */}
          {lead.healthPlan && (
            <HealthPlanSection data={lead.healthPlan} leadId={lead.id} canEdit={canEditData} />
          )}

          {/* Additional Info Section */}
          {lead.additionalInfo && (
            <section className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <h3 className="text-sm font-semibold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Informacoes Adicionais
              </h3>
              <div className="space-y-2">
                <AdditionalInfoItem
                  icon={Brain}
                  label="Avaliacao Psicoeducacional"
                  hasCondition={lead.additionalInfo.hasPsychoEvaluation}
                  details={lead.additionalInfo.psychoEvaluationDetails}
                  colorClass="text-purple-700 bg-purple-50"
                />
                <AdditionalInfoItem
                  icon={BookOpen}
                  label="Suporte Academico"
                  hasCondition={lead.additionalInfo.hasAcademicSupport}
                  details={lead.additionalInfo.academicSupportDetails}
                  colorClass="text-blue-700 bg-blue-50"
                />
                <AdditionalInfoItem
                  icon={Heart}
                  label="Questoes de Saude"
                  hasCondition={lead.additionalInfo.hasHealthIssues}
                  details={lead.additionalInfo.healthIssuesDetails}
                  colorClass="text-red-700 bg-red-50"
                />
                <AdditionalInfoItem
                  icon={AlertCircle}
                  label="Dificuldade de Adaptacao"
                  hasCondition={lead.additionalInfo.hasAdaptationDifficulty}
                  details={lead.additionalInfo.adaptationDifficultyDetails}
                  colorClass="text-amber-700 bg-amber-50"
                />

                {lead.additionalInfo.otherRelevantInfo && (
                  <div className="bg-white rounded-lg p-3 border border-emerald-100">
                    <p className="text-sm font-medium text-neutral-700 mb-1">Outras Informacoes</p>
                    <p className="text-sm text-neutral-600">{lead.additionalInfo.otherRelevantInfo}</p>
                  </div>
                )}

                {!lead.additionalInfo.hasPsychoEvaluation &&
                  !lead.additionalInfo.hasAcademicSupport &&
                  !lead.additionalInfo.hasHealthIssues &&
                  !lead.additionalInfo.hasAdaptationDifficulty &&
                  !lead.additionalInfo.otherRelevantInfo && (
                    <p className="text-sm text-emerald-600 italic">
                      Nenhuma informacao adicional foi reportada pela familia.
                    </p>
                  )}
              </div>
            </section>
          )}

          {/* Education History Section */}
          {lead.educationHistory && lead.educationHistory.length > 0 && (
            <section className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <h3 className="text-sm font-semibold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                <School className="w-4 h-4" />
                Historico Educacional
              </h3>
              <div className="space-y-2">
                {lead.educationHistory.map((edu) => (
                  <div key={edu.id} className="bg-white rounded-lg p-3 border border-emerald-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-neutral-900 text-sm">{edu.schoolName}</p>
                        {(edu.city || edu.country) && (
                          <p className="text-neutral-500 text-xs flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {[edu.city, edu.country].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                      {(edu.yearStart || edu.yearEnd) && (
                        <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                          {edu.yearStart}{edu.yearEnd && edu.yearEnd !== edu.yearStart ? ` - ${edu.yearEnd}` : ''}
                        </span>
                      )}
                    </div>
                    {edu.gradesAttended && (
                      <p className="text-neutral-600 text-xs mt-1">
                        <strong>Series:</strong> {edu.gradesAttended}
                      </p>
                    )}
                    {edu.notes && (
                      <p className="text-neutral-500 text-xs mt-1 italic">{edu.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Primary Contact Info */}
      <section>
        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
          Contato Principal
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-neutral-900">{lead.primaryContactName}</p>
              <p className="text-sm text-neutral-500">Responsavel Principal</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-neutral-600">
            <Mail className="w-4 h-4 text-neutral-400" />
            <a href={`mailto:${lead.primaryContactEmail}`} className="hover:text-primary-600">
              {lead.primaryContactEmail}
            </a>
          </div>

          {lead.primaryContactPhone && (
            <div className="flex items-center gap-3 text-neutral-600">
              <Phone className="w-4 h-4 text-neutral-400" />
              <a href={`tel:${lead.primaryContactPhone}`} className="hover:text-primary-600">
                {lead.primaryContactPhone}
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Secondary Contact Info */}
      {(lead.secondaryContactName || lead.secondaryContactEmail || lead.secondaryContactPhone) && (
        <section>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Contato Secundario
          </h3>
          <div className="space-y-3">
            {lead.secondaryContactName && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-neutral-500" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900">{lead.secondaryContactName}</p>
                  <p className="text-sm text-neutral-500">Responsavel Secundario</p>
                </div>
              </div>
            )}

            {lead.secondaryContactEmail && (
              <div className="flex items-center gap-3 text-neutral-600">
                <Mail className="w-4 h-4 text-neutral-400" />
                <a href={`mailto:${lead.secondaryContactEmail}`} className="hover:text-primary-600">
                  {lead.secondaryContactEmail}
                </a>
              </div>
            )}

            {lead.secondaryContactPhone && (
              <div className="flex items-center gap-3 text-neutral-600">
                <Phone className="w-4 h-4 text-neutral-400" />
                <a href={`tel:${lead.secondaryContactPhone}`} className="hover:text-primary-600">
                  {lead.secondaryContactPhone}
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Children Info */}
      <section>
        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
          Informacoes dos Alunos
        </h3>
        <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-600">
              <Users className="w-4 h-4" />
              <span>Numero de Filhos</span>
            </div>
            <span className="font-medium text-neutral-900">{lead.numberOfChildren}</span>
          </div>

          {lead.desiredGrades && lead.desiredGrades.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Series Desejadas</span>
              <div className="flex flex-wrap gap-1 justify-end">
                {lead.desiredGrades.map((grade, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full"
                  >
                    {grade}
                  </span>
                ))}
              </div>
            </div>
          )}

          {lead.hasSiblingsAtSchool !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Irmaos na Escola</span>
              <span className="font-medium text-neutral-900">
                {lead.hasSiblingsAtSchool ? 'Sim' : 'Nao'}
              </span>
            </div>
          )}

          {lead.children && lead.children.length > 0 && (
            <div className="pt-3 border-t border-neutral-200">
              <p className="text-sm text-neutral-600 mb-2">Criancas cadastradas:</p>
              <div className="space-y-2">
                {lead.children.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center justify-between bg-white rounded p-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900">{child.fullName}</span>
                      {child.relationship === 'SIBLING' && (
                        <span className="text-xs px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded">
                          Irmao(a)
                        </span>
                      )}
                    </div>
                    {child.desiredGrade && (
                      <span className="text-xs text-neutral-500">{child.desiredGrade}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Source & Meta */}
      <section>
        <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
          Informacoes do Lead
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-600">
              <MapPin className="w-4 h-4" />
              <span>Origem</span>
            </div>
            <span className="font-medium text-neutral-900">
              {sourceConfig[lead.source]?.label || lead.source}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-neutral-600">
              <Calendar className="w-4 h-4" />
              <span>Criado</span>
            </div>
            <span className="text-neutral-900">
              {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: ptBR })}
            </span>
          </div>

          {lead.creator && (
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Criado por</span>
              <span className="text-neutral-900">{lead.creator.displayName}</span>
            </div>
          )}

          {lead.applicationDate && (
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Data da Inscricao</span>
              <span className="text-neutral-900">
                {new Date(lead.applicationDate).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Notes */}
      {lead.notes && (
        <section>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Observacoes
          </h3>
          <div className="bg-neutral-50 rounded-lg p-4">
            <p className="text-neutral-700 whitespace-pre-wrap">{lead.notes}</p>
          </div>
        </section>
      )}

      {/* Counters */}
      {(lead._count || lead.documents || lead.comments) && (
        <section>
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Resumo
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-neutral-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-neutral-900">
                {lead._count?.documents || lead.documents?.length || 0}
              </p>
              <p className="text-sm text-neutral-500">Documentos</p>
            </div>
            <div className="bg-neutral-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-neutral-900">
                {lead._count?.comments || lead.comments?.length || 0}
              </p>
              <p className="text-sm text-neutral-500">Comentarios</p>
            </div>
            <div className="bg-neutral-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-neutral-900">
                {lead.children?.length || 0}
              </p>
              <p className="text-sm text-neutral-500">Criancas</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
