import { Loader2, MessageSquare, Users } from 'lucide-react';
import { useLead } from '@/hooks/leads/useLeadQueries';
import { LeadCommentsTab } from '@/components/crm/tabs/LeadCommentsTab';

interface InviteComentariosTabProps {
  leadId: string;
  familyName: string;
}

/**
 * Re-enrollment comments are family-scoped: we reuse the lead-level
 * LeadCommentsTab so conversations stay unified across enrollment and
 * re-enrollment. The wrapper fetches the full Lead (with comments) and
 * prepends a context banner explaining the shared scope.
 */
export function InviteComentariosTab({ leadId, familyName }: InviteComentariosTabProps) {
  const { data, isLoading, isError } = useLead(leadId);
  const lead = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <div className="flex items-center gap-2 text-sm text-red-600">
          <MessageSquare className="w-4 h-4" />
          Não foi possível carregar os comentários da família.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
        <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          Comentários da família <strong>{familyName}</strong> — compartilhados com o
          fluxo de matrícula e com as outras rematrículas dos irmãos.
        </p>
      </div>
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <LeadCommentsTab lead={lead} />
      </div>
    </div>
  );
}
