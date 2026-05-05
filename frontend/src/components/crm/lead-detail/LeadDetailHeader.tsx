import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Flag,
  Link2,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import { differenceInDays } from 'date-fns';
import {
  useToggleLeadFlag,
  useUpdateLeadColumn,
  useGenerateApplicationLink,
  useGenerateEnrollmentLink,
  useDeleteLead,
} from '@/hooks/useLeads';
import { useKanbanColumns } from '@/hooks/useKanbanColumns';
import { useAuthStore } from '@/stores/authStore';
import { LeadStatusBadge } from '@/components/crm/badges/LeadStatusBadge';
import { PipelineStrip } from '@/components/crm/PipelineStrip';
import type { Lead, AdmissionGateStatus } from '@/types/crm';

interface LeadDetailHeaderProps {
  lead: Lead;
  onEdit: () => void;
  onDelete: () => void;
}

export function LeadDetailHeader({ lead, onEdit, onDelete }: LeadDetailHeaderProps) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { hasModuleAccess } = useAuthStore();
  const canEdit = hasModuleAccess('CRM', 'EDIT');
  const canDelete = hasModuleAccess('CRM', 'ADMIN');

  const { data: columnsData } = useKanbanColumns();
  const toggleFlagMutation = useToggleLeadFlag();
  const updateColumnMutation = useUpdateLeadColumn();
  const generateLinkMutation = useGenerateApplicationLink();
  const generateEnrollmentLinkMutation = useGenerateEnrollmentLink();
  const deleteMutation = useDeleteLead();

  const columns = columnsData?.data || [];
  const currentColumn = columns.find((c) => c.id === lead.columnId);

  const daysInPipeline = differenceInDays(new Date(), new Date(lead.createdAt));

  const handleToggleFlag = () => {
    toggleFlagMutation.mutate(lead.id);
  };

  const handleColumnChange = (columnId: string) => {
    updateColumnMutation.mutate({ id: lead.id, columnId });
    setShowColumnMenu(false);
  };

  const handleGenerateLink = () => {
    generateLinkMutation.mutate(lead.id);
    setShowMenu(false);
  };

  const handleGenerateEnrollmentLink = () => {
    generateEnrollmentLinkMutation.mutate(lead.id);
    setShowMenu(false);
  };

  const handleDelete = () => {
    deleteMutation.mutate(lead.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        onDelete();
      },
    });
  };

  return (
    <div className="flex-shrink-0 bg-white">
      {/* Row 1: Navigation + Title + Actions */}
      <div className="h-14 flex items-center justify-between px-3 sm:px-6 border-b border-neutral-200">
        {/* Left side */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/crm')}
            className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">CRM</span>
          </button>

          <div className="w-px h-6 bg-neutral-200 flex-shrink-0" />

          <h1 className="text-base sm:text-xl font-semibold text-neutral-900 truncate max-w-[120px] sm:max-w-md">
            {lead.familyName}
          </h1>

          <span className="text-xs sm:text-sm font-mono text-neutral-400 flex-shrink-0 hidden sm:inline">
            {lead.code}
          </span>
        </div>

        {/* Right side */}
        {canEdit && (
          <div className="flex items-center gap-2 flex-shrink-0">
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
              title={lead.isFlagged ? 'Remover sinalização' : 'Sinalizar lead'}
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
                        onEdit();
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
                        {generateEnrollmentLinkMutation.isPending
                          ? 'Gerando...'
                          : 'Gerar Link de Matrícula'}
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

      {/* Row 2: PipelineStrip — always visible so user knows where they are */}
      <PipelineStrip
        status={(lead.admissionGateStatus || 'NOT_STARTED') as AdmissionGateStatus}
        leadId={lead.id}
      />

      {/* Row 3: Days in pipeline */}
      <div className="px-3 sm:px-6 py-1 bg-neutral-50 border-b border-neutral-200">
        <span className="text-xs text-neutral-500">
          {daysInPipeline === 0
            ? 'Criado hoje'
            : `${daysInPipeline} ${daysInPipeline === 1 ? 'dia' : 'dias'} no pipeline`}
        </span>
      </div>

      {/* Delete Confirmation Modal */}
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
    </div>
  );
}
