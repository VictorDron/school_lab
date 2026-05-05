import { useNavigate } from 'react-router-dom';
import { Users, AlertTriangle, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ReEnrollmentKanbanCard } from '@/types/re-enrollment-kanban';

const GATE_LABELS: Record<string, string> = {
  CONVITE_ENVIADO: 'Convite Enviado',
  FORMULARIO_CONFIRMADO: 'Formulário Confirmado',
  DOCS_APROVADOS: 'Documentos Aprovados',
  CONTRATO_PENDENTE: 'Contrato Pendente',
  CONTRATO_ASSINADO: 'Contrato Assinado',
  TAXA_PAGA: 'Taxa Paga',
  REMATRICULADO: 'Rematriculado',
  RECUSADO: 'Recusado',
};

const GATE_TONES: Record<string, string> = {
  CONVITE_ENVIADO: 'bg-neutral-100 text-neutral-700',
  FORMULARIO_CONFIRMADO: 'bg-blue-50 text-blue-700',
  DOCS_APROVADOS: 'bg-indigo-50 text-indigo-700',
  CONTRATO_PENDENTE: 'bg-amber-50 text-amber-700',
  CONTRATO_ASSINADO: 'bg-cyan-50 text-cyan-700',
  TAXA_PAGA: 'bg-emerald-50 text-emerald-700',
  REMATRICULADO: 'bg-emerald-100 text-emerald-800',
  RECUSADO: 'bg-red-50 text-red-700',
};

interface ReEnrollmentListViewProps {
  cards: ReEnrollmentKanbanCard[];
}

export function ReEnrollmentListView({ cards }: ReEnrollmentListViewProps) {
  const navigate = useNavigate();

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-neutral-700 mb-2">Nenhum convite encontrado</p>
          <p className="text-neutral-500">Ajuste os filtros ou crie um novo convite.</p>
        </div>
      </div>
    );
  }

  const handleOpen = (id: string) => {
    navigate(`/crm/re-enrollments/invites/${id}`);
  };

  return (
    <div className="p-4 lg:p-6 space-y-2 overflow-y-auto h-full">
      <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2 bg-neutral-100 rounded-lg text-xs font-medium text-neutral-500 uppercase">
        <div className="col-span-4">Aluno</div>
        <div className="col-span-2">Série</div>
        <div className="col-span-3">Etapa atual</div>
        <div className="col-span-2">Última atualização</div>
        <div className="col-span-1 text-right">Abrir</div>
      </div>

      {cards.map((card) => {
        const tone = GATE_TONES[card.gateStatus] ?? 'bg-neutral-100 text-neutral-700';
        return (
          <div
            key={card.id}
            onClick={() => handleOpen(card.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOpen(card.id);
              }
            }}
            role="button"
            tabIndex={0}
            className="grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 p-4 bg-white rounded-lg border border-neutral-200 hover:shadow-md cursor-pointer transition-shadow"
          >
            <div className="lg:col-span-4 flex items-center gap-2">
              {card.overdue && (
                <AlertTriangle
                  className="w-4 h-4 text-red-500 flex-shrink-0"
                  aria-label="Vencido"
                />
              )}
              <div className="min-w-0">
                <p className="font-semibold text-neutral-900 truncate">{card.studentName}</p>
                <p className="text-xs text-neutral-500 font-mono truncate">{card.id}</p>
              </div>
            </div>

            <div className="lg:col-span-2 text-sm text-neutral-700">
              {card.grade ?? '—'}
            </div>

            <div className="lg:col-span-3">
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${tone}`}>
                {GATE_LABELS[card.gateStatus] ?? card.gateStatus}
              </span>
              {card.hasAction && (
                <span className="ml-2 text-[11px] text-amber-600 font-medium">Ação pendente</span>
              )}
            </div>

            <div className="lg:col-span-2 text-xs text-neutral-500">
              {formatDistanceToNow(new Date(card.lastUpdatedAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </div>

            <div className="lg:col-span-1 flex items-center justify-end">
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
