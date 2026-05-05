import { useMemo } from 'react';
import {
  Send,
  ClipboardCheck,
  FileCheck,
  ScrollText,
  DollarSign,
  GraduationCap,
  Ban,
} from 'lucide-react';
import { KanbanView } from '../../kanban/KanbanView';
import type { KanbanColumnDef } from '@/types/kanban';
import type {
  ReEnrollmentKanbanPayload,
  ReEnrollmentKanbanCard,
  ReEnrollmentKanbanColumnKey,
} from '@/types/re-enrollment-kanban';
import { ReEnrollmentCard } from './ReEnrollmentCard';

const EMPTY_ICON_CLASS = 'w-5 h-5 text-neutral-300';

/**
 * Board column metadata. Order, colors, and empty-state copy are
 * presentation concerns and live with the component rather than the
 * backend payload. The empty icon + label tell the operator what this
 * column is for when no cards are present — more useful than a bland
 * 'Nenhum aluno' for every slot.
 */
const COLUMN_DEFS: Record<
  ReEnrollmentKanbanColumnKey,
  {
    name: string;
    color: string;
    isFinal?: boolean;
    emptyLabel: string;
    emptyIcon: React.ReactNode;
  }
> = {
  CONVITE: {
    name: 'Convite',
    color: '#0ea5e9',
    emptyLabel: 'Nenhum convite aguardando resposta.',
    emptyIcon: <Send className={EMPTY_ICON_CLASS} />,
  },
  FORMULARIO: {
    name: 'Formulário',
    color: '#3b82f6',
    emptyLabel: 'Nenhum formulário confirmado ainda.',
    emptyIcon: <ClipboardCheck className={EMPTY_ICON_CLASS} />,
  },
  DOCS: {
    name: 'Documentos',
    color: '#f59e0b',
    emptyLabel: 'Nenhuma família com documentos aprovados.',
    emptyIcon: <FileCheck className={EMPTY_ICON_CLASS} />,
  },
  CONTRATO: {
    name: 'Contrato',
    color: '#6366f1',
    emptyLabel: 'Nenhum contrato pendente ou assinado.',
    emptyIcon: <ScrollText className={EMPTY_ICON_CLASS} />,
  },
  PAGAMENTO: {
    name: 'Pagamento',
    color: '#10b981',
    emptyLabel: 'Nenhuma taxa registrada nesta fase.',
    emptyIcon: <DollarSign className={EMPTY_ICON_CLASS} />,
  },
  CONCLUIDO: {
    name: 'Concluído',
    color: '#22c55e',
    emptyLabel: 'Nenhuma rematrícula concluída nesta janela.',
    emptyIcon: <GraduationCap className={EMPTY_ICON_CLASS} />,
  },
  RECUSADO: {
    name: 'Recusado',
    color: '#ef4444',
    isFinal: true,
    emptyLabel: 'Nenhuma recusa registrada.',
    emptyIcon: <Ban className={EMPTY_ICON_CLASS} />,
  },
};

const PIPELINE_KEYS: ReEnrollmentKanbanColumnKey[] = ['CONVITE', 'FORMULARIO', 'DOCS', 'CONTRATO', 'PAGAMENTO', 'CONCLUIDO'];
const FINAL_KEYS: ReEnrollmentKanbanColumnKey[] = ['RECUSADO'];

interface ReEnrollmentKanbanViewProps {
  payload: ReEnrollmentKanbanPayload;
  /**
   * Optional client-side filters. When set, the displayed cards are a
   * subset — but the column header counts still reflect the full
   * per-column totals from the payload so operators always see the
   * real board size.
   */
  filter?: (card: ReEnrollmentKanbanCard) => boolean;
}

export function ReEnrollmentKanbanView({ payload, filter }: ReEnrollmentKanbanViewProps) {
  const countsById = useMemo(
    () => Object.fromEntries(payload.columns.map((c) => [c.id, c.count])) as Record<ReEnrollmentKanbanColumnKey, number>,
    [payload.columns],
  );

  const buildColumns = (keys: ReEnrollmentKanbanColumnKey[]): KanbanColumnDef[] =>
    keys.map((id) => ({
      id,
      name: `${COLUMN_DEFS[id].name}${countsById[id] != null ? ` (${countsById[id]})` : ''}`,
      color: COLUMN_DEFS[id].color,
      isFinal: COLUMN_DEFS[id].isFinal,
      emptyLabel: COLUMN_DEFS[id].emptyLabel,
      emptyIcon: COLUMN_DEFS[id].emptyIcon,
    }));

  const pipelineColumns = useMemo(() => buildColumns(PIPELINE_KEYS), [countsById]);
  const finalColumns = useMemo(() => buildColumns(FINAL_KEYS), [countsById]);

  const cardsByColumn = useMemo(() => {
    const grouped: Record<string, ReEnrollmentKanbanCard[]> = {};
    for (const key of [...PIPELINE_KEYS, ...FINAL_KEYS]) grouped[key] = [];
    for (const card of payload.cards) {
      if (filter && !filter(card)) continue;
      if (grouped[card.columnId]) grouped[card.columnId].push(card);
    }
    return grouped;
  }, [payload.cards, filter]);

  return (
    <KanbanView<ReEnrollmentKanbanCard>
      pipelineColumns={pipelineColumns}
      finalColumns={finalColumns}
      cardsByColumn={cardsByColumn}
      canEdit
      emptyColumnLabel="Nenhum aluno"
      renderCard={(card, helpers) => <ReEnrollmentCard key={card.id} card={card} helpers={helpers} />}
    />
  );
}
