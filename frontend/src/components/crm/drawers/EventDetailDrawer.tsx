import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  User,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useCrmEvent, useUpdateEventStatus, useDeleteCrmEvent } from '@/hooks/useCrmEvents';
import { useEventEvaluations } from '@/hooks/useEvaluations';
import { useAuthStore } from '@/stores/authStore';
import { EvaluationCard } from '../evaluations/EvaluationCard';
import { ExperienceEvaluationForm } from '../evaluations/ExperienceEvaluationForm';

interface EventDetailDrawerProps {
  eventId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EventDetailDrawer({ eventId, isOpen, onClose }: EventDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'evaluations'>('details');
  const [showEvalForm, setShowEvalForm] = useState(false);

  const { hasModuleAccess } = useAuthStore();
  const canEdit = hasModuleAccess('CRM', 'EDIT');

  const { data: eventData, isLoading } = useCrmEvent(eventId);
  const event = eventData?.data;

  const { data: evalData } = useEventEvaluations(
    event?.eventType === 'VIVENCIA' ? eventId : null
  );
  const evaluations = evalData?.data || [];

  const updateStatusMutation = useUpdateEventStatus();
  const deleteMutation = useDeleteCrmEvent();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    setActiveTab('details');
    setShowEvalForm(false);
  }, [eventId]);

  const handleStatusUpdate = (status: string) => {
    if (!eventId) return;
    updateStatusMutation.mutate({ id: eventId, leadId: event?.leadId, status });
  };

  const handleDelete = () => {
    if (!eventId || !confirm('Tem certeza que deseja deletar este evento?')) return;
    deleteMutation.mutate({ id: eventId, leadId: event?.leadId }, { onSuccess: onClose });
  };

  const currentStatus = event?.eventType === 'VISIT' ? event.visitStatus : event?.vivenciaStatus;
  const isCompleted = currentStatus === 'COMPLETED';
  const isCancelled = currentStatus === 'CANCELLED';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-[550px] max-w-full bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    event?.eventType === 'VISIT'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {event?.eventType === 'VISIT' ? 'Visita' : 'Vivência'}
                </span>
                <h2 className="text-lg font-semibold truncate">{event?.title || 'Carregando...'}</h2>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs for vivência */}
            {event?.eventType === 'VIVENCIA' && (
              <div className="flex border-b border-neutral-200">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'details'
                      ? 'border-[#0aacce] text-[#0aacce]'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  Detalhes
                </button>
                <button
                  onClick={() => setActiveTab('evaluations')}
                  className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'evaluations'
                      ? 'border-[#0aacce] text-[#0aacce]'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  Avaliações ({evaluations.length})
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                </div>
              ) : !event ? (
                <div className="text-center py-12 text-neutral-500">Evento não encontrado</div>
              ) : activeTab === 'details' ? (
                <div className="space-y-4">
                  {/* Status badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-500">Status:</span>
                    <StatusBadge status={currentStatus || 'SCHEDULED'} />
                  </div>

                  {/* Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <span>
                        {new Date(event.startDate).toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-neutral-400" />
                      <span>
                        {new Date(event.startDate).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(event.endDate).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-neutral-400" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.lead && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-neutral-400" />
                        <span>
                          {event.lead.familyName} ({event.lead.code})
                        </span>
                      </div>
                    )}
                    {event.assignedTeacher && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-4 h-4 text-neutral-400" />
                        <span>Professor: {event.assignedTeacher.displayName}</span>
                      </div>
                    )}
                  </div>

                  {event.description && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-neutral-700 mb-1">Descrição</h4>
                      <p className="text-sm text-neutral-600">{event.description}</p>
                    </div>
                  )}

                  {(event.visitNotes || event.vivenciaNotes) && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-neutral-700 mb-1">Notas</h4>
                      <p className="text-sm text-neutral-600">
                        {event.visitNotes || event.vivenciaNotes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Evaluations tab */
                <div className="space-y-4">
                  {showEvalForm ? (
                    <ExperienceEvaluationForm
                      eventId={event.id}
                      leadId={event.leadId}
                      onClose={() => setShowEvalForm(false)}
                    />
                  ) : (
                    <>
                      {evaluations.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                          <p className="text-sm text-neutral-500">Nenhuma avaliação ainda</p>
                        </div>
                      ) : (
                        evaluations.map((evaluation) => (
                          <EvaluationCard key={evaluation.id} evaluation={evaluation} />
                        ))
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Actions footer */}
            {event && canEdit && !isCancelled && (
              <div className="p-4 border-t border-neutral-200 space-y-2">
                {activeTab === 'evaluations' && event.eventType === 'VIVENCIA' && !showEvalForm && isCompleted && (
                  <button
                    onClick={() => setShowEvalForm(true)}
                    className="w-full btn btn-primary btn-md"
                  >
                    <FileText className="w-4 h-4" />
                    Nova Avaliação
                  </button>
                )}

                {activeTab === 'details' && !isCompleted && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate('COMPLETED')}
                      disabled={updateStatusMutation.isPending}
                      className="flex-1 btn btn-md bg-green-600 text-white hover:bg-green-700"
                    >
                      {updateStatusMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Marcar Completo
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('CANCELLED')}
                      disabled={updateStatusMutation.isPending}
                      className="btn btn-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancelar
                    </button>
                  </div>
                )}

                {activeTab === 'details' && (
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="w-full text-sm text-red-500 hover:text-red-700 py-1"
                  >
                    Deletar evento
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    SCHEDULED: { label: 'Agendado', className: 'bg-yellow-100 text-yellow-800' },
    IN_PROGRESS: { label: 'Em andamento', className: 'bg-blue-100 text-blue-800' },
    COMPLETED: { label: 'Concluído', className: 'bg-green-100 text-green-800' },
    CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
    NO_SHOW: { label: 'Não compareceu', className: 'bg-neutral-100 text-neutral-800' },
  };

  const c = config[status] || { label: status, className: 'bg-neutral-100 text-neutral-800' };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.className}`}>{c.label}</span>
  );
}
