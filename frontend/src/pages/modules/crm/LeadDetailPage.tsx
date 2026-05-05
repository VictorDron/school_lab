import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useLead, useDeleteLead } from '@/hooks/useLeads';
import { useMarkLeadViewed } from '@/hooks/useUnviewedLeads';
import { useAuthStore } from '@/stores/authStore';
import { LeadDetailHeader, LeadDetailSidebar, LeadDetailContent } from '@/components/crm/lead-detail';
import type { LeadDetailTab } from '@/components/crm/lead-detail/LeadDetailContent';
import { EditLeadDrawer } from '@/components/crm';

export default function LeadDetailPage() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const { data: leadData, isLoading } = useLead(leadId ?? null);
  const { hasModuleAccess } = useAuthStore();
  const markViewedMutation = useMarkLeadViewed();
  const deleteMutation = useDeleteLead();

  const [activeTab, setActiveTab] = useState<LeadDetailTab>('processo');
  const [showEditDrawer, setShowEditDrawer] = useState(false);

  const canEdit = hasModuleAccess('CRM', 'EDIT');
  const canDelete = hasModuleAccess('CRM', 'ADMIN');

  const lead = leadData?.data;

  // Mark lead as viewed on mount
  useEffect(() => {
    if (lead?.id) {
      markViewedMutation.mutate(lead.id);
    }
  }, [lead?.id]);

  const handleDelete = () => {
    if (lead) {
      deleteMutation.mutate(lead.id, {
        onSuccess: () => navigate('/crm'),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <p className="text-neutral-500">Lead não encontrado</p>
        <button onClick={() => navigate('/crm')} className="btn btn-primary btn-sm">
          Voltar ao CRM
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header with pipeline strip */}
      <LeadDetailHeader
        lead={lead}
        onEdit={() => setShowEditDrawer(true)}
        onDelete={handleDelete}
      />

      {/* Body: Sidebar + Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left Sidebar */}
        <LeadDetailSidebar lead={lead} canEdit={canEdit} />

        {/* Main Content */}
        <LeadDetailContent
          lead={lead}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          canEdit={canEdit}
        />
      </div>

      {/* Edit Lead Drawer */}
      <EditLeadDrawer
        lead={showEditDrawer ? lead : null}
        isOpen={showEditDrawer}
        onClose={() => setShowEditDrawer(false)}
      />
    </div>
  );
}
