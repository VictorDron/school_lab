import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle,
  XCircle,
  ShoppingCart,
  AlertTriangle,
  Loader2,
  Send,
  Pencil,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import {
  usePurchase,
  useSubmitPurchase,
  useApprovePurchase,
  useCancelPurchase,
  useExecutePurchase,
  useUpdatePurchase,
} from '@/hooks/usePurchases';
import { ExecutePurchaseModal } from '../ExecutePurchaseModal';
import type { PurchaseRequest } from '@/types/procurement';

import { tabs, StatusBadge } from './constants';
import type { TabType, ActionModalType, EditFormState } from './constants';
import { ResumoTab } from './ResumoTab';
import { ItensTab } from './ItensTab';
import { TimelineTab } from './TimelineTab';
import { ComunicacaoTab } from './ComunicacaoTab';
import { ActionModal } from './ActionModal';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PurchaseDetailDrawerProps {
  purchaseId: string | null;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PurchaseDetailDrawer({ purchaseId, onClose }: PurchaseDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('resumo');
  const [actionModal, setActionModal] = useState<ActionModalType>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditFormState>({ title: '', department: '', priority: 'NORMAL', justification: '', notes: '' });
  const [showExecuteModal, setShowExecuteModal] = useState(false);

  const { user, hasModuleAccess } = useAuthStore();
  const canAdmin = hasModuleAccess('PROCUREMENT', 'ADMIN');

  const { data: purchaseData, isLoading, isError } = usePurchase(purchaseId ?? undefined);
  const submitMutation = useSubmitPurchase();
  const approveMutation = useApprovePurchase();
  const cancelMutation = useCancelPurchase();
  const executeMutation = useExecutePurchase();
  const updateMutation = useUpdatePurchase();

  const isOpen = purchaseId !== null;

  // Reset tab and edit mode when a different purchase is opened
  useEffect(() => {
    if (purchaseId) {
      setActiveTab('resumo');
      setIsEditing(false);
      setShowExecuteModal(false);
    }
  }, [purchaseId]);

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

  const purchase = purchaseData?.data as PurchaseRequest | undefined;

  const isCreator = user?.id === purchase?.creator?.id;
  const isPending =
    submitMutation.isPending ||
    approveMutation.isPending ||
    cancelMutation.isPending ||
    executeMutation.isPending ||
    updateMutation.isPending;

  // ----- Edit handlers -----

  const handleStartEditing = useCallback(() => {
    if (!purchase) return;
    setEditForm({
      title: purchase.title,
      department: purchase.department,
      priority: purchase.priority,
      justification: purchase.justification || '',
      notes: purchase.notes || '',
    });
    setIsEditing(true);
  }, [purchase]);

  const handleCancelEditing = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!purchase) return;
    updateMutation.mutate(
      {
        id: purchase.id,
        data: {
          title: editForm.title,
          department: editForm.department,
          priority: editForm.priority,
          justification: editForm.justification,
          notes: editForm.notes || undefined,
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      },
    );
  }, [purchase, editForm, updateMutation]);

  const handleEditFormChange = useCallback((updates: Partial<EditFormState>) => {
    setEditForm((prev) => ({ ...prev, ...updates }));
  }, []);

  // ----- Action handlers -----

  const handleActionConfirm = useCallback(
    (comments: string) => {
      if (!purchase) return;

      switch (actionModal) {
        case 'submit':
          submitMutation.mutate(purchase.id, {
            onSuccess: () => {
              setActionModal(null);
            },
          });
          break;

        case 'approve':
          approveMutation.mutate(
            { id: purchase.id, action: 'approve', comments: comments || undefined },
            { onSuccess: () => setActionModal(null) },
          );
          break;

        case 'reject':
          approveMutation.mutate(
            { id: purchase.id, action: 'reject', comments },
            { onSuccess: () => setActionModal(null) },
          );
          break;

        case 'cancel':
          cancelMutation.mutate(
            { id: purchase.id, reason: comments },
            { onSuccess: () => setActionModal(null) },
          );
          break;

        default:
          break;
      }
    },
    [actionModal, purchase, submitMutation, approveMutation, cancelMutation],
  );

  // ----- Determine which bottom actions to show -----

  function renderBottomActions() {
    if (!purchase) return null;

    const { status } = purchase;

    const buttons: React.ReactNode[] = [];

    if (status === 'DRAFT') {
      if (isCreator && !isEditing) {
        buttons.push(
          <button
            key="edit"
            onClick={handleStartEditing}
            disabled={isPending}
            className="btn btn-md bg-neutral-100 text-neutral-700 hover:bg-neutral-200 flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            Editar
          </button>,
        );
        buttons.push(
          <button
            key="submit"
            onClick={() => setActionModal('submit')}
            disabled={isPending}
            className="btn btn-primary btn-md flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Submeter para Aprovação
          </button>,
        );
      }
      buttons.push(
        <button
          key="cancel"
          onClick={() => setActionModal('cancel')}
          disabled={isPending}
          className="btn btn-md bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
        >
          Cancelar
        </button>,
      );
    }

    if (
      (status === 'PENDING_MANAGER' || status === 'PENDING_FINANCE') &&
      canAdmin
    ) {
      buttons.push(
        <button
          key="approve"
          onClick={() => setActionModal('approve')}
          disabled={isPending}
          className="btn btn-md bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Aprovar
        </button>,
        <button
          key="reject"
          onClick={() => setActionModal('reject')}
          disabled={isPending}
          className="btn btn-md bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
        >
          <XCircle className="w-4 h-4" />
          Rejeitar
        </button>,
      );
    }

    if (status === 'APPROVED' && canAdmin) {
      buttons.push(
        <button
          key="execute"
          onClick={() => setShowExecuteModal(true)}
          disabled={isPending}
          className="btn btn-primary btn-md flex items-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          Executar Compra
        </button>,
      );
    }

    if (buttons.length === 0) return null;

    return (
      <div className="flex items-center justify-end gap-3 p-4 border-t border-neutral-200 bg-white">
        {buttons}
      </div>
    );
  }

  // ----- Render -----

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
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-neutral-100 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>

                {purchase && (
                  <div className="min-w-0">
                    <span className="text-xs font-mono text-neutral-500">{purchase.code}</span>
                    <h2 className="text-lg font-semibold text-neutral-900 truncate">
                      {purchase.title}
                    </h2>
                  </div>
                )}
              </div>

              {purchase && (
                <div className="flex-shrink-0 ml-3">
                  <StatusBadge status={purchase.status} />
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center h-64 text-neutral-500 gap-2">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                  <p className="text-sm">Erro ao carregar requisição.</p>
                </div>
              ) : purchase ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {activeTab === 'resumo' && (
                      <ResumoTab
                        purchase={purchase}
                        isEditing={isEditing}
                        editForm={editForm}
                        onEditFormChange={handleEditFormChange}
                        onSave={handleSaveEdit}
                        onCancel={handleCancelEditing}
                        isSaving={updateMutation.isPending}
                      />
                    )}
                    {activeTab === 'itens' && <ItensTab purchase={purchase} />}
                    {activeTab === 'timeline' && <TimelineTab purchase={purchase} />}
                    {activeTab === 'comunicacao' && <ComunicacaoTab purchase={purchase} />}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="flex items-center justify-center h-64 text-neutral-500">
                  Requisição não encontrada
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            {!isLoading && !isError && renderBottomActions()}

            {/* Action Modals */}
            <AnimatePresence>
              {actionModal && (
                <ActionModal
                  type={actionModal}
                  onClose={() => setActionModal(null)}
                  onConfirm={handleActionConfirm}
                  isPending={isPending}
                />
              )}
            </AnimatePresence>

            {/* Execute Purchase Modal */}
            {showExecuteModal && purchase && (
              <ExecutePurchaseModal
                purchase={purchase as any}
                onClose={() => setShowExecuteModal(false)}
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
