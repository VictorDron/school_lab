import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Flag,
  Link2,
  MoreVertical,
  User,
  Users,
  FileText,
  MessageSquare,
  Clock,
  Pencil,
  Trash2,
  Loader2,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import { useLead, useToggleLeadFlag, useUpdateLeadColumn, useGenerateApplicationLink, useGenerateEnrollmentLink, useDeleteLead } from '@/hooks/useLeads';
import { useKanbanColumns } from '@/hooks/useKanbanColumns';
import { useMarkLeadViewed } from '@/hooks/useUnviewedLeads';
import type { Lead } from '@/types/crm';
import { LeadStatusBadge } from '../badges/LeadStatusBadge';
import { LeadOverviewTab } from '../tabs/LeadOverviewTab';
import { LeadChildrenTab } from '../tabs/LeadChildrenTab';
import { LeadDocumentsTab } from '../documents';
import { LeadCommentsTab } from '../tabs/LeadCommentsTab';
import { LeadHistoryTab } from '../tabs/LeadHistoryTab';
import { ParentalConsentTab } from '../tabs/ParentalConsentTab';
import { PipelineStrip } from '../PipelineStrip';
import { LeadProcessoTab } from '../tabs/LeadProcessoTab';
import { ContractTab } from '../contract/ContractTab';
import { EscalationBanner } from '../escalations/EscalationBanner';
import { useAuthStore } from '@/stores/authStore';

interface LeadDrawerProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (lead: Lead) => void;
  onNavigateToCalendar?: (eventId?: string, eventDate?: Date) => void;
}

type TabType = 'overview' | 'vivencia' | 'children' | 'documents' | 'contract' | 'comments' | 'history' | 'consent';

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Resumo', icon: User },
  { id: 'vivencia', label: 'Processo', icon: GraduationCap },
  { id: 'children', label: 'Alunos', icon: Users },
  { id: 'documents', label: 'Documentos', icon: FileText },
  { id: 'contract', label: 'Contrato', icon: FileText },
  { id: 'comments', label: 'Comentários', icon: MessageSquare },
  { id: 'history', label: 'Histórico', icon: Clock },
  { id: 'consent', label: 'Consentimento', icon: ShieldCheck },
];

export function LeadDrawer({ leadId, isOpen, onClose, onEdit, onNavigateToCalendar }: LeadDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showMenu, setShowMenu] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { hasModuleAccess } = useAuthStore();
  const canEdit = hasModuleAccess('CRM', 'EDIT');
  const canDelete = hasModuleAccess('CRM', 'ADMIN');

  const { data: leadData, isLoading } = useLead(leadId);
  const { data: columnsData } = useKanbanColumns();
  const toggleFlagMutation = useToggleLeadFlag();
  const updateColumnMutation = useUpdateLeadColumn();
  const generateLinkMutation = useGenerateApplicationLink();
  const generateEnrollmentLinkMutation = useGenerateEnrollmentLink();
  const deleteMutation = useDeleteLead();
  const markViewedMutation = useMarkLeadViewed();

  // Reset to the first tab whenever a different lead is opened
  useEffect(() => {
    setActiveTab('overview');
  }, [leadId]);

  // Track which leads have been marked as viewed in this session
  const viewedLeadsRef = useRef<Set<string>>(new Set());

  // Block body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const lead = leadData?.data;
  const columns = columnsData?.data || [];
  const currentColumn = columns.find(c => c.id === lead?.columnId);

  // Mark lead as viewed when drawer opens (only once per lead per session)
  useEffect(() => {
    if (lead?.id && isOpen && !viewedLeadsRef.current.has(lead.id)) {
      viewedLeadsRef.current.add(lead.id);
      markViewedMutation.mutate(lead.id);
    }
  }, [lead?.id, isOpen]);

  const handleToggleFlag = () => {
    if (lead) {
      toggleFlagMutation.mutate(lead.id);
    }
  };

  const handleColumnChange = (columnId: string) => {
    if (lead) {
      updateColumnMutation.mutate({ id: lead.id, columnId });
      setShowColumnMenu(false);
    }
  };

  const handleGenerateLink = () => {
    if (lead) {
      generateLinkMutation.mutate(lead.id);
    }
    setShowMenu(false);
  };

  const handleGenerateEnrollmentLink = () => {
    if (lead) {
      generateEnrollmentLinkMutation.mutate(lead.id);
    }
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (lead) {
      deleteMutation.mutate(lead.id, {
        onSuccess: () => {
          setShowDeleteConfirm(false);
          onClose();
        },
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[700px] lg:w-[800px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
                {lead && (
                  <div>
                    <div className="flex items-center gap-2">
                      {lead.isFlagged && (
                        <Flag className="w-4 h-4 text-amber-500 fill-amber-500" />
                      )}
                      <span className="text-sm font-mono text-neutral-500">{lead.code}</span>
                    </div>
                    <h2 className="text-lg font-semibold text-neutral-900">{lead.familyName}</h2>
                  </div>
                )}
              </div>

              {lead && canEdit && (
                <div className="flex items-center gap-2">
                  {/* Column Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowColumnMenu(!showColumnMenu)}
                      className="flex items-center gap-1"
                    >
                      <LeadStatusBadge column={currentColumn} size="md" />
                    </button>

                    {showColumnMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowColumnMenu(false)}
                        />
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-20 max-h-64 overflow-y-auto">
                          {columns.map((column) => (
                            <button
                              key={column.id}
                              onClick={() => handleColumnChange(column.id)}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2 ${
                                lead.columnId === column.id ? 'bg-neutral-100' : ''
                              }`}
                            >
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: column.color }}
                              />
                              {column.name}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Flag Toggle */}
                  <button
                    onClick={handleToggleFlag}
                    disabled={toggleFlagMutation.isPending}
                    className={`p-2 rounded-lg transition-colors ${
                      lead.isFlagged
                        ? 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                        : 'text-neutral-400 hover:bg-neutral-100'
                    }`}
                    title={lead.isFlagged ? 'Remover sinalizacao' : 'Sinalizar lead'}
                  >
                    <Flag className={`w-4 h-4 ${lead.isFlagged ? 'fill-current' : ''}`} />
                  </button>

                  {/* More Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-neutral-500" />
                    </button>

                    {showMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowMenu(false)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-20">
                          <button
                            onClick={() => {
                              onEdit?.(lead);
                              setShowMenu(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"
                          >
                            <Pencil className="w-4 h-4" />
                            Editar Lead
                          </button>
                          <button
                            onClick={handleGenerateLink}
                            disabled={generateLinkMutation.isPending}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"
                          >
                            <Link2 className="w-4 h-4" />
                            {generateLinkMutation.isPending ? 'Gerando...' : 'Gerar Link de Inscrição'}
                          </button>
                          {lead.applicationStatus === 'FORM_RECEIVED' && (
                            <button
                              onClick={handleGenerateEnrollmentLink}
                              disabled={generateEnrollmentLinkMutation.isPending}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2 text-emerald-700"
                            >
                              <Link2 className="w-4 h-4" />
                              {generateEnrollmentLinkMutation.isPending ? 'Gerando...' : 'Gerar Link de Matrícula'}
                            </button>
                          )}
                          {canDelete && (
                            <>
                              <hr className="my-1 border-neutral-200" />
                              <button
                                onClick={() => {
                                  setShowDeleteConfirm(true);
                                  setShowMenu(false);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Excluir Lead
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-200 px-4 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Pipeline Strip - fixed progress indicator */}
            {lead && lead.admissionGateStatus && lead.admissionGateStatus !== 'NOT_STARTED' && (
              <PipelineStrip status={lead.admissionGateStatus} leadId={lead.id} />
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
              ) : lead ? (
                <>
                  <EscalationBanner leadId={lead.id} />
                  {activeTab === 'overview' && <LeadOverviewTab lead={lead} />}
                  {activeTab === 'vivencia' && <LeadProcessoTab lead={lead} onNavigateToCalendar={onNavigateToCalendar} onNavigateToContract={() => setActiveTab('contract')} />}
                  {activeTab === 'children' && <LeadChildrenTab lead={lead} canEdit={canEdit} />}
                  {activeTab === 'documents' && <LeadDocumentsTab lead={lead} canEdit={canEdit} />}
                  {activeTab === 'contract' && <ContractTab leadId={lead.id} lead={lead} />}
                  {activeTab === 'comments' && <LeadCommentsTab lead={lead} />}
                  {activeTab === 'history' && <LeadHistoryTab lead={lead} />}
                  {activeTab === 'consent' && <ParentalConsentTab leadId={lead.id} />}
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-neutral-500">
                  Lead não encontrado
                </div>
              )}
            </div>

            {/* Delete Confirmation */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 z-50"
                    onClick={() => setShowDeleteConfirm(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  >
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                        Excluir Lead
                      </h3>
                      <p className="text-neutral-600 mb-4">
                        Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.
                      </p>
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="btn btn-secondary btn-md"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleDelete}
                          disabled={deleteMutation.isPending}
                          className="btn btn-md bg-red-600 text-white hover:bg-red-700"
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Excluir'
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
