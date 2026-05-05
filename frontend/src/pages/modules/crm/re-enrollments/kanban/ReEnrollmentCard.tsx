import { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, AlertTriangle, BellDot } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { CardRenderHelpers } from '../../kanban/KanbanView';
import type { ReEnrollmentKanbanCard, ReEnrollmentGateStatus } from '@/types/re-enrollment-kanban';
import { ReEnrollmentCardMenu } from './ReEnrollmentCardMenu';

const gateBadge: Record<ReEnrollmentGateStatus, { label: string; color: string }> = {
  CONVITE_ENVIADO: { label: 'Convite enviado', color: 'bg-sky-100 text-sky-700' },
  FORMULARIO_CONFIRMADO: { label: 'Formulário recebido', color: 'bg-blue-100 text-blue-700' },
  DOCS_APROVADOS: { label: 'Documentos aprovados', color: 'bg-amber-100 text-amber-700' },
  CONTRATO_PENDENTE: { label: 'Contrato pendente', color: 'bg-indigo-100 text-indigo-700' },
  CONTRATO_ASSINADO: { label: 'Contrato assinado', color: 'bg-violet-100 text-violet-700' },
  TAXA_PAGA: { label: 'Taxa paga', color: 'bg-emerald-100 text-emerald-700' },
  REMATRICULADO: { label: 'Rematriculado', color: 'bg-green-100 text-green-700' },
  RECUSADO: { label: 'Recusado', color: 'bg-red-100 text-red-700' },
};

interface ReEnrollmentCardProps {
  card: ReEnrollmentKanbanCard;
  helpers: CardRenderHelpers<ReEnrollmentKanbanCard>;
}

export const ReEnrollmentCard = forwardRef<HTMLDivElement, ReEnrollmentCardProps>(function ReEnrollmentCard(
  { card, helpers },
  ref,
) {
  const badge = gateBadge[card.gateStatus];
  const navigate = useNavigate();

  const handleClick = () => {
    // Skip the navigation mid-drag — once drag-and-drop is ever enabled,
    // a click ending a drag would otherwise open the detail and discard
    // the drop target. canDrag is the forward-compatible gate.
    if (helpers.isDragging) return;
    navigate(`/crm/re-enrollments/invites/${card.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <motion.div
      ref={ref}
      layout
      layoutId={card.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1, ease: 'easeOut' }}
      draggable={helpers.canDrag}
      onDragStart={(e) => helpers.onDragStart(e as unknown as React.DragEvent, card)}
      onDragEnd={helpers.onDragEnd}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Abrir detalhes de ${card.studentName}`}
      className="bg-white rounded-lg border border-neutral-200 p-3 hover:border-primary-300 hover:shadow-md transition-colors group select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-300"
      style={{ touchAction: 'none' }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-neutral-900 text-sm line-clamp-2" title={card.studentName}>
          {card.studentName}
        </h4>
        <div className="flex items-center gap-1 flex-shrink-0">
          {card.hasAction && <BellDot className="w-3.5 h-3.5 text-primary-600" />}
          {card.overdue && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
          <ReEnrollmentCardMenu inviteId={card.id} gateStatus={card.gateStatus} />
        </div>
      </div>

      {card.grade && (
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-2">
          <GraduationCap className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{card.grade}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge.color}`}>
          {badge.label}
        </span>
        <span className="text-[10px] text-neutral-400">
          {formatDistanceToNow(new Date(card.lastUpdatedAt), { addSuffix: true, locale: ptBR })}
        </span>
      </div>
    </motion.div>
  );
});
