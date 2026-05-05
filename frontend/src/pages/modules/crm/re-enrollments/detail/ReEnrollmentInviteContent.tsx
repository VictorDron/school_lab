import { useState } from 'react';
import {
  ClipboardList,
  FileText,
  ScrollText,
  DollarSign,
  MessageSquare,
  Clock,
} from 'lucide-react';
import type { InviteDetail } from '@/hooks/useReEnrollmentInvite';
import { InviteResumoTab } from './tabs/InviteResumoTab';
import { InviteDocumentosTab } from './tabs/InviteDocumentosTab';
import { InviteContratoTab } from './tabs/InviteContratoTab';
import { InvitePagamentoTab } from './tabs/InvitePagamentoTab';
import { InviteComentariosTab } from './tabs/InviteComentariosTab';
import { InviteHistoricoTab } from './tabs/InviteHistoricoTab';

export type InviteDetailTab =
  | 'resumo'
  | 'documentos'
  | 'contrato'
  | 'pagamento'
  | 'comentarios'
  | 'historico';

interface ReEnrollmentInviteContentProps {
  detail: InviteDetail;
}

const tabs: { id: InviteDetailTab; label: string; icon: React.ElementType }[] = [
  { id: 'resumo', label: 'Resumo', icon: ClipboardList },
  { id: 'documentos', label: 'Documentos', icon: FileText },
  { id: 'contrato', label: 'Contrato', icon: ScrollText },
  { id: 'pagamento', label: 'Pagamento', icon: DollarSign },
  { id: 'comentarios', label: 'Comentários', icon: MessageSquare },
  { id: 'historico', label: 'Histórico', icon: Clock },
];

export function ReEnrollmentInviteContent({ detail }: ReEnrollmentInviteContentProps) {
  const [activeTab, setActiveTab] = useState<InviteDetailTab>('resumo');

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="flex-shrink-0 bg-white border-b border-neutral-200">
        <div className="flex px-3 sm:px-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
          {activeTab === 'resumo' && <InviteResumoTab detail={detail} />}
          {activeTab === 'documentos' && <InviteDocumentosTab detail={detail} />}
          {activeTab === 'contrato' && <InviteContratoTab detail={detail} />}
          {activeTab === 'pagamento' && <InvitePagamentoTab detail={detail} />}
          {activeTab === 'comentarios' && (
            <InviteComentariosTab
              leadId={detail.lead.id}
              familyName={detail.lead.familyName}
            />
          )}
          {activeTab === 'historico' && <InviteHistoricoTab inviteId={detail.invite.id} />}
        </div>
      </div>
    </div>
  );
}
