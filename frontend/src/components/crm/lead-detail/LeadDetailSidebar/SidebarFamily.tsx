import {
  User,
  Users,
  Home,
  MapPin,
  Heart,
  Brain,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import type { ElementType } from 'react';
import type { Lead } from '@/types/crm';
import { SidebarSection } from '../SidebarSection';
import { formatAddressLine, parentTypeLabels } from './helpers';

interface SidebarFamilyProps {
  lead: Lead;
  hasFormData: boolean;
}

export function SidebarFamily({ lead, hasFormData }: SidebarFamilyProps) {
  return (
    <>
      <SidebarSection
        title="Alunos"
        icon={<Users className="w-3.5 h-3.5 text-neutral-400" />}
        defaultOpen
        count={lead.children?.length}
      >
        {lead.children && lead.children.length > 0 ? (
          <div className="space-y-1">
            {lead.children.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-neutral-50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium text-neutral-800 truncate">
                    {child.fullName}
                  </span>
                  {child.relationship === 'SIBLING' && (
                    <span className="text-[10px] px-1 py-0.5 bg-neutral-100 text-neutral-500 rounded flex-shrink-0">
                      Irmão(ã)
                    </span>
                  )}
                </div>
                {child.desiredGrade && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-primary-50 text-primary-600 rounded-full font-medium flex-shrink-0 ml-2">
                    {child.desiredGrade}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-400 italic">Nenhum aluno cadastrado</p>
        )}
      </SidebarSection>

      {hasFormData && (
        <SidebarSection
          title="Dados da Família"
          icon={<Home className="w-3.5 h-3.5 text-neutral-400" />}
          defaultOpen={false}
        >
          <div className="space-y-3">
            {lead.parents && lead.parents.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Responsáveis
                </p>
                <div className="space-y-1.5">
                  {lead.parents.map((parent) => (
                    <div
                      key={parent.id}
                      className="flex items-center gap-2 py-1.5 px-2 bg-neutral-50 rounded"
                    >
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-3 h-3 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-neutral-800 truncate">
                          {parent.fullName}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-emerald-600 font-medium">
                            {parentTypeLabels[parent.parentType] || parent.parentType}
                          </span>
                          {parent.email && (
                            <span className="text-[10px] text-neutral-400 truncate">
                              {parent.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lead.address && (
              <div>
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Endereço
                </p>
                <div className="flex items-start gap-2 text-xs text-neutral-600">
                  <MapPin className="w-3 h-3 text-neutral-400 mt-0.5 flex-shrink-0" />
                  <span>{formatAddressLine(lead.address)}</span>
                </div>
              </div>
            )}

            {lead.additionalInfo && (
              <div>
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Informações
                </p>
                <div className="flex flex-wrap gap-1">
                  {lead.additionalInfo.hasPsychoEvaluation && (
                    <InfoBadge
                      icon={Brain}
                      label="Aval. Psico"
                      colorClass="text-purple-700 bg-purple-50"
                    />
                  )}
                  {lead.additionalInfo.hasAcademicSupport && (
                    <InfoBadge
                      icon={BookOpen}
                      label="Suporte Acad."
                      colorClass="text-blue-700 bg-blue-50"
                    />
                  )}
                  {lead.additionalInfo.hasHealthIssues && (
                    <InfoBadge
                      icon={Heart}
                      label="Saúde"
                      colorClass="text-red-700 bg-red-50"
                    />
                  )}
                  {lead.additionalInfo.hasAdaptationDifficulty && (
                    <InfoBadge
                      icon={AlertCircle}
                      label="Adaptação"
                      colorClass="text-amber-700 bg-amber-50"
                    />
                  )}
                  {!lead.additionalInfo.hasPsychoEvaluation &&
                    !lead.additionalInfo.hasAcademicSupport &&
                    !lead.additionalInfo.hasHealthIssues &&
                    !lead.additionalInfo.hasAdaptationDifficulty && (
                      <span className="text-[10px] text-neutral-400 italic">
                        Nenhuma condição reportada
                      </span>
                    )}
                </div>
              </div>
            )}

            {lead.educationHistory && lead.educationHistory.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Histórico Educacional
                </p>
                <div className="space-y-1">
                  {lead.educationHistory.map((edu) => (
                    <div key={edu.id} className="flex items-center justify-between py-1 px-2 bg-neutral-50 rounded">
                      <span className="text-xs text-neutral-700 truncate">{edu.schoolName}</span>
                      {(edu.yearStart || edu.yearEnd) && (
                        <span className="text-[10px] text-neutral-400 flex-shrink-0 ml-2">
                          {edu.yearStart}
                          {edu.yearEnd && edu.yearEnd !== edu.yearStart ? `-${edu.yearEnd}` : ''}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SidebarSection>
      )}
    </>
  );
}

function InfoBadge({
  icon: Icon,
  label,
  colorClass,
}: {
  icon: ElementType;
  label: string;
  colorClass: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${colorClass}`}>
      <Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}
