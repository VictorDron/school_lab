import { useState, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Flag, Mail, MoreHorizontal, Link2, Copy, GripVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useGenerateApplicationLink } from '@/hooks/useLeads';
import { sourceConfig, type Lead, type AdmissionGateStatus } from '@/types/crm';

const gateStatusConfig: Record<AdmissionGateStatus, { label: string; color: string } | null> = {
  NOT_STARTED: null,
  FORM_RECEIVED: { label: 'Form. Recebido', color: 'bg-sky-100 text-sky-700' },
  FORM_APPROVED: { label: 'Form. Aprovado', color: 'bg-sky-100 text-sky-700' },
  VISIT_SCHEDULED: { label: 'Visita Agendada', color: 'bg-blue-100 text-blue-700' },
  VISIT_COMPLETED: { label: 'Visita Realizada', color: 'bg-blue-100 text-blue-700' },
  INTERVIEW_COMPLETED: { label: 'Entrevista OK', color: 'bg-indigo-100 text-indigo-700' },
  VISIT_APPROVED: { label: 'Visita Aprovada', color: 'bg-indigo-100 text-indigo-700' },
  DOCS_REQUESTED: { label: 'Docs Solicitados', color: 'bg-orange-100 text-orange-700' },
  DOCS_RECEIVED: { label: 'Docs Recebidos', color: 'bg-orange-100 text-orange-700' },
  VIVENCIA_SCHEDULED: { label: 'Vivência Agendada', color: 'bg-purple-100 text-purple-700' },
  VIVENCIA_COMPLETED: { label: 'Vivência OK', color: 'bg-purple-100 text-purple-700' },
  EVALUATION_PENDING: { label: 'Avaliação Pendente', color: 'bg-amber-100 text-amber-700' },
  EVALUATION_COMPLETED: { label: 'Avaliação OK', color: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Aprovado', color: 'bg-emerald-100 text-emerald-700' },
  ENROLLMENT_PENDING: { label: 'Matrícula Pendente', color: 'bg-teal-100 text-teal-700' },
  ENROLLMENT_COMPLETED: { label: 'Matrícula Enviada', color: 'bg-teal-100 text-teal-700' },
  CONTRACT_PENDING: { label: 'Contrato Pendente', color: 'bg-cyan-100 text-cyan-700' },
  CONTRACT_SIGNED: { label: 'Contrato Assinado', color: 'bg-cyan-100 text-cyan-700' },
  FINANCIAL_APPROVED: { label: 'Financeiro OK', color: 'bg-green-100 text-green-700' },
  ENROLLED: { label: 'Matriculado', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejeitado', color: 'bg-red-100 text-red-700' },
};

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, lead: Lead) => void;
  onDragEnd: () => void;
  canEdit: boolean;
  isDragging: boolean;
}

export const LeadCard = forwardRef<HTMLDivElement, LeadCardProps>(function LeadCard(
  { lead, onClick, onDragStart, onDragEnd, canEdit, isDragging },
  ref
) {
  const [showMenu, setShowMenu] = useState(false);
  const generateLinkMutation = useGenerateApplicationLink();

  const handleGenerateLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    generateLinkMutation.mutate(lead.id);
    setShowMenu(false);
  };

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(lead.primaryContactEmail);
    toast.success('Email copiado!');
    setShowMenu(false);
  };

  return (
    <motion.div
      ref={ref}
      layout
      layoutId={lead.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: isDragging ? 0.4 : 1,
        scale: isDragging ? 0.98 : 1,
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1, ease: 'easeOut' }}
      draggable={canEdit}
      onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, lead)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`bg-white rounded-lg border p-3 cursor-pointer group select-none ${
        isDragging ? 'border-primary-400 shadow-lg' : 'border-neutral-200 hover:border-primary-300 hover:shadow-md'
      }`}
      style={{ touchAction: 'none' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {canEdit && <GripVertical className="w-3.5 h-3.5 text-neutral-300 cursor-grab active:cursor-grabbing" />}
          {lead.isFlagged && <Flag className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
          <span className="text-[10px] font-mono text-neutral-300 opacity-60">{lead.code}</span>
        </div>

        {canEdit && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-neutral-100 rounded transition-opacity"
            >
              <MoreHorizontal className="w-4 h-4 text-neutral-400" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div className="absolute right-0 top-6 w-40 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-20">
                  <button
                    onClick={handleGenerateLink}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"
                  >
                    <Link2 className="w-4 h-4 text-neutral-500" />
                    Gerar Link
                  </button>
                  <button
                    onClick={handleCopyEmail}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4 text-neutral-500" />
                    Copiar Email
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Family Name */}
      <h4 className="font-semibold text-neutral-900 text-sm mb-2 line-clamp-2" title={lead.familyName}>{lead.familyName}</h4>

      {/* Contact Info */}
      <div className="space-y-1 text-xs text-neutral-500">
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3 flex-shrink-0" />
          <span>
            {lead.numberOfChildren} filho{lead.numberOfChildren > 1 ? 's' : ''}
          </span>
          {lead.desiredGrades?.length > 0 && <span className="text-neutral-400 truncate">- {lead.desiredGrades.join(', ')}</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <Mail className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{lead.primaryContactEmail}</span>
        </div>
      </div>

      {/* Gate Status Badge */}
      {lead.admissionGateStatus && gateStatusConfig[lead.admissionGateStatus] && (
        <div className="mt-1.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${gateStatusConfig[lead.admissionGateStatus]!.color}`}>
            {gateStatusConfig[lead.admissionGateStatus]!.label}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100">
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${sourceConfig[lead.source]?.bgColor || 'bg-neutral-100'}`}>
          {sourceConfig[lead.source]?.label || lead.source}
        </span>
        <span className="text-[10px] text-neutral-400">
          {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: ptBR })}
        </span>
      </div>
    </motion.div>
  );
});
