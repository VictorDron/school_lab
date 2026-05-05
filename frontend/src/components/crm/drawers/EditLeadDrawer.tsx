import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Loader2,
  User,
  Users,
  GraduationCap,
  FileText,
  ChevronDown,
  ChevronRight,
  Phone,
  Mail,
  Building2
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useUpdateLead } from '@/hooks/useLeads';
import {
  sourceConfig,
  gradeOptions,
  type Lead,
  type UpdateLeadData,
  type LeadSource
} from '@/types/crm';

interface EditLeadDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, icon, children, defaultOpen = true }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-primary-600">{icon}</div>
          <span className="font-medium text-neutral-900">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-neutral-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-neutral-500" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 space-y-4 bg-white">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function EditLeadDrawer({ lead, isOpen, onClose }: EditLeadDrawerProps) {
  const updateMutation = useUpdateLead();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateLeadData>();

  // Block body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure this runs after LeadDrawer cleanup
      const timeout = setTimeout(() => {
        document.body.style.overflow = 'hidden';
      }, 50);

      return () => {
        clearTimeout(timeout);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Reset form when lead changes
  useEffect(() => {
    if (lead) {
      reset({
        familyName: lead.familyName,
        primaryContactName: lead.primaryContactName,
        primaryContactEmail: lead.primaryContactEmail,
        primaryContactPhone: lead.primaryContactPhone || '',
        secondaryContactName: lead.secondaryContactName || '',
        secondaryContactEmail: lead.secondaryContactEmail || '',
        secondaryContactPhone: lead.secondaryContactPhone || '',
        numberOfChildren: lead.numberOfChildren,
        desiredGrades: lead.desiredGrades,
        source: lead.source,
        notes: lead.notes || '',
        hasSiblingsAtSchool: lead.hasSiblingsAtSchool || false,
      });
    }
  }, [lead, reset]);

  const onSubmit = (data: UpdateLeadData) => {
    if (!lead) return;

    // Clean empty strings for optional fields
    const cleanedData = {
      ...data,
      secondaryContactName: data.secondaryContactName || undefined,
      secondaryContactEmail: data.secondaryContactEmail || undefined,
      secondaryContactPhone: data.secondaryContactPhone || undefined,
      primaryContactPhone: data.primaryContactPhone || undefined,
      notes: data.notes || undefined,
    };

    updateMutation.mutate(
      { id: lead.id, data: cleanedData },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && lead && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">Editar Lead</h2>
                <p className="text-sm text-neutral-500 mt-0.5">{lead.code}</p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            {/* Form Content */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex-1 overflow-y-auto"
            >
              <div className="p-6 space-y-4">
                {/* Basic Info Section */}
                <Section
                  title="Informações Básicas"
                  icon={<FileText className="w-5 h-5" />}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="label">Nome da Família *</label>
                      <input
                        {...register('familyName', { required: 'Nome obrigatório' })}
                        className="input"
                        placeholder="Ex: Família Silva"
                      />
                      {errors.familyName && (
                        <p className="text-xs text-error-500 mt-1">{errors.familyName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">Origem</label>
                      <select {...register('source')} className="input">
                        {(Object.keys(sourceConfig) as LeadSource[]).map((source) => (
                          <option key={source} value={source}>
                            {sourceConfig[source].label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors w-full">
                        <input
                          type="checkbox"
                          {...register('hasSiblingsAtSchool')}
                          className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-700">Possui irmãos na escola</span>
                      </label>
                    </div>
                  </div>
                </Section>

                {/* Primary Contact Section */}
                <Section
                  title="Contato Principal"
                  icon={<User className="w-5 h-5" />}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="label">Nome Completo *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          {...register('primaryContactName', { required: 'Nome obrigatório' })}
                          className="input pl-10"
                          placeholder="Nome do contato principal"
                        />
                      </div>
                      {errors.primaryContactName && (
                        <p className="text-xs text-error-500 mt-1">{errors.primaryContactName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          type="email"
                          {...register('primaryContactEmail', {
                            required: 'Email obrigatório',
                            pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' },
                          })}
                          className="input pl-10"
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      {errors.primaryContactEmail && (
                        <p className="text-xs text-error-500 mt-1">{errors.primaryContactEmail.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">Telefone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          {...register('primaryContactPhone')}
                          className="input pl-10"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>
                  </div>
                </Section>

                {/* Secondary Contact Section */}
                <Section
                  title="Contato Secundário"
                  icon={<Users className="w-5 h-5" />}
                  defaultOpen={!!(lead.secondaryContactName || lead.secondaryContactEmail)}
                >
                  <p className="text-sm text-neutral-500 mb-4">
                    Adicione um segundo contato caso necessário (opcional)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="label">Nome Completo</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          {...register('secondaryContactName')}
                          className="input pl-10"
                          placeholder="Nome do contato secundário"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          type="email"
                          {...register('secondaryContactEmail', {
                            pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' },
                          })}
                          className="input pl-10"
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      {errors.secondaryContactEmail && (
                        <p className="text-xs text-error-500 mt-1">{errors.secondaryContactEmail.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label">Telefone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                        <input
                          {...register('secondaryContactPhone')}
                          className="input pl-10"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>
                  </div>
                </Section>

                {/* Children Section */}
                <Section
                  title="Informações dos Filhos"
                  icon={<GraduationCap className="w-5 h-5" />}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Número de Filhos</label>
                      <select
                        {...register('numberOfChildren', { valueAsNumber: true })}
                        className="input"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? 'filho' : 'filhos'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="label">Série Desejada</label>
                      <select {...register('desiredGrades.0')} className="input">
                        <option value="">Selecione...</option>
                        {gradeOptions.map((grade) => (
                          <option key={grade} value={grade}>
                            {grade}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {lead.children && lead.children.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-neutral-200">
                      <p className="text-sm font-medium text-neutral-700 mb-3">
                        Filhos cadastrados ({lead.children.length})
                      </p>
                      <div className="space-y-2">
                        {lead.children.map((child) => (
                          <div
                            key={child.id}
                            className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-primary-700">
                                  {child.fullName.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-neutral-900">{child.fullName}</p>
                                <p className="text-xs text-neutral-500">
                                  {child.desiredGrade || 'Série não definida'}
                                  {child.dateOfBirth && ` • ${new Date(child.dateOfBirth).toLocaleDateString('pt-BR')}`}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-neutral-500 mt-3">
                        Para editar os filhos, use a aba "Filhos" no painel do lead.
                      </p>
                    </div>
                  )}
                </Section>

                {/* Notes Section */}
                <Section
                  title="Observações"
                  icon={<FileText className="w-5 h-5" />}
                  defaultOpen={!!lead.notes}
                >
                  <div>
                    <textarea
                      {...register('notes')}
                      rows={4}
                      className="input resize-none"
                      placeholder="Adicione observações relevantes sobre este lead..."
                    />
                    <p className="text-xs text-neutral-500 mt-2">
                      Estas observações são visíveis apenas para a equipe interna.
                    </p>
                  </div>
                </Section>

                {/* Form Data Info (Read-only) */}
                {(lead.parents && lead.parents.length > 0) || lead.address ? (
                  <Section
                    title="Dados do Formulário"
                    icon={<Building2 className="w-5 h-5" />}
                    defaultOpen={false}
                  >
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        Este lead possui dados adicionais preenchidos pela família através do formulário de admissão.
                        Esses dados podem ser visualizados na aba "Visão Geral" do painel do lead.
                      </p>

                      {lead.parents && lead.parents.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2">
                            Responsáveis cadastrados
                          </p>
                          <div className="space-y-1">
                            {lead.parents.map((parent) => (
                              <div key={parent.id} className="text-sm text-blue-900">
                                {parent.fullName} ({parent.parentType === 'FATHER' ? 'Pai' : parent.parentType === 'MOTHER' ? 'Mãe' : 'Responsável'})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {lead.address && (
                        <div className="mt-4">
                          <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2">
                            Endereço
                          </p>
                          <p className="text-sm text-blue-900">
                            {lead.address.street && `${lead.address.street}, `}
                            {lead.address.number && `${lead.address.number} - `}
                            {lead.address.neighborhood && `${lead.address.neighborhood}, `}
                            {lead.address.city}
                            {lead.address.state && ` - ${lead.address.state}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </Section>
                ) : null}
              </div>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-neutral-200 bg-neutral-50">
              <p className="text-sm text-neutral-500">
                {isDirty ? 'Você tem alterações não salvas' : 'Nenhuma alteração pendente'}
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-secondary btn-md"
                  disabled={updateMutation.isPending}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={updateMutation.isPending || !isDirty}
                  className="btn btn-primary btn-md min-w-[140px]"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
