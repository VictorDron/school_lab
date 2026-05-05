import type { Lead, LeadChild, LeadEducationHistory } from '@/types/crm';
import { ChildHealthForm } from '../ChildHealthForm';
import { ChildTransportForm } from '../ChildTransportForm';
import type { LeadChildrenTabState } from '../useLeadChildrenTab';
import { ChildCardHeader } from './ChildCardHeader';
import { ChildInfoSection } from './ChildInfoSection';
import { EducationHistoryToggle } from './EducationHistoryToggle';
import { ChildDeleteConfirmation } from './ChildDeleteConfirmation';

interface ChildCardProps {
  child: LeadChild;
  childHistory: LeadEducationHistory[];
  lead: Lead;
  canEdit: boolean;
  state: LeadChildrenTabState;
}

export function ChildCard({ child, childHistory, lead, canEdit, state }: ChildCardProps) {
  const { ui, setters, handlers, mutations } = state;
  const {
    expandedChildId,
    deletingId,
    editingHealthChildId,
    editingTransportChildId,
    healthForm,
    transportForm,
  } = ui;
  const {
    setExpandedChildId,
    setDeletingId,
    setEditingHealthChildId,
    setEditingTransportChildId,
    setHealthForm,
    setTransportForm,
  } = setters;
  const { handleEdit, handleDelete } = handlers;
  const { delete: deleteMutation, updateHealth: updateHealthMutation, updateTransport: updateTransportMutation } = mutations;

  const isExpanded = expandedChildId === child.id;
  const health = lead.childrenHealth?.find((h) => h.childId === child.id);
  const transport = lead.childrenTransport?.find((t) => t.childId === child.id);

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4">
      <ChildCardHeader
        child={child}
        canEdit={canEdit}
        onEdit={() => handleEdit(child)}
        onRequestDelete={() => setDeletingId(child.id)}
      />

      <ChildInfoSection child={child} />

      <EducationHistoryToggle
        history={childHistory}
        isExpanded={isExpanded}
        onToggle={() => setExpandedChildId(isExpanded ? null : child.id)}
      />

      {/* Health */}
      {health && (
        <ChildHealthForm
          health={health}
          childId={child.id}
          leadId={lead.id}
          canEdit={canEdit}
          isEditing={editingHealthChildId === child.id}
          healthForm={healthForm}
          isSaving={updateHealthMutation.isPending}
          onStartEdit={(initial) => {
            setEditingHealthChildId(child.id);
            setHealthForm(initial);
          }}
          onCancelEdit={() => setEditingHealthChildId(null)}
          onChangeForm={setHealthForm}
          onSave={(payload) =>
            updateHealthMutation.mutate(payload, {
              onSuccess: () => setEditingHealthChildId(null),
            })
          }
        />
      )}

      {/* Transport */}
      {transport && (
        <ChildTransportForm
          transport={transport}
          childId={child.id}
          leadId={lead.id}
          canEdit={canEdit}
          isEditing={editingTransportChildId === child.id}
          transportForm={transportForm}
          isSaving={updateTransportMutation.isPending}
          onStartEdit={(initial) => {
            setEditingTransportChildId(child.id);
            setTransportForm(initial);
          }}
          onCancelEdit={() => setEditingTransportChildId(null)}
          onChangeForm={setTransportForm}
          onSave={(payload) =>
            updateTransportMutation.mutate(payload, {
              onSuccess: () => setEditingTransportChildId(null),
            })
          }
        />
      )}

      <ChildDeleteConfirmation
        isOpen={deletingId === child.id}
        isDeleting={deleteMutation.isPending}
        onCancel={() => setDeletingId(null)}
        onConfirm={() => handleDelete(child.id)}
      />
    </div>
  );
}
