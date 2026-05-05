import { X, User, MapPin, BookOpen, Heart, GraduationCap, Phone, Mail, FileText, Calendar, Users, Shield, Car, DollarSign, AlertTriangle, Stethoscope } from 'lucide-react';
import type { Lead, LeadChild, LeadParent, LeadAddress, LeadAdditionalInfo, LeadEducationHistory } from '@/types/crm';

const relationshipLabels: Record<string, string> = {
  GRANDPARENT: 'Avô/Avó',
  UNCLE_AUNT: 'Tio/Tia',
  SIBLING: 'Irmão/Irmã',
  NANNY: 'Babá',
  DRIVER: 'Motorista',
  NEIGHBOR: 'Vizinho',
  FRIEND: 'Amigo da família',
  FATHER: 'Pai',
  MOTHER: 'Mãe',
  GUARDIAN: 'Responsável',
  OTHER: 'Outro',
};

interface FormViewerModalProps {
  lead: Lead;
  formType: 'admission' | 'enrollment';
  onClose: () => void;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
        <div className="p-1.5 rounded-lg bg-[#0aacce]/10 text-[#0aacce]">{icon}</div>
        <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-neutral-800 mt-0.5">{value || <span className="text-neutral-300 italic">Não informado</span>}</p>
    </div>
  );
}

function BooleanBadge({ label, value, details }: { label: string; value?: boolean; details?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
      <Heart className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-xs font-semibold text-amber-800">{label}</p>
        {details && <p className="text-xs text-amber-700 mt-0.5">{details}</p>}
      </div>
    </div>
  );
}

function ChildCard({ child, index }: { child: LeadChild; index: number }) {
  return (
    <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-[#0aacce]/10 flex items-center justify-center">
          <span className="text-xs font-bold text-[#0aacce]">{index + 1}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900">{child.fullName}</p>
          {child.desiredGrade && (
            <p className="text-xs text-neutral-500">{child.desiredGrade}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pl-9">
        {child.dateOfBirth && <Field label="Data de Nascimento" value={new Date(child.dateOfBirth).toLocaleDateString('pt-BR')} />}
        {child.gender && <Field label="Gênero" value={child.gender} />}
        {child.nationality && <Field label="Nacionalidade" value={child.nationality} />}
        {child.currentSchool && <Field label="Escola Atual" value={child.currentSchool} />}
        {child.currentGrade && <Field label="Série Atual" value={child.currentGrade} />}
        {child.primaryLanguage && <Field label="Idioma Principal" value={child.primaryLanguage} />}
        {child.specialNeeds && <Field label="Necessidades Especiais" value={child.specialNeeds} />}
      </div>
    </div>
  );
}

function ParentCard({ parent }: { parent: LeadParent }) {
  const typeLabel = parent.parentType === 'FATHER' ? 'Pai' : parent.parentType === 'MOTHER' ? 'Mãe' : 'Responsável';
  return (
    <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900">{parent.fullName}</p>
          <p className="text-xs text-neutral-500">{typeLabel}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pl-9">
        {parent.email && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-600">
            <Mail className="w-3 h-3 text-neutral-400" />
            {parent.email}
          </div>
        )}
        {parent.phone && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-600">
            <Phone className="w-3 h-3 text-neutral-400" />
            {parent.phone}
          </div>
        )}
        {parent.cpf && <Field label="CPF" value={parent.cpf} />}
        {parent.occupation && <Field label="Profissão" value={parent.occupation} />}
        {parent.nativeLanguage && <Field label="Idioma Nativo" value={parent.nativeLanguage} />}
      </div>
    </div>
  );
}

function AddressCard({ address }: { address: LeadAddress }) {
  const parts = [
    address.street && `${address.street}${address.number ? `, ${address.number}` : ''}`,
    address.complement,
    address.neighborhood,
    [address.city, address.state].filter(Boolean).join(' - '),
    address.zipCode,
    address.country,
  ].filter(Boolean);

  return (
    <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
      <div className="flex items-start gap-2">
        <MapPin className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-neutral-700 space-y-0.5">
          {parts.map((part, i) => (
            <p key={i}>{part}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function EducationHistoryCard({ history }: { history: LeadEducationHistory }) {
  return (
    <div className="flex items-start gap-2 p-2.5 bg-neutral-50 rounded-lg border border-neutral-100">
      <GraduationCap className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-neutral-800">{history.schoolName}</p>
        <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
          {history.city && <span>{[history.city, history.country].filter(Boolean).join(', ')}</span>}
          {history.yearStart && (
            <span>{history.yearStart}{history.yearEnd ? ` - ${history.yearEnd}` : ' - atual'}</span>
          )}
        </div>
        {history.gradesAttended && <p className="text-xs text-neutral-500 mt-0.5">{history.gradesAttended}</p>}
        {history.notes && <p className="text-xs text-neutral-400 mt-1">{history.notes}</p>}
      </div>
    </div>
  );
}

export function FormViewerModal({ lead, formType, onClose }: FormViewerModalProps) {
  const isAdmission = formType === 'admission';
  const title = isAdmission ? 'Formulário de Inscrição' : 'Formulário de Matrícula';
  const children = lead.children || [];
  const parents = lead.parents || [];
  const address = lead.address;
  const additionalInfo = lead.additionalInfo;
  const educationHistory = lead.educationHistory || [];
  const submittedAt = isAdmission ? lead.lastFormSubmittedAt : lead.enrollmentSubmittedAt;
  const hasData = isAdmission
    ? !!(children.length || parents.length || address)
    : !!lead.enrollmentSubmittedAt;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0aacce]" />
              <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
              <span className="font-medium">{lead.code} - {lead.familyName}</span>
              {submittedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Enviado em {new Date(submittedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {!hasData ? (
            <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
              <FileText className="w-10 h-10 mb-3" />
              <p className="text-sm font-medium">Nenhum dado encontrado</p>
              <p className="text-xs mt-1">O formulário ainda não foi preenchido.</p>
            </div>
          ) : isAdmission ? (
            <>
              {/* Children / Students */}
              {children.length > 0 && (
                <Section title={`Alunos (${children.length})`} icon={<Users className="w-4 h-4" />}>
                  <div className="space-y-2">
                    {children.map((child, i) => (
                      <ChildCard key={child.id} child={child} index={i} />
                    ))}
                  </div>
                </Section>
              )}

              {/* Parents */}
              {parents.length > 0 && (
                <Section title="Responsáveis" icon={<User className="w-4 h-4" />}>
                  <div className="space-y-2">
                    {parents.map((parent) => (
                      <ParentCard key={parent.parentType} parent={parent} />
                    ))}
                  </div>
                </Section>
              )}

              {/* Address */}
              {address && (
                <Section title="Endereço" icon={<MapPin className="w-4 h-4" />}>
                  <AddressCard address={address} />
                </Section>
              )}

              {/* Education History */}
              {educationHistory.length > 0 && (
                <Section title="Histórico Educacional" icon={<BookOpen className="w-4 h-4" />}>
                  <div className="space-y-2">
                    {educationHistory.map((h, i) => (
                      <EducationHistoryCard key={i} history={h} />
                    ))}
                  </div>
                </Section>
              )}

              {/* Additional Info */}
              {additionalInfo && (
                <Section title="Informações Adicionais" icon={<Heart className="w-4 h-4" />}>
                  <div className="space-y-2">
                    <BooleanBadge label="Avaliação Psicológica" value={additionalInfo.hasPsychoEvaluation} details={additionalInfo.psychoEvaluationDetails} />
                    <BooleanBadge label="Suporte Acadêmico" value={additionalInfo.hasAcademicSupport} details={additionalInfo.academicSupportDetails} />
                    <BooleanBadge label="Questões de Saúde" value={additionalInfo.hasHealthIssues} details={additionalInfo.healthIssuesDetails} />
                    <BooleanBadge label="Dificuldade de Adaptação" value={additionalInfo.hasAdaptationDifficulty} details={additionalInfo.adaptationDifficultyDetails} />
                    {additionalInfo.otherRelevantInfo && (
                      <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-100">
                        <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Outras Informações</p>
                        <p className="text-sm text-neutral-700">{additionalInfo.otherRelevantInfo}</p>
                      </div>
                    )}
                    {!additionalInfo.hasPsychoEvaluation && !additionalInfo.hasAcademicSupport && !additionalInfo.hasHealthIssues && !additionalInfo.hasAdaptationDifficulty && !additionalInfo.otherRelevantInfo && (
                      <p className="text-xs text-neutral-400 italic">Nenhuma informação adicional reportada.</p>
                    )}
                  </div>
                </Section>
              )}
            </>
          ) : (
            <>
              {/* Enrollment Info */}
              {(lead.enrollmentInfo?.length ?? 0) > 0 && (
                <Section title="Dados Acadêmicos" icon={<GraduationCap className="w-4 h-4" />}>
                  <div className="space-y-2">
                    {lead.enrollmentInfo!.map((info) => (
                      <div key={info.id} className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 space-y-2">
                        {info.child && (
                          <p className="text-sm font-semibold text-neutral-900">{info.child.fullName}</p>
                        )}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                          {info.studentCpf && <Field label="CPF do Aluno" value={info.studentCpf} />}
                          {info.studentIdNumber && <Field label="RG/Passaporte" value={info.studentIdNumber} />}
                          {info.studentIdIssuer && <Field label="Órgão Emissor" value={info.studentIdIssuer} />}
                          {info.campus && <Field label="Campus" value={info.campus} />}
                          {info.classGroup && <Field label="Turma" value={info.classGroup} />}
                          {info.personType && <Field label="Tipo" value={info.personType} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Health Data per Child */}
              {(lead.childrenHealth?.length ?? 0) > 0 && (
                <Section title="Saúde dos Alunos" icon={<Stethoscope className="w-4 h-4" />}>
                  <div className="space-y-2">
                    {lead.childrenHealth!.map((health) => (
                      <div key={health.id} className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 space-y-2">
                        {health.child && (
                          <p className="text-sm font-semibold text-neutral-900">{health.child.fullName}</p>
                        )}
                        <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
                          {health.weight && <Field label="Peso" value={health.weight} />}
                          {health.height && <Field label="Altura" value={health.height} />}
                          {health.bloodType && <Field label="Tipo Sanguíneo" value={health.bloodType} />}
                        </div>
                        {(health.medicalConditions?.length ?? 0) > 0 && (
                          <div>
                            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Condições Médicas</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {health.medicalConditions!.map((c) => (
                                <span key={c} className="px-2 py-0.5 text-[10px] font-medium bg-red-50 text-red-700 rounded">{c}</span>
                              ))}
                            </div>
                            {health.medicalConditionsNotes && <p className="text-xs text-neutral-600 mt-1">{health.medicalConditionsNotes}</p>}
                          </div>
                        )}
                        {(health.allergies?.length ?? 0) > 0 && (
                          <div>
                            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Alergias</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {health.allergies!.map((a) => (
                                <span key={a} className="px-2 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 rounded">{a}</span>
                              ))}
                            </div>
                            {health.allergiesNotes && <p className="text-xs text-neutral-600 mt-1">{health.allergiesNotes}</p>}
                          </div>
                        )}
                        <BooleanBadge label="Hospitalizações" value={health.hasHospitalizations} details={health.hospitalizationsNotes} />
                        <BooleanBadge label="Convulsões/Desmaios" value={health.hasSeizures} details={health.seizuresNotes} />
                        <BooleanBadge label="Distúrbio Alimentar" value={health.hasEatingDisorder} details={health.eatingDisorderNotes} />
                        {health.regularMedications && <Field label="Medicamentos Regulares" value={health.regularMedications} />}
                        {health.medicationRestrictions && <Field label="Restrições de Medicamentos" value={health.medicationRestrictions} />}
                        {health.additionalHealthInfo && <Field label="Info Adicional de Saúde" value={health.additionalHealthInfo} />}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Health Plan */}
              {lead.healthPlan && (
                <Section title="Plano de Saúde" icon={<Shield className="w-4 h-4" />}>
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      <Field label="Operadora" value={lead.healthPlan.operator} />
                      <Field label="Código Beneficiário" value={lead.healthPlan.beneficiaryCode} />
                      <Field label="Tipo do Plano" value={lead.healthPlan.planType} />
                      <Field label="Hospital Preferido" value={lead.healthPlan.preferredHospital} />
                    </div>
                  </div>
                </Section>
              )}

              {/* Emergency Contacts */}
              {(lead.emergencyContacts?.length ?? 0) > 0 && (
                <Section title="Contatos de Emergência" icon={<AlertTriangle className="w-4 h-4" />}>
                  <div className="space-y-2">
                    {lead.emergencyContacts!.map((contact) => (
                      <div key={contact.id} className="flex items-center gap-3 p-2.5 bg-neutral-50 rounded-lg border border-neutral-100">
                        <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-3.5 h-3.5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-neutral-900">{contact.name}</p>
                            {contact.isPrimary && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold uppercase">Principal</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-neutral-500 mt-0.5">
                            <span>{contact.phone}</span>
                            {contact.relationship && <span>{relationshipLabels[contact.relationship] || contact.relationship}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Transport */}
              {lead.transport && (
                <Section title="Transporte" icon={<Car className="w-4 h-4" />}>
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      <Field label="Meio de Transporte" value={lead.transport.transportMethod} />
                      {lead.transport.transportMethodOther && <Field label="Outro" value={lead.transport.transportMethodOther} />}
                      {lead.transport.schoolBusCompany && <Field label="Empresa de Transporte" value={lead.transport.schoolBusCompany} />}
                      <Field label="Pode Sair Sozinho" value={lead.transport.canLeaveAlone ? 'Sim' : 'Não'} />
                      <Field label="Atleta" value={lead.transport.isAthlete ? 'Sim' : 'Não'} />
                      <Field label="Restrições Legais" value={lead.transport.hasLegalRestrictions ? 'Sim' : 'Não'} />
                    </div>
                    {lead.transport.legalRestrictionsNotes && (
                      <p className="text-xs text-red-600 mt-2">{lead.transport.legalRestrictionsNotes}</p>
                    )}
                  </div>
                </Section>
              )}

              {/* Financial Responsible */}
              {lead.financialResponsible && (
                <Section title="Responsável Financeiro" icon={<DollarSign className="w-4 h-4" />}>
                  <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      <Field label="Tipo" value={
                        lead.financialResponsible.responsibleType === 'FATHER' ? 'Pai' :
                        lead.financialResponsible.responsibleType === 'MOTHER' ? 'Mãe' : 'Outro'
                      } />
                      {lead.financialResponsible.personType && <Field label="Pessoa" value={lead.financialResponsible.personType === 'COMPANY' ? 'Jurídica' : 'Física'} />}
                      {lead.financialResponsible.fullName && <Field label="Nome" value={lead.financialResponsible.fullName} />}
                      {lead.financialResponsible.cpf && <Field label="CPF" value={lead.financialResponsible.cpf} />}
                      {lead.financialResponsible.email && <Field label="Email" value={lead.financialResponsible.email} />}
                      {lead.financialResponsible.phone && <Field label="Telefone" value={lead.financialResponsible.phone} />}
                      {lead.financialResponsible.companyName && <Field label="Razão Social" value={lead.financialResponsible.companyName} />}
                      {lead.financialResponsible.cnpj && <Field label="CNPJ" value={lead.financialResponsible.cnpj} />}
                    </div>
                  </div>
                </Section>
              )}

              {/* Empty state if no enrollment data at all */}
              {!(lead.enrollmentInfo?.length) && !(lead.childrenHealth?.length) && !lead.healthPlan && !(lead.emergencyContacts?.length) && !lead.transport && !lead.financialResponsible && (
                <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
                  <FileText className="w-10 h-10 mb-3" />
                  <p className="text-sm font-medium">Nenhum dado encontrado</p>
                  <p className="text-xs mt-1">O formulário de matrícula ainda não foi preenchido.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
