import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Clock,
  FileText,
  ScrollText,
  DollarSign,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ReEnrollmentKanbanCard } from '@/types/re-enrollment-kanban';

const DAY_MS = 24 * 60 * 60 * 1000;
const SOON_WINDOW_DAYS = 7;

interface PendencyGroup {
  key: string;
  title: string;
  icon: React.ReactNode;
  cards: ReEnrollmentKanbanCard[];
}

interface ReEnrollmentPendenciesWidgetProps {
  cards: ReEnrollmentKanbanCard[];
}

function groupPendencies(cards: ReEnrollmentKanbanCard[]): PendencyGroup[] {
  const now = Date.now();
  const cutoff = now + SOON_WINDOW_DAYS * DAY_MS;

  const expiringSoon = cards.filter((c) => {
    if (c.gateStatus === 'REMATRICULADO' || c.gateStatus === 'RECUSADO') return false;
    const deadline = new Date(c.effectiveDeadline).getTime();
    return deadline >= now && deadline <= cutoff;
  });

  const docsToReview = cards.filter((c) => c.gateStatus === 'FORMULARIO_CONFIRMADO');
  const contractsPending = cards.filter((c) => c.gateStatus === 'CONTRATO_PENDENTE');
  const feesPending = cards.filter((c) => c.gateStatus === 'CONTRATO_ASSINADO');

  return [
    {
      key: 'expiringSoon',
      title: `Vencendo em ${SOON_WINDOW_DAYS} dias`,
      icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
      cards: expiringSoon,
    },
    {
      key: 'docsToReview',
      title: 'Documentos aguardando revisão',
      icon: <FileText className="w-3.5 h-3.5 text-blue-500" />,
      cards: docsToReview,
    },
    {
      key: 'contractsPending',
      title: 'Contratos aguardando assinatura',
      icon: <ScrollText className="w-3.5 h-3.5 text-cyan-500" />,
      cards: contractsPending,
    },
    {
      key: 'feesPending',
      title: 'Taxas não pagas',
      icon: <DollarSign className="w-3.5 h-3.5 text-emerald-500" />,
      cards: feesPending,
    },
  ].filter((g) => g.cards.length > 0);
}

export function ReEnrollmentPendenciesWidget({ cards }: ReEnrollmentPendenciesWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const groups = useMemo(() => groupPendencies(cards), [cards]);

  const totalCount = groups.reduce((acc, g) => acc + g.cards.length, 0);

  if (totalCount === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-1.5 rounded-md bg-amber-50/80 border border-amber-200/50 hover:bg-amber-100/60 transition-colors"
      >
        <Bell className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        <span className="text-xs font-semibold text-amber-800">Pendências de Rematrícula</span>
        <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white leading-none">
          {totalCount}
        </span>

        {!expanded && (
          <div className="hidden sm:flex items-center gap-1.5 ml-1">
            {groups.slice(0, 4).map((g) => (
              <span
                key={g.key}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-white text-amber-700 border border-amber-200"
              >
                {g.icon}
                {g.cards.length}
              </span>
            ))}
          </div>
        )}

        {expanded ? (
          <ChevronUp className="w-3 h-3 text-amber-400 ml-auto flex-shrink-0" />
        ) : (
          <ChevronDown className="w-3 h-3 text-amber-400 ml-auto flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            {groups.map((group) => (
              <div key={group.key} className="border-b border-neutral-100 last:border-b-0">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 sticky top-0">
                  {group.icon}
                  <span className="text-[11px] font-semibold text-neutral-700">{group.title}</span>
                  <span className="text-[10px] text-neutral-400 ml-auto">
                    {group.cards.length}
                  </span>
                </div>
                <div className="divide-y divide-neutral-100">
                  {group.cards.slice(0, 6).map((card) => (
                    <Link
                      key={card.id}
                      to={`/crm/re-enrollments/invites/${card.id}`}
                      onClick={() => setExpanded(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-left hover:bg-neutral-50 transition-colors"
                    >
                      <span className="min-w-0 flex-1 truncate text-xs font-medium text-neutral-800">
                        {card.studentName}
                      </span>
                      {card.grade && (
                        <span className="text-[10px] text-neutral-500 flex-shrink-0">
                          {card.grade}
                        </span>
                      )}
                      <span className="shrink-0 text-[10px] text-neutral-400 tabular-nums">
                        {formatDistanceToNow(new Date(card.lastUpdatedAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                      <ArrowRight className="w-3 h-3 shrink-0 text-neutral-300" />
                    </Link>
                  ))}
                  {group.cards.length > 6 && (
                    <div className="px-3 py-1.5 text-center">
                      <span className="text-[10px] text-neutral-400">
                        +{group.cards.length - 6} convites
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
