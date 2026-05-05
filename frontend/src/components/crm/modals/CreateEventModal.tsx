import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Calendar, MapPin, User, Search, ChevronDown, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useCreateCrmEvent, isConflictError, getConflicts } from '@/hooks/useCrmEvents';
import { useLeads } from '@/hooks/useLeads';
import type { CrmEventType } from '@/types/crm';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStartDate?: Date;
  defaultLeadId?: string;
  defaultEventType?: CrmEventType;
}

interface EventFormData {
  leadId: string;
  eventType: CrmEventType;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  assignedTeacherId: string;
}

function formatDateTimeLocal(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function CreateEventModal({
  isOpen,
  onClose,
  defaultStartDate,
  defaultLeadId,
  defaultEventType,
}: CreateEventModalProps) {
  const createMutation = useCreateCrmEvent();
  const { data: leadsData } = useLeads({ limit: 200 });
  const leads = leadsData?.data || [];

  // Conflict handling state
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [pendingData, setPendingData] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const startDefault = defaultStartDate || new Date();
  const endDefault = new Date(startDefault);
  endDefault.setHours(endDefault.getHours() + 1);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EventFormData>({
    defaultValues: {
      leadId: defaultLeadId || '',
      eventType: defaultEventType || 'VISIT',
      title: '',
      description: '',
      startDate: formatDateTimeLocal(startDefault),
      endDate: formatDateTimeLocal(endDefault),
      location: '',
      assignedTeacherId: '',
    },
  });

  // Reset form when modal opens with new defaults
  useEffect(() => {
    if (isOpen) {
      const start = defaultStartDate || new Date();
      const end = new Date(start);
      end.setHours(end.getHours() + 1);
      reset({
        leadId: defaultLeadId || '',
        eventType: defaultEventType || 'VISIT',
        title: '',
        description: '',
        startDate: formatDateTimeLocal(start),
        endDate: formatDateTimeLocal(end),
        location: '',
        assignedTeacherId: '',
      });
      setConflicts([]);
      setPendingData(null);
    }
  }, [isOpen, defaultStartDate, defaultLeadId, defaultEventType, reset]);

  const eventType = watch('eventType');
  const selectedLeadId = watch('leadId');

  // Searchable lead dropdown state
  const [leadSearch, setLeadSearch] = useState('');
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(false);
  const leadDropdownRef = useRef<HTMLDivElement>(null);
  const leadInputRef = useRef<HTMLInputElement>(null);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  // Auto-generate title from children names + event type
  const autoTitle = useMemo(() => {
    if (!selectedLead) return '';
    const childrenNames = selectedLead.children?.map((c) => c.fullName).filter(Boolean);
    const names = childrenNames && childrenNames.length > 0
      ? childrenNames.join(', ')
      : selectedLead.familyName;
    return eventType === 'VISIT' ? `Visita - ${names}` : `Vivência - ${names}`;
  }, [selectedLead, eventType]);

  const filteredLeads = useMemo(() => {
    if (!leadSearch.trim()) return leads;
    const q = leadSearch.toLowerCase();
    return leads.filter(
      (l) =>
        l.code?.toLowerCase().includes(q) ||
        l.familyName?.toLowerCase().includes(q) ||
        l.primaryContactName?.toLowerCase().includes(q)
    );
  }, [leads, leadSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (leadDropdownRef.current && !leadDropdownRef.current.contains(e.target as Node)) {
        setLeadDropdownOpen(false);
      }
    }
    if (leadDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [leadDropdownOpen]);

  const buildPayload = (data: EventFormData, force?: boolean) => ({
    ...data,
    title: autoTitle || (data.eventType === 'VISIT' ? 'Visita' : 'Vivência'),
    startDate: new Date(data.startDate).toISOString(),
    endDate: new Date(data.endDate).toISOString(),
    assignedTeacherId: data.assignedTeacherId || undefined,
    force,
  });

  const onSubmit = (data: EventFormData) => {
    setConflicts([]);
    createMutation.mutate(buildPayload(data), {
      onSuccess: () => {
        reset();
        onClose();
      },
      onError: (error) => {
        if (isConflictError(error)) {
          setConflicts(getConflicts(error));
          setPendingData(buildPayload(data, true));
        }
      },
    });
  };

  const handleForceCreate = () => {
    if (!pendingData) return;
    createMutation.mutate(pendingData, {
      onSuccess: () => {
        setConflicts([]);
        setPendingData(null);
        reset();
        onClose();
      },
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#0aacce]" />
                  <h2 className="text-lg font-semibold">Novo Evento</h2>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-md">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
                {/* Lead selector - searchable */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Lead *</label>
                  <input type="hidden" {...register('leadId', { required: 'Selecione um lead' })} />
                  <div ref={leadDropdownRef} className="relative">
                    <div
                      onClick={() => {
                        setLeadDropdownOpen(true);
                        setTimeout(() => leadInputRef.current?.focus(), 0);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer transition-colors ${
                        leadDropdownOpen
                          ? 'border-[#0aacce] ring-2 ring-[#0aacce]'
                          : errors.leadId
                          ? 'border-red-300'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      {leadDropdownOpen ? (
                        <input
                          ref={leadInputRef}
                          type="text"
                          value={leadSearch}
                          onChange={(e) => setLeadSearch(e.target.value)}
                          placeholder="Buscar por código, família ou contato..."
                          className="flex-1 outline-none bg-transparent text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setLeadDropdownOpen(false);
                          }}
                        />
                      ) : (
                        <span className={`flex-1 truncate ${selectedLead ? 'text-neutral-900' : 'text-neutral-400'}`}>
                          {selectedLead
                            ? `${selectedLead.code} - ${selectedLead.familyName} (${selectedLead.primaryContactName})`
                            : 'Buscar lead...'}
                        </span>
                      )}
                      <ChevronDown className={`w-4 h-4 text-neutral-400 flex-shrink-0 transition-transform ${leadDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {leadDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredLeads.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-neutral-400 text-center">
                            Nenhum lead encontrado
                          </div>
                        ) : (
                          filteredLeads.map((lead) => (
                            <button
                              key={lead.id}
                              type="button"
                              onClick={() => {
                                setValue('leadId', lead.id, { shouldValidate: true });
                                setLeadSearch('');
                                setLeadDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2 ${
                                selectedLeadId === lead.id ? 'bg-[#0aacce]/5 text-[#0aacce]' : 'text-neutral-700'
                              }`}
                            >
                              <span className="font-mono text-xs text-neutral-400">{lead.code}</span>
                              <span className="truncate">{lead.familyName}</span>
                              <span className="text-xs text-neutral-400 ml-auto flex-shrink-0">
                                {lead.primaryContactName}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {errors.leadId && (
                    <p className="text-xs text-red-500 mt-1">{errors.leadId.message}</p>
                  )}
                </div>

                {/* Event type */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo *</label>
                  <div className="flex gap-2">
                    <label
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm font-medium ${
                        eventType === 'VISIT'
                          ? 'bg-blue-50 border-blue-300 text-blue-800'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <input
                        type="radio"
                        value="VISIT"
                        {...register('eventType')}
                        className="sr-only"
                      />
                      Visita
                    </label>
                    <label
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm font-medium ${
                        eventType === 'VIVENCIA'
                          ? 'bg-purple-50 border-purple-300 text-purple-800'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <input
                        type="radio"
                        value="VIVENCIA"
                        {...register('eventType')}
                        className="sr-only"
                      />
                      Vivência
                    </label>
                  </div>
                </div>

                {/* Auto-generated title preview */}
                {autoTitle && (
                  <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-0.5">Título (automático)</p>
                    <p className="text-sm text-neutral-700 font-medium">{autoTitle}</p>
                  </div>
                )}

                {/* Date/Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Início *</label>
                    <input
                      type="datetime-local"
                      {...register('startDate', { required: true })}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0aacce] focus:border-[#0aacce]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Fim *</label>
                    <input
                      type="datetime-local"
                      {...register('endDate', { required: true })}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0aacce] focus:border-[#0aacce]"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    <MapPin className="w-3.5 h-3.5 inline mr-1" />
                    Local
                  </label>
                  <input
                    type="text"
                    {...register('location')}
                    placeholder="Ex: Sala de reuniões, Recepção..."
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0aacce] focus:border-[#0aacce]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Descrição</label>
                  <textarea
                    {...register('description')}
                    rows={2}
                    placeholder="Observações sobre o evento..."
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0aacce] focus:border-[#0aacce] resize-none"
                  />
                </div>

                {/* Conflict Warning */}
                {conflicts.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">
                          Conflito de horário detectado
                        </p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          {conflicts.length === 1
                            ? 'Já existe 1 evento neste horário:'
                            : `Existem ${conflicts.length} eventos neste horário:`}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5 ml-6">
                      {conflicts.map((c: any) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between bg-white rounded px-2.5 py-1.5 border border-amber-100"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-neutral-800 truncate">{c.title}</p>
                            <p className="text-[10px] text-neutral-500">
                              {c.lead?.familyName || 'Lead'} &middot; {c.eventType === 'VISIT' ? 'Visita' : 'Vivência'}
                            </p>
                          </div>
                          <span className="text-[10px] text-neutral-400 flex-shrink-0 ml-2">
                            {new Date(c.startDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            {' - '}
                            {new Date(c.endDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => { setConflicts([]); setPendingData(null); }}
                        className="btn btn-secondary btn-sm"
                      >
                        Alterar Horário
                      </button>
                      <button
                        type="button"
                        onClick={handleForceCreate}
                        disabled={createMutation.isPending}
                        className="btn btn-sm bg-amber-600 text-white hover:bg-amber-700"
                      >
                        {createMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          'Criar Mesmo Assim'
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={onClose} className="btn btn-secondary btn-md">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="btn btn-primary btn-md"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Criar Evento'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
