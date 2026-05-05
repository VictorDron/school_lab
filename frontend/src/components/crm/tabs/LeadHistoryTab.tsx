import {
  Clock,
  Plus,
  ArrowRight,
  FileText,
  MessageSquare,
  User,
  Flag,
  Link2,
  Pencil,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Lead, LeadHistory } from '@/types/crm';

interface LeadHistoryTabProps {
  lead: Lead;
}

const actionIcons: Record<string, React.ElementType> = {
  CREATED: Plus,
  STATUS_CHANGED: ArrowRight,
  UPDATED: Pencil,
  CHILD_ADDED: User,
  CHILD_UPDATED: User,
  CHILD_REMOVED: Trash2,
  DOCUMENT_UPLOADED: FileText,
  DOCUMENT_DELETED: FileText,
  COMMENT_ADDED: MessageSquare,
  FLAGGED: Flag,
  UNFLAGGED: Flag,
  APPLICATION_LINK_GENERATED: Link2,
  FORM_SUBMITTED: FileText,
};

const actionLabels: Record<string, string> = {
  CREATED: 'Lead criado',
  STATUS_CHANGED: 'Coluna alterada',
  UPDATED: 'Lead atualizado',
  CHILD_ADDED: 'Aluno adicionado',
  CHILD_UPDATED: 'Aluno atualizado',
  CHILD_REMOVED: 'Aluno removido',
  DOCUMENT_UPLOADED: 'Documento enviado',
  DOCUMENT_DELETED: 'Documento removido',
  COMMENT_ADDED: 'Comentário adicionado',
  FLAGGED: 'Sinalizado como importante',
  UNFLAGGED: 'Sinalização removida',
  APPLICATION_LINK_GENERATED: 'Link de inscrição gerado',
  FORM_SUBMITTED: 'Formulário de inscrição recebido',
};

function getActionColor(action: string): string {
  switch (action) {
    case 'CREATED':
    case 'FORM_SUBMITTED':
      return 'bg-green-100 text-green-600';
    case 'STATUS_CHANGED':
      return 'bg-blue-100 text-blue-600';
    case 'UPDATED':
      return 'bg-purple-100 text-purple-600';
    case 'CHILD_ADDED':
    case 'CHILD_UPDATED':
      return 'bg-cyan-100 text-cyan-600';
    case 'CHILD_REMOVED':
    case 'DOCUMENT_DELETED':
      return 'bg-red-100 text-red-600';
    case 'DOCUMENT_UPLOADED':
      return 'bg-indigo-100 text-indigo-600';
    case 'COMMENT_ADDED':
      return 'bg-yellow-100 text-yellow-600';
    case 'FLAGGED':
    case 'UNFLAGGED':
      return 'bg-amber-100 text-amber-600';
    case 'APPLICATION_LINK_GENERATED':
      return 'bg-teal-100 text-teal-600';
    default:
      return 'bg-neutral-100 text-neutral-600';
  }
}

function renderDetails(action: string, details: Record<string, any> | undefined) {
  if (!details) return null;

  // Handle column change (new format with column objects)
  if (action === 'STATUS_CHANGED' && details.previousColumn && details.newColumn) {
    return (
      <div className="flex items-center gap-2 mt-1">
        <span
          className="px-2 py-0.5 text-xs rounded-full"
          style={{
            backgroundColor: details.previousColumn.color ? `${details.previousColumn.color}20` : undefined,
            color: details.previousColumn.color,
          }}
        >
          {details.previousColumn.name}
        </span>
        <ArrowRight className="w-3 h-3 text-neutral-400" />
        <span
          className="px-2 py-0.5 text-xs rounded-full"
          style={{
            backgroundColor: details.newColumn.color ? `${details.newColumn.color}20` : undefined,
            color: details.newColumn.color,
          }}
        >
          {details.newColumn.name}
        </span>
      </div>
    );
  }

  // Handle legacy status change format (for old history entries)
  if (action === 'STATUS_CHANGED' && details.previousStatus && details.newStatus) {
    return (
      <div className="flex items-center gap-2 mt-1">
        <span className="px-2 py-0.5 text-xs rounded-full bg-neutral-100 text-neutral-600">
          {details.previousStatus}
        </span>
        <ArrowRight className="w-3 h-3 text-neutral-400" />
        <span className="px-2 py-0.5 text-xs rounded-full bg-neutral-100 text-neutral-600">
          {details.newStatus}
        </span>
      </div>
    );
  }

  if (details.childName) {
    return (
      <p className="text-xs text-neutral-500 mt-1">
        Aluno: {details.childName}
      </p>
    );
  }

  if (details.documentName) {
    return (
      <p className="text-xs text-neutral-500 mt-1">
        Documento: {details.documentName}
      </p>
    );
  }

  if (details.changes) {
    return (
      <p className="text-xs text-neutral-500 mt-1">
        Campos: {details.changes.join(', ')}
      </p>
    );
  }

  if (details.source) {
    return (
      <p className="text-xs text-neutral-500 mt-1">
        Via: {details.source === 'PUBLIC_FORM' ? 'Formulário Público' : details.source}
      </p>
    );
  }

  return null;
}

export function LeadHistoryTab({ lead }: LeadHistoryTabProps) {
  const history = lead.history || [];

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
        Histórico de Atividades
      </h3>

      {history.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          <Clock className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
          <p>Nenhuma atividade registrada</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-neutral-200" />

          {/* Events */}
          <div className="space-y-4">
            {history.map((event, index) => {
              const Icon = actionIcons[event.action] || Clock;
              const label = actionLabels[event.action] || event.action;
              const colorClass = getActionColor(event.action);

              return (
                <div key={event.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-baseline gap-2">
                      <p className="font-medium text-neutral-900">{label}</p>
                      <span className="text-xs text-neutral-400">
                        {formatDistanceToNow(new Date(event.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>

                    {renderDetails(event.action, event.details)}

                    <p className="text-xs text-neutral-400 mt-1">
                      {format(new Date(event.createdAt), "dd 'de' MMMM 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
