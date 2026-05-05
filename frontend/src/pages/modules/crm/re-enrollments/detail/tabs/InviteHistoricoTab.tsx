import {
  Clock,
  Send,
  ClipboardCheck,
  FileCheck,
  ScrollText,
  PenLine,
  DollarSign,
  GraduationCap,
  Ban,
  Loader2,
  CircleAlert,
  User as UserIcon,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useInviteHistory, type InviteHistoryEntry } from '@/hooks/useReEnrollmentInvite';

interface InviteHistoricoTabProps {
  inviteId: string;
}

const GATE_ACTION_META: Record<
  string,
  { label: string; icon: React.ElementType; tone: 'primary' | 'success' | 'danger' | 'neutral' }
> = {
  RE_ENROLLMENT_CONVITE_ENVIADO: { label: 'Convite enviado', icon: Send, tone: 'primary' },
  RE_ENROLLMENT_FORMULARIO_CONFIRMADO: {
    label: 'Formulário de rematrícula preenchido',
    icon: ClipboardCheck,
    tone: 'primary',
  },
  RE_ENROLLMENT_DOCS_APROVADOS: {
    label: 'Documentos aprovados',
    icon: FileCheck,
    tone: 'primary',
  },
  RE_ENROLLMENT_CONTRATO_PENDENTE: {
    label: 'Contrato de rematrícula criado',
    icon: ScrollText,
    tone: 'primary',
  },
  RE_ENROLLMENT_CONTRATO_ASSINADO: {
    label: 'Contrato de rematrícula assinado',
    icon: PenLine,
    tone: 'primary',
  },
  RE_ENROLLMENT_TAXA_PAGA: {
    label: 'Pagamento da entrada registrado',
    icon: DollarSign,
    tone: 'primary',
  },
  RE_ENROLLMENT_REMATRICULADO: {
    label: 'Rematrícula concluída',
    icon: GraduationCap,
    tone: 'success',
  },
  RE_ENROLLMENT_RECUSADO: {
    label: 'Rematrícula recusada',
    icon: Ban,
    tone: 'danger',
  },
};

/**
 * Timeline of gate transitions and other actions recorded on the
 * student within this campaign window. Consumes GET /invites/:id/history
 * and renders a vertical stepper with actor, contextual label, absolute
 * timestamp, and a 'há X' relative tooltip.
 */
export function InviteHistoricoTab({ inviteId }: InviteHistoricoTabProps) {
  const { data, isLoading, isError, error } = useInviteHistory(inviteId);
  const entries = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
        <CircleAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">
          Erro ao carregar histórico: {(error as Error)?.message ?? 'erro desconhecido'}
        </p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-8">
        <div className="text-center max-w-md mx-auto">
          <Clock className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-neutral-700">Nenhum evento registrado</p>
          <p className="text-xs text-neutral-500 mt-1">
            As transições e ações deste convite aparecerão aqui à medida que a
            rematrícula avança.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-white border border-neutral-200 rounded-lg p-4">
      <ol className="relative">
        <span
          aria-hidden="true"
          className="absolute left-[15px] top-0 bottom-0 w-px bg-neutral-200"
        />
        {entries.map((entry, i) => (
          <TimelineEntry key={entry.id} entry={entry} isLast={i === entries.length - 1} />
        ))}
      </ol>
    </section>
  );
}

function TimelineEntry({ entry, isLast }: { entry: InviteHistoryEntry; isLast: boolean }) {
  const meta = GATE_ACTION_META[entry.action];
  const label =
    meta?.label ??
    (typeof entry.details === 'object' && entry.details && 'label' in entry.details
      ? String((entry.details as Record<string, unknown>).label)
      : humanizeAction(entry.action));

  const Icon = meta?.icon ?? Clock;
  const toneClasses = {
    primary: 'bg-primary-50 text-primary-600 border-primary-200',
    success: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    danger: 'bg-red-50 text-red-600 border-red-200',
    neutral: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  }[meta?.tone ?? 'neutral'];

  const createdAt = new Date(entry.createdAt);
  const absoluteTs = format(createdAt, "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  const relativeTs = formatDistanceToNow(createdAt, { addSuffix: true, locale: ptBR });

  return (
    <li className={`relative pl-10 ${isLast ? '' : 'pb-4'}`}>
      <span
        className={`absolute left-0 top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${toneClasses}`}
      >
        <Icon className="w-3.5 h-3.5" />
      </span>

      <div className="pt-0.5">
        <p className="text-sm font-medium text-neutral-900">{label}</p>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-500">
          <span title={absoluteTs}>{relativeTs}</span>
          {entry.actor && (
            <>
              <span className="text-neutral-300">·</span>
              <span className="inline-flex items-center gap-1">
                <UserIcon className="w-3 h-3 text-neutral-400" />
                {entry.actor.displayName}
              </span>
            </>
          )}
        </div>
        {entry.action.startsWith('RE_ENROLLMENT_') &&
          typeof entry.details === 'object' &&
          entry.details &&
          'previousStatus' in entry.details && (
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {String((entry.details as Record<string, unknown>).previousStatus)} →{' '}
              {String((entry.details as Record<string, unknown>).newStatus)}
            </p>
          )}
      </div>
    </li>
  );
}

function humanizeAction(action: string): string {
  return action
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
}
