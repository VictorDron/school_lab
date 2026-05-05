import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Users, Phone, Mail, GraduationCap, MessageSquare, Megaphone, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useCreateLead } from '@/hooks/useLeads';
import { sourceConfig, gradeOptions, type CreateLeadData, type LeadSource } from '@/types/crm';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return numbers
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
};

interface DuplicateInfo {
  id: string;
  code: string;
  familyName: string;
  primaryContactName: string;
  admissionGateStatus?: string;
  createdAt: string;
}

export function CreateLeadModal({ isOpen, onClose }: CreateLeadModalProps) {
  const createMutation = useCreateLead();
  const navigate = useNavigate();
  const [duplicates, setDuplicates] = useState<DuplicateInfo[]>([]);
  const [pendingData, setPendingData] = useState<CreateLeadData | null>(null);

  // Block body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateLeadData>({
    defaultValues: {
      numberOfChildren: 1,
      source: 'WEBSITE',
      desiredGrades: [],
    },
  });

  const numberOfChildren = watch('numberOfChildren') || 1;

  // Trim desiredGrades when numberOfChildren decreases
  useEffect(() => {
    const current = watch('desiredGrades') || [];
    if (current.length > numberOfChildren) {
      setValue('desiredGrades', current.slice(0, numberOfChildren));
    }
  }, [numberOfChildren, setValue, watch]);

  const onSubmit = (data: CreateLeadData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        reset();
        setDuplicates([]);
        setPendingData(null);
        onClose();
      },
      onError: (error) => {
        if (axios.isAxiosError(error) && error.response?.status === 409 && error.response?.data?.error === 'LEAD_DUPLICATE_EMAIL') {
          setDuplicates(error.response.data.duplicates || []);
          setPendingData(data);
        }
      },
    });
  };

  const handleForceCreate = () => {
    if (!pendingData) return;
    createMutation.mutate({ ...pendingData, force: true } as any, {
      onSuccess: () => {
        reset();
        setDuplicates([]);
        setPendingData(null);
        onClose();
      },
    });
  };

  const handleOpenExisting = (leadId: string) => {
    setDuplicates([]);
    setPendingData(null);
    reset();
    onClose();
    navigate(`/crm/${leadId}`);
  };

  const handleClose = () => {
    reset();
    setDuplicates([]);
    setPendingData(null);
    onClose();
  };

  const phoneRegister = register('primaryContactPhone', { required: 'Telefone obrigatório' });
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = formatPhone(e.target.value);
    phoneRegister.onChange(e);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-large w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Novo Lead</h2>
                    <p className="text-sm text-white/70">Cadastre uma nova família interessada</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-6 overflow-y-auto flex-1">

                {/* Section: Informações da Família */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                    <Users className="w-4 h-4 text-primary-500" />
                    <span className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">Informações da Família</span>
                  </div>

                  {/* Family Name */}
                  <div>
                    <label className="label">Nome da Família *</label>
                    <input
                      {...register('familyName', { required: 'Nome obrigatório' })}
                      placeholder="Ex: Família Silva"
                      className={`input ${errors.familyName ? 'input-error' : ''}`}
                    />
                    {errors.familyName && (
                      <p className="text-xs text-error-500 mt-1">{errors.familyName.message}</p>
                    )}
                  </div>

                  {/* Contact Name */}
                  <div>
                    <label className="label">Nome do Contato *</label>
                    <input
                      {...register('primaryContactName', { required: 'Nome obrigatório' })}
                      placeholder="Nome do responsável"
                      className={`input ${errors.primaryContactName ? 'input-error' : ''}`}
                    />
                    {errors.primaryContactName && (
                      <p className="text-xs text-error-500 mt-1">{errors.primaryContactName.message}</p>
                    )}
                  </div>

                  {/* Email & Phone - Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Contact Email */}
                    <div>
                      <label className="label">
                        <Mail className="w-3.5 h-3.5 inline-block mr-1 text-neutral-400" />
                        Email *
                      </label>
                      <input
                        type="email"
                        {...register('primaryContactEmail', {
                          required: 'Email obrigatório',
                          pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' },
                        })}
                        placeholder="email@exemplo.com"
                        className={`input ${errors.primaryContactEmail ? 'input-error' : ''}`}
                      />
                      {errors.primaryContactEmail && (
                        <p className="text-xs text-error-500 mt-1">{errors.primaryContactEmail.message}</p>
                      )}
                    </div>

                    {/* Contact Phone */}
                    <div>
                      <label className="label">
                        <Phone className="w-3.5 h-3.5 inline-block mr-1 text-neutral-400" />
                        Telefone *
                      </label>
                      <input
                        {...phoneRegister}
                        onChange={handlePhoneChange}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        className={`input ${errors.primaryContactPhone ? 'input-error' : ''}`}
                      />
                      {errors.primaryContactPhone && (
                        <p className="text-xs text-error-500 mt-1">{errors.primaryContactPhone.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section: Filhos e Séries */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                    <GraduationCap className="w-4 h-4 text-primary-500" />
                    <span className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">Filhos e Séries</span>
                  </div>

                  {/* Number of Children */}
                  <div>
                    <label className="label">Número de Filhos</label>
                    <select {...register('numberOfChildren', { valueAsNumber: true })} className="input">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'filho' : 'filhos'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Desired Grades */}
                  <div className="space-y-3">
                    {Array.from({ length: numberOfChildren }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <select
                            {...register(`desiredGrades.${i}` as const, { required: 'Série obrigatória' })}
                            className={`input ${errors.desiredGrades?.[i] ? 'input-error' : ''}`}
                          >
                            <option value="">Selecione a série...</option>
                            {gradeOptions.map((grade) => (
                              <option key={grade} value={grade}>
                                {grade}
                              </option>
                            ))}
                          </select>
                          {errors.desiredGrades?.[i] && (
                            <p className="text-xs text-error-500 mt-1">{errors.desiredGrades[i]?.message}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section: Detalhes */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                    <Megaphone className="w-4 h-4 text-primary-500" />
                    <span className="text-sm font-semibold text-neutral-700 uppercase tracking-wide">Detalhes</span>
                  </div>

                  {/* Source */}
                  <div>
                    <label className="label">Origem *</label>
                    <select
                      {...register('source', { required: 'Origem obrigatória' })}
                      className={`input ${errors.source ? 'input-error' : ''}`}
                    >
                      {(Object.keys(sourceConfig) as LeadSource[]).map((source) => (
                        <option key={source} value={source}>
                          {sourceConfig[source].label}
                        </option>
                      ))}
                    </select>
                    {errors.source && (
                      <p className="text-xs text-error-500 mt-1">{errors.source.message}</p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="label">
                      <MessageSquare className="w-3.5 h-3.5 inline-block mr-1 text-neutral-400" />
                      Observações
                    </label>
                    <textarea
                      {...register('notes')}
                      rows={3}
                      placeholder="Informações adicionais sobre a família..."
                      className="input resize-none"
                    />
                  </div>
                </div>

                {/* Duplicate Warning (inside scroll, so it never gets cut off) */}
                {duplicates.length > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-amber-800">Já existe um lead com este e-mail.</p>
                        <p className="text-xs text-amber-700/90">
                          Você pode abrir o lead existente ou criar um novo mesmo assim.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {duplicates.map((dup) => (
                        <button
                          key={dup.id}
                          type="button"
                          onClick={() => handleOpenExisting(dup.id)}
                          className="w-full flex items-center justify-between p-2.5 bg-white rounded-lg border border-amber-100 hover:border-amber-300 transition-colors text-left"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">{dup.familyName}</p>
                            <p className="text-xs text-neutral-500 truncate">
                              {dup.code} - {dup.primaryContactName}
                            </p>
                          </div>
                          <span className="text-xs text-amber-700 font-medium flex-shrink-0">Abrir</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </form>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-secondary btn-md"
                  disabled={createMutation.isPending}
                >
                  Cancelar
                </button>
                {duplicates.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleForceCreate}
                    disabled={createMutation.isPending}
                    className="btn btn-primary btn-md"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Criando...
                      </>
                    ) : (
                      'Criar mesmo assim'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit(onSubmit)}
                    disabled={createMutation.isPending}
                    className="btn btn-primary btn-md"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Criando...
                      </>
                    ) : (
                      'Criar lead'
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
