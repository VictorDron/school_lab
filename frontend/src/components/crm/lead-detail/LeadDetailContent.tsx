import { ClipboardList, Users, FileText, ScrollText, MessageSquare, Clock } from 'lucide-react';
import type { Lead } from '@/types/crm';
import { LeadProcessoTab } from '@/components/crm/tabs/LeadProcessoTab';
import { LeadChildrenTab } from '@/components/crm/tabs/LeadChildrenTab';
import { LeadDocumentsTab } from '@/components/crm/documents';
import { ContractTab } from '@/components/crm/contract/ContractTab';
import { LeadCommentsTab } from '@/components/crm/tabs/LeadCommentsTab';
import { LeadHistoryTab } from '@/components/crm/tabs/LeadHistoryTab';
import { EscalationBanner } from '@/components/crm/escalations/EscalationBanner';

export type LeadDetailTab = 'processo' | 'alunos' | 'documentos' | 'contrato' | 'comentarios' | 'historico';

interface LeadDetailContentProps {
  lead: Lead;
  activeTab: LeadDetailTab;
  onTabChange: (tab: LeadDetailTab) => void;
  canEdit: boolean;
}

const tabs: { id: LeadDetailTab; label: string; icon: React.ElementType }[] = [
  { id: 'processo', label: 'Processo', icon: ClipboardList },
  { id: 'alunos', label: 'Alunos', icon: Users },
  { id: 'documentos', label: 'Documentos', icon: FileText },
  { id: 'contrato', label: 'Contrato', icon: ScrollText },
  { id: 'comentarios', label: 'Comentários', icon: MessageSquare },
  { id: 'historico', label: 'Histórico', icon: Clock },
];

export function LeadDetailContent({ lead, activeTab, onTabChange, canEdit }: LeadDetailContentProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="flex-shrink-0 bg-white border-b border-neutral-200">
        <div className="flex px-3 sm:px-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-3 sm:p-6">
          <EscalationBanner leadId={lead.id} />
          {activeTab === 'processo' && (
            <LeadProcessoTab lead={lead} onNavigateToContract={() => onTabChange('contrato')} />
          )}
          {activeTab === 'alunos' && <LeadChildrenTab lead={lead} canEdit={canEdit} />}
          {activeTab === 'documentos' && <LeadDocumentsTab lead={lead} canEdit={canEdit} />}
          {activeTab === 'contrato' && <ContractTab leadId={lead.id} lead={lead} />}
          {activeTab === 'comentarios' && <LeadCommentsTab lead={lead} />}
          {activeTab === 'historico' && <LeadHistoryTab lead={lead} />}
        </div>
      </div>
    </div>
  );
}
